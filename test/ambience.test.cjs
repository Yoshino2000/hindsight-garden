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
  assert.ok(layer.children.length > 0 && layer.children.length <= 24);
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

test("blossom's relocated lantern glow also stays on the rear lawn clear of the flowerbed", () => {
  const { readFileSync } = require("node:fs");
  const { join } = require("node:path");
  const { GEOMETRY } = require("../garden-layout.js");
  const css = readFileSync(join(__dirname, "..", "ui", "theme-effects.css"), "utf8");
  const base = css.match(/^\.theme-light-lantern\s*\{([^}]+)\}/m)[1];
  const override = css.match(/^#view-garden\[data-theme="blossom"\] \.theme-light-lantern\s*\{([^}]+)\}/m)[1];
  const read = (name) => Number((override.match(new RegExp(`\\b${name}:\\s*([\\d.]+)%`)) ||
    base.match(new RegExp(`\\b${name}:\\s*([\\d.]+)%`)))[1]) / 100;
  const width = read("width") * GEOMETRY.width, height = read("height") * GEOMETRY.height;
  const center = { x: read("left") * GEOMETRY.width + width / 2, y: read("top") * GEOMETRY.height + height / 2 };
  const distance = (point, diamond) => Math.abs(point.x - diamond.x) / diamond.radius +
    Math.abs(point.y - diamond.y) / (diamond.radius * GEOMETRY.stepY / GEOMETRY.stepX);
  for (let step = 0; step < 360; step++) {
    const angle = step * Math.PI / 180;
    const point = { x: center.x + width / 2 * Math.cos(angle), y: center.y + height / 2 * Math.sin(angle) };
    assert.ok(distance(point, GEOMETRY.island) < .98, "the glow leaves the grass");
    assert.ok(distance(point, GEOMETRY.bed) > 1.05, "the glow reaches the flowers");
  }
});

function petalStyles() {
  const { readFileSync } = require("node:fs");
  const { join } = require("node:path");
  const css = readFileSync(join(__dirname, "..", "ui", "theme-effects.css"), "utf8");
  const routes = [...css.matchAll(/^\.theme-petal-[a-z]+\s*\{([^}]+)\}/gm)].map((match) => {
    const read = (name, suffix = "%") => Number(match[1].match(new RegExp(`${name}:\\s*([-\\d.]+)${suffix}`))[1]);
    return { x0: read("--petal-x0"), y0: read("--petal-y0"),
      x1: read("--petal-x1"), y1: read("--petal-y1"), delay: read("animation-delay", "s") };
  });
  return { css, routes };
}

test("petals cross a visible height from above the garden and settle on safe grass rather than flowers", () => {
  const { GEOMETRY } = require("../garden-layout.js");
  const { routes } = petalStyles();
  assert.ok(routes.length >= 4 && routes.length <= 6);
  const distance = (point, diamond) => Math.abs(point.x - diamond.x) / diamond.radius +
    Math.abs(point.y - diamond.y) / (diamond.radius * GEOMETRY.stepY / GEOMETRY.stepX);
  for (const route of routes) {
    assert.ok(route.y0 >= 12 && route.y0 <= 20, "A petal must start above the garden, below the viewport crop");
    assert.ok(route.y1 - route.y0 >= 25, "A petal must travel much farther than a few sprite pixels");
    const landed = { x: route.x1 * GEOMETRY.width / 100, y: route.y1 * GEOMETRY.height / 100 };
    assert.ok(distance(landed, GEOMETRY.island) < .95, "The petal lands before the island edge");
    assert.ok(distance(landed, GEOMETRY.bed) > 1.05, "The settled petal stays outside the flowerbed");
  }
});

test("the configured petal phases remain visible regularly with at most three at once and a stationary landing", () => {
  const { css, routes } = petalStyles();
  const duration = Number(css.match(/^\.theme-petal\s*\{[^}]*animation:\s*theme-petal-fall\s+([\d.]+)s/m)[1]);
  const frames = css.match(/@keyframes theme-petal-fall\s*\{([\s\S]*?)\n\}/)[1];
  const points = [...frames.matchAll(/([\d.% ,]+)\{([^}]+)\}/g)].flatMap((match) => {
    const opacity = Number(match[2].match(/opacity:\s*([\d.]+)/)[1]);
    return match[1].trim().split(/,\s*/).map((percent) => ({ phase: Number(percent.replace("%", "")), opacity, transform: match[2].match(/transform:\s*([^;]+);/)[1] }));
  }).sort((first, second) => first.phase - second.phase);
  const opacityAt = (phase) => {
    const upper = points.findIndex((point) => point.phase >= phase);
    if (upper === 0) return points[0].opacity;
    const before = points[upper - 1], after = points[upper];
    return before.opacity + (after.opacity - before.opacity) * (phase - before.phase) / (after.phase - before.phase);
  };
  let maximum = 0, total = 0, samples = 0;
  for (let time = 0; time < duration; time += .05) {
    const visible = routes.filter((route) => opacityAt(((time - route.delay) % duration) / duration * 100) > .02).length;
    maximum = Math.max(maximum, visible);
    total += visible;
    samples++;
  }
  assert.ok(maximum <= 3, "Avoid a shower of simultaneous petals");
  assert.ok(total / samples >= 1.5, "Do not leave almost the whole cycle invisible");
  const landing = points.find((point) => point.phase === 34);
  const faded = points.find((point) => point.phase === 46);
  assert.equal(landing.transform, faded.transform, "The final fade must remain at the landing point");
  assert.ok((faded.phase - landing.phase) / 100 * duration >= 2, "Leave time to see the petal settle");
});

