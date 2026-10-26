"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const vm = require("node:vm");
const { setImmediate: nextTurn } = require("node:timers/promises");
require("../core.js");
const { createStore } = require("../store.js");

function hostFor(t) {
  const db = new DatabaseSync(":memory:");
  t.after(() => db.close());
  const host = {
    db,
    notifications: [],
    failStorage: false,
    failNotifications: false,
    beforeCall: null,
  };
  host.call = async (method, params) => {
    if (host.beforeCall) await host.beforeCall(method, params);
    if (method === "notifications.send") {
      if (host.failNotifications) throw new Error("Notifications denied");
      host.notifications.push(structuredClone(params));
      return null;
    }
    if (host.failStorage) throw new Error("Storage temporarily unavailable");
    const statement = db.prepare(params.sql);
    if (method === "db.query") return statement.all(...(params.params || []));
    if (method === "db.execute") return statement.run(...(params.params || []));
    throw new Error("Unexpected method: " + method);
  };
  return host;
}

async function seeded(host, notifications = true) {
  const store = createStore(host.call);
  await store.apply(
    {
      type: "plant",
      id: "p1",
      plant: {
        name: "阅读绣球",
        species: "hydrangea",
        targetMinutes: 1,
        rules: [{ type: "app", value: "reader", exact: true }],
      },
    },
    0,
  );
  if (!notifications)
    await store.apply({ type: "notifications", enabled: false }, 0);
  return store;
}

function worker(host, initialNow = 0, random = 0.5, language = "zh-CN") {
  const clock = { now: initialNow };
  const intervals = [];
  const listeners = new Map();
  const errors = [];
  const timers = new Set();
  class ClockDate extends Date {
    constructor(...values) {
      super(...(values.length ? values : [clock.now]));
    }
    static now() {
      return clock.now;
    }
  }
  const math = Object.create(Math);
  math.random = () => random;
  const context = vm.createContext({
    navigator: { language },
    Date: ClockDate,
    Math: math,
    URL,
    TextEncoder,
    console: {
      error: (...values) => errors.push(values.map(String).join(" ")),
    },
    hindsight: {
      call: host.call,
      on: (name, callback) => listeners.set(name, callback),
    },
    setInterval: (callback) => {
      intervals.push(callback);
      return intervals.length;
    },
    setTimeout: (callback, ms) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        callback();
      }, ms);
      timers.add(timer);
      return timer;
    },
    clearTimeout: (timer) => {
      clearTimeout(timer);
      timers.delete(timer);
    },
  });
  context.importScripts = (...names) => {
    for (const name of names)
      vm.runInContext(
        readFileSync(resolve(__dirname, "..", name), "utf8"),
        context,
        { filename: name },
      );
  };
  vm.runInContext(
    readFileSync(resolve(__dirname, "..", "background.js"), "utf8"),
    context,
    { filename: "background.js" },
  );
  async function flush() {
    await nextTurn();
    await vm.runInContext("queue", context);
    await nextTurn();
  }
  return {
    clock,
    listeners,
    errors,
    flush,
    store: createStore(host.call),
    async focus(event, at = clock.now) {
      clock.now = at;
      listeners.get("focus.changed")(event);
      await flush();
    },
    async tick(at) {
      clock.now = at;
      for (const callback of intervals) callback();
      await flush();
    },
    async grow(until) {
      for (let at = clock.now + 2000; at <= until; at += 2000)
        await this.tick(at);
    },
    close() {
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
    },
  };
}

test("worker boot preserves an empty install and sends no unsolicited notification", async (t) => {
  const host = hostFor(t);
  const live = worker(host);
  t.after(() => live.close());
  await live.flush();
  const state = await live.store.load();
  assert.equal(state.active, null);
  assert.equal(state.garden.length, 0);
  assert.equal(state.focus, null);
  assert.deepEqual(host.notifications, []);
});

