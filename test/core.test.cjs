const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../core.js");

const SID = "worker-a";
function settings(overrides = {}) {
  return {
    name: "阅读绣球",
    species: "hydrangea",
    targetMinutes: 1,
    rules: [{ type: "app", value: "reader.exe", exact: true }],
    ...overrides,
  };
}
function change(state, input, now) {
  return core.reduce(state, input, now).state;
}
function boot(now = 0) {
  return change(null, { type: "boot", sessionId: SID }, now);
}
function planted(overrides = {}) {
  return change(
    boot(),
    { type: "plant", id: "plant-1", plant: settings(overrides) },
    0,
  );
}
function focus(state, app, now, rest = {}) {
  return change(
    state,
    { type: "focus", sessionId: SID, event: { app, ...rest } },
    now,
  );
}
function tick(state, now) {
  return change(state, { type: "tick", sessionId: SID }, now);
}
function grow(state, start, finish) {
  for (let now = start + 1000; now <= finish; now += 1000)
    state = tick(state, now);
  return state;
}
const strict = { enabled: true, kind: "percent", amount: 25, graceSeconds: 5 };

test("website normalization and boundary matching exclude lookalike domains", () => {
  assert.equal(
    core.normalizeHost("https://WWW.Example.com/path?q=x"),
    "example.com",
  );
  const rules = [{ type: "website", value: "example.com" }];
  assert.equal(core.matches(rules, { host: "docs.example.com" }), true);
  for (const host of ["notexample.com", "example.com.evil.org"]) {
    assert.equal(core.matches(rules, { host }), false);
  }
  for (const host of [
    "",
    "not a domain",
    "ftp://example.com",
    "https://a@b.com",
    "-bad.com",
  ]) {
    assert.throws(() => core.normalizeHost(host));
  }
});

test("app matching is case insensitive, strips exe, supports exact and OR rules", () => {
  const rules = core.validatePlant(settings()).rules;
  assert.equal(core.matches(rules, { app: "READER.EXE" }), true);
  assert.equal(core.matches(rules, { app: "Reader Helper" }), false);
  assert.equal(
    core.matches([{ type: "app", value: "reader" }], { app: "Reader Helper" }),
    true,
  );
  assert.equal(
    core.matches([...rules, { type: "website", value: "example.com" }], {
      host: "example.com",
    }),
    true,
  );
  assert.equal(core.matches(rules, { app: "reader", away: true }), false);
});

test("input validation constrains all settings and ignores forged progress", () => {
  const value = core.validatePlant(
    settings({ progressMs: 99999, penalty: {} }),
  );
  assert.equal(value.progressMs, undefined);
  assert.equal(value.targetMs, 60000);
  assert.equal(value.penalty.enabled, false);
  for (const override of [
    { name: " " },
    { species: "fake" },
    { targetMinutes: 0 },
    { targetMinutes: 1.5 },
    { rules: [] },
    { rules: [{ type: "app", value: "x".repeat(121) }] },
    { penalty: { amount: 101 } },
    { penalty: { graceSeconds: 301 } },
  ]) {
    assert.throws(() => core.validatePlant(settings(override)));
  }
});

test("only fresh matching foreground time grows; default off-rule pause has no penalty", () => {
  let state = planted();
  state = grow(state, 0, 3000);
  assert.equal(state.active.progressMs, 0);
  state = focus(state, "reader", 3000);
  state = grow(state, 3000, 13000);
  assert.equal(state.active.progressMs, 10000);
  state = focus(state, "chat", 13000);
  state = grow(state, 13000, 30000);
  assert.equal(state.active.progressMs, 10000);
  assert.equal(state.lastPenalty, null);
});

test("leaving a matching app settles old interval and arriving does not count absent time", () => {
  let state = focus(planted(), "reader", 0);
  state = focus(state, "chat", 7000);
  assert.equal(state.active.progressMs, 7000);
  state = focus(state, "reader", 14000);
  assert.equal(state.active.progressMs, 7000);
  state = tick(state, 16000);
  assert.equal(state.active.progressMs, 9000);
});

test("returning before grace cancels a pending deduction", () => {
  let state = focus(planted({ penalty: strict }), "reader", 0);
  state = grow(state, 0, 20000);
  state = focus(state, "chat", 20000);
  state = tick(state, 24000);
  assert.equal(state.active.progressMs, 20000);
  state = focus(state, "reader", 24000);
  state = tick(state, 25000);
  assert.equal(state.active.progressMs, 21000);
  assert.equal(state.interruption, null);
  assert.equal(state.lastPenalty, null);
});

