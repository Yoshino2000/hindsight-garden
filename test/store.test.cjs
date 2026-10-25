"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { mkdtempSync, rmSync, readFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");
const vm = require("node:vm");
const core = require("../core.js");
const { createStore } = require("../store.js");

function hostFor(db = new DatabaseSync(":memory:")) {
  const host = { db, calls: [], conflicts: 0, intercept: null };
  host.call = async (method, params) => {
    host.calls.push({ method, params: structuredClone(params) });
    assert.ok(Buffer.byteLength(params.sql, "utf8") <= 100000, "Host SQL length limit");
    assert.ok((params.params || []).length <= 1000, "Host parameter count limit");
    for (const value of params.params || []) {
      if (typeof value === "string") assert.ok(Buffer.byteLength(value, "utf8") <= 256000, "Host value limit");
    }
    if (host.intercept) {
      const response = await host.intercept(method, params);
      if (response !== undefined) return response;
    }
    const statement = db.prepare(params.sql);
    assert.equal(params.sql.slice(statement.sourceSQL.length).trim(), "", "Each host call is exactly one SQL statement");
    if (method === "db.query") {
      const result = statement.all(...(params.params || []));
      assert.ok(Buffer.byteLength(JSON.stringify(result), "utf8") <= 10000000, "Host result limit");
      return result;
    }
    if (method !== "db.execute") throw new Error("Unexpected API: " + method);
    const result = statement.run(...(params.params || []));
    if (params.sql.startsWith("UPDATE") && result.changes === 0)
      host.conflicts++;
    return result;
  };
  return host;
}

function plant(name = "阅读绣球") {
  return {
    name,
    species: "hydrangea",
    targetMinutes: 1,
    rules: [{ type: "app", value: "reader", exact: true }],
  };
}

async function prepare(store) {
  await store.apply({ type: "boot", sessionId: "worker" }, 0);
  await store.apply({ type: "plant", id: "p1", plant: plant() }, 0);
  await store.apply(
    { type: "focus", sessionId: "worker", event: { app: "reader" } },
    0,
  );
}

test("two independent page/worker stores preserve concurrent user changes through real SQLite CAS", async (t) => {
  const host = hostFor();
  t.after(() => host.db.close());
  const first = createStore(host.call);
  const second = createStore(host.call);
  await prepare(first);
  await second.load();
  await Promise.all([
    first.apply({ type: "rename", id: "p1", name: "新花名" }, 100),
    second.apply({ type: "pause", paused: true }, 100),
  ]);
  const state = await first.load();
  assert.equal(state.active.name, "新花名");
  assert.equal(state.paused, true);
  assert.ok(
    host.conflicts > 0,
    "The concurrent snapshots must exercise a real version conflict",
  );
});

test("simultaneous initial writes create one garden and retain both operations", async (t) => {
  const host = hostFor();
  t.after(() => host.db.close());
  const first = createStore(host.call);
  const second = createStore(host.call);
  await Promise.all([
    first.apply({ type: "boot", sessionId: "worker" }, 0),
    second.apply({ type: "notifications", enabled: false }, 0),
  ]);
  const state = await first.load();
  assert.equal(state.sessionId, "worker");
  assert.equal(state.notify, false);
  assert.equal(
    host.db.prepare("SELECT COUNT(*) AS n FROM garden_store").get().n,
    1,
  );
});

test("competing bloom commits retain one mature flower and return only one notification", async (t) => {
  const host = hostFor();
  t.after(() => host.db.close());
  const first = createStore(host.call);
  const second = createStore(host.call);
  await prepare(first);
  for (let now = 10000; now <= 50000; now += 10000) {
    await first.apply({ type: "tick", sessionId: "worker" }, now);
  }
  const results = await Promise.all([
    first.apply({ type: "tick", sessionId: "worker" }, 60000),
    second.apply({ type: "tick", sessionId: "worker" }, 60000),
  ]);
  assert.equal(
    results.reduce((sum, result) => sum + result.notes.length, 0),
    1,
  );
  const state = await second.load();
  assert.equal(state.active, null);
  assert.equal(state.garden.length, 1);
  assert.equal(state.garden[0].progressMs, 60000);
});

