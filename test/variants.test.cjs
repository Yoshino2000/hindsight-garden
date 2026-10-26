"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");
const core = require("../core.js");
const { createStore } = require("../store.js");
const SID = "variant-worker";

function settings(species = "daisy") {
  return { name: "一朵花", species, targetMinutes: 1, rules: [{ type: "app", value: "reader", exact: true }] };
}
function change(state, action, now = 0) { return core.reduce(state, action, now).state; }
function pureFlower(state, id, species, roll, start = 0) {
  state = change(state, { type: "plant", id, plant: settings(species), variantRoll: roll }, start);
  state = change(state, { type: "focus", sessionId: SID, event: { app: "reader" } }, start);
  for (let now = start + 10000; now <= start + 60000; now += 10000)
    state = change(state, { type: "tick", sessionId: SID }, now);
  return state;
}
function hostFor(t) {
  const db = new DatabaseSync(":memory:");
  t.after(() => db.close());
  const host = { db, calls: [], intercept: null };
  host.call = async (method, params) => {
    host.calls.push({ method, params: structuredClone(params) });
    if (host.intercept) {
      const result = await host.intercept(method, params);
      if (result !== undefined) return result;
    }
    const statement = db.prepare(params.sql);
    return method === "db.query" ? statement.all(...params.params) : statement.run(...params.params);
  };
  return host;
}
async function storeFlower(store, id, species, start = 0) {
  await store.apply({ type: "plant", id, plant: settings(species) }, start);
  await store.apply({ type: "focus", sessionId: SID, event: { app: "reader" } }, start);
  for (let now = start + 10000; now <= start + 60000; now += 10000)
    await store.apply({ type: "tick", sessionId: SID }, now);
}
function oldRuntime() {
  const sandbox = vm.createContext({ URL, TextEncoder, setTimeout, clearTimeout });
  const folder = join(__dirname, "fixtures/garden-0.15.0");
  vm.runInContext(readFileSync(join(folder, "core.js"), "utf8"), sandbox);
  vm.runInContext(readFileSync(join(folder, "store.js"), "utf8"), sandbox);
  return sandbox;
}

test("the five-percent decision has an exact exclusive threshold and rejects invalid tickets", () => {
  assert.equal(core.HIDDEN_CHANCE, 0.05);
  for (const roll of [0, 0.01, 0.049999999999999996]) assert.equal(core.variantFromRoll(roll), "hidden");
  for (const roll of [0.05, 0.5, 0.9999999999999999]) assert.equal(core.variantFromRoll(roll), "normal");
  for (const roll of [-1, 1, NaN, Infinity, "0.01", null, undefined]) assert.throws(() => core.variantFromRoll(roll), /随机签/);
  const samples = Array.from({ length: 10000 }, (_, index) => (index + .5) / 10000);
  assert.equal(samples.filter((roll) => core.variantFromRoll(roll) === "hidden").length, 500);
});

test("all eight species reveal hidden variants at bloom and retain their original goal and timing behavior", () => {
  let state = change(null, { type: "boot", sessionId: SID });
  for (const [index, item] of core.SPECIES.entries()) {
    state = pureFlower(state, "hidden-" + item.id, item.id, 0.01, index * 60000);
    const flower = state.garden[0];
    assert.equal(flower.variant, "hidden");
    assert.equal(flower.species, item.id);
    assert.equal(flower.targetMs, 60000);
    assert.equal(flower.progressMs, 60000);
    assert.equal(flower.variantRoll, undefined, "The completed record stores the result, not its internal ticket");
    assert.equal(state.earnedAchievements["hidden-" + item.id + "-first"], (index + 1) * 60000);
  }
  assert.equal(state.collection.totalBlooms, 8);
  assert.equal(state.hiddenCollection.totalBlooms, 8);
  assert.equal(state.hiddenCollection.species.length, 8);
  assert.equal(state.focusStats.totalMs, 8 * 60000);
  assert.ok(Object.hasOwn(state.earnedAchievements, "hidden-species-8"));
});