test("focus observed during startup is queued, then one full minute blooms and notifies once", async (t) => {
  const host = hostFor(t);
  await seeded(host);
  const live = worker(host);
  t.after(() => live.close());
  // Deliver synchronously, before asynchronous SQLite initialization has completed.
  live.listeners.get("focus.changed")({
    app: "READER.EXE",
    title: "PRIVATE TITLE",
  });
  await live.flush();
  await live.grow(60000);
  let state = await live.store.load();
  assert.equal(state.active, null);
  assert.equal(state.garden.length, 1);
  assert.equal(host.notifications.length, 1);
  assert.match(host.notifications[0].body, /阅读绣球/);
  assert.equal(JSON.stringify(state).includes("PRIVATE TITLE"), false);
  await live.grow(70000);
  state = await live.store.load();
  assert.equal(state.garden.length, 1);
  assert.equal(host.notifications.length, 1);
});

test("turning off bloom notifications still grows and saves the plant", async (t) => {
  const host = hostFor(t);
  await seeded(host, false);
  const live = worker(host);
  t.after(() => live.close());
  await live.focus({ app: "reader" });
  await live.grow(60000);
  assert.equal((await live.store.load()).garden.length, 1);
  assert.equal(host.notifications.length, 0);
});

test("live category rules use stable IDs across category renames and stop when category is absent", async (t) => {
  const host = hostFor(t);
  const page = await seeded(host);
  await page.apply(
    {
      type: "rules",
      id: "p1",
      rules: [{ type: "category", value: "reading", label: "阅读" }],
    },
    0,
  );
  const live = worker(host);
  t.after(() => live.close());
  await live.focus({
    app: "unrelated",
    category: { id: "reading", name: "阅读" },
  });
  await live.grow(10000);
  await live.focus({
    app: "another",
    category: { id: "reading", name: "新名称", color: "PRIVATE_COLOR" },
  });
  await live.grow(20000);
  assert.equal((await live.store.load()).active.progressMs, 20000);
  await live.focus({ app: "reader", category: null });
  await live.grow(30000);
  await live.focus({
    app: "reader",
    category: { id: "different", name: "阅读" },
  });
  await live.grow(40000);
  const paused = await live.store.load();
  assert.equal(paused.active.progressMs, 20000);
  assert.equal(JSON.stringify(paused).includes("PRIVATE_COLOR"), false);
  await live.focus({
    app: "another",
    category: { id: "reading", name: "新名称" },
  });
  await live.grow(80000);
  assert.equal((await live.store.load()).garden.length, 1);
  assert.equal(host.notifications.length, 1);
});

test("restarting waits for fresh focus, keeps existing progress, and old session ticks cannot grow", async (t) => {
  const host = hostFor(t);
  await seeded(host);
  const first = worker(host, 0, 0.1);
  t.after(() => first.close());
  await first.focus({ app: "reader" });
  await first.grow(10000);
  const second = worker(host, 1000000, 0.2);
  t.after(() => second.close());
  await second.flush();
  await second.grow(1010000);
  let state = await second.store.load();
  assert.equal(state.active.progressMs, 10000);
  assert.equal(state.focus, null);
  await first.tick(1011000);
  assert.equal((await second.store.load()).active.progressMs, 10000);
  await second.focus({ app: "reader" }, 1012000);
  await second.grow(1014000);
  state = await second.store.load();
  assert.equal(state.active.progressMs, 12000);
});

test("notification failure cannot lose a completed flower or cause repeated delivery attempts", async (t) => {
  const host = hostFor(t);
  await seeded(host);
  let attempts = 0;
  host.beforeCall = async (method) => {
    if (method === "notifications.send") attempts++;
  };
  host.failNotifications = true;
  const live = worker(host);
  t.after(() => live.close());
  await live.focus({ app: "reader" });
  await live.grow(60000);
  const state = await live.store.load();
  assert.equal(state.garden.length, 1);
  assert.equal(state.active, null);
  assert.match(state.lastError, /Notifications denied/);
  host.failNotifications = false;
  await live.grow(70000);
  assert.equal(attempts, 1);
  assert.equal(host.notifications.length, 0);
});

