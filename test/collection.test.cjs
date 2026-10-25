"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("../ui/collection.js");
const core = require("../core.js");

function groups(total = 0, species = [], at = 1234) {
  return C.achievementGroups(core.achievementProgress(
    core.initializeCollection(core.initialState(), total, species, at),
  ));
}

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

test("twenty persistent achievements become thirteen display cards without granting any locked tiers", () => {
  assert.deepEqual(C.achievementGroups([]), []);
  const result = groups();
  assert.equal(result.length, 13);
  assert.equal(result.flatMap((item) => item.tiers).length, 20);
  assert.equal(new Set(result.flatMap((item) => item.tiers.map((tier) => tier.id))).size, 20);
  assert.deepEqual(result.slice(0, 5).map((item) => item.id),
    ["first-bloom", "bloom-sprouts", "bloom-gardens", "bloom-landscape", "species-collection"]);
  for (const item of result) {
    assert.equal(item.currentLevel, 0);
    assert.equal(item.currentTier, null);
    assert.equal(item.earnedCount, 0);
    assert.equal(item.earned, false);
    assert.equal(item.complete, false);
    assert.equal(item.metal, "none");
    assert.equal(item.earnedAt, null);
    assert.equal(item.nextTier.id, item.tiers[0].id);
  }
  const quantity = result.find((item) => item.id === "bloom-sprouts");
  assert.equal(quantity.current, 0);
  assert.equal(quantity.target, 5);
  assert.deepEqual(quantity.tiers.map((item) => [item.target, item.metal, item.levelName]),
    [[5, "white", "白阶"], [10, "silver", "银阶"], [25, "gold", "金阶"]]);
});

test("a three-tier card follows the highest earned level while progress targets its next unmet tier", () => {
  for (const [total, level, metal, current, target, complete] of [
    [7, 1, "white", 7, 10, false],
    [10, 2, "silver", 10, 25, false],
    [25, 3, "gold", 25, 25, true],
    [1000, 3, "gold", 25, 25, true],
  ]) {
    const item = groups(total, ["hydrangea"], 0).find((entry) => entry.id === "bloom-sprouts");
    assert.equal(item.currentLevel, level);
    assert.equal(item.currentTier.level, level);
    assert.equal(item.earnedCount, level);
    assert.equal(item.metal, metal);
    assert.equal(item.current, current);
    assert.equal(item.target, target);
    assert.equal(item.complete, complete);
    assert.equal(item.earnedAt, 0, "Timestamp zero must remain an earned fact");
    assert.equal(item.displayTier.id, item.currentTier.id);
    assert.equal(item.nextTier?.target ?? null, complete ? null : target);
  }
});

test("two-tier cards use white then gold, while the first flower stays its own permanent card", () => {
  const white = groups(50, ["daisy"]).find((item) => item.id === "bloom-gardens");
  assert.equal(white.currentLevel, 1);
  assert.equal(white.metal, "white");
  assert.equal(white.nextTier.target, 100);
  const gold = groups(100, ["daisy"]).find((item) => item.id === "bloom-gardens");
  assert.equal(gold.currentLevel, 2);
  assert.equal(gold.metal, "gold");
  assert.equal(gold.complete, true);
  assert.equal(gold.nextTier, null);
  const first = groups(1, ["daisy"]).find((item) => item.id === "first-bloom");
  assert.deepEqual(first.tiers.map((item) => item.id), ["first-bloom"]);
  assert.equal(first.complete, true);
  assert.equal(first.target, 1);
});

test("250, 500 and 1000 share one card and retain the original conditions, ids and individual dates", () => {
  const state = core.initializeCollection(core.initialState(), 1000, core.SPECIES.map((item) => item.id), 500);
  Object.assign(state.earnedAchievements, {
    "two-hundred-fifty-blooms": 101, "five-hundred-blooms": 202, "thousand-blooms": 303,
  });
  const progress = core.achievementProgress(state);
  const original = JSON.stringify(progress);
  for (const item of progress) Object.freeze(item);
  Object.freeze(progress);
  const result = C.achievementGroups(progress);
  const landscape = result.find((item) => item.id === "bloom-landscape");
  assert.deepEqual(landscape.tiers.map((item) => [item.id, item.target, item.earnedAt]), [
    ["two-hundred-fifty-blooms", 250, 101],
    ["five-hundred-blooms", 500, 202],
    ["thousand-blooms", 1000, 303],
  ]);
  assert.equal(landscape.currentTier.id, "thousand-blooms");
  assert.equal(landscape.earnedAt, 303);
  assert.equal(landscape.current, 1000);
  assert.equal(landscape.target, 1000);
  for (const tier of result.flatMap((item) => item.tiers)) {
    const source = progress.find((item) => item.id === tier.id);
    assert.equal(tier.condition, source.condition);
    assert.equal(tier.description, source.description);
    assert.equal(tier.earnedAt, source.earnedAt);
  }
  landscape.tiers[0].name = "展示层可改自己的对象";
  assert.equal(JSON.stringify(progress), original);
});

test("a higher earned tier never fabricates missing lower awards or hides their unmet conditions", () => {
  const state = core.initializeCollection(core.initialState(), 1000, [], 500);
  state.earnedAchievements = { "thousand-blooms": 0 };
  const result = C.achievementGroups(core.achievementProgress(state));
  const item = result.find((entry) => entry.id === "bloom-landscape");
  assert.equal(item.currentLevel, 3);
  assert.equal(item.metal, "gold");
  assert.equal(item.earnedCount, 1);
  assert.equal(item.complete, false);
  assert.equal(item.nextTier.id, "two-hundred-fifty-blooms");
  assert.equal(item.target, 250);
  assert.deepEqual(item.tiers.map((tier) => tier.earnedAt), [null, null, 0]);
  assert.deepEqual(item.tiers.map((tier) => tier.earned), [false, false, true]);
});