test("old flower records remain ordinary without mutation or re-rolling during normalization", () => {
  const original = { id: "old", name: "旧花", species: "rose", createdAt: 0, bloomAt: 60000, targetMs: 60000, progressMs: 60000 };
  const raw = JSON.stringify(original);
  const valid = core.normalizeFlower(original);
  assert.equal(core.variantOf(valid), "normal");
  assert.equal(valid.variant, undefined);
  assert.equal(JSON.stringify(original), raw);
  assert.equal(core.variantOf({ variant: "hidden" }), "hidden");
  assert.throws(() => core.normalizeFlower({ ...original, variant: "unknown-future-palette" }), /配色/);
});

test("a plant request draws once through CAS retries, ignores user tickets and never re-draws after restart", async (t) => {
  const host = hostFor(t);
  let draws = 0;
  const first = createStore(host.call, { random: () => { draws++; return .04; } });
  await first.load();
  let conflicted = false;
  host.intercept = async (method, params) => {
    if (!conflicted && method === "db.execute" && params.sql.startsWith("UPDATE")) {
      conflicted = true;
      host.db.prepare("UPDATE garden_store SET version = version + 1 WHERE key = 'state'").run();
    }
  };
  await first.apply({ type: "plant", id: "new", plant: { ...settings(), variantRoll: .9 }, variantRoll: .9 }, 0);
  host.intercept = null;
  assert.equal(draws, 1);
  assert.equal((await first.load()).active.variantRoll, .04);
  const reopened = createStore(host.call, { random: () => { throw new Error("Restart must not draw"); } });
  await reopened.apply({ type: "boot", sessionId: SID }, 0);
  await reopened.apply({ type: "focus", sessionId: SID, event: { app: "reader" } }, 0);
  for (let now = 10000; now <= 60000; now += 10000) await reopened.apply({ type: "tick", sessionId: SID }, now);
  assert.equal((await reopened.load()).garden[0].variant, "hidden");
  assert.equal((await reopened.load()).hiddenCollection.totalBlooms, 1);
  assert.equal(draws, 1);
});

test("a normal store draw cannot be replaced with forged hidden fields from a page", async (t) => {
  const host = hostFor(t);
  const store = createStore(host.call, { random: () => .9 });
  await store.apply({ type: "boot", sessionId: SID }, 0);
  await store.apply({ type: "plant", id: "normal", variantRoll: 0, plant: { ...settings(), variant: "hidden", variantRoll: 0 } }, 0);
  await store.apply({ type: "focus", sessionId: SID, event: { app: "reader" } }, 0);
  for (let now = 10000; now <= 60000; now += 10000) await store.apply({ type: "tick", sessionId: SID }, now);
  const state = await store.load();
  assert.equal(state.garden[0].variant, "normal");
  assert.equal(state.hiddenCollection.totalBlooms, 0);
});

test("each newly planted pot gets its own draw rather than inheriting the last flower's variant", async (t) => {
  const host = hostFor(t);
  let draws = 0;
  const store = createStore(host.call, { random: () => draws++ % 2 ? .9 : .01 });
  await store.apply({ type: "boot", sessionId: SID }, 0);
  for (const [index, item] of core.SPECIES.entries())
    await storeFlower(store, "flower-" + index, item.id, index * 60000);
  const state = await store.load();
  assert.equal(draws, 8);
  for (let index = 0; index < 8; index++)
    assert.equal(state.garden.find((item) => item.id === "flower-" + index).variant, index % 2 ? "normal" : "hidden");
  assert.equal(state.hiddenCollection.totalBlooms, 4);
  assert.equal(state.hiddenCollection.species.length, 4);
});

