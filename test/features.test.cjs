"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { spawnSync } = require("node:child_process");
const { join } = require("node:path");
const { readFileSync } = require("node:fs");
const vm = require("node:vm");
const core = require("../core.js");
const { createStore } = require("../store.js");

function settings(extra = {}) {
  return {
    name: "阅读时光", species: "hydrangea", targetMinutes: 1,
    rules: [{ type: "category", value: "Reading.EXE", label: "阅读" }],
    ...extra,
  };
}
function flower(index, extra = {}) {
  return {
    id: "flower-" + index, name: "花" + index,
    species: core.SPECIES[index % core.SPECIES.length].id,
    createdAt: index, bloomAt: 60000 + index, targetMs: 60000, progressMs: 60000,
    ...extra,
  };
}
function change(state, input, now = 0) { return core.reduce(state, input, now).state; }
function planted() {
  let state = change(null, { type: "boot", sessionId: "worker" });
  state = change(state, { type: "plant", id: "new-flower", plant: settings({ taskNote: "读完这一章" }) });
  return change(state, { type: "focus", sessionId: "worker", event: { category: { id: "Reading.EXE" } } });
}
function finish(state) {
  for (let now = 10000; now <= 60000; now += 10000)
    state = change(state, { type: "tick", sessionId: "worker" }, now);
  return state;
}
function hostFor(t) {
  const db = new DatabaseSync(":memory:");
  t.after(() => db.close());
  const host = { db, calls: [], intercept: null };
  host.call = async (method, params) => {
    host.calls.push({ method, params: structuredClone(params) });
    if (host.intercept) {
      const response = await host.intercept(method, params);
      if (response !== undefined) return response;
    }
    for (const value of params.params || [])
      if (typeof value === "string") assert.ok(Buffer.byteLength(value, "utf8") <= 256000);
    const statement = db.prepare(params.sql);
    if (method === "db.query") return statement.all(...(params.params || []));
    assert.equal(method, "db.execute");
    return statement.run(...(params.params || []));
  };
  return host;
}

function oldStoreFor(host) {
  const sandbox = vm.createContext({ URL, TextEncoder, setTimeout, clearTimeout });
  const folder = join(__dirname, "fixtures/garden-0.10.0");
  vm.runInContext(readFileSync(join(folder, "core.js"), "utf8"), sandbox);
  vm.runInContext(readFileSync(join(folder, "store.js"), "utf8"), sandbox);
  return sandbox.GardenStore.createStore(host.call);
}