test("percentage penalty is current accumulated progress and happens once per interruption", () => {
  let state = focus(planted({ penalty: strict }), "reader", 0);
  state = grow(state, 0, 20000);
  state = focus(state, "chat", 20000);
  state = grow(state, 20000, 25000);
  assert.equal(state.active.progressMs, 15000);
  assert.equal(state.lastPenalty.lostMs, 5000);
  state = focus(state, "browser", 26000);
  state = grow(state, 26000, 40000);
  assert.equal(state.active.progressMs, 15000);
  state = focus(state, "reader", 40000);
  state = tick(state, 41000);
  state = focus(state, "chat", 41000);
  state = grow(state, 41000, 46000);
  assert.equal(state.active.progressMs, 12000);
});

test("different off-rule programs do not restart the grace countdown", () => {
  let state = focus(planted({ penalty: strict }), "reader", 0);
  state = grow(state, 0, 10000);
  state = focus(state, "chat", 10000);
  state = focus(state, "browser", 13000);
  state = tick(state, 15000);
  assert.equal(state.active.progressMs, 7500);
  assert.equal(state.lastPenalty.at, 15000);
});

test("fixed minutes penalty clamps at zero, including zero grace", () => {
  let state = focus(
    planted({
      penalty: { enabled: true, kind: "minutes", amount: 1, graceSeconds: 0 },
    }),
    "reader",
    0,
  );
  state = tick(state, 10000);
  state = focus(state, "chat", 10000);
  assert.equal(state.active.progressMs, 0);
  assert.equal(state.lastPenalty.lostMs, 10000);
  state = tick(state, 11000);
  assert.equal(state.active.progressMs, 0);
});

test("manual pause cancels interruption without advancing time or charging penalty", () => {
  let state = focus(planted({ penalty: strict }), "reader", 0);
  state = grow(state, 0, 20000);
  state = focus(state, "chat", 20000);
  state = change(state, { type: "pause", paused: true }, 26000);
  assert.equal(state.active.progressMs, 20000);
  assert.equal(state.interruption, null);
  state = grow(state, 26000, 40000);
  state = change(state, { type: "pause", paused: false }, 40000);
  state = tick(state, 41000);
  assert.equal(state.active.progressMs, 20000);
  assert.equal(state.lastPenalty, null);
});

test("away cancels pending penalty and never grows while away", () => {
  let state = focus(planted({ penalty: strict }), "reader", 0);
  state = grow(state, 0, 10000);
  state = focus(state, "chat", 10000);
  state = focus(state, null, 17000, { away: true });
  state = grow(state, 17000, 27000);
  assert.equal(state.active.progressMs, 10000);
  assert.equal(state.interruption, null);
  assert.equal(state.lastPenalty, null);
});

test("worker boot keeps progress, clears old focus and ignores stale worker events", () => {
  let state = focus(planted({ penalty: strict }), "reader", 0);
  state = tick(state, 10000);
  state = focus(state, "chat", 10000);
  state = change(state, { type: "boot", sessionId: "worker-b" }, 1000000);
  state = change(state, { type: "tick", sessionId: "worker-b" }, 1001000);
  assert.equal(state.active.progressMs, 10000);
  assert.equal(state.lastPenalty, null);
  assert.equal(state.focus, null);
  const stale = change(
    state,
    { type: "focus", sessionId: SID, event: { app: "reader" } },
    1001000,
  );
  assert.deepEqual(stale, state);
});

test("suspension gaps and backwards wall clock are neither growth nor punishment", () => {
  for (const endpoint of [30000, 5000]) {
    let state = focus(planted({ penalty: strict }), "reader", 0);
    state = tick(state, 10000);
    state = focus(state, "chat", 10000);
    state = tick(state, endpoint);
    assert.equal(state.active.progressMs, 10000);
    assert.equal(state.focus, null);
    assert.equal(state.interruption, null);
    assert.equal(state.lastPenalty, null);
  }
  let state = focus(planted(), "reader", 0);
  state = tick(state, 20000);
  assert.equal(state.active.progressMs, 0);
  assert.equal(state.focus, null);
  state = focus(state, "reader", 21000);
  state = tick(state, 22000);
  assert.equal(state.active.progressMs, 1000);
});

test("source timestamps cannot replay historical time", () => {
  let state = focus(planted(), "reader", 1000, { at: "2000-01-01T00:00:00Z" });
  state = tick(state, 2000);
  assert.equal(state.active.progressMs, 1000);
});

