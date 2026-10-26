// Only the worker observes focus and advances growth. Page commands and worker writes use the
// same versioned store, following the small classic-script layout used by Hindsight Focus.
"use strict";
importScripts("core.js", "store.js", "i18n.js");

const store = GardenStore.createStore((method, params) =>
  hindsight.call(method, params),
);
const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const TICK_MS = 2000;
// While nothing but the clock changes, the saved heartbeat may lag by up to this long. It stays
// below the 10 s unobserved gap and the page's 12 s freshness check, with a full tick of margin.
const IDLE_WRITE_MS = 6000;
let queue = Promise.resolve();
let started = false;
let bootAttempted = false;
let superseded = false;
let ticking = false;
let focusSequence = 0;
let acceptFocusAfter = 0;

async function notify(body) {
  let timer;
  try {
    await Promise.race([
      Promise.resolve().then(() =>
        hindsight.call("notifications.send", { body }),
      ),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("开花通知请求超时，系统是否接收尚不确定。")),
          8000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function boot() {
  if (superseded) return false;
  if (started) return true;
  const recovering = bootAttempted;
  bootAttempted = true;
  const result = await store.apply({ type: "boot", sessionId,
    ...(recovering ? { recoverSessionId: sessionId } : {}) });
  if (result.state.sessionId !== sessionId) { superseded = true; return false; }
  started = true;
  return true;
}

// A tick that only moves lastAt/heartbeatAt need not rewrite the whole row every 2 s. Any other
// change (growth, a penalty, a gap reset, an upgrade) is written at once, and the older of the two
// saved clocks is never allowed to pass IDLE_WRITE_MS. A clock behind the saved one always writes.
function clockOnly(saved, next, now) {
  const persisted = Math.min(saved.lastAt ?? -Infinity, saved.heartbeatAt ?? -Infinity);
  const age = now - persisted;
  if (!(age >= 0 && age + TICK_MS <= IDLE_WRITE_MS)) return false;
  const rest = (state) => JSON.stringify(state, (key, value) =>
    key === "lastAt" || key === "heartbeatAt" ? undefined : value);
  return rest(saved) === rest(next);
}

async function run(input, options) {
  if (!(await boot())) return;
  const result = await store.apply({ ...input, sessionId }, undefined, options);
  if (result.state.sessionId !== sessionId) { superseded = true; return; }
  for (const note of result.notes) {
    try {
      await notify(GardenI18n.message(note.body));
    } catch (error) {
      // The bloom is already saved. Never resend after a timeout: delivery may have succeeded.
      await store.apply({
        type: "error",
        sessionId,
        message: String(error.message || error),
      });
    }
  }
}

function later(job) {
  queue = queue.then(job).catch(async (error) => {
    // Do not count an interval whose writes failed. Recovery waits for a fresh focus event.
    started = false;
    acceptFocusAfter = focusSequence + 1;
    console.error("时光花园：", error);
    try {
      await store.apply({
        type: "error",
        sessionId,
        message: String(error.message || error),
      });
    } catch (saveError) {
      console.error("时光花园存储：", saveError);
    }
  });
  return queue;
}

// Register before opening SQLite, so startup focus events are queued rather than dropped.
hindsight.on("focus.changed", (event) => {
  if (superseded) return;
  const sequence = ++focusSequence;
  const receivedAt = Date.now();
  later(async () => {
    // A queued observation from before a storage failure is not a fresh focus after recovery.
    if (sequence < acceptFocusAfter) return;
    const age = Date.now() - receivedAt;
    if (age < 0 || age > GardenCore.MAX_GAP_MS) {
      started = false;
      await boot();
      return;
    }
    await run({ type: "focus", event, observedAt: receivedAt });
  });
});
later(boot);
setInterval(() => {
  if (ticking || superseded) return;
  ticking = true;
  const queuedAfter = focusSequence;
  later(async () => {
    try {
      // A focus change that arrived while this tick waited settles the clock itself. Ticking
      // first would stamp a later time and make that queued observation look stale.
      if (focusSequence !== queuedAfter) return;
      await run({ type: "tick" }, { skip: clockOnly });
    } finally {
      ticking = false;
    }
  });
}, TICK_MS);
