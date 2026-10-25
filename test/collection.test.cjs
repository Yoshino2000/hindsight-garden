"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("../ui/collection.js");

test("plan labels combine only the user text, current category names and target time", () => {
  const plan = { name: "  论文阅读  ", targetMinutes: 60, rules: [
    { type: "category", value: "read", label: "旧分类名" },
    { type: "category", value: "read", label: "旧分类名" },
    { type: "superCategory", value: "work", label: "工作" },
  ] };
  assert.equal(C.planLabel(plan, (rule) => rule.value === "read" ? "阅读" : ""), "论文阅读 · 阅读、工作 · 60 分钟");
  assert.equal(plan.name, "  论文阅读  ");
  assert.equal(C.planLabel({ name: "查资料", targetMinutes: 30, rules: [{ type: "website", value: "example.com" }] }), "查资料 · 网站 example.com · 30 分钟");
});

test("unknown or locked theme preferences fall back while timestamp zero remains a valid unlock", () => {
  assert.equal(C.theme("missing").id, "meadow");
  assert.equal(C.theme("blossom", {}).id, "meadow");
  assert.equal(C.theme("blossom", { "all-species": 0 }).id, "blossom");
});