test("bloom is atomic, emitted once, and mature archive drops matching details", () => {
  let state = focus(planted(), "reader", 0);
  state = grow(state, 0, 59000);
  const result = core.reduce(state, { type: "tick", sessionId: SID }, 61000);
  assert.equal(result.state.active, null);
  assert.equal(result.state.garden.length, 1);
  assert.equal(result.state.garden[0].progressMs, 60000);
  assert.equal(result.state.garden[0].rules, undefined);
  assert.equal(result.state.garden[0].penalty, undefined);
  assert.equal(result.notes.length, 1);
  assert.equal(result.notes[0].id, "plant-1");
  const again = core.reduce(
    result.state,
    { type: "tick", sessionId: SID },
    62000,
  );
  assert.equal(again.notes.length, 0);
  assert.equal(again.state.garden.length, 1);
});

test("disabled notifications preserve the completed plant without notes", () => {
  let state = planted();
  state = change(state, { type: "notifications", enabled: false }, 0);
  state = focus(state, "reader", 0);
  state = grow(state, 0, 59000);
  const result = core.reduce(state, { type: "tick", sessionId: SID }, 60000);
  assert.equal(result.state.garden.length, 1);
  assert.deepEqual(result.notes, []);
});

test("page actions cannot create elapsed time or mutate their input state", () => {
  const previous = focus(planted(), "reader", 0);
  const frozen = JSON.stringify(previous);
  const renamed = change(
    previous,
    { type: "rename", id: "plant-1", name: " 新名字 " },
    500000,
  );
  assert.equal(renamed.active.progressMs, 0);
  assert.equal(renamed.active.name, "新名字");
  assert.equal(JSON.stringify(previous), frozen);
  assert.throws(() =>
    change(previous, { type: "plant", id: "second", plant: settings() }, 0),
  );
  assert.throws(() =>
    change(previous, { type: "rename", id: "missing", name: "x" }, 0),
  );
});

test("a page command after sleep cannot refresh stale foreground observations", () => {
  let state = focus(planted({ penalty: strict }), "reader", 0);
  state = tick(state, 10000);
  state = change(state, { type: "notifications", enabled: false }, 60000);
  assert.equal(state.focus, null);
  state = tick(state, 61000);
  assert.equal(state.active.progressMs, 10000);
  assert.equal(state.lastPenalty, null);
});

test("return at the grace deadline applies exactly one deduction before resuming", () => {
  let state = focus(planted({ penalty: strict }), "reader", 0);
  state = tick(state, 10000);
  state = focus(state, "chat", 10000);
  state = focus(state, "reader", 15000);
  assert.equal(state.active.progressMs, 7500);
  assert.equal(state.lastPenalty.lostMs, 2500);
  assert.equal(state.interruption, null);
  state = tick(state, 16000);
  assert.equal(state.active.progressMs, 8500);
});

test("rename and delete work for the collection; no implicit replacement", () => {
  let state = focus(planted(), "reader", 0);
  state = grow(state, 0, 60000);
  state = change(
    state,
    { type: "rename", id: "plant-1", name: "我的第一朵花" },
    60000,
  );
  assert.equal(state.garden[0].name, "我的第一朵花");
  state = change(state, { type: "delete", id: "plant-1" }, 60000);
  assert.equal(state.garden.length, 0);
  state = change(
    state,
    { type: "plant", id: "plant-2", plant: settings() },
    60000,
  );
  state = change(state, { type: "delete", id: "plant-2" }, 60000);
  assert.equal(state.active, null);
});

test("saved state validation rejects unknown schema and corrupted progress", () => {
  assert.throws(() => core.normalizeState({ schema: 2, garden: [] }));
  const state = planted();
  state.active.progressMs = -1;
  assert.throws(() => core.normalizeState(state));
  assert.equal(core.normalizeState(null).schema, 1);
  assert.deepEqual(core.normalizeState(planted()), planted());
});

test("collection limit is explicit and never silently discards an existing flower", () => {
  const state = core.initialState();
  state.garden = Array.from({ length: 200 }, (_, index) => ({
    id: "mature-" + index,
    name: "花",
    species: "daisy",
    targetMs: 60000,
    progressMs: 60000,
    createdAt: 0,
    bloomAt: 100,
  }));
  assert.throws(
    () => change(state, { type: "plant", id: "next", plant: settings() }, 100),
    /200/,
  );
  assert.equal(state.garden.length, 200);
});

test("five stages include seed and mature, with safe boundary clamps", () => {
  assert.deepEqual(
    [0, 15000, 30000, 45000, 60000].map((at) => core.stage(at, 60000)),
    [0, 1, 2, 3, 4],
  );
  assert.equal(core.stage(999999, 60000), 4);
  assert.equal(core.stage(-10, 60000), 0);
  assert.equal(core.stage(100, 0), 0);
});