function replayRestricted(calls, checks) {
  const source = [
    "import json, runpy, sqlite3, sys, tempfile",
    "from pathlib import Path",
    "from contextlib import closing",
    "authorize=runpy.run_path(sys.argv[1])['authorize']",
    "with closing(sqlite3.connect(':memory:')) as connection:",
    " connection.set_authorizer(authorize)",
    " for expression in (\"json_group_array(1)\", \"json_group_object('k', 1)\"):",
    "  try: connection.execute('SELECT '+expression).fetchall()",
    "  except sqlite3.DatabaseError as error: assert 'not authorized' in str(error), str(error)",
    "  else: raise AssertionError('JSON aggregates must be denied by the host authorizer')",
    "operations=json.load(sys.stdin)",
    "with tempfile.TemporaryDirectory(prefix='hindsight-feature-authorizer-') as folder:",
    " for recursion in (0, 1):",
    "  filename=Path(folder)/('data-'+str(recursion)+'.sqlite')",
    "  for operation in operations:",
    "   with closing(sqlite3.connect(filename)) as connection, connection:",
    "    connection.execute('PRAGMA temp_store=FILE')",
    "    connection.execute('PRAGMA recursive_triggers='+str(recursion))",
    "    for limit, value in [(sqlite3.SQLITE_LIMIT_LENGTH,256000),(sqlite3.SQLITE_LIMIT_SQL_LENGTH,100000),(sqlite3.SQLITE_LIMIT_COLUMN,100),(sqlite3.SQLITE_LIMIT_EXPR_DEPTH,100),(sqlite3.SQLITE_LIMIT_COMPOUND_SELECT,3),(sqlite3.SQLITE_LIMIT_VDBE_OP,25000),(sqlite3.SQLITE_LIMIT_FUNCTION_ARG,8),(sqlite3.SQLITE_LIMIT_ATTACHED,0),(sqlite3.SQLITE_LIMIT_VARIABLE_NUMBER,1000),(sqlite3.SQLITE_LIMIT_TRIGGER_DEPTH,10)]: connection.setlimit(limit,value)",
    "    connection.set_authorizer(authorize)",
    "    try:",
    "     cursor=connection.execute(operation['params']['sql'], operation['params']['params'])",
    "     if operation['method']=='db.query': cursor.fetchall()",
    "    except sqlite3.DatabaseError as error:",
    "     if not operation.get('expectedError'): raise",
    "     assert operation['expectedError'] in str(error), str(error)",
    "    else: assert not operation.get('expectedError'), 'Expected outdated runtime to be rejected'",
    "  with closing(sqlite3.connect(filename)) as connection:",
    "   hot=json.loads(connection.execute(\"SELECT value FROM garden_store WHERE key='state'\").fetchone()[0])",
    ...checks.map((line) => "   " + line),
  ].join("\n");
  const python = process.platform === "win32" ? "py" : process.env.PYTHON || "python3";
  const pythonOptions = process.platform === "win32" ? ["-3", "-X", "utf8"] : ["-X", "utf8"];
  const result = spawnSync(python, [...pythonOptions, "-c", source, join(__dirname, "../scripts/preview.py")], {
    input: JSON.stringify(calls), encoding: "utf8", timeout: 15000,
  });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
}
async function seedOldArchive(host, count) {
  const old = core.initialState();
  delete old.plans;
  delete old.lastPlanting;
  delete old.collection;
  delete old.earnedAchievements;
  await host.call("db.execute", {
    sql: "CREATE TABLE garden_store (key TEXT PRIMARY KEY, value TEXT NOT NULL, version INTEGER NOT NULL)", params: [],
  });
  await host.call("db.execute", {
    sql: "CREATE TABLE garden_plants (id TEXT PRIMARY KEY, value TEXT NOT NULL)", params: [],
  });
  await host.call("db.execute", {
    sql: "INSERT INTO garden_store VALUES (?, ?, ?)", params: ["state", JSON.stringify(old), 0],
  });
  for (let index = 0; index < count; index++) {
    const item = flower(index, { note: "旧插件保留的其他元数据" });
    await host.call("db.execute", { sql: "INSERT INTO garden_plants VALUES (?, ?)", params: [item.id, JSON.stringify(item)] });
  }
  return old;
}

test("planting plans retain stable rules and explicit penalty settings without reusing flower names or task memories", () => {
  const before = core.initialState();
  const raw = JSON.stringify(before);
  let state = change(before, {
    type: "savePlan", id: "plan-reading", name: " 阅读一章 ",
    plant: settings({ taskNote: "私人任务", penalty: { enabled: true, kind: "minutes", amount: 2, graceSeconds: 15 } }),
  });
  assert.equal(JSON.stringify(before), raw);
  assert.deepEqual(state.plans[0], {
    id: "plan-reading", name: "阅读一章", species: "hydrangea", targetMinutes: 1,
    rules: [{ type: "category", value: "Reading.EXE", label: "阅读", exact: false }],
    penalty: { enabled: true, kind: "minutes", amount: 2, graceSeconds: 15 },
  });
  assert.equal(state.active, null, "Saving a plan does not start a plant");
  state = change(state, { type: "savePlan", id: "plan-reading", name: "新方案", plant: settings({ targetMinutes: 30 }) });
  assert.equal(state.plans.length, 1);
  assert.equal(state.plans[0].targetMinutes, 30);
  state = change(state, { type: "deletePlan", id: "plan-reading" });
  assert.deepEqual(state.plans, []);
  assert.throws(() => change(state, { type: "deletePlan", id: "plan-reading" }), /不存在/);
});

