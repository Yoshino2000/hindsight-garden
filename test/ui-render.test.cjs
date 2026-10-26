"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const vm = require("node:vm");
const layout = require("../garden-layout.js");
const core = require("../core.js");
const i18n = require("../i18n.js");
const variants = require("../ui/variants.js");
const main = readFileSync(require.resolve("../ui/main.js"), "utf8");

// Run the checked-in render functions, not copies of their signatures or branching logic.
// The small tree below observes node replacement and actions; it does not model browser paint.
function productionFunction(name) {
  const start = main.indexOf(`  function ${name}(`) >= 0 ? main.indexOf(`  function ${name}(`) : main.indexOf(`  async function ${name}(`);
  assert.notEqual(start, -1, `Production function ${name} exists`);
  const end = main.slice(start).match(/\r?\n  }/);
  assert.ok(end, `Production function ${name} has an identifiable boundary`);
  return main.slice(start, start + end.index + end[0].length);
}

function renderFixture(count = 30) {
  const nodes = new Map();
  const replacements = new Map();
  const counters = { breeze: 0, savedView: 0 };
  class Element {
    constructor(tag = "div") {
      this.tagName = tag;
      this.children = [];
      this.parentElement = null;
      this.hidden = false;
      this.dataset = {};
      this.properties = new Map();
      this.listeners = new Map();
      this.style = { setProperty() {} };
    }
    get id() { return this.properties.get("id") || ""; }
    set id(value) { this.properties.set("id", String(value)); nodes.set(String(value), this); }
    get attributes() { return [...this.properties].map(([name, value]) => ({ name, value })); }
    get firstElementChild() { return this.children[0] || null; }
    setAttribute(name, value) {
      if (name === "id") this.id = value;
      else this.properties.set(name, String(value));
    }
    getAttribute(name) { return this.properties.get(name) ?? null; }
    append(...items) {
      for (const item of items) {
        if (item.parentElement) {
          const siblings = item.parentElement.children;
          siblings.splice(siblings.indexOf(item), 1);
        }
        item.parentElement = this;
        this.children.push(item);
      }
    }
    replaceChildren(...items) {
      replacements.set(this.id, (replacements.get(this.id) || 0) + 1);
      for (const child of this.children) child.parentElement = null;
      this.children = [];
      this.append(...items);
    }
    addEventListener(type, callback) { this.listeners.set(type, callback); }
    click() { this.listeners.get("click")?.(); }
    matches() { return false; }
    focus() {}
    querySelectorAll(selector) {
      const result = [];
      for (const child of this.children) {
        if (selector === "*" || selector === "button" && child.tagName === "button" ||
            selector === "[id]" && child.id) result.push(child);
        result.push(...child.querySelectorAll(selector));
      }
      return result;
    }
    cloneNode(deep) {
      const copy = new Element(this.tagName);
      copy.className = this.className;
      for (const { name, value } of this.attributes) copy.setAttribute(name, value);
      if (deep) copy.append(...this.children.map(child => child.cloneNode(true)));
      return copy;
    }
  }
  const $ = (id) => {
    if (!nodes.has(id)) { const node = new Element(); node.id = id; }
    return nodes.get(id);
  };
  const landscape = new Element("svg");
  const paint = new Element("linearGradient"); paint.id = "test-paint";
  const ground = new Element("path"); ground.setAttribute("fill", "url(#test-paint)");
  landscape.append(paint, ground);
  const props = new Element();
  const swing = new Element();
  $("garden-ambience").querySelector = selector => {
    assert.equal(selector, ".ambience-swing"); return swing;
  };
  $("flower-drawer").hidden = true;
  const now = Date.now();
  const archive = Object.freeze(Array.from({ length: count }, (_, index) => Object.freeze({
    id: "plant-" + index, name: "Flower " + index, species: "daisy",
    createdAt: now - 3600000 + index, bloomAt: now,
    targetMs: 60000, progressMs: 60000, taskNote: "Original task " + index,
  })));
  const scope = {
    C: core, GardenLayout: layout, GardenVariants: variants,
    selectGardenView: layout.createViewSelector(), state: { garden: archive },
    gardenView: null, gardenMode: "all", gardenWeek: "", gardenPage: 0,
    gardenSignature: "", albumSignature: "", flowerSignature: "", selectedFlower: null,
    editPlantId: null, noteId: null, renameId: null, deleteId: null,
    $, t: i18n.create("en").t,
    document: { createElement: tag => new Element(tag), querySelector(selector) {
      if (selector === ".garden-island-card .garden-landscape") return landscape;
      if (selector === ".garden-island-card .theme-props") return props;
      throw new Error("Unexpected selector: " + selector);
    } },
    renderReview() {}, renderWeekIndex() {}, animateWeekChange() {},
    closeAchievementDrawer() {},
    saveGardenView() { counters.savedView++; },
    breeze: { refresh() { counters.breeze++; } },
    gardenArtwork: () => new Element("svg"),
    species: id => core.SPECIES.find(item => item.id === id),
    minutes: String, date: value => new Date(value).toISOString(),
    openRename() {}, openDelete() {}, openNote() {},
  };
  vm.createContext(scope);
  vm.runInContext([
    "el", "renderGarden", "weekRange", "renderAlbum", "renderFlower", "placeFlowerActions",
    "closeFlowerDrawer", "closeFlowerActions", "changeGardenPage", "changeGardenScope",
  ].map(productionFunction).join("\n"), scope);
  return {
    $, scope, counters,
    render: () => vm.runInContext("renderGarden()", scope),
    replace(id, changes) {
      scope.state = { ...scope.state, garden: Object.freeze(scope.state.garden.map(plant =>
        plant.id === id ? Object.freeze({ ...plant, ...changes }) : plant)) };
    },
    select(id) {
      const button = $("garden-grid").children.find(node => node.dataset.plantId === id);
      assert.ok(button, "The requested flower is visible"); button.click();
    },
    page: delta => vm.runInContext(`changeGardenPage(${delta})`, scope),
    replaced: id => replacements.get(id) || 0,
  };
}

