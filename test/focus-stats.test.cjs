"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");
const vm = require("node:vm");
const core = require("../core.js");
const { createStore } = require("../store.js");
const SID = "stats-worker";
const MINUTE = 60000;
const HOUR = 3600000;

function settings(extra = {}) {
  return { name: "有效生长", species: "daisy", targetMinutes: 1440,
    rules: [{ type: "app", value: "reader", exact: true }], ...extra };
}
function change(state, action, now = 0) { return core.reduce(state, action, now).state; }
function start(extra = {}) {
  let state = change(null, { type: "boot", sessionId: SID });
  state = change(state, { type: "plant", id: "plant", plant: settings(extra) });
  return focus(state, 0, { id: "reading", name: "阅读" });
}
function focus(state, now, category, extra = {}) {
  return change(state, { type: "focus", sessionId: SID, event: { app: "reader", category, ...extra } }, now);
}
function tick(state, now) { return change(state, { type: "tick", sessionId: SID }, now); }
function grow(state, from, duration) {
  const end = from + duration;
  while (from < end) {
    from = Math.min(end, from + 10000);
    state = tick(state, from);
  }
  return state;
}
function assertConserved(stats) {
  assert.equal(stats.categories.reduce((sum, item) => sum + item.ms, stats.uncategorizedMs + stats.otherMs), stats.totalMs);
  assert.ok(stats.streakMs <= stats.longestMs && stats.longestMs <= stats.totalMs);
}
function statsState(total, categories, extra = {}) {
  const state = core.initializeCollection(core.initialState(), 0, [], 100);
  state.focusStats = {
    ...core.initialFocusStats(100), totalMs: total,
    categories: categories.map((ms, index) => ({ id: "category-" + index, name: "分类" + index, ms })),
    uncategorizedMs: total - categories.reduce((sum, ms) => sum + ms, 0), ...extra,
  };
  return core.normalizeState(state);
}
function achievement(state, id) { return core.achievementProgress(state).find((item) => item.id === id); }
function hostFor(t) {
  const db = new DatabaseSync(":memory:");
  t.after(() => db.close());
  const host = { db, calls: [], intercept: null };
  host.call = async (method, params) => {
    const operation = { method, params: structuredClone(params) };
    host.calls.push(operation);
    if (host.intercept) {
      const result = await host.intercept(method, params);
      if (result !== undefined) return result;
    }
    const query = db.prepare(params.sql);
    return method === "db.query" ? query.all(...params.params) : query.run(...params.params);
  };
  return host;
}
async function prepare(store, extra = {}) {
  await store.apply({ type: "boot", sessionId: SID }, 0);
  await store.apply({ type: "plant", id: "plant", plant: settings(extra) }, 0);
  await store.apply({ type: "focus", sessionId: SID, event: { app: "reader", category: { id: "reading", name: "阅读" } } }, 0);
}
function oldRuntime() {
  const sandbox = vm.createContext({ URL, TextEncoder, setTimeout, clearTimeout });
  const folder = join(__dirname, "fixtures/garden-0.14.0");
  vm.runInContext(readFileSync(join(folder, "core.js"), "utf8"), sandbox);
  vm.runInContext(readFileSync(join(folder, "store.js"), "utf8"), sandbox);
  return sandbox;
}

test("only effective growth is counted once when OR rules overlap, using the actual focus category", () => {
  let state = start({ rules: [
    { type: "app", value: "reader" }, { type: "website", value: "example.com" },
    { type: "category", value: "guessed", label: "不能据此猜分类" },
  ] });
  state = focus(state, 0, { id: "actual", name: "实际分类", icon: "SECRET_ICON" }, { host: "example.com", title: "SECRET_TITLE" });
  state = tick(state, 5000);
  assert.equal(state.active.progressMs, 5000);
  assert.equal(state.focusStats.totalMs, 5000);
  assert.deepEqual(state.focusStats.categories, [{ id: "actual", name: "实际分类", ms: 5000 }]);
  assert.equal(JSON.stringify(state.focusStats).includes("SECRET"), false);
  assert.equal(JSON.stringify(state.focusStats).includes("reader"), false);
  assert.equal(JSON.stringify(state.focusStats).includes("example.com"), false);
  assertConserved(state.focusStats);
});