test("plan limits permit updating the twentieth slot and reject invalid or duplicated saved settings", () => {
  let state = core.initialState();
  for (let index = 0; index < 20; index++)
    state = change(state, { type: "savePlan", id: "p" + index, name: "方案" + index, plant: settings() });
  assert.throws(() => change(state, { type: "savePlan", id: "overflow", name: "多一个", plant: settings() }), /20/);
  state = change(state, { type: "savePlan", id: "p19", name: "更新最后一个", plant: settings({ species: "rose" }) });
  assert.equal(state.plans[19].species, "rose");
  for (const override of [
    { name: " " }, { id: "" }, { plant: settings({ targetMinutes: 0 }) },
    { plant: settings({ rules: [] }) },
  ]) assert.throws(() => change(state, { type: "savePlan", id: "p0", name: "方案", plant: settings(), ...override }));
  assert.throws(() => core.normalizeState({ ...state, plans: [state.plans[0], state.plans[0]] }), /重复/);
});

test("the last planting settings survive blooming and never retain the previous name or task memory", () => {
  let state = finish(planted());
  assert.equal(state.active, null);
  assert.equal(state.lastPlanting.name, undefined);
  assert.equal(state.lastPlanting.taskNote, undefined);
  assert.equal(state.lastPlanting.targetMinutes, 1);
  assert.deepEqual(state.lastPlanting.rules, [{ type: "category", value: "Reading.EXE", label: "阅读", exact: false }]);
  state = change(state, { type: "boot", sessionId: "next" }, 100000);
  assert.equal(state.lastPlanting.species, "hydrangea");
  assert.equal(state.active, null);
});

test("task memories are optional, bounded and treated as data; legacy metadata uses its own untouched field", () => {
  const text = "<script>alert('x')</script>";
  assert.equal(core.validatePlant(settings({ taskNote: "  " + text + "  " })).taskNote, text);
  assert.equal(core.validatePlant(settings()).taskNote, "");
  assert.equal(core.validatePlant(settings({ taskNote: "花".repeat(280) })).taskNote.length, 280);
  for (const taskNote of ["花".repeat(281), 42, null])
    assert.throws(() => core.validatePlant(settings({ taskNote })), /任务记忆/);
  const legacy = flower(0, { note: "legacy metadata" });
  assert.equal(core.normalizeFlower(legacy).taskNote, undefined);
  assert.equal(legacy.note, "legacy metadata");
});

test("a flower keeps its task through bloom, while private notes are excluded from system notifications", () => {
  let state = planted();
  state = change(state, { type: "note", id: "new-flower", note: "  写完测试，不要出现在系统通知里  " });
  assert.equal(state.active.taskNote, "写完测试，不要出现在系统通知里");
  for (let now = 10000; now <= 50000; now += 10000)
    state = change(state, { type: "tick", sessionId: "worker" }, now);
  const result = core.reduce(state, { type: "tick", sessionId: "worker" }, 60000);
  assert.equal(result.state.garden[0].taskNote, "写完测试，不要出现在系统通知里");
  assert.equal(JSON.stringify(result.notes).includes("写完测试"), false);
  state = change(result.state, { type: "note", id: "new-flower", note: "事后回看" }, 60000);
  assert.equal(state.garden[0].taskNote, "事后回看");
  state = change(state, { type: "note", id: "new-flower", note: "" }, 60000);
  assert.equal(state.garden[0].taskNote, "");
  assert.throws(() => change(state, { type: "note", id: "missing", note: "x" }), /不存在/);
});