test("competing completion commits and failed archive writes keep one persisted variant and one hidden count", async (t) => {
  const host = hostFor(t);
  let draws = 0;
  const first = createStore(host.call, { random: () => { draws++; return 0; } });
  const second = createStore(host.call, { random: () => { throw new Error("Completion cannot draw"); } });
  await first.apply({ type: "boot", sessionId: SID }, 0);
  await first.apply({ type: "plant", id: "hidden", plant: settings() }, 0);
  await first.apply({ type: "focus", sessionId: SID, event: { app: "reader" } }, 0);
  for (let now = 10000; now <= 50000; now += 10000) await first.apply({ type: "tick", sessionId: SID }, now);
  const before = host.db.prepare("SELECT value, version FROM garden_store WHERE key = 'state'").get();
  host.db.exec("CREATE TRIGGER fail_variant_bloom BEFORE INSERT ON garden_plants BEGIN SELECT RAISE(ABORT, 'database or disk is full'); END");
  await assert.rejects(first.apply({ type: "tick", sessionId: SID }, 60000), /存储空间不足/);
  assert.deepEqual(host.db.prepare("SELECT value, version FROM garden_store WHERE key = 'state'").get(), before);
  host.db.exec("DROP TRIGGER fail_variant_bloom");
  const results = await Promise.all([first.apply({ type: "tick", sessionId: SID }, 60000), second.apply({ type: "tick", sessionId: SID }, 60000)]);
  const state = await first.load();
  assert.equal(draws, 1);
  assert.equal(state.garden.length, 1);
  assert.equal(state.garden[0].variant, "hidden");
  assert.equal(state.hiddenCollection.totalBlooms, 1);
  assert.deepEqual(state.hiddenCollection.species, ["daisy"]);
  assert.equal(state.focusStats.totalMs, 60000);
  assert.equal(results.reduce((sum, result) => sum + result.notes.length, 0), 1);
  assert.equal(state.earnedAchievements["hidden-first"], 60000);
});

test("upgrading an old growing pot adds one ticket while every old completed record stays byte-for-byte unchanged", async (t) => {
  const host = hostFor(t);
  const old = oldRuntime();
  const previous = old.GardenStore.createStore(host.call);
  await previous.apply({ type: "boot", sessionId: SID }, 0);
  await storeFlower(previous, "old-completed", "rose", 0);
  await previous.apply({ type: "plant", id: "old-growing", plant: settings("lily") }, 60000);
  await previous.apply({ type: "focus", sessionId: SID, event: { app: "reader" } }, 60000);
  await previous.apply({ type: "tick", sessionId: SID }, 70000);
  const oldState = await previous.load();
  const archive = host.db.prepare("SELECT value FROM garden_plants WHERE id = 'old-completed'").get().value;
  let draws = 0;
  const current = createStore(host.call, { random: () => { draws++; return .01; } });
  let conflicted = false;
  host.intercept = async (method, params) => {
    if (!conflicted && method === "db.execute" && params.sql.startsWith("UPDATE")) {
      conflicted = true;
      host.db.prepare("UPDATE garden_store SET version = version + 1 WHERE key = 'state'").run();
    }
  };
  const upgraded = await current.load();
  host.intercept = null;
  assert.equal(draws, 1);
  assert.equal(upgraded.active.variantRoll, .01);
  assert.equal(upgraded.active.progressMs, 10000);
  assert.equal(upgraded.hiddenCollection.totalBlooms, 0);
  assert.equal(core.variantOf(upgraded.garden[0]), "normal");
  assert.equal(host.db.prepare("SELECT value FROM garden_plants WHERE id = 'old-completed'").get().value, archive);
  assert.deepEqual(upgraded.focusStats, JSON.parse(JSON.stringify(oldState.focusStats)));
  assert.deepEqual(upgraded.earnedAchievements, JSON.parse(JSON.stringify(oldState.earnedAchievements)));
  await current.load();
  assert.equal(draws, 1);
  await current.apply({ type: "boot", sessionId: SID }, 70000);
  await current.apply({ type: "focus", sessionId: SID, event: { app: "reader" } }, 70000);
  for (let now = 80000; now <= 120000; now += 10000) await current.apply({ type: "tick", sessionId: SID }, now);
  const completed = await current.load();
  assert.equal(completed.garden.find((item) => item.id === "old-growing").variant, "hidden");
  assert.equal(completed.hiddenCollection.totalBlooms, 1);
  assert.equal(draws, 1);
});

test("two upgrading stores use the winning saved ticket without repeatedly sampling after a CAS loss", async (t) => {
  const host = hostFor(t);
  const previous = oldRuntime().GardenStore.createStore(host.call);
  await previous.apply({ type: "plant", id: "old-growing", plant: settings() }, 0);
  let firstDraws = 0;
  let secondDraws = 0;
  const first = createStore(host.call, { random: () => { firstDraws++; return .01; } });
  const second = createStore(host.call, { random: () => { secondDraws++; return .9; } });
  const [one, two] = await Promise.all([first.load(), second.load()]);
  assert.equal(one.active.variantRoll, two.active.variantRoll);
  assert.ok(firstDraws <= 1 && secondDraws <= 1);
  const draws = firstDraws + secondDraws;
  for (let index = 0; index < 3; index++) await Promise.all([first.load(), second.load()]);
  assert.equal(firstDraws + secondDraws, draws);
  const saved = JSON.parse(host.db.prepare("SELECT value FROM garden_store WHERE key = 'state'").get().value);
  assert.equal(saved.active.variantRoll, one.active.variantRoll);
});