test("storage failure freezes accumulation; recovery boot requires new focus before growth", async (t) => {
  const host = hostFor(t);
  await seeded(host);
  const live = worker(host);
  t.after(() => live.close());
  await live.focus({ app: "reader" });
  await live.grow(10000);
  host.failStorage = true;
  await live.tick(12000);
  assert.ok(
    live.errors.some((message) =>
      message.includes("Storage temporarily unavailable"),
    ),
  );
  host.failStorage = false;
  await live.tick(14000);
  await live.grow(20000);
  let state = await live.store.load();
  assert.equal(state.active.progressMs, 10000);
  assert.equal(state.focus, null);
  await live.focus({ app: "reader" }, 20000);
  await live.tick(22000);
  state = await live.store.load();
  assert.equal(state.active.progressMs, 12000);
});

test("focus events queued before a failed write do not reactivate growth after recovery", async (t) => {
  const host = hostFor(t);
  await seeded(host);
  const live = worker(host);
  t.after(() => live.close());
  await live.focus({ app: "reader" });
  await live.grow(10000);
  let release;
  let entered;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const waiting = new Promise((resolve) => {
    entered = resolve;
  });
  let blocked = false;
  host.beforeCall = async (method, params) => {
    if (
      !blocked &&
      method === "db.execute" &&
      params.sql.startsWith("UPDATE")
    ) {
      blocked = true;
      entered();
      await gate;
      throw new Error("One write failed");
    }
  };
  const pendingTick = live.tick(12000);
  await waiting;
  live.clock.now = 13000;
  live.listeners.get("focus.changed")({ app: "reader" });
  live.listeners.get("focus.changed")({ app: "reader" });
  release();
  await pendingTick;
  await live.flush();
  await live.tick(14000);
  await live.tick(16000);
  let state = await live.store.load();
  assert.equal(state.active.progressMs, 10000);
  assert.equal(state.focus, null);
  await live.focus({ app: "reader" }, 17000);
  await live.tick(19000);
  state = await live.store.load();
  assert.equal(state.active.progressMs, 12000);
});

test("an observation held in the startup queue beyond the gap limit is discarded", async (t) => {
  const host = hostFor(t);
  await seeded(host);
  let release;
  let entered;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const waiting = new Promise((resolve) => {
    entered = resolve;
  });
  let blocked = false;
  host.beforeCall = async (method, params) => {
    if (
      !blocked &&
      method === "db.execute" &&
      params.sql.startsWith("CREATE")
    ) {
      blocked = true;
      entered();
      await gate;
    }
  };
  const live = worker(host);
  t.after(() => live.close());
  live.listeners.get("focus.changed")({ app: "reader" });
  await waiting;
  live.clock.now = 20000;
  release();
  await live.flush();
  await live.tick(22000);
  let state = await live.store.load();
  assert.equal(state.focus, null);
  assert.equal(state.active.progressMs, 0);
  await live.focus({ app: "reader" }, 22000);
  await live.tick(24000);
  state = await live.store.load();
  assert.equal(state.active.progressMs, 2000);
});

test("a late wake-up tick drops the unobserved sleep interval rather than growing a flower", async (t) => {
  const host = hostFor(t);
  await seeded(host);
  const live = worker(host);
  t.after(() => live.close());
  await live.focus({ app: "reader" });
  await live.grow(10000);
  await live.tick(1000000);
  await live.tick(1002000);
  const state = await live.store.load();
  assert.equal(state.active.progressMs, 10000);
  assert.equal(state.focus, null);
  assert.equal(state.garden.length, 0);
});

test("background bloom notifications follow English, Japanese and fallback system languages", async (t) => {
  for (const language of ["en-US", "ja-JP", "fr-FR"]) {
    const host = hostFor(t);
    await seeded(host);
    const live = worker(host, 0, 0.5, language);
    t.after(() => live.close());
    await live.focus({ app: "reader" });
    await live.grow(60000);
    assert.equal(host.notifications.length, 1);
    assert.equal(host.notifications[0].body, language === "ja-JP"
      ? "「阅读绣球」が咲きました！庭を見に来てください。"
      : "“阅读绣球” has bloomed! Come see your garden.");
    assert.equal((await live.store.load()).garden[0].name, "阅读绣球");
  }
});

