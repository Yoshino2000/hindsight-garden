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
  assert.equal(C.theme("rain", { "first-bloom": 0 }).id, "rain");
  assert.equal(C.theme("dusk", { "ten-blooms": 0 }).id, "dusk");
});

test("thirty-six persistent achievements become sixteen display cards without granting any locked tiers", () => {
  assert.deepEqual(C.achievementGroups([]), []);
  const result = groups();
  assert.equal(result.length, 16);
  assert.equal(result.flatMap((item) => item.tiers).length, 36);
  assert.equal(new Set(result.flatMap((item) => item.tiers.map((tier) => tier.id))).size, 36);
  assert.deepEqual(result.slice(0, 2).map((item) => item.id), ["bloom-collection", "species-collection"]);
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
  const quantity = result.find((item) => item.id === "bloom-collection");
  assert.equal(quantity.current, 0);
  assert.equal(quantity.target, 1);
  assert.deepEqual(quantity.tiers.map((item) => [item.target, item.metal, item.levelName]),
    [[1, "white", "白阶 1/2"], [5, "white", "白阶 2/2"], [10, "blue", "蓝阶 1/2"],
      [25, "blue", "蓝阶 2/2"], [50, "purple", "紫阶 1/2"], [100, "purple", "紫阶 2/2"],
      [250, "gold", "金阶 1/2"], [500, "gold", "金阶 2/2"], [1000, "rainbow", "彩阶"]]);
});

test("one nine-tier card reaches all five badge colors and always targets its next unmet milestone", () => {
  for (const [total, level, metal, current, target, complete] of [
    [1, 1, "white", 1, 5, false],
    [7, 2, "white", 7, 10, false],
    [10, 3, "blue", 10, 25, false],
    [25, 4, "blue", 25, 50, false],
    [50, 5, "purple", 50, 100, false],
    [100, 6, "purple", 100, 250, false],
    [250, 7, "gold", 250, 500, false],
    [500, 8, "gold", 500, 1000, false],
    [1000, 9, "rainbow", 1000, 1000, true],
  ]) {
    const item = groups(total, ["hydrangea"], 0).find((entry) => entry.id === "bloom-collection");
    assert.equal(item.currentLevel, level);
    assert.equal(item.currentTier.level, level);
    assert.equal(item.earnedCount, level);
    assert.equal(item.metal, metal);
    assert.equal(item.colorStep, level === 9 ? 1 : (level - 1) % 2 + 1);
    assert.equal(item.colorSteps, level === 9 ? 1 : 2);
    assert.equal(item.colorName, item.currentTier.colorName);
    assert.equal(item.current, current);
    assert.equal(item.target, target);
    assert.equal(item.complete, complete);
    assert.equal(item.earnedAt, 0, "Timestamp zero must remain an earned fact");
    assert.equal(item.displayTier.id, item.currentTier.id);
    assert.equal(item.nextTier?.target ?? null, complete ? null : target);
  }
});

test("a gold badge remains incomplete until the final milestone, without changing theme unlock identities", () => {
  const gold = groups(500, ["daisy"]).find((item) => item.id === "bloom-collection");
  assert.equal(gold.currentLevel, 8);
  assert.equal(gold.metal, "gold");
  assert.equal(gold.complete, false);
  assert.equal(gold.nextTier.target, 1000);
  const complete = groups(1000, ["daisy"]).find((item) => item.id === "bloom-collection");
  assert.equal(complete.metal, "rainbow");
  assert.equal(complete.complete, true);
  assert.equal(complete.nextTier, null);
  const first = groups(1, ["daisy"], 0).find((item) => item.id === "bloom-collection");
  assert.equal(first.currentTier.id, "first-bloom");
  assert.equal(first.complete, false);
  const original = Object.fromEntries(first.tiers.filter((tier) => tier.earned).map((tier) => [tier.id, tier.earnedAt]));
  assert.equal(C.theme("rain", original).id, "rain");
  assert.equal(C.theme("dusk", original).id, "meadow");
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
  const landscape = result.find((item) => item.id === "bloom-collection");
  assert.deepEqual(landscape.tiers.filter((item) => item.target >= 250).map((item) => [item.id, item.target, item.earnedAt]), [
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
  const item = result.find((entry) => entry.id === "bloom-collection");
  assert.equal(item.currentLevel, 9);
  assert.equal(item.metal, "rainbow");
  assert.equal(item.earnedCount, 1);
  assert.equal(item.complete, false);
  assert.equal(item.nextTier.id, "first-bloom");
  assert.equal(item.target, 1);
  assert.deepEqual(item.tiers.map((tier) => tier.earnedAt), [...Array(8).fill(null), 0]);
  assert.deepEqual(item.tiers.map((tier) => tier.earned), [...Array(8).fill(false), true]);
});

test("species diversity tiers stay separate from eight individual species memories", () => {
  const result = groups(4, ["rose", "lily", "daisy", "hydrangea"]);
  const diversity = result.find((item) => item.id === "species-collection");
  assert.deepEqual(diversity.tiers.map((item) => item.target), [2, 4, 8]);
  assert.equal(diversity.currentLevel, 2);
  assert.equal(diversity.metal, "purple");
  assert.equal(diversity.current, 4);
  assert.equal(diversity.target, 8);
  const singles = result.filter((item) => item.metric === "speciesBloom");
  assert.equal(singles.length, 8);
  assert.equal(singles.filter((item) => item.earned).length, 4);
  assert.equal(singles.find((item) => item.id === "first-rose").displayTier.species, "rose");
  assert.equal(singles.find((item) => item.id === "first-rose").metal, "white");
  assert.equal(singles.find((item) => item.id === "first-rose").complete, true);
  assert.equal(singles.find((item) => item.id === "first-sunflower").earnedAt, null);
});

test("tier ordering does not depend on source order and unknown future achievements remain visible", () => {
  const state = core.initializeCollection(core.initialState(), 1000, [], 500);
  const reversed = core.achievementProgress(state).reverse();
  const result = C.achievementGroups(reversed);
  assert.deepEqual(result.slice(0, 2).map((item) => item.id), ["bloom-collection", "species-collection"]);
  assert.deepEqual(result.find((item) => item.id === "bloom-collection").tiers.map((item) => item.target), [1, 5, 10, 25, 50, 100, 250, 500, 1000]);
  const future = { id: "future-award", name: "未来徽章", metric: "blooms", target: 2000, current: 1000, earnedAt: null };
  const withFuture = C.achievementGroups([...reversed, future]);
  assert.equal(withFuture.length, 17);
  assert.equal(withFuture.find((item) => item.id === "future-award").nextTier.condition, undefined);
  assert.equal(withFuture.find((item) => item.id === "future-award").target, 2000);
});

test("missing catalog entries do not silently turn an intermediate tier into a completed group", () => {
  const onlyWhite = { id: "fifty-blooms", name: "50 朵花开", metric: "blooms", target: 50, current: 50, earnedAt: 0 };
  const [item] = C.achievementGroups([onlyWhite]);
  assert.equal(item.currentLevel, 5);
  assert.equal(item.levelCount, 9);
  assert.equal(item.metal, "purple");
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