function content(node) {
  return String(node.textContent || "") + node.children.map(content).join(" ");
}

test("unchanged archive identity preserves the actual garden, album and open detail nodes", () => {
  const f = renderFixture(); f.render(); f.select("plant-0");
  const view = f.scope.gardenView;
  const grid = f.$("garden-grid").children, album = f.$("garden-album").children;
  const details = f.$("flower-details").children;
  f.scope.state = { ...f.scope.state, notify: false, heartbeatAt: Date.now() };
  f.render(); f.render();
  assert.strictEqual(f.scope.gardenView, view);
  assert.strictEqual(f.$("garden-grid").children, grid);
  assert.strictEqual(f.$("garden-album").children, album);
  assert.strictEqual(f.$("flower-details").children, details);
  assert.equal(f.replaced("garden-grid"), 1);
  assert.equal(f.replaced("garden-album"), 1);
  assert.equal(f.counters.breeze, 1);
});

test("a new note snapshot refreshes an open flower while keeping its actual plot and album nodes", () => {
  const f = renderFixture(); f.render(); f.select("plant-0");
  const grid = f.$("garden-grid").children, album = f.$("garden-album").children;
  const details = f.$("flower-details").children;
  f.replace("plant-0", { taskNote: "New task memory <b> {0}" }); f.render();
  assert.strictEqual(f.$("garden-grid").children, grid);
  assert.strictEqual(f.$("garden-album").children, album);
  assert.notStrictEqual(f.$("flower-details").children, details);
  assert.ok(content(f.$("flower-details")).includes("New task memory <b> {0}"));
  assert.equal(f.$("flower-drawer").hidden, false);
  assert.equal(f.counters.breeze, 1);
  f.scope.closeFlowerDrawer(false); f.select("plant-0");
  assert.ok(content(f.$("flower-details")).includes("New task memory <b> {0}"),
    "A reused button must open the current snapshot, not its old captured plant metadata");
});

test("renaming an offscreen flower preserves both plots and previews that do not show names", () => {
  const f = renderFixture(); f.render(); f.select("plant-0");
  const grid = f.$("garden-grid").children, album = f.$("garden-album").children;
  const details = f.$("flower-details").children;
  f.replace("plant-29", { name: "Renamed offscreen flower" }); f.render();
  assert.strictEqual(f.$("garden-grid").children, grid);
  assert.strictEqual(f.$("garden-album").children, album);
  assert.strictEqual(f.$("flower-details").children, details);
  assert.equal(f.counters.breeze, 1);
});

test("renaming a visible flower updates its button label and open drawer without rebuilding the album", () => {
  const f = renderFixture(); f.render(); f.select("plant-0");
  const grid = f.$("garden-grid").children, album = f.$("garden-album").children;
  f.replace("plant-0", { name: "New visible flower name" }); f.render();
  assert.notStrictEqual(f.$("garden-grid").children, grid);
  assert.strictEqual(f.$("garden-album").children, album);
  assert.ok(f.$("garden-grid").children[0].getAttribute("aria-label").includes("New visible flower name"));
  assert.ok(content(f.$("flower-details")).includes("New visible flower name"));
  assert.equal(f.$("flower-drawer").hidden, false);
  assert.equal(f.counters.breeze, 2);
});