test("queued focus changes settle at reception time instead of crediting the previous app during a slow write", async (t) => {
  const host = hostFor(t);
  await seeded(host);
  const live = worker(host);
  t.after(() => live.close());
  await live.focus({ app: "reader" });
  await live.tick(2000);
  let release;
  let entered;
  const gate = new Promise((resolve) => { release = resolve; });
  const waiting = new Promise((resolve) => { entered = resolve; });
  let blocked = false;
  host.beforeCall = async (method, params) => {
    if (!blocked && method === "db.execute" && params.sql.startsWith("UPDATE")) {
      blocked = true;
      entered();
      await gate;
    }
  };
  const pending = live.tick(4000);
  await waiting;
  live.clock.now = 5000;
  live.listeners.get("focus.changed")({ app: "other" });
  live.clock.now = 12000;
  release();
  await pending;
  await live.flush();
  const state = await live.store.load();
  assert.equal(state.active.progressMs, 5000);
  assert.equal(state.focusStats.totalMs, 5000);
  assert.equal(state.focus.app, "other");
});

test("a queued observation from before a clock reversal cannot reactivate focus", async (t) => {
  const host = hostFor(t);
  await seeded(host);
  let release;
  let entered;
  const gate = new Promise((resolve) => { release = resolve; });
  const waiting = new Promise((resolve) => { entered = resolve; });
  let blocked = false;
  host.beforeCall = async (method, params) => {
    if (!blocked && method === "db.execute" && params.sql.startsWith("CREATE")) {
      blocked = true;
      entered();
      await gate;
    }
  };
  const live = worker(host, 10000);
  t.after(() => live.close());
  live.listeners.get("focus.changed")({ app: "reader" });
  await waiting;
  live.clock.now = 0;
  release();
  await live.flush();
  await live.tick(2000);
  const state = await live.store.load();
  assert.equal(state.focus, null);
  assert.equal(state.active.progressMs, 0);
});

test("a replaced worker's delayed failure cannot clear the new worker or reclaim its session", async (t) => {
  const host = hostFor(t);
  await seeded(host);
  const first = worker(host, 0, .1);
  t.after(() => first.close());
  await first.focus({ app: "reader" });
  await first.grow(10000);
  let release;
  let entered;
  const gate = new Promise((resolve) => { release = resolve; });
  const waiting = new Promise((resolve) => { entered = resolve; });
  let blocked = false;
  host.beforeCall = async (method, params) => {
    if (!blocked && method === "db.execute" && params.sql.startsWith("UPDATE")) {
      blocked = true;
      entered();
      await gate;
      throw new Error("old worker delayed failure");
    }
  };
  const pending = first.tick(12000);
  await waiting;
  const second = worker(host, 13000, .2);
  t.after(() => second.close());
  await second.focus({ app: "reader" });
  await second.tick(15000);
  const session = (await second.store.load()).sessionId;
  first.clock.now = 16000;
  release();
  await pending;
  await first.flush();
  assert.equal((await second.store.load()).focus?.app, "reader");
  await first.tick(18000);
  await second.tick(19000);
  const state = await second.store.load();
  assert.equal(state.sessionId, session);
  assert.equal(state.active.progressMs, 16000);
});

test("a first boot with a lost acknowledgement cannot reclaim a session after a replacement worker starts", async (t) => {
  const host = hostFor(t);
  await seeded(host);
  let release;
  let entered;
  const gate = new Promise((resolve) => { release = resolve; });
  const waiting = new Promise((resolve) => { entered = resolve; });
  let blocked = false;
  host.beforeCall = async (method, params) => {
    if (!blocked && method === "db.execute" && params.sql.startsWith("UPDATE")) {
      blocked = true;
      host.db.prepare(params.sql).run(...params.params);
      entered();
      await gate;
      throw new Error("first boot committed but acknowledgement was lost");
    }
  };
  const first = worker(host, 0, .1);
  t.after(() => first.close());
  await waiting;
  const second = worker(host, 1000, .2);
  t.after(() => second.close());
  await second.focus({ app: "reader" });
  await second.tick(3000);
  const session = (await second.store.load()).sessionId;
  first.clock.now = 4000;
  release();
  await first.flush();
  await first.tick(5000);
  await first.focus({ app: "other" }, 6000);
  await second.tick(7000);
  const state = await second.store.load();
  assert.equal(state.sessionId, session);
  assert.equal(state.focus.app, "reader");
  assert.equal(state.active.progressMs, 6000);
});