test("forced version conflict retries a stable time without doubling growth", async (t) => {
  const host = hostFor();
  t.after(() => host.db.close());
  const store = createStore(host.call);
  await prepare(store);
  let injected = false;
  host.intercept = async (method, params) => {
    if (
      !injected &&
      method === "db.execute" &&
      params.sql.startsWith("UPDATE")
    ) {
      injected = true;
      host.db
        .prepare("UPDATE garden_store SET version = version + 1 WHERE key = ?")
        .run("state");
    }
  };
  await store.apply({ type: "tick", sessionId: "worker" }, 5000);
  assert.equal((await store.load()).active.progressMs, 5000);
  assert.ok(injected);
  assert.equal(host.conflicts, 1);
});

test("persistent conflicts fail clearly while leaving the last saved garden intact", async (t) => {
  const host = hostFor();
  t.after(() => host.db.close());
  const store = createStore(host.call);
  await prepare(store);
  host.intercept = async (method, params) => {
    if (method === "db.execute" && params.sql.startsWith("UPDATE"))
      return { changes: 0 };
  };
  await assert.rejects(
    store.apply({ type: "rename", id: "p1", name: "未保存" }, 100),
    /其他窗口/,
  );
  assert.equal((await store.load()).active.name, "阅读绣球");
});

test("SQL-looking user text is bound as data, never executed", async (t) => {
  const host = hostFor();
  t.after(() => host.db.close());
  const store = createStore(host.call);
  const name = "'); DROP TABLE garden_store; --";
  await store.apply({ type: "plant", id: "p1", plant: plant(name) }, 0);
  assert.equal((await store.load()).active.name, name);
  assert.ok(host.calls.every(({ params }) => !params.sql.includes(name)));
  assert.equal(
    host.db.prepare("SELECT COUNT(*) AS n FROM garden_store").get().n,
    1,
  );
});

test("corrupt JSON, unknown schema, and corrupt row versions reject without replacing original data", async (t) => {
  const host = hostFor();
  t.after(() => host.db.close());
  const store = createStore(host.call);
  await prepare(store);
  for (const [raw, version] of [
    ["broken json", 1],
    [JSON.stringify({ schema: 3, garden: [] }), 2],
    [JSON.stringify(core.initialState()), -1],
  ]) {
    host.db
      .prepare("INSERT OR REPLACE INTO garden_store (key, value, version) VALUES (?, ?, ?)")
      .run("state", raw, version);
    await assert.rejects(store.load());
    await assert.rejects(
      store.apply({ type: "notifications", enabled: false }, 100),
    );
    const saved = host.db
      .prepare("SELECT value, version FROM garden_store WHERE key = ?")
      .get("state");
    assert.equal(saved.value, raw);
    assert.equal(saved.version, version);
  }
});

test("a failed initialization can recover rather than caching a permanently rejected promise", async (t) => {
  const host = hostFor();
  t.after(() => host.db.close());
  let fail = true;
  host.intercept = async () => {
    if (fail) throw new Error("Storage unavailable");
  };
  const store = createStore(host.call);
  await assert.rejects(store.load(), /Storage unavailable/);
  fail = false;
  assert.equal((await store.load()).schema, 2);
  await store.apply({ type: "plant", id: "p1", plant: plant() }, 0);
  assert.equal((await store.load()).active.id, "p1");
});

test("a host timeout rejects and a later request can recover", async (t) => {
  const host = hostFor();
  t.after(() => host.db.close());
  let stuck = true;
  host.intercept = async () => {
    if (stuck) return new Promise(() => {});
  };
  const store = createStore(host.call, { timeoutMs: 10 });
  await assert.rejects(store.load(), /超时/);
  stuck = false;
  assert.equal((await store.load()).schema, 2);
});