test("achievement baselines are verified now, not backdated, and deletion never revokes earned facts", () => {
  let state = core.initialState();
  state.garden = Array.from({ length: 10 }, (_, index) => flower(index));
  state = change(state, { type: "boot", sessionId: "worker" }, 500000);
  assert.deepEqual(state.collection, {
    totalBlooms: 10, species: core.SPECIES.map((item) => item.id), verifiedAt: 500000,
  });
  assert.deepEqual(state.earnedAchievements, {
    "first-bloom": 500000, "ten-blooms": 500000, "all-species": 500000,
  });
  for (const item of [...state.garden])
    state = change(state, { type: "delete", id: item.id }, 500001);
  assert.equal(state.garden.length, 0);
  assert.equal(state.collection.totalBlooms, 10);
  const progress = core.achievementProgress(state);
  assert.equal(progress.find((item) => item.id === "all-species").earnedAt, 500000);
  assert.equal(progress.find((item) => item.id === "hundred-blooms").current, 10);
  assert.equal(progress.find((item) => item.id === "hundred-blooms").earnedAt, null);
});

test("only a successful first bloom increments lifetime progress, once, including repeated ticks", () => {
  let state = planted();
  assert.equal(state.collection.totalBlooms, 0);
  assert.deepEqual(state.earnedAchievements, {});
  state = finish(state);
  assert.equal(state.collection.totalBlooms, 1);
  assert.deepEqual(state.collection.species, ["hydrangea"]);
  assert.equal(state.earnedAchievements["first-bloom"], 60000);
  state = change(state, { type: "tick", sessionId: "worker" }, 61000);
  assert.equal(state.collection.totalBlooms, 1);
  state = change(state, { type: "delete", id: "new-flower" }, 62000);
  state = change(state, { type: "plant", id: "unfinished", plant: settings() }, 62000);
  state = change(state, { type: "delete", id: "unfinished" }, 62001);
  assert.equal(state.collection.totalBlooms, 1);
});

test("malformed achievement and task state fails closed rather than silently overwriting it", () => {
  for (const override of [
    { collection: { totalBlooms: -1, species: [], verifiedAt: 0 } },
    { collection: { totalBlooms: 1, species: ["unknown"], verifiedAt: 0 } },
    { collection: { totalBlooms: 1, species: ["daisy", "daisy"], verifiedAt: 0 } },
    { earnedAchievements: { "not-real": 100 } },
    { earnedAchievements: { "first-bloom": -1 } },
    { garden: [flower(0, { taskNote: "x".repeat(281) })] },
  ]) assert.throws(() => core.normalizeState({ ...core.initialState(), ...override }));
});

test("pre-0.11 row archives establish a durable baseline with one summary, and subsequent ticks never rescan it", async (t) => {
  const host = hostFor(t);
  await seedOldArchive(host, 100);
  host.calls.length = 0;
  const store = createStore(host.call);
  const state = await store.load();
  assert.equal(state.collection.totalBlooms, 100);
  assert.equal(Object.keys(state.earnedAchievements).length, 4);
  assert.ok(Object.values(state.earnedAchievements).every((at) => at === state.collection.verifiedAt));
  assert.equal(state.garden[0].note, "旧插件保留的其他元数据");
  assert.equal(state.garden[0].taskNote, undefined);
  assert.equal(host.calls.filter(({ params }) => params.sql.includes("COUNT(*) AS count FROM garden_plants GROUP BY")).length, 1);
  host.calls.length = 0;
  await store.apply({ type: "boot", sessionId: "worker" }, 0);
  for (let now = 1000; now <= 10000; now += 1000)
    await store.apply({ type: "tick", sessionId: "worker" }, now);
  assert.equal(host.calls.filter(({ params }) => params.sql.includes("FROM garden_plants")).length, 0);
  await store.apply({ type: "delete", id: "flower-0" }, 10000);
  const reopened = await createStore(host.call).load();
  assert.equal(reopened.garden.length, 99);
  assert.equal(reopened.collection.totalBlooms, 100);
  assert.deepEqual(reopened.earnedAchievements, state.earnedAchievements);
});