test("a final tick credits only the remaining goal and blooming starts a new streak for the next pot", () => {
  let state = grow(start({ targetMinutes: 1 }), 0, 59000);
  state = tick(state, 65000);
  assert.equal(state.active, null);
  assert.equal(state.focusStats.totalMs, MINUTE);
  assert.equal(state.focusStats.longestMs, MINUTE);
  assert.equal(state.focusStats.streakMs, 0);
  state = change(state, { type: "plant", id: "second", plant: settings() }, 65000);
  state = tick(state, 75000);
  assert.equal(state.focusStats.totalMs, 70000);
  assert.equal(state.focusStats.streakMs, 10000);
  assert.equal(state.focusStats.longestMs, MINUTE);
  assertConserved(state.focusStats);
});

test("each interruption boundary ends the streak without discarding total or longest time", () => {
  const base = grow(start(), 0, 20000);
  for (const [action, now] of [
    [{ type: "boot", sessionId: "new-worker" }, 20000],
    [{ type: "focus", sessionId: SID, event: { app: "other" } }, 20000],
    [{ type: "focus", sessionId: SID, event: { away: true } }, 20000],
    [{ type: "pause", paused: true }, 20000],
    [{ type: "rules", id: "plant", rules: settings().rules }, 20000],
    [{ type: "delete", id: "plant" }, 20000],
    [{ type: "error", message: "storage recovery" }, 20000],
    [{ type: "tick", sessionId: SID }, 31001],
    [{ type: "tick", sessionId: SID }, 19000],
  ]) {
    const next = change(base, action, now);
    assert.equal(next.focusStats.streakMs, 0, action.type);
    assert.equal(next.focusStats.totalMs, 20000, action.type);
    assert.equal(next.focusStats.longestMs, 20000, action.type);
    assertConserved(next.focusStats);
  }
  assert.equal(base.focusStats.streakMs, 20000, "Inputs remain immutable");
});

test("matching category changes and ordinary metadata edits preserve a continuous segment", () => {
  let state = grow(start(), 0, 20000);
  for (const action of [
    { type: "rename", id: "plant", name: "新的名字" },
    { type: "note", id: "plant", note: "新的记忆" },
    { type: "notifications", enabled: false },
    { type: "savePlan", id: "plan", name: "方案", plant: settings() },
  ]) state = change(state, action, 20000);
  state = focus(state, 20000, { id: "code", name: "编程" });
  state = tick(state, 30000);
  assert.equal(state.focusStats.streakMs, 30000);
  assert.equal(state.focusStats.longestMs, 30000);
  assert.deepEqual(state.focusStats.categories.map((item) => [item.id, item.ms]), [["reading", 20000], ["code", 10000]]);
});

test("penalties reduce plant progress without reversing observed time and off-rule grace still ends the streak", () => {
  let state = grow(start({ penalty: { enabled: true, kind: "percent", amount: 50, graceSeconds: 5 } }), 0, 20000);
  state = focus(state, 20000, null, { app: "other" });
  assert.equal(state.focusStats.streakMs, 0);
  state = tick(state, 25000);
  assert.equal(state.active.progressMs, 10000);
  assert.equal(state.focusStats.totalMs, 20000);
  state = focus(state, 25000, { id: "reading", name: "阅读" });
  state = tick(state, 35000);
  assert.equal(state.active.progressMs, 20000);
  assert.equal(state.focusStats.totalMs, 30000);
  assert.equal(state.focusStats.streakMs, 10000);
  assert.equal(state.focusStats.longestMs, 20000);
  assertConserved(state.focusStats);
});

