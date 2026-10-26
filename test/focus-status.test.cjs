"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
require("../core.js");
const { explain } = require("../ui/focus-status.js");

function state(extra = {}) {
  return { heartbeatAt: 1000, paused: false,
    active: { rules: [{ type: "category", value: "reading", label: "阅读" }], penalty: { enabled: false } },
    focus: { app: "Chrome", host: "example.com", category: { id: "games", name: "游戏", superCategory: { id: "fun", name: "娱乐" } } }, ...extra };
}

test("mismatch explains the observed category and keeps the required rule visible", () => {
  const result = explain(state(), 2000);
  assert.equal(result.code, "mismatch");
  assert.match(result.summary, /游戏/);
  assert.deepEqual(result.expected, ["阅读"]);
  assert.ok(result.observations.some(([label, value]) => label === "所属大类" && value === "娱乐"));
});

test("a matching app grows even if category or domain information is unavailable", () => {
  const result = explain(state({ active: { rules: [{ type: "app", value: "chrome" }] }, focus: { app: "Chrome.EXE" } }), 2000);
  assert.equal(result.code, "growing");
  assert.equal(result.growing, true);
  assert.deepEqual(result.matched, ["chrome"]);
});

test("unclassified foreground activity is not asserted to be a different category", () => {
  const result = explain(state({ focus: { app: "Chrome" } }), 2000);
  assert.equal(result.code, "missing");
  assert.match(result.summary, /缺少/);
  assert.ok(result.observations.some(([label, value]) => label === "当前分类" && value === "未识别"));
});

test("stale and clock-reversed observations never display stale activity as current", () => {
  for (const now of [13000, 999]) {
    const result = explain(state(), now);
    assert.equal(result.code, "stale");
    assert.equal(result.fresh, false);
    assert.deepEqual(result.observations, [["前台信息", "等待更新"]]);
  }
});

test("manual pause, away and an empty observation have distinct remedies", () => {
  assert.equal(explain(state({ paused: true }), 2000).code, "paused");
  assert.equal(explain(state({ focus: { away: true } }), 2000).code, "away");
  assert.equal(explain(state({ focus: null }), 2000).code, "unknown");
  assert.equal(explain(state({ active: null }), 2000).code, "empty");
});

test("deleted rules are diagnosed only with a successfully loaded catalog", () => {
  assert.equal(explain(state(), 2000, { catalogs: { category: [] } }).code, "deleted");
  assert.equal(explain(state(), 2000, { catalogs: { category: null } }).code, "mismatch");
  const result = explain(state(), 2000, { catalogs: { category: [{ id: "reading", name: "读书" }] } });
  assert.equal(result.code, "mismatch");
});

test("deleted-category explanations keep an enabled interruption penalty visible", () => {
  const source = state();
  source.active.penalty.enabled = true;
  source.interruption = { applied: false };
  const catalogs = { category: [] };
  assert.match(explain(source, 2000, { catalogs }).advice, /宽限期后.*扣减一次/);
  source.interruption.applied = true;
  assert.match(explain(source, 2000, { catalogs }).advice, /已扣减过/);
});

test("domain-unavailable explanation keeps OR matching and interruption wording intact", () => {
  const base = state({ active: { rules: [{ type: "website", value: "example.com" }], penalty: { enabled: true } },
    focus: { app: "Chrome" }, interruption: { applied: false } });
  assert.match(explain(base, 2000).advice, /扣减一次/);
  base.interruption.applied = true;
  assert.match(explain(base, 2000).advice, /已扣减过/);
  base.active.rules.push({ type: "app", value: "chrome" });
  assert.equal(explain(base, 2000).code, "growing");
});

test("explanation is read-only and never includes a focus window title", () => {
  const source = state();
  source.focus.title = "secret title";
  const before = JSON.stringify(source);
  const result = explain(source, 2000);
  assert.equal(JSON.stringify(source), before);
  assert.equal(JSON.stringify(result).includes("secret title"), false);
});