test("an archive edit interleaved with baseline verification forces a consistent CAS retry", async (t) => {
  const host = hostFor(t);
  await seedOldArchive(host, 9);
  let injected = false;
  host.intercept = async (method, params) => {
    if (!injected && method === "db.query" && params.sql.includes("COUNT(*) AS count FROM garden_plants GROUP BY")) {
      injected = true;
      const item = flower(9);
      host.db.prepare("INSERT INTO garden_plants VALUES (?, ?)").run(item.id, JSON.stringify(item));
    }
  };
  const state = await createStore(host.call).load();
  assert.equal(state.collection.totalBlooms, 10);
  assert.equal(state.garden.length, 10);
  assert.ok(Object.hasOwn(state.earnedAchievements, "ten-blooms"));
  assert.ok(host.calls.filter(({ params }) => params.sql.includes("COUNT(*) AS count FROM garden_plants GROUP BY")).length >= 2);
});

test("failed baseline writes preserve the old row and can recover without partially earning achievements", async (t) => {
  const host = hostFor(t);
  await seedOldArchive(host, 10);
  const before = host.db.prepare("SELECT value, version FROM garden_store WHERE key = 'state'").get();
  let fail = true;
  host.intercept = async (method, params) => {
    if (fail && method === "db.execute" && params.sql.startsWith("UPDATE")) throw new Error("SQLITE_FULL: database or disk is full");
  };
  const store = createStore(host.call);
  await assert.rejects(store.load(), /存储空间不足/);
  assert.deepEqual(host.db.prepare("SELECT value, version FROM garden_store WHERE key = 'state'").get(), before);
  fail = false;
  const recovered = await store.load();
  assert.equal(recovered.collection.totalBlooms, 10);
  assert.ok(Object.hasOwn(recovered.earnedAchievements, "ten-blooms"));
});

test("concurrent plans, task edits and worker updates retain each other's changes in SQLite", async (t) => {
  const host = hostFor(t);
  const first = createStore(host.call);
  const second = createStore(host.call);
  await first.apply({ type: "boot", sessionId: "worker" }, 0);
  await first.apply({ type: "plant", id: "new-flower", plant: settings({ taskNote: "先读一章" }) }, 0);
  await first.apply({ type: "focus", sessionId: "worker", event: { category: { id: "Reading.EXE" } } }, 0);
  await Promise.all([
    first.apply({ type: "savePlan", id: "reading", name: "阅读方案", plant: settings() }, 1000),
    second.apply({ type: "note", id: "new-flower", note: "改为整理笔记" }, 1000),
  ]);
  await first.apply({ type: "tick", sessionId: "worker" }, 2000);
  const state = await first.load();
  assert.equal(state.plans[0].name, "阅读方案");
  assert.equal(state.active.taskNote, "改为整理笔记");
  assert.equal(state.active.progressMs, 1000);
  assert.equal(state.lastPlanting.taskNote, undefined);
});

test("an archived task edit touches only its own row and preserves unrelated legacy metadata", async (t) => {
  const host = hostFor(t);
  await seedOldArchive(host, 2);
  const store = createStore(host.call);
  await store.load();
  const untouched = host.db.prepare("SELECT value FROM garden_plants WHERE id = 'flower-1'").get().value;
  host.calls.length = 0;
  await store.apply({ type: "note", id: "flower-0", note: "整理完参考文献" }, 1000);
  assert.equal(host.calls.filter(({ params }) => params.sql.startsWith("WITH batch")).length, 0);
  assert.equal(host.db.prepare("SELECT value FROM garden_plants WHERE id = 'flower-1'").get().value, untouched);
  const item = JSON.parse(host.db.prepare("SELECT value FROM garden_plants WHERE id = 'flower-0'").get().value);
  assert.equal(item.note, "旧插件保留的其他元数据");
  assert.equal(item.taskNote, "整理完参考文献");
  const before = JSON.stringify(item);
  await assert.rejects(store.apply({ type: "note", id: "flower-0", note: "x".repeat(281) }, 1000), /280/);
  assert.equal(host.db.prepare("SELECT value FROM garden_plants WHERE id = 'flower-0'").get().value, before);
});