test("pagination closes stale details, changes the visible plots and reuses the same album window", () => {
  const f = renderFixture(); f.render(); f.select("plant-0");
  const album = f.$("garden-album").children;
  f.page(1);
  assert.equal(f.scope.gardenPage, 1);
  assert.equal(f.$("garden-grid").children.length, 5);
  assert.equal(f.$("garden-grid").children[0].dataset.plantId, "plant-25");
  assert.strictEqual(f.$("garden-album").children, album);
  assert.equal(album[0].getAttribute("aria-pressed"), "false");
  assert.equal(album[1].getAttribute("aria-pressed"), "true");
  assert.equal(f.$("flower-drawer").hidden, true);
  assert.equal(f.scope.selectedFlower, null);
  assert.equal(f.counters.breeze, 2);
  f.page(-1);
  assert.equal(f.$("garden-grid").children.length, 25);
  assert.equal(f.counters.breeze, 3);
});

test("deleting a selected flower and entering an empty week cannot leave stale details or plots", () => {
  const f = renderFixture(); f.render(); f.select("plant-0");
  f.scope.state = { garden: Object.freeze(f.scope.state.garden.filter(plant => plant.id !== "plant-0")) };
  f.render();
  assert.equal(f.$("flower-drawer").hidden, true);
  assert.equal(f.scope.selectedFlower, null);
  assert.equal(f.$("garden-grid").children[0].dataset.plantId, "plant-1");
  vm.runInContext('changeGardenScope("week", "9999-12-27")', f.scope);
  assert.equal(f.$("garden-grid").children.length, 0);
  assert.equal(f.$("garden-empty").hidden, false);
  assert.equal(f.$("garden-album").hidden, true);
  assert.equal(f.scope.gardenView.review.count, 0);
  assert.equal(f.counters.breeze, 3);
});

test("the actual page poll skips hidden views and discards an outstanding hidden result", async () => {
  let calls = 0, renders = 0, resolveLoad;
  const original = { label: "existing" }, latest = { label: "latest" };
  const scope = { polling: false, busy: false, generation: 0, state: original,
    document: { visibilityState: "hidden" },
    store: { load: async () => { calls++; return latest; } },
    render: () => { renders++; }, showError: error => { throw error; } };
  vm.createContext(scope); vm.runInContext(productionFunction("poll"), scope);
  await vm.runInContext("poll()", scope);
  assert.equal(calls, 0, "Hidden pages do not query SQLite");
  scope.document.visibilityState = "visible";
  scope.store.load = () => { calls++; return new Promise(resolve => { resolveLoad = resolve; }); };
  const pending = vm.runInContext("poll()", scope);
  scope.document.visibilityState = "hidden"; resolveLoad(latest); await pending;
  assert.strictEqual(scope.state, original);
  assert.equal(renders, 0);
  assert.equal(scope.polling, false);
  scope.document.visibilityState = "visible";
  scope.store.load = async () => { calls++; return latest; };
  await vm.runInContext("poll()", scope);
  assert.strictEqual(scope.state, latest);
  assert.equal(renders, 1);
  assert.equal(calls, 2);
});

for (const timezone of ["UTC", "Pacific/Tongatapu"]) {
  test(`the actual date lookup respects minimum, maximum and pre-epoch rejection in ${timezone}`, () => {
    const source = `
      const assert = require("node:assert/strict"), vm = require("node:vm");
      const GardenLayout = require(${JSON.stringify(require.resolve("../garden-layout.js"))});
      const I = require(${JSON.stringify(require.resolve("../i18n.js"))}).create("en");
      const fn = ${JSON.stringify(productionFunction("locateWeek"))};
      function locate(value) {
        const result = {};
        const oldError = { hidden: false, textContent: "Previous invalid date" };
        const scope = { Date, Number, GardenLayout, t: I.t, errorSource: "date", $: id => id === "error" ? oldError : ({ value }),
          showError: error => { result.error = error.message; },
          changeGardenScope: (mode, week) => { result.mode = mode; result.week = week; } };
        vm.createContext(scope); vm.runInContext(fn + "\\nlocateWeek()", scope);
        if (result.week) {
          assert.equal(oldError.hidden, true, "A corrected date clears the previous date error");
          assert.equal(oldError.textContent, "");
          assert.equal(scope.errorSource, "");
        }
        return result;
      }
      assert.deepEqual(locate("1970-01-01"), { mode: "week", week: "1969-12-29" });
      assert.deepEqual(locate("9999-12-31"), { mode: "week", week: "9999-12-27" });
      const rejected = locate("1969-12-31");
      assert.equal(rejected.week, undefined, "An unsupported day must not silently select this week");
      assert.equal(rejected.error, I.t("花园日期从 1970 年 1 月 1 日开始，请选择此日期或之后的日期。"));
      assert.ok(!/[\\u3400-\\u9fff]/.test(rejected.error), "The explicit English error is localized");
      assert.equal(locate("2026-02-30").week, undefined);
      assert.equal(locate("2026-02-30").error, I.t("日期无法识别，请重新选择。"));
    `;
    const result = spawnSync(process.execPath, ["-e", source], {
      env: { ...process.env, TZ: timezone }, encoding: "utf8", timeout: 10000,
    });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
  });
}