test("species diversity tiers stay separate from eight individual species memories", () => {
  const result = groups(4, ["rose", "lily", "daisy", "hydrangea"]);
  const diversity = result.find((item) => item.id === "species-collection");
  assert.deepEqual(diversity.tiers.map((item) => item.target), [2, 4, 8]);
  assert.equal(diversity.currentLevel, 2);
  assert.equal(diversity.metal, "silver");
  assert.equal(diversity.current, 4);
  assert.equal(diversity.target, 8);
  const singles = result.filter((item) => item.metric === "speciesBloom");
  assert.equal(singles.length, 8);
  assert.equal(singles.filter((item) => item.earned).length, 4);
  assert.equal(singles.find((item) => item.id === "first-rose").displayTier.species, "rose");
  assert.equal(singles.find((item) => item.id === "first-sunflower").earnedAt, null);
});

test("tier ordering does not depend on source order and unknown future achievements remain visible", () => {
  const state = core.initializeCollection(core.initialState(), 1000, [], 500);
  const reversed = core.achievementProgress(state).reverse();
  const result = C.achievementGroups(reversed);
  assert.deepEqual(result.slice(0, 5).map((item) => item.id),
    ["first-bloom", "bloom-sprouts", "bloom-gardens", "bloom-landscape", "species-collection"]);
  assert.deepEqual(result.find((item) => item.id === "bloom-landscape").tiers.map((item) => item.target), [250, 500, 1000]);
  const future = { id: "future-award", name: "未来徽章", metric: "blooms", target: 2000, current: 1000, earnedAt: null };
  const withFuture = C.achievementGroups([...reversed, future]);
  assert.equal(withFuture.length, 14);
  assert.equal(withFuture.find((item) => item.id === "future-award").nextTier.condition, undefined);
  assert.equal(withFuture.find((item) => item.id === "future-award").target, 2000);
});

test("missing catalog entries do not silently turn a white tier into a completed gold group", () => {
  const onlyWhite = { id: "fifty-blooms", name: "50 朵花开", metric: "blooms", target: 50, current: 50, earnedAt: 0 };
  const [item] = C.achievementGroups([onlyWhite]);
  assert.equal(item.currentLevel, 1);
  assert.equal(item.levelCount, 2);
  assert.equal(item.metal, "white");
  assert.equal(item.complete, false);
  assert.equal(item.tiers.length, 1);
  assert.equal(item.tiers[0].id, "fifty-blooms");
});

test("name suggestions prioritize trimmed distinct categories and avoid the previous result when alternatives exist", () => {
  const labels = [" 阅读 ", "阅读", "", null, 42, "写作"];
  const before = JSON.stringify(labels);
  assert.equal(C.suggestName(" 绣球 ", labels, "", () => 0), "阅读的绣球");
  assert.equal(C.suggestName("绣球", labels, " 阅读的绣球 ", () => 0), "写作的绣球");
  assert.equal(C.suggestName("绣球", labels, "写作的绣球", () => 0.99), "阅读的绣球");
  assert.equal(C.suggestName("玫瑰", ["编程"], "编程的玫瑰", () => 0), "编程的玫瑰");
  assert.equal(JSON.stringify(labels), before);
});

test("name suggestions provide ten task presets only when no category is available", () => {
  const choices = Array.from({ length: 10 }, (_, index) => C.suggestName("向日葵", [], "", () => index / 10));
  assert.equal(new Set(choices).size, 10);
  assert.equal(choices[0], "论文阅读的向日葵");
  assert.equal(choices[9], "日常充电的向日葵");
  assert.equal(C.suggestName("向日葵", [" ", ""], "论文阅读的向日葵", () => 0), "写作整理的向日葵");
  assert.equal(C.suggestName("向日葵", ["游戏"], "", () => 0), "游戏的向日葵");
});

test("name suggestions preserve normal flower names and respect the forty UTF-16-unit validation limit", () => {
  const longTask = "写".repeat(100);
  const name = C.suggestName("薰衣草", [longTask], "", () => 0);
  assert.equal(name.length, 40);
  assert.ok(name.endsWith("的薰衣草"));
  const emoji = C.suggestName("🌻向日葵", ["🌱".repeat(100)], "", () => 0);
  assert.ok(emoji.length <= 40);
  assert.ok(emoji.endsWith("的🌻向日葵"));
  assert.equal([...emoji].some((part) => /^[\uD800-\uDFFF]$/.test(part)), false);
  const longFlower = C.suggestName("花".repeat(100), ["🌱阅读"], "", () => 0);
  assert.ok(longFlower.length <= 40);
  assert.ok(longFlower.startsWith("🌱的"));
  assert.equal([...longFlower].some((part) => /^[\uD800-\uDFFF]$/.test(part)), false);
});

test("empty flower names and boundary random samples still return a usable suggestion", () => {
  assert.equal(C.suggestName("", [], "", () => 0), "论文阅读的小花");
  assert.equal(C.suggestName("绣球", ["阅读", "写作"], "", () => 1), "写作的绣球");
  assert.equal(C.suggestName("绣球", ["阅读", "写作"], "", () => -1), "阅读的绣球");
  assert.equal(C.suggestName("绣球", ["阅读", "写作"], "", () => NaN), "阅读的绣球");
});