test("a failed bloom rolls back its achievement increment, and competing retry commits count it once", async (t) => {
  const host = hostFor(t);
  await seedOldArchive(host, 9);
  const first = createStore(host.call);
  const second = createStore(host.call);
  await first.apply({ type: "boot", sessionId: "worker" }, 0);
  await first.apply({ type: "plant", id: "tenth", plant: settings({ taskNote: "新成就的任务" }) }, 0);
  await first.apply({ type: "focus", sessionId: "worker", event: { category: { id: "Reading.EXE" } } }, 0);
  for (let now = 10000; now <= 50000; now += 10000)
    await first.apply({ type: "tick", sessionId: "worker" }, now);
  const before = host.db.prepare("SELECT value FROM garden_store WHERE key = 'state'").get().value;
  host.db.exec("CREATE TRIGGER abort_new_bloom BEFORE INSERT ON garden_plants BEGIN SELECT RAISE(ABORT, 'database or disk is full'); END");
  await assert.rejects(first.apply({ type: "tick", sessionId: "worker" }, 60000), /存储空间不足/);
  assert.equal(host.db.prepare("SELECT value FROM garden_store WHERE key = 'state'").get().value, before);
  host.db.exec("DROP TRIGGER abort_new_bloom");
  const results = await Promise.all([
    first.apply({ type: "tick", sessionId: "worker" }, 60000),
    second.apply({ type: "tick", sessionId: "worker" }, 60000),
  ]);
  const state = await first.load();
  assert.equal(state.collection.totalBlooms, 10);
  assert.equal(state.earnedAchievements["ten-blooms"], 60000);
  assert.equal(state.garden.find((item) => item.id === "tenth").taskNote, "新成就的任务");
  assert.equal(results.reduce((sum, result) => sum + result.notes.length, 0), 1);
});

test("feature SQL succeeds under the actual preview authorizer that denies SQLite JSON aggregate functions", async (t) => {
  const host = hostFor(t);
  await seedOldArchive(host, 9);
  const store = createStore(host.call);
  await store.load();
  await store.apply({ type: "savePlan", id: "reading", name: "阅读", plant: settings() }, 0);
  await store.apply({ type: "note", id: "flower-0", note: "已读完的一章" }, 0);
  await store.apply({ type: "boot", sessionId: "worker" }, 0);
  await store.apply({ type: "plant", id: "tenth", plant: settings({ taskNote: "开始下一章" }) }, 0);
  await store.apply({ type: "focus", sessionId: "worker", event: { category: { id: "Reading.EXE" } } }, 0);
  for (let now = 10000; now <= 60000; now += 10000)
    await store.apply({ type: "tick", sessionId: "worker" }, now);
  await store.load();
  replayRestricted(host.calls, [
    "assert hot['collection']['totalBlooms']==10",
    "assert hot['earnedAchievements']['ten-blooms']==60000",
    "assert hot['plans'][0]['id']=='reading'",
    "archived=dict(connection.execute('SELECT id, value FROM garden_plants'))",
    "assert json.loads(archived['flower-0'])['taskNote']=='已读完的一章'",
    "assert json.loads(archived['tenth'])['taskNote']=='开始下一章'",
  ]);
});

