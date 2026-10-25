"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createLayout, createView } = require("../garden-layout.js");
const { spawnSync } = require("node:child_process");

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

function localAt(year, month, day, hours = 12, minutes = 0, seconds = 0, milliseconds = 0) {
  return new Date(year, month - 1, day, hours, minutes, seconds, milliseconds).getTime();
}

function bloomed(id, createdAt, bloomAt) {
  return { id, name: "花" + id, species: "daisy", createdAt, bloomAt };
}

test("an empty view always has one empty garden and the current local calendar week", () => {
  const now = localAt(2026, 10, 25);
  for (const mode of ["all", "week"]) {
    const view = createView([], { mode, now, page: 100 });
    assert.equal(view.mode, mode);
    assert.equal(view.week, "2026-10-19");
    assert.equal(view.total, 0);
    assert.equal(view.gardens.length, 1);
    assert.equal(view.gardens[0].count, 0);
    assert.equal(view.layout.page, 0);
    assert.equal(view.layout.total, 0);
    assert.deepEqual(view.weeks, [{
      key: "2026-10-19", start: localAt(2026, 10, 19, 0), end: localAt(2026, 10, 26, 0),
      count: 0, current: true,
    }]);
  }
});

test("weekly gardens group by bloom date while both modes keep the stable planting order", () => {
  const plants = [
    bloomed("late-planted", localAt(2026, 10, 18), localAt(2026, 10, 20)),
    bloomed("old-plant", localAt(2026, 9, 1), localAt(2026, 10, 21)),
    bloomed("earlier-bloom", localAt(2026, 10, 2), localAt(2026, 10, 10)),
  ];
  const options = { now: localAt(2026, 10, 25), week: "2026-10-19" };
  const all = createView(plants, { ...options, mode: "all" });
  const week = createView(plants, { ...options, mode: "week" });
  assert.deepEqual(all.layout.plots.map(({ plant }) => plant.id), ["old-plant", "earlier-bloom", "late-planted"]);
  assert.deepEqual(week.layout.plots.map(({ plant }) => plant.id), ["old-plant", "late-planted"]);
  assert.equal(week.layout.total, 2);
  assert.equal(week.total, 3);
  assert.deepEqual(week.weeks.map(({ key, count, current }) => ({ key, count, current })), [
    { key: "2026-10-19", count: 2, current: true },
    { key: "2026-10-05", count: 1, current: false },
  ]);
});

test("Sunday's last millisecond and Monday midnight belong to different local weeks", () => {
  const plants = [
    bloomed("sunday", 0, localAt(2026, 10, 25, 23, 59, 59, 999)),
    bloomed("monday", 1, localAt(2026, 10, 26, 0)),
  ];
  const view = createView(plants, { mode: "week", now: localAt(2026, 10, 26, 0) });
  assert.equal(view.week, "2026-10-26");
  assert.deepEqual(view.layout.plots.map(({ plant }) => plant.id), ["monday"]);
  assert.equal(view.weeks.find(({ key }) => key === "2026-10-19").end, localAt(2026, 10, 26, 0));
});

test("weeks cross year boundaries using Monday dates instead of a year-number approximation", () => {
  const plants = [
    bloomed("new-year", 0, localAt(2027, 1, 1)),
    bloomed("sunday", 1, localAt(2027, 1, 3, 23, 59, 59, 999)),
    bloomed("new-week", 2, localAt(2027, 1, 4, 0)),
  ];
  const sunday = createView(plants, { mode: "week", now: localAt(2027, 1, 3) });
  assert.equal(sunday.week, "2026-12-28");
  assert.equal(sunday.layout.total, 2);
  assert.equal(sunday.weeks.find(({ key }) => key === "2026-12-28").end, localAt(2027, 1, 4, 0));
  const monday = createView(plants, { mode: "week", now: localAt(2027, 1, 4) });
  assert.equal(monday.week, "2027-01-04");
  assert.equal(monday.layout.total, 1);
});

test("only strict real Monday date keys are accepted and invalid selections fall back to this week", () => {
  const now = localAt(2026, 10, 25);
  for (const week of ["2026-10-20", "2026-02-30", "2025-02-29", "2026-13-01", "2026-00-01",
    "2026-10-00", "2026-2-02", "2026-10-19Z", " 2026-10-19", "2026-10-19 ", "", null, 20261019]) {
    assert.equal(createView([], { now, week }).week, "2026-10-19", String(week));
  }
  assert.equal(createView([], { now, week: "2024-02-26" }).week, "2024-02-26");
});

test("a valid selected empty week survives deletion, including while viewing all flowers", () => {
  for (const mode of ["all", "week"]) {
    const view = createView([], { mode, now: localAt(2026, 10, 25), week: "2026-10-05" });
    assert.equal(view.week, "2026-10-05");
    assert.equal(view.gardens.length, 1);
    assert.equal(view.layout.total, 0);
    assert.deepEqual(view.weeks.map(({ key, count, current }) => ({ key, count, current })), [
      { key: "2026-10-19", count: 0, current: true },
      { key: "2026-10-05", count: 0, current: false },
    ]);
  }
});

