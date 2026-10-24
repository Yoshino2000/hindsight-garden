"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createLayout } = require("../garden-layout.js");

function flowers(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `plant-${String(index).padStart(3, "0")}`,
    name: "小花" + index,
    createdAt: index * 1000,
    species: "daisy",
  }));
}

function positions(layout) {
  return layout.plots.map(({ plant, x, y, z, rotation }) => ({
    id: plant.id,
    x,
    y,
    z,
    rotation,
  }));
}

test("empty and non-array gardens are safe and retain one empty page", () => {
  for (const value of [[], null, undefined, {}, "flowers", 25]) {
    assert.deepEqual(createLayout(value, 100), {
      page: 0,
      pageCount: 1,
      plots: [],
      total: 0,
    });
  }
});

test("a full page has 25 distinct plot coordinates inside the agreed scene", () => {
  const layout = createLayout(flowers(25));
  assert.equal(layout.plots.length, 25);
  assert.equal(layout.total, 25);
  assert.equal(layout.pageCount, 1);
  assert.equal(new Set(layout.plots.map(({ x, y }) => `${x},${y}`)).size, 25);
  for (const plot of layout.plots) {
    assert.ok(plot.x >= 220 && plot.x <= 780);
    assert.ok(plot.y >= 340 && plot.y <= 596);
    assert.equal(plot.rotation, 0);
  }
  for (const first of layout.plots) {
    for (const second of layout.plots) {
      if (first.y < second.y)
        assert.ok(
          first.z < second.z,
          "Foreground flowers must appear above those farther back",
        );
    }
  }
});

test("a small garden grows out from the center without inventing any extra flowers", () => {
  const single = createLayout(flowers(1));
  assert.equal(single.plots.length, 1);
  assert.equal(single.plots[0].x, 500);
  assert.equal(single.plots[0].y, 468);
  assert.equal(single.plots[0].z, 4);
  const small = createLayout(flowers(8));
  assert.equal(small.plots.length, 8);
  assert.deepEqual(
    small.plots.map(({ x, y }) => [x, y]),
    [
      [500, 468],
      [570, 436],
      [430, 436],
      [570, 500],
      [430, 500],
      [640, 404],
      [500, 404],
      [360, 404],
    ],
  );
  assert.deepEqual(positions(small).slice(0, 1), positions(single));
});

test("polling, input order, display-name changes, and later additions preserve existing positions", () => {
  const original = flowers(20);
  const before = positions(createLayout(original));
  const renamed = original.map((plant) => ({
    ...plant,
    name: "完全不同的名字",
  }));
  assert.deepEqual(positions(createLayout([...renamed].reverse())), before);
  const extended = positions(
    createLayout([...renamed, ...flowers(21).slice(20)]),
  );
  assert.equal(extended.length, 21);
  assert.deepEqual(extended.slice(0, 20), before);
  assert.deepEqual(
    original,
    flowers(20),
    "Layout must not reorder or mutate the original garden",
  );
});

test("same-time flowers use a stable ID order rather than name or current array order", () => {
  const plants = [
    { id: "z", name: "A", createdAt: 100 },
    { id: "b", name: "Z", createdAt: 100 },
    { id: "a", name: "X", createdAt: 100 },
    { id: "oldest", name: "Y", createdAt: 0 },
  ];
  assert.deepEqual(
    createLayout(plants).plots.map(({ plant }) => plant.id),
    ["oldest", "a", "b", "z"],
  );
});

test("pagination never exceeds 25 flowers and clamps requested pages", () => {
  const plants = flowers(53);
  const first = createLayout(plants, -10);
  const middle = createLayout(plants, 1.9);
  const last = createLayout(plants, 99);
  assert.equal(first.page, 0);
  assert.equal(first.plots.length, 25);
  assert.equal(middle.page, 1);
  assert.equal(middle.plots[0].plant.id, "plant-025");
  assert.equal(last.page, 2);
  assert.equal(last.pageCount, 3);
  assert.equal(last.plots.length, 3);
  assert.equal(last.plots[0].plant.id, "plant-050");
  assert.equal(createLayout(plants, "2").page, 2);
  assert.equal(
    new Set(
      [first, middle, last].flatMap((layout) =>
        layout.plots.map(({ plant }) => plant.id),
      ),
    ).size,
    53,
  );
});

test("malformed records and duplicate IDs cannot create broken or duplicate plots", () => {
  const good = flowers(3);
  const mixed = [
    null,
    false,
    1,
    "plant",
    {},
    { id: "", createdAt: 0 },
    { id: "bad-time", createdAt: NaN },
    { id: "negative", createdAt: -1 },
    { id: "string-time", createdAt: "1" },
    { id: "x".repeat(129), createdAt: 0 },
    ...good,
    { ...good[0], name: "重复", createdAt: 5000 },
  ];
  const layout = createLayout(mixed);
  assert.equal(layout.total, 3);
  assert.deepEqual(
    layout.plots.map(({ plant }) => plant.id),
    good.map((plant) => plant.id),
  );
  assert.equal(layout.plots[0].plant.name, good[0].name);
  for (const page of [NaN, Infinity, -Infinity, {}, null, Symbol("page")]) {
    assert.equal(createLayout(good, page).page, 0);
  }
});

test("oversized foreign input is capped at 200 unique flowers and eight pages", () => {
  const layout = createLayout(flowers(250).reverse(), 100);
  assert.equal(layout.total, 200);
  assert.equal(layout.pageCount, 8);
  assert.equal(layout.page, 7);
  assert.equal(layout.plots.length, 25);
  assert.equal(layout.plots[0].plant.id, "plant-175");
  assert.equal(layout.plots[24].plant.id, "plant-199");
});
