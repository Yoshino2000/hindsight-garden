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

test("category rules validate opaque IDs without app normalization and bound optional labels", () => {
  assert.deepEqual(
    core.validateRules([
      {
        type: "category",
        value: " Reading.EXE ",
        label: " 阅读 ",
        exact: true,
      },
      { type: "superCategory", value: " Work-A ", exact: true },
    ]),
    [
      { type: "category", value: "Reading.EXE", label: "阅读", exact: false },
      { type: "superCategory", value: "Work-A", exact: false },
    ],
  );
  assert.equal(
    core.validateRules([{ type: "category", value: "x".repeat(128) }])[0].value
      .length,
    128,
  );
  for (const rule of [
    { type: "category", value: " " },
    { type: "category", value: -1 },
    { type: "category", value: "x".repeat(129) },
    { type: "category", value: "reading", label: "x".repeat(81) },
    { type: "category", value: "reading", label: 100 },
    { type: "supercategory", value: "work" },
  ])
    assert.throws(() => core.validateRules([rule]));
});

test("category matching uses exact stable IDs, ignores renames, and separates parent from child", () => {
  const child = core.validateRules([
    { type: "category", value: "Reading.EXE", label: "旧名称" },
  ]);
  const parent = core.validateRules([
    { type: "superCategory", value: "Work-A", label: "工作" },
  ]);
  const event = {
    category: {
      id: "Reading.EXE",
      name: "新名称",
      superCategory: { id: "Work-A", name: "重命名" },
    },
  };
  assert.equal(core.matches(child, event), true);
  assert.equal(core.matches(parent, event), true);
  assert.equal(core.matches(child, { category: { id: "reading.exe" } }), false);
  assert.equal(core.matches(child, { category: { id: "reading" } }), false);
  assert.equal(
    core.matches(child, { category: { id: "different", name: "旧名称" } }),
    false,
  );
  assert.equal(core.matches(child, { category: { id: "Work-A" } }), false);
  assert.equal(
    core.matches(parent, { category: { id: "Work-A", superCategory: null } }),
    false,
  );
  assert.equal(
    core.matches(parent, {
      category: { id: "Reading.EXE", superCategory: { id: "work-a" } },
    }),
    false,
  );
  assert.equal(core.matches(child, { category: null }), false);
  assert.equal(core.matches(parent, {}), false);
  assert.equal(core.matches(child, { ...event, away: true }), false);
  assert.equal(
    core.matches([...child, { type: "app", value: "reader", exact: true }], {
      app: "reader",
    }),
    true,
  );
  assert.equal(
    core.matches([{ type: "unknown", value: "example.com" }], {
      host: "example.com",
    }),
    false,
  );
});

test("focus persistence keeps only the category identity and name, without titles or decorative fields", () => {
  let state = planted({
    rules: [{ type: "category", value: "reading", label: "阅读" }],
  });
  state = focus(state, "unrelated", 0, {
    category: {
      id: "reading",
      name: "阅读",
      color: "SECRET_COLOR",
      icon: "SECRET_ICON",
      superCategory: {
        id: "leisure",
        name: "休闲",
        color: "SECRET_PARENT_COLOR",
        icon: "SECRET_PARENT_ICON",
      },
    },
    title: "SECRET_TITLE",
  });
  assert.deepEqual(state.focus.category, {
    id: "reading",
    name: "阅读",
    superCategory: { id: "leisure", name: "休闲" },
  });
  state = tick(state, 5000);
  assert.equal(state.active.progressMs, 5000);
  assert.equal(JSON.stringify(state).includes("SECRET"), false);
  state = focus(state, null, 5000, {
    away: true,
    category: { id: "reading", name: "阅读" },
  });
  assert.equal(state.focus.category, null);
});

