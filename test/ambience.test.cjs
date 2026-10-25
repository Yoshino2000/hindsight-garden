const test = require("node:test");
const assert = require("node:assert/strict");
const { createVisitors, createThemeEffects } = require("../ui/ambience.js");

function fixture(random = () => 0.5) {
  let time = 0;
  let sequence = 0;
  const timers = new Map();
  const node = () => {
    const listeners = {};
    const art = { style: {} };
    return { dataset: {}, style: { setProperty() {} }, listeners, art,
      querySelector() { return art; },
      addEventListener(name, callback) { listeners[name] = callback; } };
  };
  const bird = node();
  const butterfly = node();
  const controller = createVisitors(bird, butterfly, {
    random, now: () => time,
    setTimeout(callback, delay) { const id = ++sequence; timers.set(id, { callback, due: time + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
  });
  function advance(duration) {
    const target = time + duration;
    while (true) {
      const next = [...timers].sort((a, b) => a[1].due - b[1].due)[0];
      if (!next || next[1].due > target) break;
      time = next[1].due;
      timers.delete(next[0]);
      next[1].callback();
    }
    time = target;
  }
  return { controller, bird, butterfly, timers, advance };
}

test("visitors schedule only while running and resume their remaining wait", () => {
  const f = fixture();
  assert.equal(f.timers.size, 0);
  f.controller.setRunning(true);
  f.controller.setRunning(true);
  assert.equal(f.timers.size, 2);
  f.advance(1000);
  f.controller.setRunning(false);
  assert.equal(f.timers.size, 0);
  f.advance(60000);
  assert.equal(f.bird.dataset.visiting, "false");
  f.controller.setRunning(true);
  f.advance(1499);
  assert.equal(f.bird.dataset.visiting, "false");
  f.advance(1);
  assert.equal(f.bird.dataset.visiting, "true");
  assert.equal(f.bird.dataset.kind, "bird-robin");
  assert.equal(f.bird.dataset.direction, "right");
  assert.equal(f.timers.size, 2);
});

test("bird start intervals cover 15 to 30 seconds and select all three species", () => {
  for (const value of [0, 0.5, 0.999999]) {
    const f = fixture(() => value);
    f.controller.setRunning(true);
    f.advance(2500);
    assert.equal(f.bird.dataset.kind, ["bird-blue", "bird-robin", "bird-finch"][Math.floor(value * 3)]);
    const next = [...f.timers.values()].find((timer) => timer.due !== 6000);
    assert.ok(next.due - 2500 >= 15000 && next.due - 2500 <= 30000);
    assert.match(f.bird.art.style.backgroundImage, /^url\("\.\.\/assets\/ambience\/bird-/);
  }
});

test("butterflies select three palettes and only route completion hides the visitor", () => {
  for (const value of [0, 0.5, 0.999999]) {
    const f = fixture(() => value);
    f.controller.setRunning(true);
    f.advance(6000);
    assert.equal(f.butterfly.dataset.kind, ["butterfly", "butterfly-amber", "butterfly-blue"][Math.floor(value * 3)]);
    f.butterfly.listeners.animationend({ target: f.butterfly.art });
    assert.equal(f.butterfly.dataset.visiting, "true");
    f.butterfly.listeners.animationend({ target: { classList: { contains: (name) => name === "visitor-flight" } } });
    assert.equal(f.butterfly.dataset.visiting, "false");
    f.controller.setRunning(false);
    assert.equal(f.timers.size, 0);
  }
});

test("hiding during a flight ends that visit and preserves the wait for the next", () => {
  const f = fixture(() => 0);
  f.controller.setRunning(true);
  f.advance(2500);
  assert.equal(f.bird.dataset.visiting, "true");
  f.advance(2000);
  f.controller.setRunning(false);
  assert.equal(f.bird.dataset.visiting, "false");
  f.advance(100000);
  f.controller.setRunning(true);
  f.advance(12999);
  assert.equal(f.bird.dataset.visiting, "false");
  f.advance(1);
  assert.equal(f.bird.dataset.visiting, "true");
});

function sceneFixture(miniature = false) {
  const document = {
    createElement(tagName) {
      const node = {
        tagName, className: "", attributes: {}, children: [], ownerDocument: document,
        setAttribute(name, value) { node.attributes[name] = value; },
        append(item) { node.children.push(item); item.parentElement = node; },
        querySelector(selector) {
          assert.equal(selector, ".theme-effects");
          return node.children.find((item) => item.classList.contains("theme-effects")) || null;
        },
        addEventListener() { throw new Error("A static theme layer must not register an event loop"); },
      };
      node.classList = { contains(name) { return node.className.split(/\s+/).includes(name); } };
      return node;
    },
  };
  const scene = document.createElement("div");
  scene.className = "garden-scene" + (miniature ? " garden-miniature" : "");
  return scene;
}

test("theme details mount once as a bounded decorative layer without controls or resource loads", () => {
  const scene = sceneFixture();
  const layer = createThemeEffects(scene);
  assert.equal(createThemeEffects(scene), layer);
  assert.equal(scene.children.length, 1);
  assert.equal(layer.attributes["aria-hidden"], "true");
  assert.ok(layer.children.length > 0 && layer.children.length <= 12);
  for (const node of layer.children) {
    assert.equal(node.tagName, "span");
    assert.deepEqual(node.attributes, {});
    assert.equal(node.children.length, 0);
  }
});

test("theme details never add animated nodes to album miniatures or a missing scene", () => {
  const scene = sceneFixture(true);
  assert.equal(createThemeEffects(scene), null);
  assert.equal(createThemeEffects(null), null);
  assert.equal(scene.children.length, 0);
});

test("the actual ground-light ellipses stay on the rear lawn without reaching the flowerbed", () => {
  const { readFileSync } = require("node:fs");
  const { join } = require("node:path");
  const { GEOMETRY } = require("../garden-layout.js");
  const css = readFileSync(join(__dirname, "..", "ui", "theme-effects.css"), "utf8");
  const distance = (point, diamond) => Math.abs(point.x - diamond.x) / diamond.radius +
    Math.abs(point.y - diamond.y) / (diamond.radius * GEOMETRY.stepY / GEOMETRY.stepX);
  for (const selector of ["theme-light-bench", "theme-light-lantern"]) {
    const block = css.match(new RegExp(`^\\.${selector}\\s*\\{([^}]+)\\}`, "m"));
    assert.ok(block, selector);
    const read = (name) => Number(block[1].match(new RegExp(`\\b${name}:\\s*([\\d.]+)%`))[1]) / 100;
    const width = read("width") * GEOMETRY.width, height = read("height") * GEOMETRY.height;
    const center = { x: read("left") * GEOMETRY.width + width / 2,
      y: read("top") * GEOMETRY.height + height / 2 };
    assert.ok(width <= 90 && height <= 21, "Keep each light a small, low-cost ground patch");
    for (let step = 0; step < 360; step++) {
      const angle = step * Math.PI / 180;
      const point = { x: center.x + width / 2 * Math.cos(angle), y: center.y + height / 2 * Math.sin(angle) };
      assert.ok(distance(point, GEOMETRY.island) < .98, `${selector} leaves the grass`);
      assert.ok(distance(point, GEOMETRY.bed) > 1.05, `${selector} reaches the flowers`);
    }
  }
});