test("a bloom is revealed while the page is open, and on opening only when newer than the last reveal", () => {
  const scope = {};
  vm.createContext(scope);
  vm.runInContext(productionFunction("bloomRevealDue"), scope);
  const due = (bloom, stored, opening) => vm.runInContext("bloomRevealDue", scope)(bloom, stored, opening);
  const bloom = { id: "plant-1", at: 5000 };
  assert.equal(due(null, null, false), false);
  assert.equal(due(bloom, null, false), true, "an open page reveals a new bloom");
  assert.equal(due(bloom, 5000, false), false, "the same bloom is not revealed twice");
  assert.equal(due(bloom, null, true), false, "a first visit records the current bloom quietly");
  assert.equal(due(bloom, 4000, true), true, "opening after an unseen bloom reveals it");
  assert.equal(due(bloom, 6000, true), false);
  assert.equal(due(bloom, Number.NaN, true), false);
});

test("visiting a revealed flower opens its bloom week, finds its garden page and shows its details", () => {
  const f = renderFixture(); f.render();
  f.scope.document.body = { classList: { contains: () => false } };
  f.scope.tab = () => {};
  vm.runInContext(productionFunction("showGardenFlower"), f.scope);
  assert.equal(vm.runInContext('showGardenFlower("plant-27")', f.scope), true);
  assert.equal(f.scope.gardenMode, "week");
  assert.equal(f.scope.gardenWeek, layout.localWeek(Date.now()).key);
  assert.equal(f.scope.gardenPage, 1);
  assert.equal(f.scope.selectedFlower, "plant-27");
  assert.equal(f.$("flower-drawer").hidden, false);
  assert.equal(vm.runInContext('showGardenFlower("missing")', f.scope), false);
});

test("duration shortcuts mark only the button that matches the typed minutes", () => {
  const buttons = [30, 60, 90].map(minutes => {
    const attributes = new Map();
    return { dataset: { minutes: String(minutes) }, attributes, setAttribute: (name, value) => attributes.set(name, value) };
  });
  const nodes = { "target-minutes": { value: "60" }, "minute-presets": { children: buttons } };
  const scope = { $: id => nodes[id] };
  vm.createContext(scope);
  vm.runInContext(productionFunction("syncMinutePresets"), scope);
  vm.runInContext("syncMinutePresets()", scope);
  assert.deepEqual(buttons.map(button => button.attributes.get("aria-pressed")), ["false", "true", "false"]);
  nodes["target-minutes"].value = "75";
  vm.runInContext("syncMinutePresets()", scope);
  assert.deepEqual(buttons.map(button => button.attributes.get("aria-pressed")), ["false", "false", "false"]);
});

test("the active pot shows whole minutes left and the next quarter stage", () => {
  const scope = { C: core, t: i18n.create("zh-CN").t, STAGES: ["种子", "发芽", "长叶", "花苞", "开花"] };
  vm.createContext(scope);
  vm.runInContext(productionFunction("remainingText") + "\n" + productionFunction("progressNext"), scope);
  const next = (progress, target) => vm.runInContext(`progressNext(${progress}, ${target})`, scope);
  assert.equal(next(24000, 3600000), "还需 60 分钟开花 · 15 分钟后发芽");
  assert.equal(next(900000, 3600000), "还需 45 分钟开花 · 15 分钟后长叶");
  assert.equal(next(2700000, 3600000), "还需 15 分钟开花");
  assert.equal(next(3599500, 3600000), "还需 1 秒开花");
  assert.equal(next(3600000, 3600000), "");
  assert.equal(i18n.create("en").t("还需 {0}开花 · {1}后{2}", "60 minutes", "15 minutes", "Sprout"), "60 minutes to bloom · Sprout in 15 minutes");
});