test("hidden milestones are permanent and leave all prior thirty-six definitions untouched", () => {
  const old = oldRuntime();
  // Identity, names and thresholds are persistent; condition and description are display copy.
  const persistent = ({ condition, description, ...item }) => item;
  assert.deepEqual(core.ACHIEVEMENTS.slice(0, 36).map(persistent),
    JSON.parse(JSON.stringify(old.GardenCore.ACHIEVEMENTS)).map(persistent));
  assert.equal(core.ACHIEVEMENTS.length, 52);
  let state = change(null, { type: "boot", sessionId: SID });
  for (const [index, item] of core.SPECIES.entries())
    state = pureFlower(state, "p" + index, item.id, .01, index * 60000);
  const earned = structuredClone(state.earnedAchievements);
  for (const flower of [...state.garden]) state = change(state, { type: "delete", id: flower.id }, 480000);
  assert.equal(state.garden.length, 0);
  assert.equal(state.hiddenCollection.totalBlooms, 8);
  assert.equal(state.hiddenCollection.species.length, 8);
  assert.deepEqual(state.earnedAchievements, earned);
  state.hiddenCollection.totalBlooms = 49;
  state = core.refreshAchievements(core.normalizeState(state), 480000);
  assert.equal(state.earnedAchievements["hidden-50"], undefined);
  state = pureFlower(state, "fifty", "daisy", .01, 480000);
  assert.equal(state.hiddenCollection.totalBlooms, 50);
  assert.equal(state.earnedAchievements["hidden-50"], 540000);
  for (const [id, at] of Object.entries(earned)) assert.equal(state.earnedAchievements[id], at);
});

test("a persisted ticket is immutable and 0.15 writers cannot strip hidden collection metadata", async (t) => {
  const host = hostFor(t);
  const current = createStore(host.call, { random: () => .01 });
  await current.apply({ type: "plant", id: "protected", plant: settings() }, 0);
  const row = host.db.prepare("SELECT value, version FROM garden_store WHERE key = 'state'").get();
  for (const alteration of [
    (value) => { delete value.hiddenCollection; },
    (value) => { delete value.active.variantRoll; },
    (value) => { value.active.variantRoll = .9; },
  ]) {
    const attempted = JSON.parse(row.value);
    alteration(attempted);
    assert.throws(() => host.db.prepare("UPDATE garden_store SET value = ? WHERE key = 'state'").run(JSON.stringify(attempted)), /隐藏配色/);
    assert.deepEqual(host.db.prepare("SELECT value, version FROM garden_store WHERE key = 'state'").get(), row);
  }
  const old = oldRuntime();
  assert.throws(() => old.GardenCore.normalizeState(JSON.parse(row.value)), /版本不支持/);
  const lowered = JSON.parse(row.value);
  lowered.achievementRevision = 3;
  host.db.prepare("UPDATE garden_store SET value = ? WHERE key = 'state'").run(JSON.stringify(lowered));
  const before = host.db.prepare("SELECT value, version FROM garden_store WHERE key = 'state'").get();
  await assert.rejects(old.GardenStore.createStore(host.call).apply({ type: "notifications", enabled: false }, 0), /隐藏配色/);
  assert.deepEqual(host.db.prepare("SELECT value, version FROM garden_store WHERE key = 'state'").get(), before);
  await current.apply({ type: "delete", id: "protected" }, 0);
  assert.equal((await current.load()).active, null, "Removing the pot is allowed and does not forge a completed result");
});