test("24 real category buckets stay bounded while unknown and overflowing classifications conserve all time", () => {
  let state = start();
  let now = 0;
  for (let index = 0; index < 26; index++) {
    state = focus(state, now, { id: "id-" + index, name: "分类" + index });
    now += 2000;
    state = tick(state, now);
  }
  assert.equal(state.focusStats.categories.length, core.FOCUS_CATEGORY_LIMIT);
  assert.equal(state.focusStats.otherMs, 4000);
  state = focus(state, now, null);
  state = tick(state, now += 3000);
  state = focus(state, now, { id: "id-0", name: "分类改名" });
  state = tick(state, now += 2000);
  assert.equal(state.focusStats.categories[0].name, "分类改名");
  assert.equal(state.focusStats.categories[0].ms, 4000);
  assert.equal(state.focusStats.uncategorizedMs, 3000);
  assert.equal(state.focusStats.totalMs, 57000);
  assertConserved(state.focusStats);
  const snapshot = JSON.stringify(state.focusStats);
  const summary = core.focusSummary(state);
  assert.equal(summary.categoryLimit, 24);
  assert.equal(summary.buckets.length, 26);
  assert.equal(summary.qualifiedCategories, 0);
  assert.ok(Math.abs(summary.buckets.reduce((sum, item) => sum + item.percent, 0) - 100) < 1e-9);
  assert.equal(summary.buckets.filter((item) => item.id === null).length, 2);
  assert.equal(JSON.stringify(state.focusStats), snapshot);
});

test("continuous and lifetime achievements are granted by new observed time, not an active goal's size", () => {
  let state = start();
  assert.equal(achievement(state, "focus-1h").current, 0);
  state = grow(state, 0, 5 * MINUTE);
  assert.equal(state.earnedAchievements["streak-5m"], 5 * MINUTE);
  assert.equal(state.earnedAchievements["streak-15m"], undefined);
  state = grow(state, 5 * MINUTE, 55 * MINUTE);
  assert.equal(state.focusStats.totalMs, HOUR);
  assert.equal(state.earnedAchievements["focus-1h"], HOUR);
  assert.equal(state.earnedAchievements["streak-60m"], HOUR);
  assert.equal(state.earnedAchievements["ratio-single-80"], HOUR);
  state = change(state, { type: "pause", paused: true }, HOUR);
  assert.equal(state.focusStats.streakMs, 0);
  assert.equal(state.focusStats.longestMs, HOUR);
});

test("category variety needs ten effective minutes in each real retained bucket", () => {
  const almost = statsState(2 * HOUR, [10 * MINUTE, 10 * MINUTE - 1], { otherMs: HOUR, uncategorizedMs: 40 * MINUTE + 1 });
  assert.equal(achievement(almost, "categories-2x10m").current, 1);
  const enough = statsState(HOUR, [10 * MINUTE, 10 * MINUTE, 10 * MINUTE]);
  assert.equal(achievement(enough, "categories-2x10m").current, 2);
  assert.equal(achievement(enough, "categories-3x10m").current, 3);
  assert.equal(achievement(enough, "categories-5x10m").current, 3);
  assert.equal(core.focusSummary(enough).qualifiedCategories, 3);
});

test("ratio achievements require both minimum observed time and exact named-category proportions", () => {
  for (const [id, total, parts, eligible] of [
    ["ratio-single-80", 1000, [1000], false],
    ["ratio-single-80", HOUR - 1, [HOUR - 1], false],
    ["ratio-single-80", HOUR, [HOUR * .8 - 1], false],
    ["ratio-single-80", HOUR, [HOUR * .8], true],
    ["ratio-dual-25", HOUR, [HOUR * .75, HOUR * .25], true],
    ["ratio-dual-25", HOUR, [HOUR * .75, HOUR * .25 - 1], false],
    ["ratio-triple-15", HOUR, [HOUR * .4, HOUR * .3, HOUR * .3], false],
    ["ratio-triple-15", 2 * HOUR, [HOUR * .3, HOUR * .3, HOUR * .3], true],
  ]) {
    const item = achievement(statsState(total, parts), id);
    assert.equal(item.eligible, eligible, id);
    assert.equal(item.current === 100, eligible, id);
    assert.ok(item.current >= 0 && item.current <= 100);
    assert.equal(item.observedTotalMs, total);
  }
  const noNamed = statsState(10 * HOUR, [], { uncategorizedMs: 5 * HOUR, otherMs: 5 * HOUR });
  assert.equal(achievement(noNamed, "ratio-single-80").current, 0);
});