test("a persistent SQL guard rejects real 0.10 writers while current plans, tasks and achievements remain editable", async (t) => {
  const host = hostFor(t);
  await seedOldArchive(host, 9);
  const current = createStore(host.call);
  await current.load();
  await current.apply({ type: "savePlan", id: "plan", name: "保留的方案", plant: settings() }, 0);
  await current.apply({ type: "boot", sessionId: "worker" }, 0);
  await current.apply({ type: "plant", id: "active", plant: settings({ taskNote: "不应被旧窗口抹掉" }) }, 0);
  const before = host.db.prepare("SELECT value, version FROM garden_store WHERE key = 'state'").get();
  const archiveBefore = host.db.prepare("SELECT id, value FROM garden_plants ORDER BY id").all();
  const older = oldStoreFor(host);
  await older.load();
  for (const action of [
    { type: "tick", sessionId: "worker" },
    { type: "notifications", enabled: false },
    { type: "rename", id: "active", name: "旧版改名" },
    { type: "rename", id: "flower-0", name: "旧版改收藏" },
    { type: "delete", id: "flower-0" },
  ]) {
    const start = host.calls.length;
    await assert.rejects(older.apply(action, 1000), /此版本的时光花园已过期/);
    const rejected = host.calls.slice(start).find((item) => item.method === "db.execute" && item.params.sql.startsWith("UPDATE"));
    assert.ok(rejected);
    rejected.expectedError = "此版本的时光花园已过期";
    assert.deepEqual(host.db.prepare("SELECT value, version FROM garden_store WHERE key = 'state'").get(), before);
    assert.deepEqual(host.db.prepare("SELECT id, value FROM garden_plants ORDER BY id").all(), archiveBefore);
  }
  await current.apply({ type: "note", id: "active", note: "新版可以正常编辑" }, 1000);
  await current.apply({ type: "savePlan", id: "plan", name: "新版更新的方案", plant: settings({ targetMinutes: 30 }) }, 1000);
  await current.apply({ type: "note", id: "flower-0", note: "新版收藏备注" }, 1000);
  await current.apply({ type: "focus", sessionId: "worker", event: { category: { id: "Reading.EXE" } } }, 1000);
  for (let now = 11000; now <= 61000; now += 10000)
    await current.apply({ type: "tick", sessionId: "worker" }, now);
  const state = await current.load();
  assert.equal(state.collection.totalBlooms, 10);
  assert.equal(state.earnedAchievements["ten-blooms"], 61000);
  assert.equal(state.plans[0].targetMinutes, 30);
  assert.equal(state.garden.find((item) => item.id === "active").taskNote, "新版可以正常编辑");
  assert.equal(state.garden.find((item) => item.id === "flower-0").taskNote, "新版收藏备注");
  assert.equal(host.db.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'trigger' AND name = 'garden_require_features_v1'").get().count, 1);
  replayRestricted(host.calls, [
    "assert hot['collection']['totalBlooms']==10",
    "assert hot['earnedAchievements']['ten-blooms']==61000",
    "assert hot['plans'][0]['targetMinutes']==30",
    "archived=dict(connection.execute('SELECT id, value FROM garden_plants'))",
    "assert json.loads(archived['flower-0'])['taskNote']=='新版收藏备注'",
    "assert json.loads(archived['active'])['taskNote']=='新版可以正常编辑'",
  ]);
});

test("the guard rejects dropping any protected field but permits other keys and valid current metadata updates", async (t) => {
  const host = hostFor(t);
  await createStore(host.call).load();
  const before = host.db.prepare("SELECT value, version FROM garden_store WHERE key = 'state'").get();
  for (const field of ["collection", "plans", "earnedAchievements"]) {
    const attempted = JSON.parse(before.value);
    delete attempted[field];
    assert.throws(() => host.db.prepare("UPDATE garden_store SET value = ?, version = version + 1 WHERE key = 'state'").run(JSON.stringify(attempted)), /已过期/);
    assert.deepEqual(host.db.prepare("SELECT value, version FROM garden_store WHERE key = 'state'").get(), before);
  }
  host.db.prepare("INSERT INTO garden_store VALUES (?, ?, ?)").run("other", "non-JSON data", 0);
  host.db.prepare("UPDATE garden_store SET value = ? WHERE key = 'other'").run("still non-JSON data");
  assert.equal(host.db.prepare("SELECT value FROM garden_store WHERE key = 'other'").get().value, "still non-JSON data");
  assert.deepEqual(host.db.prepare("SELECT value, version FROM garden_store WHERE key = 'state'").get(), before);
});