test("saved progress and settings survive closing and reopening the actual database", async (t) => {
  const folder = mkdtempSync(join(tmpdir(), "hindsight-garden-store-test-"));
  let openDb;
  t.after(() => {
    if (openDb) openDb.close();
    assert.ok(
      folder.startsWith(join(tmpdir(), "hindsight-garden-store-test-")),
    );
    rmSync(folder, { recursive: true, force: true });
  });
  const filename = join(folder, "garden.sqlite");
  const firstHost = hostFor(new DatabaseSync(filename));
  const first = createStore(firstHost.call);
  await prepare(first);
  await first.apply({ type: "tick", sessionId: "worker" }, 9000);
  await first.apply({ type: "notifications", enabled: false }, 9000);
  firstHost.db.close();
  const secondHost = hostFor(new DatabaseSync(filename));
  openDb = secondHost.db;
  const state = await createStore(secondHost.call).load();
  assert.equal(state.active.progressMs, 9000);
  assert.equal(state.notify, false);
  assert.equal(state.active.name, "阅读绣球");
});

function mature(index, extra = {}) {
  return {
    id: "flower-" + String(index).padStart(6, "0"), name: "收藏" + index,
    species: "daisy", createdAt: index, bloomAt: 60000 + index,
    targetMs: 60000, progressMs: 60000, ...extra,
  };
}

function legacyFixture(host, count = 120) {
  const value = core.initialState();
  value.schema = 1;
  value.garden = Array.from({ length: count }, (_, index) => mature(index, { note: "原始备注" + index }));
  const raw = JSON.stringify(value);
  host.db.exec("CREATE TABLE garden_store (key TEXT PRIMARY KEY, value TEXT NOT NULL, version INTEGER NOT NULL)");
  host.db.prepare("INSERT INTO garden_store VALUES (?, ?, ?)").run("state", raw, 7);
  return { raw, value };
}

function seedArchive(host, count, extra = {}) {
  const insert = host.db.prepare("INSERT INTO garden_plants (id, value) VALUES (?, ?)");
  host.db.exec("BEGIN");
  try {
    for (let index = 0; index < count; index++) {
      const flower = mature(index, extra);
      insert.run(flower.id, JSON.stringify(flower));
    }
    host.db.exec("COMMIT");
  } catch (error) { host.db.exec("ROLLBACK"); throw error; }
}

test("schema-1 migration atomically archives all flowers and retains their original extra metadata", async (t) => {
  const host = hostFor();
  t.after(() => host.db.close());
  const fixture = legacyFixture(host);
  const first = createStore(host.call);
  const second = createStore(host.call);
  const [one, two] = await Promise.all([first.load(), second.load()]);
  assert.equal(one.garden.length, 120);
  assert.equal(two.garden.length, 120);
  assert.equal(one.garden.find(({ id }) => id === "flower-000005").note, "原始备注5");
  const row = host.db.prepare("SELECT value, version FROM garden_store WHERE key = 'state'").get();
  const hot = JSON.parse(row.value);
  assert.equal(hot.schema, 2);
  assert.deepEqual(hot.garden, []);
  assert.equal(hot._archive, undefined);
  assert.equal(row.version, 8);
  assert.equal(host.db.prepare("SELECT COUNT(*) AS n FROM garden_plants").get().n, 120);
  assert.equal(host.db.prepare("SELECT version FROM garden_archive_meta").get().version, 120);
  assert.equal(fixture.value.garden.length, 120);
  assert.equal((await first.load()).garden.length, 120);
});

test("a mid-migration archive failure rolls back every row and preserves the entire old state for retry", async (t) => {
  const host = hostFor();
  t.after(() => host.db.close());
  const fixture = legacyFixture(host);
  host.db.exec("CREATE TABLE garden_plants (id TEXT PRIMARY KEY, value TEXT NOT NULL)");
  host.db.exec("CREATE TRIGGER abort_migration BEFORE INSERT ON garden_plants WHEN NEW.id = 'flower-000005' BEGIN SELECT RAISE(ABORT, 'simulated archive failure'); END");
  const store = createStore(host.call);
  await assert.rejects(store.load(), /simulated archive failure/);
  assert.equal(host.db.prepare("SELECT value FROM garden_store WHERE key = 'state'").get().value, fixture.raw);
  assert.equal(host.db.prepare("SELECT version FROM garden_store WHERE key = 'state'").get().version, 7);
  assert.equal(host.db.prepare("SELECT COUNT(*) AS n FROM garden_plants").get().n, 0);
  assert.equal(host.db.prepare("SELECT version FROM garden_archive_meta").get().version, 0);
  host.db.exec("DROP TRIGGER abort_migration");
  assert.equal((await store.load()).garden.length, 120);
  assert.equal(host.db.prepare("SELECT COUNT(*) AS n FROM garden_plants").get().n, 120);
});