test("a parent category grows across its child categories but not unrelated or missing categories", () => {
  let state = planted({ rules: [{ type: "superCategory", value: "work" }] });
  state = focus(state, "editor", 0, {
    category: { id: "code", superCategory: { id: "work", name: "工作" } },
  });
  state = tick(state, 5000);
  state = focus(state, "reader", 5000, {
    category: {
      id: "reading",
      superCategory: { id: "work", name: "新工作名" },
    },
  });
  state = tick(state, 10000);
  assert.equal(state.active.progressMs, 10000);
  state = focus(state, "game", 10000, {
    category: { id: "game", superCategory: { id: "play" } },
  });
  state = tick(state, 15000);
  state = focus(state, "unknown", 15000, { category: null });
  state = tick(state, 20000);
  assert.equal(state.active.progressMs, 10000);
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

test("editing an active plant's rules keeps its growth and identity while cancelling old penalties", () => {
  let state = focus(planted({ penalty: strict }), "reader", 0);
  state = grow(state, 0, 20000);
  state = focus(state, "chat", 20000);
  state = grow(state, 20000, 25000);
  assert.equal(state.active.progressMs, 15000);
  assert.ok(state.lastPenalty);
  assert.ok(state.interruption);
  const previous = structuredClone(state);
  const result = core.reduce(
    state,
    {
      type: "rules",
      id: "plant-1",
      rules: [{ type: "category", value: "reading", label: "阅读" }],
    },
    26000,
  );
  state = result.state;
  assert.deepEqual(result.notes, []);
  assert.equal(state.interruption, null);
  assert.equal(state.lastPenalty, null);
  const { rules, ...retained } = state.active;
  const { rules: oldRules, ...expected } = previous.active;
  assert.deepEqual(retained, expected);
  assert.deepEqual(rules, [
    { type: "category", value: "reading", label: "阅读", exact: false },
  ]);
  assert.deepEqual(previous.active.rules, oldRules);
  assert.deepEqual(previous, core.normalizeState(previous));
  state = tick(state, 27000);
  assert.equal(state.active.progressMs, 15000);
  assert.equal(state.lastPenalty, null);
  state = focus(state, "any-app", 28000, {
    category: { id: "reading", name: "重新命名的分类" },
  });
  state = tick(state, 29000);
  assert.equal(state.active.progressMs, 16000);
});

test("changing from a matching to nonmatching rule is not itself a punishable interruption", () => {
  let state = focus(planted({ penalty: strict }), "reader", 0);
  state = grow(state, 0, 10000);
  state = change(
    state,
    {
      type: "rules",
      id: "plant-1",
      rules: [{ type: "superCategory", value: "work", label: "工作" }],
    },
    11000,
  );
  state = grow(state, 11000, 21000);
  assert.equal(state.active.progressMs, 10000);
  assert.equal(state.interruption, null);
  assert.equal(state.lastPenalty, null);
  assert.throws(() =>
    change(
      state,
      {
        type: "rules",
        id: "missing",
        rules: [{ type: "category", value: "reading" }],
      },
      21000,
    ),
  );
  assert.throws(() =>
    change(state, { type: "rules", id: "plant-1", rules: [] }, 21000),
  );
});

test("0.1.0 saved flowers, app rules, and progress load without a category field or destructive migration", () => {
  let legacy = focus(planted(), "reader", 0);
  legacy = tick(legacy, 7000);
  delete legacy.focus.category;
  legacy.garden = [
    {
      id: "old-flower",
      name: "旧花",
      species: "daisy",
      createdAt: 0,
      bloomAt: 1000,
      targetMs: 60000,
      progressMs: 60000,
    },
  ];
  const raw = JSON.stringify(legacy);
  const loaded = core.normalizeState(JSON.parse(raw));
  assert.equal(loaded.schema, 2);
  assert.equal(loaded.focus.category, null);
  assert.deepEqual(loaded.active, legacy.active);
  assert.deepEqual(loaded.garden, legacy.garden);
  assert.equal(loaded.active.progressMs, 7000);
  assert.equal(JSON.stringify(legacy), raw);
  const next = change(
    loaded,
    {
      type: "rules",
      id: "plant-1",
      rules: [{ type: "category", value: "reading" }],
    },
    7000,
  );
  assert.equal(next.active.progressMs, 7000);
  assert.deepEqual(next.garden, legacy.garden);
});

test("malformed or missing category identities are unknown, never accidental matches", () => {
  for (const category of [
    undefined,
    null,
    { id: " " },
    { id: -1 },
    { id: "x".repeat(129) },
  ]) {
    let state = planted({ rules: [{ type: "category", value: "reading" }] });
    state = focus(state, "reader", 0, { category });
    state = tick(state, 5000);
    assert.equal(state.focus.category, null);
    assert.equal(state.active.progressMs, 0);
  }
});

test("saved state validation rejects unknown schema and corrupted progress", () => {
  assert.throws(() => core.normalizeState({ schema: 3, garden: [] }));
  const state = planted();
  state.active.progressMs = -1;
  assert.throws(() => core.normalizeState(state));
  assert.equal(core.normalizeState(null).schema, 2);
  assert.deepEqual(core.normalizeState(planted()), planted());
});

test("large collections keep every flower and permit a new plant to mature without a count cap", () => {
  const state = core.initialState();
  state.garden = Array.from({ length: 5000 }, (_, index) => ({
    id: "mature-" + index,
    name: "花",
    species: "daisy",
    targetMs: 60000,
    progressMs: 60000,
    createdAt: 0,
    bloomAt: 100,
  }));
  let next = change(state, { type: "plant", id: "next", plant: settings() }, 100);
  next = change(next, { type: "boot", sessionId: SID }, 100);
  next = focus(next, "reader", 100);
  for (let now = 10100; now <= 60100; now += 10000) next = tick(next, now);
  assert.equal(next.active, null);
  assert.equal(next.garden.length, 5001);
  assert.equal(next.garden[0].id, "next");
  assert.equal(state.garden.length, 5000);
  assert.equal(core.normalizeState(next).garden.length, 5001);
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

test("new flower species can be planted, saved and bloomed through the same timing rules", () => {
  assert.deepEqual(core.SPECIES.map((species) => species.id), [
    "sunflower", "hydrangea", "tulip", "daisy", "rose", "lavender", "cosmos", "lily",
  ]);
  assert.equal(new Set(core.SPECIES.map((species) => species.id)).size, 8);
  for (const species of ["rose", "lavender", "cosmos", "lily"]) {
    let state = planted({ species });
    state = core.normalizeState(JSON.parse(JSON.stringify(state)));
    state = focus(state, "reader", 0);
    state = grow(state, 0, 60000);
    assert.equal(state.active, null);
    assert.equal(state.garden[0].species, species);
    assert.equal(state.garden[0].progressMs, 60000);
    assert.deepEqual(core.normalizeState(state).garden, state.garden);
  }
});

test("older four-species collections and a growing plant keep their IDs and progress", () => {
  let previous = planted({ species: "hydrangea", rules: [
    { type: "category", value: "reading", label: "阅读" },
  ] });
  previous = focus(previous, "reader", 0, { category: { id: "reading", name: "阅读" } });
  previous = tick(previous, 7000);
  previous.garden = ["sunflower", "hydrangea", "tulip", "daisy"].map((species, index) => ({
    id: "old-" + species, name: "旧花" + index, species, createdAt: index,
    bloomAt: index + 1000, targetMs: 60000, progressMs: 60000,
  }));
  const loaded = core.normalizeState(JSON.parse(JSON.stringify(previous)));
  assert.deepEqual(loaded, previous);
  assert.equal(loaded.active.progressMs, 7000);
  assert.deepEqual(loaded.garden.map((plant) => plant.id), [
    "old-sunflower", "old-hydrangea", "old-tulip", "old-daisy",
  ]);
});

test("queued worker observations cannot undo a newer page action or count through that action", () => {
  let state = focus(planted(), "reader", 0);
  state = tick(state, 2000);
  state = change(state, { type: "pause", paused: true }, 6000);
  state = change(state, { type: "pause", paused: false }, 7000);
  state = change(state, { type: "focus", sessionId: SID, observedAt: 5000, event: { app: "reader" } }, 8000);
  assert.equal(state.focus, null);
  assert.equal(state.active.progressMs, 2000);
  state = tick(state, 10000);
  assert.equal(state.active.progressMs, 2000);
  state = change(state, { type: "focus", sessionId: SID, observedAt: 10000, event: { app: "reader" } }, 10000);
  state = tick(state, 12000);
  assert.equal(state.active.progressMs, 4000);
});

test("a genuinely fresh post-reversal observation starts a new interval without crediting reversed time", () => {
  let state = focus(planted(), "reader", 0);
  state = tick(state, 10000);
  state = change(state, { type: "focus", sessionId: SID, observedAt: 4000, event: { app: "reader" } }, 4000);
  assert.equal(state.active.progressMs, 10000);
  assert.equal(state.focusStats.streakMs, 0);
  state = tick(state, 6000);
  assert.equal(state.active.progressMs, 12000);
  assert.equal(state.focusStats.streakMs, 2000);
});

test("a completed-counter overflow leaves all prior plant and effective-time data unchanged", () => {
  let state = focus(planted(), "reader", 0);
  state = tick(state, 10000);
  state.active.progressMs = 59999;
  state.collection.totalBlooms = Number.MAX_SAFE_INTEGER;
  const before = JSON.stringify(state);
  assert.throws(() => tick(state, 10001), /超出可保存范围/);
  assert.equal(JSON.stringify(state), before);
});

test("an auto-replanted pot continues at bloom with the same settings and the leftover time", () => {
  let state = focus(planted({ autoReplant: true, taskNote: "第一章", penalty: strict }), "reader", 0);
  assert.equal(state.active.autoReplant, true);
  state = grow(state, 0, 59000);
  const result = core.reduce(state, { type: "tick", sessionId: SID }, 61000);
  const next = result.state.active;
  assert.equal(result.state.garden.length, 1);
  assert.equal(result.state.garden[0].id, "plant-1");
  assert.equal(result.state.garden[0].autoReplant, undefined, "the archive keeps no settings");
  assert.deepEqual(result.state.lastBloom, { id: "plant-1", at: 61000 });
  assert.equal(result.notes.length, 1);
  assert.notEqual(next.id, "plant-1");
  assert.ok(next.id.length <= 128);
  assert.deepEqual(
    { name: next.name, species: next.species, targetMs: next.targetMs, rules: next.rules, penalty: next.penalty,
      taskNote: next.taskNote, autoReplant: next.autoReplant, createdAt: next.createdAt, variantRoll: next.variantRoll },
    { name: "阅读绣球", species: "hydrangea", targetMs: 60000, rules: state.active.rules, penalty: state.active.penalty,
      taskNote: "", autoReplant: true, createdAt: 61000, variantRoll: undefined },
  );
  assert.equal(next.progressMs, 1000, "the second past the target grows the next pot");
  assert.equal(core.matches(next.rules, result.state.focus), true, "the same activity keeps growing it");
  const reloaded = core.normalizeState(JSON.parse(JSON.stringify(result.state)));
  assert.equal(reloaded.active.autoReplant, true, "the flag survives saving");
  const later = grow(result.state, 61000, 121000);
  assert.equal(later.garden.length, 2);
  assert.equal(later.active.autoReplant, true);
  assert.equal(new Set([later.active.id, ...later.garden.map((plant) => plant.id)]).size, 3);
});

test("auto-replant is off by default and can be switched on or off for the growing pot only", () => {
  let state = planted();
  assert.equal(Object.hasOwn(state.active, "autoReplant"), false);
  state = change(state, { type: "replant", id: "plant-1", enabled: true }, 1000);
  assert.equal(state.active.autoReplant, true);
  state = change(state, { type: "replant", id: "plant-1", enabled: false }, 2000);
  assert.equal(Object.hasOwn(state.active, "autoReplant"), false);
  assert.throws(() => change(state, { type: "replant", id: "other", enabled: true }, 3000), /不在生长/);
  assert.throws(() => change(state, { type: "replant", id: "plant-1", enabled: "yes" }, 3000), /自动续种/);
  state = grow(focus(state, "reader", 3000), 3000, 64000);
  assert.equal(state.active, null, "without the flag a bloom leaves the pot empty");
  assert.equal(Object.hasOwn(core.validatePlant(settings()), "autoReplant"), false);
});