test("missing and invalid bloom timestamps fall back to the planting date", () => {
  const createdAt = localAt(2026, 10, 20);
  const plants = [undefined, null, "flower", ...[undefined, null, NaN, Infinity, -1, "2026-10-12", 9e15]
    .map((bloomAt, index) => bloomed("fallback-" + index, createdAt + index, bloomAt))];
  const view = createView(plants, { mode: "week", now: localAt(2026, 10, 25) });
  assert.equal(view.total, 7);
  assert.equal(view.layout.total, 7);
  assert.equal(view.weeks[0].count, 7);
  assert.equal(createView([{ id: "bad-all-dates", createdAt: 9e15 }], { now: createdAt }).total, 0);
});

test("weekly pagination exposes every garden and clamps the current page independently of global totals", () => {
  const current = localAt(2026, 10, 21);
  const earlier = localAt(2026, 10, 7);
  const plants = flowers(60).map((plant, index) => ({ ...plant, bloomAt: index < 53 ? current : earlier }));
  const view = createView(plants, { mode: "week", now: current, page: 99 });
  assert.equal(view.total, 60);
  assert.equal(view.layout.total, 53);
  assert.equal(view.layout.page, 2);
  assert.equal(view.gardens.length, 3);
  assert.deepEqual(view.gardens.map(({ count }) => count), [25, 25, 3]);
  assert.deepEqual(view.gardens.map(({ page }) => page), [0, 1, 2]);
  assert.equal(new Set(view.gardens.flatMap(({ plots }) => plots.map(({ plant }) => plant.id))).size, 53);
  const all = createView(plants, { now: current, week: "2026-10-05", page: -100 });
  assert.equal(all.mode, "all");
  assert.equal(all.week, "2026-10-05");
  assert.equal(all.layout.page, 0);
  assert.equal(all.layout.total, 60);
  assert.deepEqual(all.gardens.map(({ count }) => count), [25, 25, 10]);
});

test("view deduplicates and caps globally before grouping, without mutating the source", () => {
  const now = localAt(2026, 10, 21);
  const plants = flowers(205).map((plant) => ({ ...plant, bloomAt: now }));
  plants.unshift({ ...plants[0], name: "duplicate", createdAt: 1000000, bloomAt: localAt(2026, 10, 7) });
  plants.push({ id: "bad", createdAt: -1, bloomAt: now });
  const snapshot = structuredClone(plants);
  const view = createView(plants, { mode: "week", now, page: 99 });
  assert.equal(view.total, 200);
  assert.equal(view.layout.total, 200);
  assert.equal(view.gardens.length, 8);
  assert.equal(view.weeks.length, 1);
  assert.equal(view.weeks[0].count, 200);
  assert.equal(view.gardens[0].plots[0].plant.name, "小花0");
  assert.deepEqual(plants, snapshot);
});

test("distant historical blooms add only their own week rather than traversing empty decades", () => {
  const now = localAt(2026, 10, 21);
  const view = createView([bloomed("ancient", 0, localAt(1970, 1, 1))], { now });
  assert.equal(view.weeks.length, 2);
  assert.deepEqual(view.weeks.map(({ key }) => key), ["2026-10-19", "1969-12-29"]);
});

test("invalid options remain safe and the default clock uses the local current week", () => {
  for (const options of [null, false, "week", [], { mode: "other", now: NaN }, { now: Infinity }]) {
    const view = createView([], options);
    assert.equal(view.mode, "all");
    assert.equal(view.weeks.length, 1);
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(view.week));
    assert.equal(new Date(view.weeks[0].start).getDay(), 1);
    assert.equal(view.gardens.length, 1);
  }
});

test("local weeks span DST transitions by calendar dates rather than fixed 168-hour intervals", () => {
  const modulePath = require.resolve("../garden-layout.js");
  const source = `
    const assert = require("node:assert/strict");
    const { createView } = require(${JSON.stringify(modulePath)});
    function at(month, day, hour = 0, minute = 0, second = 0, ms = 0) {
      return new Date(2026, month - 1, day, hour, minute, second, ms).getTime();
    }
    for (const [month, sunday, monday, key, hours] of [
      [3, 8, 9, "2026-03-02", 167], [11, 1, 2, "2026-10-26", 169]
    ]) {
      const plants = [
        { id: "sunday", createdAt: 0, bloomAt: at(month, sunday, 23, 59, 59, 999) },
        { id: "monday", createdAt: 1, bloomAt: at(month, monday) }
      ];
      const view = createView(plants, { mode: "week", now: at(month, sunday, 12) });
      const current = view.weeks.find((week) => week.current);
      assert.equal(view.week, key);
      assert.equal((current.end - current.start) / 3600000, hours);
      assert.equal(new Date(current.start).getHours(), 0);
      assert.equal(new Date(current.end).getHours(), 0);
      assert.equal(new Date(current.end).getDay(), 1);
      assert.equal(current.end, at(month, monday));
      assert.deepEqual(view.layout.plots.map(({ plant }) => plant.id), ["sunday"]);
    }
  `;
  const result = spawnSync(process.execPath, ["-e", source], {
    env: { ...process.env, TZ: "America/New_York" }, encoding: "utf8", timeout: 10000,
  });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
});