test("one failed bloom archive cannot commit a completed hot state or return a delivery note", async (t) => {
  const host = hostFor();
  t.after(() => host.db.close());
  const store = createStore(host.call);
  await prepare(store);
  seedArchive(host, 25);
  for (let now = 10000; now <= 50000; now += 10000) await store.apply({ type: "tick", sessionId: "worker" }, now);
  const saved = host.db.prepare("SELECT value FROM garden_store WHERE key = 'state'").get().value;
  host.db.exec("CREATE TRIGGER abort_bloom BEFORE INSERT ON garden_plants BEGIN SELECT RAISE(ABORT, 'database or disk is full'); END");
  await assert.rejects(store.apply({ type: "tick", sessionId: "worker" }, 60000), /花园存储空间不足，已有记录已保留，本次操作未完成。/);
  assert.equal(host.db.prepare("SELECT value FROM garden_store WHERE key = 'state'").get().value, saved);
  assert.equal(host.db.prepare("SELECT COUNT(*) AS n FROM garden_plants").get().n, 25);
  const retained = await store.load();
  assert.equal(retained.garden.length, 25);
  assert.equal(retained.active.progressMs, 50000);
  assert.equal(retained.garden.find(({ id }) => id === "flower-000005").name, "收藏5");
  host.db.exec("DROP TRIGGER abort_bloom");
  const result = await store.apply({ type: "tick", sessionId: "worker" }, 60000);
  assert.equal(result.notes.length, 1);
  assert.equal(result.partial, true);
  assert.equal((await store.load()).garden.length, 26);
});

test("SQLITE_FULL error codes receive the quota message without erasing existing flowers", async (t) => {
  const host = hostFor();
  t.after(() => host.db.close());
  const store = createStore(host.call);
  await store.load();
  seedArchive(host, 3);
  host.intercept = async (method, params) => {
    if (method === "db.execute" && params.sql.startsWith("UPDATE")) {
      const error = new Error("write failed");
      error.code = "SQLITE_FULL";
      throw error;
    }
  };
  await assert.rejects(store.apply({ type: "rename", id: "flower-000001", name: "未保存" }, 100),
    /花园存储空间不足，已有记录已保留，本次操作未完成。/);
  host.intercept = null;
  const retained = await store.load();
  assert.equal(retained.garden.length, 3);
  assert.equal(retained.garden.find(({ id }) => id === "flower-000001").name, "收藏1");
});

test("1000 and 5000 flowers remain separate rows; steady ticks and cached polling never reread the whole archive", async (t) => {
  for (const count of [1000, 5000]) {
    const host = hostFor();
    t.after(() => host.db.close());
    const store = createStore(host.call);
    await prepare(store);
    seedArchive(host, count);
    host.calls.length = 0;
    const loaded = await store.load();
    assert.equal(loaded.garden.length, count);
    const pages = host.calls.filter(({ params }) => params.sql.startsWith("WITH batch"));
    assert.equal(pages.length, count / 200 + 1);
    assert.ok(pages.every(({ params }) => params.params[1] === 200));
    loaded.garden[0].name = "用户改了返回值";
    loaded.garden.pop();
    host.calls.length = 0;
    const tick = await store.apply({ type: "tick", sessionId: "worker" }, 2000);
    assert.equal(tick.partial, true);
    assert.equal(tick.state.garden.length, 0);
    const polled = await store.load();
    assert.equal(polled.garden.length, count);
    assert.equal(polled.garden[0].name, "收藏0");
    assert.equal(host.calls.filter(({ params }) => params.sql.startsWith("WITH batch")).length, 0);
    const hot = host.db.prepare("SELECT value FROM garden_store WHERE key = 'state'").get().value;
    assert.ok(Buffer.byteLength(hot, "utf8") < 5000);
    assert.deepEqual(JSON.parse(hot).garden, []);
    assert.equal(JSON.parse(hot)._archive, undefined);
    assert.equal(host.db.prepare("SELECT COUNT(*) AS n FROM garden_plants").get().n, count);
  }
});

