"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const B = require("../ui/breeze.js");

function fixture(count = 25, random = () => .5) {
  let time = 0, sequence = 0;
  const timers = new Map(), writes = [];
  const grid = { dataset: {}, childElementCount: count,
    style: { setProperty(key, value) { writes.push({ key, value }); } } };
  const controller = B.createBreeze(grid, { random, now: () => time,
    setTimeout(callback, delay) { const id = ++sequence; timers.set(id, { callback, due: time + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
  });
  function advance(duration) {
    const target = time + duration;
    while (true) {
      const next = [...timers].sort((a,b) => a[1].due - b[1].due)[0];
      if (!next || next[1].due > target) break;
      time = next[1].due; timers.delete(next[0]); next[1].callback();
    }
    time = target;
  }
  return { controller, grid, timers, writes, advance };
}

test("a whole garden shares one random 3–10 second gust clock with no per-flower timers", () => {
  for (const count of [1, 8, 25]) {
    const f = fixture(count);
    assert.equal(f.timers.size, 0);
    f.controller.setRunning(true); f.controller.setRunning(true);
    assert.equal(f.timers.size, 1);
    f.advance(6499); assert.equal(f.grid.dataset.breeze, undefined);
    f.advance(1); assert.equal(f.grid.dataset.breeze, "a");
    assert.equal(f.writes.length, 4, "Only the common grid variables are written");
    assert.equal(f.timers.size, 1);
    f.advance(B.DURATION); assert.equal(f.grid.dataset.breeze, undefined);
    f.advance(6500); assert.equal(f.grid.dataset.breeze, "b");
    f.advance(B.DURATION); f.advance(6500); assert.equal(f.grid.dataset.breeze, "a");
  }
});

test("random waits begin after the full slow gust, with gentle shared amplitude", () => {
  assert.equal(B.DURATION, 4500);
  for (const value of [0, .5, 1 - Number.EPSILON, NaN, -9, 9]) {
    const f = fixture(25, () => value);
    f.controller.setRunning(true);
    const wait = [...f.timers.values()][0].due;
    assert.ok(wait >= 3000 && wait <= 10000);
    f.advance(wait);
    const angle = Number.parseFloat(f.writes.find(item => item.key === "--breeze-angle").value);
    assert.ok(Math.abs(angle) >= 1.2 && Math.abs(angle) <= 2);
    assert.equal(Math.sign(angle), value < .5 ? -1 : 1);
    const scheduled = [...f.timers.values()][0];
    assert.equal(scheduled.due, wait + B.DURATION);
    f.advance(B.DURATION); assert.equal(f.grid.dataset.breeze, undefined);
    const next = [...f.timers.values()][0];
    assert.ok(next.due - wait - B.DURATION >= 3000 && next.due - wait - B.DURATION <= 10000);
  }
});

test("motion-off and hidden views cancel wind, rest all flowers and retain only the pending wait", () => {
  const f = fixture();
  f.controller.setRunning(true); f.advance(1000);
  f.controller.setRunning(false); assert.equal(f.timers.size, 0);
  f.advance(90000); assert.equal(f.grid.dataset.breeze, undefined);
  f.controller.setRunning(true); f.advance(5499); assert.equal(f.grid.dataset.breeze, undefined);
  f.advance(1); assert.equal(f.grid.dataset.breeze, "a");
  f.controller.setRunning(false); assert.equal(f.grid.dataset.breeze, undefined);
  assert.equal(f.timers.size, 0);
  f.controller.setRunning(true); f.advance(6499);
  assert.equal(f.grid.dataset.breeze, undefined, "An interrupted gust resumes at rest with a fresh wait");
  f.advance(1); assert.equal(f.grid.dataset.breeze, "b");
});

test("empty gardens have no wind clock; replacing a page restarts one shared wait", () => {
  const f = fixture(0);
  f.controller.setRunning(true); assert.equal(f.timers.size, 0);
  f.grid.childElementCount = 25; f.controller.refresh(); assert.equal(f.timers.size, 1);
  f.advance(6500); assert.equal(f.grid.dataset.breeze, "a");
  f.advance(1000); f.controller.refresh();
  assert.equal(f.grid.dataset.breeze, undefined); assert.equal(f.timers.size, 1);
  f.advance(6499); assert.equal(f.grid.dataset.breeze, undefined);
  f.advance(1); assert.equal(f.grid.dataset.breeze, "b");
  f.grid.childElementCount = 0; f.controller.refresh();
  assert.equal(f.timers.size, 0); assert.equal(f.grid.dataset.breeze, undefined);
});

test("removing all flowers before a pending gust safely stops rather than looping", () => {
  const f = fixture(); f.controller.setRunning(true);
  f.grid.childElementCount = 0; f.advance(6500);
  assert.equal(f.timers.size, 0); assert.equal(f.writes.length, 0);
  assert.equal(f.grid.dataset.breeze, undefined);
});