test("changing later proportions never revokes a ratio achievement already obtained", () => {
  let state = core.refreshAchievements(statsState(HOUR, [HOUR]), HOUR);
  assert.equal(state.earnedAchievements["ratio-single-80"], HOUR);
  state.focusStats.totalMs = 4 * HOUR;
  state.focusStats.uncategorizedMs = 3 * HOUR;
  state = core.refreshAchievements(core.normalizeState(state), 4 * HOUR);
  assert.equal(achievement(state, "ratio-single-80").eligible, false);
  assert.equal(state.earnedAchievements["ratio-single-80"], HOUR);
});

test("invalid statistic schemas, duplicate identities and inconsistent sums stop without rewriting input", () => {
  const state = statsState(1000, [1000]);
  for (const delta of [
    { schema: 2 }, { totalMs: 1001 }, { totalMs: -1 }, { longestMs: 1001 }, { streakMs: 1 },
    { categories: [state.focusStats.categories[0], state.focusStats.categories[0]] },
    { categories: Array.from({ length: 25 }, (_, index) => ({ id: String(index), name: "x", ms: 1 })) },
    { categories: [{ id: "valid", name: "x".repeat(81), ms: 1000 }] },
  ]) {
    const attempted = { ...state, focusStats: { ...state.focusStats, ...delta } };
    const before = JSON.stringify(attempted);
    assert.throws(() => core.normalizeState(attempted), /统计/);
    assert.equal(JSON.stringify(attempted), before);
  }
});

test("competing worker ticks and a forced CAS retry never duplicate growth statistics", async (t) => {
  const host = hostFor(t);
  const first = createStore(host.call);
  const second = createStore(host.call);
  await prepare(first);
  await Promise.all([first.apply({ type: "tick", sessionId: SID }, 5000), second.apply({ type: "tick", sessionId: SID }, 5000)]);
  assert.equal((await first.load()).focusStats.totalMs, 5000);
  let conflict = false;
  host.intercept = async (method, params) => {
    if (!conflict && method === "db.execute" && params.sql.startsWith("UPDATE")) {
      conflict = true;
      host.db.prepare("UPDATE garden_store SET version = version + 1 WHERE key = 'state'").run();
    }
  };
  await first.apply({ type: "tick", sessionId: SID }, 10000);
  host.intercept = null;
  await Promise.all([
    first.apply({ type: "note", id: "plant", note: "并发备注" }, 10000),
    second.apply({ type: "notifications", enabled: false }, 10000),
  ]);
  const state = await createStore(host.call).load();
  assert.equal(state.active.progressMs, 10000);
  assert.equal(state.focusStats.totalMs, 10000);
  assert.equal(state.focusStats.longestMs, 10000);
  assert.equal(state.focusStats.streakMs, 10000);
  assert.equal(state.active.taskNote, "并发备注");
  assert.equal(state.notify, false);
  assertConserved(state.focusStats);
});

test("a failed bloom rolls back statistics and every archive change, then retries exactly once", async (t) => {
  const host = hostFor(t);
  const first = createStore(host.call);
  const second = createStore(host.call);
  await prepare(first, { targetMinutes: 1 });
  for (let now = 10000; now <= 50000; now += 10000) await first.apply({ type: "tick", sessionId: SID }, now);
  const before = host.db.prepare("SELECT value, version FROM garden_store WHERE key = 'state'").get();
  host.db.exec("CREATE TRIGGER fail_bloom BEFORE INSERT ON garden_plants BEGIN SELECT RAISE(ABORT, 'database or disk is full'); END");
  await assert.rejects(first.apply({ type: "tick", sessionId: SID }, MINUTE), /存储空间不足/);
  assert.deepEqual(host.db.prepare("SELECT value, version FROM garden_store WHERE key = 'state'").get(), before);
  assert.equal(host.db.prepare("SELECT COUNT(*) AS count FROM garden_plants").get().count, 0);
  host.db.exec("DROP TRIGGER fail_bloom");
  const results = await Promise.all([first.apply({ type: "tick", sessionId: SID }, MINUTE), second.apply({ type: "tick", sessionId: SID }, MINUTE)]);
  const state = await first.load();
  assert.equal(state.focusStats.totalMs, MINUTE);
  assert.equal(state.focusStats.streakMs, 0);
  assert.equal(state.garden.length, 1);
  assert.equal(results.reduce((sum, item) => sum + item.notes.length, 0), 1);
});