function rainfallStyles() {
  const { readFileSync } = require("node:fs");
  const { join } = require("node:path");
  const css = readFileSync(join(__dirname, "..", "ui", "theme-effects.css"), "utf8");
  const routes = [...css.matchAll(/^\.theme-rainfall-[a-z]+\s*\{([^}]+)\}/gm)].map((match) => {
    const read = (name, suffix = "%") => Number(match[1].match(new RegExp(`${name}:\\s*([-\\d.]+)${suffix}`))[1]);
    return { x0: read("--rain-x0"), y0: read("--rain-y0"),
      x1: read("--rain-x1"), y1: read("--rain-y1"), delay: read("--rain-delay", "s") };
  });
  const duration = Number(css.match(/--rain-cycle:\s*([\d.]+)s/)[1]);
  return { css, routes, duration };
}

test("the rain splash footprint stays on grass and clear of the flowerbed in normal and narrow scenes", () => {
  const { GEOMETRY } = require("../garden-layout.js");
  const { css, routes } = rainfallStyles();
  assert.ok(routes.length >= 4 && routes.length <= 8);
  const splash = [...css.matchAll(/^\.theme-rainfall::after\s*\{([^}]+)\}/gm)]
    .map((match) => match[1]).find((block) => block.includes("width:"));
  const readSize = (name, viewport) => {
    const values = splash.match(new RegExp(`${name}:\\s*clamp\\(([\\d.]+)px,\\s*([\\d.]+)vw,\\s*([\\d.]+)px\\)`));
    assert.ok(values, `The actual ${name} must remain inspectable`);
    return Math.min(Number(values[3]), Math.max(Number(values[1]), viewport * Number(values[2]) / 100));
  };
  const splashFrames = css.match(/@keyframes sparse-rain-splash\s*\{([\s\S]*?)\n\}/)[1];
  const maximumScale = Math.max(...[...splashFrames.matchAll(/scale\(([\d.]+)\)/g)].map((match) => Number(match[1])));
  const distance = (point, diamond) => Math.abs(point.x - diamond.x) / diamond.radius +
    Math.abs(point.y - diamond.y) / (diamond.radius * GEOMETRY.stepY / GEOMETRY.stepX);
  for (const route of routes) {
    assert.ok(route.y0 >= 12 && route.y0 <= 20);
    assert.ok(route.y1 - route.y0 >= 15, "Rain falls from the sky, not from a few pixels above grass");
    const ground = { x: route.x1 * GEOMETRY.width / 100, y: route.y1 * GEOMETRY.height / 100 };
    for (const sceneWidth of [320, 816]) {
      const viewport = sceneWidth + 44;
      const rx = readSize("width", viewport) * GEOMETRY.width / sceneWidth / 2 * maximumScale;
      const ry = readSize("height", viewport) * GEOMETRY.width / sceneWidth / 2 * maximumScale;
      for (let step = 0; step < 360; step++) {
        const angle = step * Math.PI / 180;
        const point = { x: ground.x + rx * Math.cos(angle), y: ground.y + ry * Math.sin(angle) };
        assert.ok(distance(point, GEOMETRY.island) < .98, "A splash must not float beyond the grass");
        assert.ok(distance(point, GEOMETRY.bed) > 1.02, "A splash must not cover a flower");
      }
    }
  }
});

test("rain phases supply a steady small shower and do not splash before their carrier lands", () => {
  const { css, routes, duration } = rainfallStyles();
  const readFrames = (name) => {
    const frames = css.match(new RegExp(`@keyframes ${name}\\s*\\{([\\s\\S]*?)\\n\\}`))[1];
    return [...frames.matchAll(/([\d.% ,]+)\{([^}]+)\}/g)].flatMap((match) => {
      const opacity = Number(match[2].match(/opacity:\s*([\d.]+)/)[1]);
      return match[1].trim().split(/,\s*/).map((percent) => ({ phase: Number(percent.replace("%", "")), opacity }));
    }).sort((first, second) => first.phase - second.phase);
  };
  const opacityAt = (points, phase) => {
    const upper = points.findIndex((point) => point.phase >= phase);
    if (upper === 0) return points[0].opacity;
    const before = points[upper - 1], after = points[upper];
    return before.opacity + (after.opacity - before.opacity) * (phase - before.phase) / (after.phase - before.phase);
  };
  const drops = readFrames("sparse-rain-drop"), splashes = readFrames("sparse-rain-splash");
  let minimum = Infinity, maximum = 0;
  for (let time = 0; time < duration; time += .01) {
    const falling = routes.filter((route) => opacityAt(drops, ((time - route.delay) % duration) / duration * 100) > .05).length;
    minimum = Math.min(minimum, falling);
    maximum = Math.max(maximum, falling);
  }
  assert.ok(minimum >= 1, "A sparse shower should not become an occasional isolated drip");
  assert.ok(maximum <= 3, "Keep simultaneous visible rain lines limited");
  for (let phase = 0; phase <= 36; phase += .1)
    assert.equal(opacityAt(splashes, phase), 0, "Only show a splash after the carrier reaches the ground");
  const routeFrames = css.match(/@keyframes sparse-rain-route\s*\{([\s\S]*?)\n\}/)[1];
  assert.match(routeFrames, /36%,\s*52%\s*\{\s*transform:\s*translate\(var\(--rain-x1\),\s*var\(--rain-y1\)\)/);
});