test("rename and delete edit only the chosen archived flower and invalidate other stores' caches", async (t) => {
  const host = hostFor();
  t.after(() => host.db.close());
  const first = createStore(host.call);
  const second = createStore(host.call);
  await first.load();
  seedArchive(host, 1000, { note: "必须保留的旧字段" });
  await first.load();
  host.calls.length = 0;
  await second.apply({ type: "rename", id: "flower-000005", name: "新名字" }, 100);
  assert.equal(host.calls.filter(({ params }) => params.sql.startsWith("WITH batch")).length, 0);
  let complete = await first.load();
  assert.equal(complete.garden.length, 1000);
  assert.equal(complete.garden.find(({ id }) => id === "flower-000005").name, "新名字");
  assert.equal(complete.garden.find(({ id }) => id === "flower-000005").note, "必须保留的旧字段");
  await second.apply({ type: "delete", id: "flower-000005" }, 100);
  complete = await first.load();
  assert.equal(complete.garden.length, 999);
  assert.ok(!complete.garden.some(({ id }) => id === "flower-000005"));
  await assert.rejects(second.apply({ type: "plant", id: "flower-000006", plant: plant() }, 100), /重复/);
});

test("archive paging closes its revision snapshot and retries after an interleaved edit", async (t) => {
  const host = hostFor();
  t.after(() => host.db.close());
  const store = createStore(host.call);
  await store.load();
  seedArchive(host, 1000);
  let injected = false;
  host.intercept = async (method, params) => {
    if (!injected && method === "db.query" && params.sql.startsWith("WITH batch")) {
      injected = true;
      const flower = mature(1001);
      host.db.prepare("INSERT INTO garden_plants VALUES (?, ?)").run(flower.id, JSON.stringify(flower));
    }
  };
  const result = await store.load();
  assert.equal(result.garden.length, 1001);
  assert.equal(new Set(result.garden.map(({ id }) => id)).size, 1001);
  assert.ok(host.calls.filter(({ params }) => params.sql.startsWith("WITH batch") && params.params[0] === "").length >= 2);
});

test("large per-flower metadata pages by bytes as well as rows, below the host 10 MB result limit", async (t) => {
  const host = hostFor();
  t.after(() => host.db.close());
  const store = createStore(host.call);
  await store.load();
  seedArchive(host, 60, { note: '"'.repeat(100000) });
  host.calls.length = 0;
  const result = await store.load();
  assert.equal(result.garden.length, 60);
  assert.equal(result.garden[0].note.length, 100000);
  assert.ok(host.calls.filter(({ params }) => params.sql.startsWith("WITH batch")).length > 2);
});

test("the actual 0.4.0 reader rejects the schema-2 hot row instead of overwriting an empty garden", async (t) => {
  const host = hostFor();
  t.after(() => host.db.close());
  legacyFixture(host, 5);
  await createStore(host.call).load();
  const sandbox = vm.createContext({ URL, TextEncoder, setTimeout, clearTimeout, module: { exports: {} } });
  const fixtures = join(__dirname, "fixtures", "garden-0.4.0");
  const oldCore = readFileSync(join(fixtures, "core.js"), "utf8");
  const oldStore = readFileSync(join(fixtures, "store.js"), "utf8");
  vm.runInContext(oldCore, sandbox);
  vm.runInContext(oldStore, sandbox);
  const reader = sandbox.GardenStore.createStore(host.call);
  await assert.rejects(reader.load(), /版本不支持/);
  await assert.rejects(reader.apply({ type: "notifications", enabled: false }, 0), /版本不支持/);
  assert.equal(host.db.prepare("SELECT COUNT(*) AS n FROM garden_plants").get().n, 5);
  assert.equal(JSON.parse(host.db.prepare("SELECT value FROM garden_store WHERE key = 'state'").get().value).schema, 2);
});

