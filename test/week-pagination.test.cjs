"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { weekPage, WEEK_PAGE_SIZE } = require("../garden-layout.js");

function weeks(count) {
  return Array.from({ length: count }, (_, index) => ({
    key: `2026-${String(index + 1).padStart(2, "0")}`,
    count: index,
  })).reverse();
}

test("one to five weeks fit on a single chronological page without navigation", () => {
  assert.equal(WEEK_PAGE_SIZE, 5);
  for (const count of [1, 4, 5]) {
    const page = weekPage(weeks(count), "2026-01");
    assert.equal(page.pageCount, 1);
    assert.equal(page.weeks.length, count);
    assert.equal(page.previous, null);
    assert.equal(page.next, null);
    assert.deepEqual(page.weeks.map((week) => week.count), Array.from({ length: count }, (_, index) => index));
  }
});

test("six weeks overflow to a second page and the last page keeps only the remaining week", () => {
  const first = weekPage(weeks(6), "2026-05");
  const last = weekPage(weeks(6), first.next);
  assert.equal(first.weeks.length, 5);
  assert.equal(first.next, "2026-06");
  assert.equal(last.page, 1);
  assert.equal(last.weeks.length, 1);
  assert.equal(last.previous, "2026-01");
  assert.equal(last.next, null);
});

test("years of weekly records stay bounded, without mutating dates or dropping weeks", () => {
  const records = weeks(260);
  const original = JSON.stringify(records);
  const seen = [];
  let key = records[records.length - 1].key;
  for (let index = 0; index < 52; index++) {
    const page = weekPage(records, key);
    assert.equal(page.page, index);
    assert.equal(page.pageCount, 52);
    assert.equal(page.weeks.length, 5);
    seen.push(...page.weeks.map((week) => week.key));
    key = page.next;
  }
  assert.equal(key, null);
  assert.deepEqual(seen, records.map((week) => week.key).reverse());
  assert.equal(JSON.stringify(records), original);
});

test("date jumps reveal the page containing a selected week, including a selected empty week", () => {
  const records = weeks(18);
  records.find((week) => week.key === "2026-12").count = 0;
  const page = weekPage(records, "2026-12");
  assert.equal(page.page, 2);
  assert.equal(page.start, 10);
  assert.ok(page.weeks.some((week) => week.key === "2026-12" && week.count === 0));
  assert.equal(weekPage(records, "2026-18").page, 3);
});