test("a failed old-pot migration preserves the entire row and reuses its uncommitted candidate on retry", async (t) => {
  const host = hostFor(t);
  const previous = oldRuntime().GardenStore.createStore(host.call);
  await previous.apply({ type: "plant", id: "old-growing", plant: settings() }, 0);
  const before = host.db.prepare("SELECT value, version FROM garden_store WHERE key = 'state'").get();
  let draws = 0;
  let fail = true;
  const current = createStore(host.call, { random: () => { draws++; return .01; } });
  host.intercept = async (method, params) => {
    if (fail && method === "db.execute" && params.sql.startsWith("UPDATE"))
      throw new Error("database or disk is full");
  };
  await assert.rejects(current.load(), /存储空间不足/);
  assert.equal(draws, 1);
  assert.deepEqual(host.db.prepare("SELECT value, version FROM garden_store WHERE key = 'state'").get(), before);
  fail = false;
  const state = await current.load();
  assert.equal(state.active.variantRoll, .01);
  assert.equal(draws, 1);
  const restarted = createStore(host.call, { random: () => { throw new Error("A saved migration ticket must survive restart"); } });
  assert.equal((await restarted.load()).active.variantRoll, .01);
});

test("retrying a plant that never committed is a fresh request, while a committed flower cannot be re-rolled by its id", async (t) => {
  const host = hostFor(t);
  let draws = 0;
  const rolls = [.01, .9, .01];
  const store = createStore(host.call, { random: () => rolls[draws++] });
  await store.load();
  const before = host.db.prepare("SELECT value, version FROM garden_store WHERE key = 'state'").get();
  let fail = true;
  host.intercept = async (method, params) => {
    if (fail && method === "db.execute" && params.sql.startsWith("UPDATE"))
      throw new Error("database or disk is full");
  };
  await assert.rejects(store.apply({ type: "plant", id: "same-id", plant: settings() }, 0), /存储空间不足/);
  assert.equal(draws, 1);
  assert.deepEqual(host.db.prepare("SELECT value, version FROM garden_store WHERE key = 'state'").get(), before);
  fail = false;
  await store.apply({ type: "boot", sessionId: SID }, 0);
  await storeFlower(store, "same-id", "daisy");
  let state = await store.load();
  assert.equal(draws, 2);
  assert.equal(state.garden[0].variant, "normal");
  await assert.rejects(store.apply({ type: "plant", id: "same-id", plant: settings() }, 60000), /重复/);
  assert.equal(draws, 2, "Duplicate archived ids are rejected before a new draw");
  await store.apply({ type: "delete", id: "same-id" }, 60000);
  state = await store.load();
  assert.equal(state.collection.totalBlooms, 1);
  assert.equal(state.hiddenCollection.totalBlooms, 0, "Deleting an ordinary flower cannot change hidden totals");
  await storeFlower(store, "same-id", "daisy", 60000);
  state = await store.load();
  assert.equal(draws, 3, "Reusing a deleted id for a genuinely new pot gets a new ticket");
  assert.equal(state.garden[0].variant, "hidden");
  assert.equal(state.collection.totalBlooms, 2);
  assert.equal(state.hiddenCollection.totalBlooms, 1);
  await store.apply({ type: "delete", id: "same-id" }, 120000);
  assert.equal((await store.load()).hiddenCollection.totalBlooms, 1);
});

test("a lost acknowledgement after a successful plant write cannot cause a retry or restart to replace its ticket", async (t) => {
  const host = hostFor(t);
  let draws = 0;
  const store = createStore(host.call, { random: () => { draws++; return .01; } });
  await store.load();
  let loseReply = true;
  host.intercept = async (method, params) => {
    if (loseReply && method === "db.execute" && params.sql.startsWith("UPDATE")) {
      loseReply = false;
      host.db.prepare(params.sql).run(...params.params);
      throw new Error("The write succeeded but its acknowledgement was lost");
    }
  };
  await assert.rejects(store.apply({ type: "plant", id: "committed", plant: settings() }, 0), /acknowledgement/);
  assert.equal(draws, 1);
  assert.equal((await store.load()).active.variantRoll, .01);
  await assert.rejects(store.apply({ type: "plant", id: "committed", plant: settings() }, 0), /已有一株/);
  assert.equal(draws, 1);
  const restarted = createStore(host.call, { random: () => { throw new Error("The ticket is already stored"); } });
  assert.equal((await restarted.load()).active.variantRoll, .01);
});