test("single-statement migration and archive deltas work with actual host SQLite limits and either trigger recursion setting", async (t) => {
  const host = hostFor();
  t.after(() => host.db.close());
  const fixture = legacyFixture(host, 5);
  const store = createStore(host.call);
  await store.load();
  await prepare(store);
  for (let now = 10000; now <= 60000; now += 10000) await store.apply({ type: "tick", sessionId: "worker" }, now);
  await store.apply({ type: "rename", id: "flower-000003", name: "重命名" }, 60000);
  const operations = [
    { sql: "CREATE TABLE garden_store (key TEXT PRIMARY KEY, value TEXT NOT NULL, version INTEGER NOT NULL)", params: [] },
    { sql: "INSERT INTO garden_store VALUES (?, ?, ?)", params: ["state", fixture.raw, 7] },
    ...host.calls.filter(({ method }) => method === "db.execute").map(({ params }) => params),
  ];
  const source = [
    "import json, sqlite3, sys, tempfile",
    "from pathlib import Path",
    "from contextlib import closing",
    "operations=json.load(sys.stdin)",
    "for recursion in (0, 1):",
    " with tempfile.TemporaryDirectory(prefix='hindsight-garden-host-test-') as folder:",
    "  filename=Path(folder)/'data.sqlite'",
    "  for operation in operations:",
    "   with closing(sqlite3.connect(filename)) as connection:",
    "    if hasattr(connection, 'setconfig'): connection.setconfig(sqlite3.SQLITE_DBCONFIG_DEFENSIVE, True)",
    "    connection.execute('PRAGMA recursive_triggers='+str(recursion))",
    "    connection.execute('PRAGMA max_page_count=16384')",
    "    for limit, value in [(sqlite3.SQLITE_LIMIT_LENGTH,256000),(sqlite3.SQLITE_LIMIT_SQL_LENGTH,100000),(sqlite3.SQLITE_LIMIT_COLUMN,100),(sqlite3.SQLITE_LIMIT_EXPR_DEPTH,100),(sqlite3.SQLITE_LIMIT_COMPOUND_SELECT,3),(sqlite3.SQLITE_LIMIT_VDBE_OP,25000),(sqlite3.SQLITE_LIMIT_FUNCTION_ARG,8),(sqlite3.SQLITE_LIMIT_ATTACHED,0),(sqlite3.SQLITE_LIMIT_VARIABLE_NUMBER,1000),(sqlite3.SQLITE_LIMIT_TRIGGER_DEPTH,10)]: connection.setlimit(limit,value)",
    "    connection.execute(operation['sql'],operation['params'])",
    "    connection.commit()",
    "  with closing(sqlite3.connect(filename)) as connection:",
    "   hot=json.loads(connection.execute(\"SELECT value FROM garden_store WHERE key='state'\").fetchone()[0])",
    "   assert hot['schema']==2 and hot['garden']==[] and '_archive' not in hot",
    "   assert connection.execute('SELECT COUNT(*) FROM garden_plants').fetchone()[0]==6",
    "   renamed=json.loads(connection.execute(\"SELECT value FROM garden_plants WHERE id='flower-000003'\").fetchone()[0])",
    "   assert renamed['name']=='重命名' and renamed['note']=='原始备注3'",
  ].join("\n");
  const python = process.platform === "win32" ? "py" : process.env.PYTHON || "python3";
  const pythonOptions = process.platform === "win32" ? ["-3", "-X", "utf8"] : ["-X", "utf8"];
  const result = spawnSync(python, [...pythonOptions, "-c", source], {
    input: JSON.stringify(operations), encoding: "utf8", timeout: 15000,
  });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
});