test("a failed first boot can retry its known former owner without blocking a legitimate replacement", async (t) => {
  const host = hostFor(t);
  const seed = await seeded(host);
  await seed.apply({ type: "boot", sessionId: "previous-owner" }, 0);
  let failed = false;
  host.beforeCall = async (method, params) => {
    if (!failed && method === "db.execute" && params.sql.startsWith("UPDATE")) {
      failed = true;
      throw new Error("first boot did not commit");
    }
  };
  const live = worker(host, 1000, .3);
  t.after(() => live.close());
  await live.flush();
  await live.focus({ app: "reader" }, 2000);
  await live.tick(4000);
  const state = await live.store.load();
  assert.notEqual(state.sessionId, "previous-owner");
  assert.equal(state.active.progressMs, 2000);
});

for (const failedStatement of ["CREATE", "SELECT"]) {
  test(`a first-install ${failedStatement} failure recovers on fresh focus when no owner has claimed the database`, async (t) => {
    const host = hostFor(t);
    let failed = false;
    host.beforeCall = async (_method, params) => {
      if (!failed && params.sql.startsWith(failedStatement)) {
        failed = true;
        throw new Error("temporary first " + failedStatement + " failure");
      }
    };
    const live = worker(host, 0, .1);
    t.after(() => live.close());
    await live.flush();
    assert.equal(failed, true);
    assert.equal((await live.store.load()).sessionId, null);
    await live.store.apply({ type: "plant", id: "first-pot", plant: {
      name: "首次安装", species: "daisy", targetMinutes: 1,
      rules: [{ type: "app", value: "reader", exact: true }],
    } }, 0);
    await live.focus({ app: "reader" }, 2000);
    await live.tick(4000);
    const state = await live.store.load();
    assert.notEqual(state.sessionId, null);
    assert.equal(state.focus.app, "reader");
    assert.equal(state.active.progressMs, 2000);
    assert.equal(state.focusStats.totalMs, 2000);
  });

  test(`an unclaimed worker after a ${failedStatement} failure yields when a later owner has started`, async (t) => {
    const host = hostFor(t);
    let failed = false;
    host.beforeCall = async (_method, params) => {
      if (!failed && params.sql.startsWith(failedStatement)) {
        failed = true;
        throw new Error("temporary first " + failedStatement + " failure");
      }
    };
    const first = worker(host, 0, .1);
    t.after(() => first.close());
    await first.flush();
    assert.equal(failed, true);
    await first.store.apply({ type: "plant", id: "first-pot", plant: {
      name: "新后台接管", species: "daisy", targetMinutes: 1,
      rules: [{ type: "app", value: "reader", exact: true }],
    } }, 0);
    const second = worker(host, 1000, .2);
    t.after(() => second.close());
    await second.focus({ app: "reader" });
    await second.tick(3000);
    const owner = (await second.store.load()).sessionId;
    await first.tick(4000);
    await first.focus({ app: "other" }, 5000);
    await second.tick(7000);
    const state = await second.store.load();
    assert.equal(state.sessionId, owner);
    assert.equal(state.focus.app, "reader");
    assert.equal(state.active.progressMs, 6000);
  });
}

test("a first-read failure with an unknown old owner conservatively requires a genuinely new worker to take over", async (t) => {
  const host = hostFor(t);
  const page = await seeded(host);
  await page.apply({ type: "boot", sessionId: "unknown-former-owner" }, 0);
  let failed = false;
  host.beforeCall = async (_method, params) => {
    if (!failed && params.sql.startsWith("CREATE")) {
      failed = true;
      throw new Error("failed before learning the former owner");
    }
  };
  const first = worker(host, 1000, .1);
  t.after(() => first.close());
  await first.flush();
  await first.focus({ app: "reader" }, 2000);
  assert.equal((await page.load()).sessionId, "unknown-former-owner");
  const reopened = worker(host, 3000, .2);
  t.after(() => reopened.close());
  await reopened.focus({ app: "reader" });
  await reopened.tick(5000);
  const state = await page.load();
  assert.notEqual(state.sessionId, "unknown-former-owner");
  assert.equal(state.active.progressMs, 2000);
});
