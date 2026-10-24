"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const core = require("../core.js");
const { createStore } = require("../store.js");

function hostFor(db = new DatabaseSync(":memory:")) {
  const host = { db, calls: [], conflicts: 0, intercept: null };
  host.call = async (method, params) => {
    host.calls.push({ method, params: structuredClone(params) });
    if (host.intercept) {
      const response = await host.intercept(method, params);
      if (response !== undefined) return response;
    }
    const statement = db.prepare(params.sql);
    if (method === "db.query") return statement.all(...(params.params || []));
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
    [JSON.stringify({ schema: 2, garden: [] }), 2],
    [JSON.stringify(core.initialState()), -1],
  ]) {
    host.db
      .prepare("UPDATE garden_store SET value = ?, version = ? WHERE key = ?")
      .run(raw, version, "state");
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
  assert.equal((await store.load()).schema, 1);
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
  assert.equal((await store.load()).schema, 1);
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