test("0.14 upgrade starts at zero, keeps old achievements and progress, and requires a fresh focus observation", async (t) => {
  const host = hostFor(t);
  const old = oldRuntime();
  let previous = old.GardenCore.reduce(null, { type: "boot", sessionId: SID }, 0).state;
  previous = old.GardenCore.reduce(previous, { type: "plant", id: "plant", plant: settings() }, 0).state;
  previous = old.GardenCore.initializeCollection(previous, 1000, core.SPECIES.map((item) => item.id), 100);
  previous = old.GardenCore.reduce(previous, { type: "focus", sessionId: SID, event: { app: "reader", category: { id: "reading", name: "阅读" } } }, 100).state;
  previous.active.progressMs = 5 * HOUR;
  host.db.exec("CREATE TABLE garden_store (key TEXT PRIMARY KEY, value TEXT NOT NULL, version INTEGER NOT NULL)");
  host.db.prepare("INSERT INTO garden_store VALUES (?, ?, ?)").run("state", JSON.stringify(previous), 7);
  const started = Date.now();
  const store = createStore(host.call);
  const state = await store.load();
  assert.equal(state.focusStats.totalMs, 0);
  assert.ok(state.focusStats.startedAt >= started && state.focusStats.startedAt <= Date.now());
  assert.equal(state.active.progressMs, 5 * HOUR);
  assert.equal(state.focus, null);
  assert.deepEqual(state.earnedAchievements, JSON.parse(JSON.stringify(previous.earnedAchievements)));
  assert.equal(state.achievementRevision, core.ACHIEVEMENT_REVISION);
  assert.equal(achievement(state, "focus-1h").earnedAt, null);
  assert.throws(() => old.GardenCore.normalizeState(JSON.parse(host.db.prepare("SELECT value FROM garden_store WHERE key = 'state'").get().value)), /版本不支持/);
  await store.apply({ type: "boot", sessionId: SID }, 20000);
  await store.apply({ type: "tick", sessionId: SID }, 30000);
  assert.equal((await store.load()).focusStats.totalMs, 0);
  await store.apply({ type: "focus", sessionId: SID, event: { app: "reader", category: { id: "reading", name: "阅读" } } }, 30000);
  await store.apply({ type: "tick", sessionId: SID }, 40000);
  const after = await store.load();
  assert.equal(after.focusStats.totalMs, 10000);
  assert.equal(after.active.progressMs, 5 * HOUR + 10000);
});

test("a persistent SQL guard also rejects a 0.14 writer that otherwise accepts the lowered catalog revision", async (t) => {
  const host = hostFor(t);
  const current = createStore(host.call);
  await prepare(current);
  await current.apply({ type: "tick", sessionId: SID }, 5000);
  const value = JSON.parse(host.db.prepare("SELECT value FROM garden_store WHERE key = 'state'").get().value);
  value.achievementRevision = 2;
  host.db.prepare("UPDATE garden_store SET value = ? WHERE key = 'state'").run(JSON.stringify(value));
  const before = host.db.prepare("SELECT value, version FROM garden_store WHERE key = 'state'").get();
  const older = oldRuntime().GardenStore.createStore(host.call);
  await assert.rejects(older.apply({ type: "notifications", enabled: false }, 5000), /此版本的时光花园已过期/);
  assert.deepEqual(host.db.prepare("SELECT value, version FROM garden_store WHERE key = 'state'").get(), before);
  await current.apply({ type: "note", id: "plant", note: "新版可继续保存" }, 5000);
  const state = await current.load();
  assert.equal(state.achievementRevision, core.ACHIEVEMENT_REVISION);
  assert.equal(state.focusStats.totalMs, 5000);
  assert.equal(state.active.taskNote, "新版可继续保存");
});
