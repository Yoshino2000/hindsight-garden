"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createLayout, createView, createViewSelector, GEOMETRY } = require("../garden-layout.js");
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

function landscapeSource() {
  const { readFileSync } = require("node:fs");
  const { join } = require("node:path");
  const html = readFileSync(join(__dirname, "..", "ui", "index.html"), "utf8");
  const svg = html.match(/<svg\s+class="garden-landscape"[\s\S]*?<\/svg>/);
  assert.ok(svg, "The actual scene SVG must exist");
  return svg[0];
}

// Read the checked-in RGBA atlas with Node's standard library, without a new image dependency.
function atlasPixels() {
  const { readFileSync } = require("node:fs");
  const { join } = require("node:path");
  const { inflateSync } = require("node:zlib");
  const png = readFileSync(
    join(__dirname, "..", "assets", "ambience", "swing.png"),
  );
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  assert.equal(width, height * 2);
  assert.equal(png[24], 8);
  assert.equal(png[25], 6);
  assert.equal(png[28], 0);
  const chunks = [];
  for (let offset = 8; offset < png.length; ) {
    const length = png.readUInt32BE(offset);
    if (png.toString("ascii", offset + 4, offset + 8) === "IDAT")
      chunks.push(png.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const raw = inflateSync(Buffer.concat(chunks));
  const stride = width * 4;
  const pixels = Buffer.alloc(stride * height);
  assert.equal(raw.length, (stride + 1) * height);
  const paeth = (left, up, corner) => {
    const prediction = left + up - corner;
    const a = Math.abs(prediction - left),
      b = Math.abs(prediction - up),
      c = Math.abs(prediction - corner);
    return a <= b && a <= c ? left : b <= c ? up : corner;
  };
  for (let y = 0; y < height; y++) {
    const source = y * (stride + 1);
    const target = y * stride;
    const filter = raw[source];
    assert.ok(filter <= 4);
    for (let x = 0; x < stride; x++) {
      const left = x >= 4 ? pixels[target + x - 4] : 0;
      const up = y ? pixels[target + x - stride] : 0;
      const corner = y && x >= 4 ? pixels[target + x - stride - 4] : 0;
      const prediction =
        filter === 0
          ? 0
          : filter === 1
            ? left
            : filter === 2
              ? up
              : filter === 3
                ? Math.floor((left + up) / 2)
                : paeth(left, up, corner);
      pixels[target + x] = (raw[source + x + 1] + prediction) & 255;
    }
  }
  return { width, height, alpha: (x, y) => pixels[(y * width + x) * 4 + 3] };
}

function roundedGround(svg) {
  const tokens = pathTokens(scenePath(svg, "grass-surface"));
  const polygon = [];
  let previous;
  for (let index = 0; index < tokens.length; ) {
    const command = tokens[index++];
    if (command === "M" || command === "L") {
      previous = { x: tokens[index++], y: tokens[index++] };
      polygon.push(previous);
    } else if (command === "Q") {
      const control = { x: tokens[index++], y: tokens[index++] };
      const end = { x: tokens[index++], y: tokens[index++] };
      for (let step = 1; step <= 32; step++) {
        const t = step / 32,
          other = 1 - t;
        polygon.push({
          x:
            other * other * previous.x +
            2 * other * t * control.x +
            t * t * end.x,
          y:
            other * other * previous.y +
            2 * other * t * control.y +
            t * t * end.y,
        });
      }
      previous = end;
    } else assert.equal(command, "Z");
  }
  return (point) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i],
        b = polygon[j];
      if (
        a.y > point.y !== b.y > point.y &&
        point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
      )
        inside = !inside;
    }
    return inside;
  };
}

function scenePath(svg, part) {
  const tag = svg.match(
    new RegExp(`<path\\b(?=[^>]*data-scene-part="${part}")[^>]*>`),
  );
  assert.ok(tag, `Missing scene part: ${part}`);
  return tag[0].match(/\bd="([^"]+)"/)[1];
}

function pathTokens(path) {
  return path
    .match(/[MLQZ]|-?\d+(?:\.\d+)?/g)
    .map((value) => (/^[MLQZ]$/.test(value) ? value : Number(value)));
}

function diamond(x, y, radius) {
  const rise = (radius * GEOMETRY.stepY) / GEOMETRY.stepX;
  return `M${x} ${y - rise} ${x + radius} ${y} ${x} ${y + rise} ${x - radius} ${y}Z`;
}

test("the actual SVG island and flowerbed share the plot geometry, including rounded 25-unit faces", () => {
  const svg = landscapeSource();
  assert.match(svg, new RegExp(`data-projection-x="${GEOMETRY.stepX}"`));
  assert.match(svg, new RegExp(`data-projection-y="${GEOMETRY.stepY}"`));
  const { x, y, radius, cornerCut: cut, depth } = GEOMETRY.island;
  const rise = (radius * GEOMETRY.stepY) / GEOMETRY.stepX;
  const trim = (cut * GEOMETRY.stepY) / GEOMETRY.stepX;
  const top = y - rise;
  const bottom = y + rise;
  const left = x - radius;
  const right = x + radius;
  const front = bottom - trim / 2;
  const grass =
    `M${x - cut} ${top + trim}Q${x} ${top} ${x + cut} ${top + trim}` +
    `L${right - cut} ${y - trim}Q${right} ${y} ${right - cut} ${y + trim}` +
    `L${x + cut} ${bottom - trim}Q${x} ${bottom} ${x - cut} ${bottom - trim}` +
    `L${left + cut} ${y + trim}Q${left} ${y} ${left + cut} ${y - trim}Z`;
  const leftFace =
    `M${left + cut / 2} ${y}Q${left + cut / 2} ${y + trim / 2} ${left + cut} ${y + trim}` +
    `L${x - cut} ${bottom - trim}Q${x - cut / 2} ${front} ${x} ${front}` +
    `L${x} ${front + depth}Q${x - cut / 2} ${front + depth} ${x - cut} ${bottom - trim + depth}` +
    `L${left + cut} ${y + trim + depth}Q${left + cut / 2} ${y + trim / 2 + depth} ${left + cut / 2} ${y + depth}Z`;
  const rightFace =
    `M${x} ${front}Q${x + cut / 2} ${front} ${x + cut} ${bottom - trim}` +
    `L${right - cut} ${y + trim}Q${right - cut / 2} ${y + trim / 2} ${right - cut / 2} ${y}` +
    `L${right - cut / 2} ${y + depth}Q${right - cut / 2} ${y + trim / 2 + depth} ${right - cut} ${y + trim + depth}` +
    `L${x + cut} ${bottom - trim + depth}Q${x + cut / 2} ${front + depth} ${x} ${front + depth}Z`;
  for (const [part, expected] of [
    ["grass-surface", grass],
    ["island-left-face", leftFace],
    ["island-right-face", rightFace],
    [
      "flowerbed-border",
      diamond(GEOMETRY.bed.x, GEOMETRY.bed.y, GEOMETRY.bed.radius),
    ],
    [
      "flowerbed-soil",
      diamond(GEOMETRY.bed.x, GEOMETRY.bed.y, GEOMETRY.bed.innerRadius),
    ],
  ]) {
    assert.deepEqual(
      pathTokens(scenePath(svg, part)),
      pathTokens(expected),
      part,
    );
  }
});

test("all real plot anchors and actual SVG grid endpoints stay inside parallel flowerbed edges", () => {
  const svg = landscapeSource();
  const { x, y, radius, innerRadius } = GEOMETRY.bed;
  const inside = (point, cx, cy, extent) =>
    Math.abs(point.x - cx) / extent +
      Math.abs(point.y - cy) / ((extent * GEOMETRY.stepY) / GEOMETRY.stepX) <=
    1 + 1e-10;
  const roots = createLayout(flowers(25)).plots;
  for (const root of roots)
    assert.ok(inside(root, x, y, innerRadius), `Plot ${root.x},${root.y}`);
  const numbers = scenePath(svg, "flowerbed-grid")
    .match(/-?\d+(?:\.\d+)?/g)
    .map(Number);
  assert.equal(numbers.length, 32);
  for (let index = 0; index < numbers.length; index += 4) {
    const first = { x: numbers[index], y: numbers[index + 1] };
    const second = { x: numbers[index + 2], y: numbers[index + 3] };
    assert.ok(inside(first, x, y, innerRadius));
    assert.ok(inside(second, x, y, innerRadius));
    assert.ok(
      Math.abs(
        Math.abs((second.y - first.y) / (second.x - first.x)) -
          GEOMETRY.stepY / GEOMETRY.stepX,
      ) < 1e-10,
    );
  }
  const vertices = [
    { x, y: y - (radius * GEOMETRY.stepY) / GEOMETRY.stepX },
    { x: x + radius, y },
    { x, y: y + (radius * GEOMETRY.stepY) / GEOMETRY.stepX },
    { x: x - radius, y },
  ];
  for (const point of vertices)
    assert.ok(
      inside(
        point,
        GEOMETRY.island.x,
        GEOMETRY.island.y,
        GEOMETRY.island.radius,
      ),
    );
  assert.match(svg, /clip-path="url\(#flowerbed-grid-clip\)"/);
  const clip = svg.match(
    /<clipPath id="flowerbed-grid-clip">([\s\S]*?)<\/clipPath>/,
  );
  assert.ok(clip);
  assert.deepEqual(
    pathTokens(clip[1].match(/\bd="([^"]+)"/)[1]),
    pathTokens(scenePath(svg, "flowerbed-soil")),
  );
});

test("the scene exposes two water rings, one reflection and fixed prop shadows for gentle CSS motion", () => {
  const svg = landscapeSource();
  assert.equal((svg.match(/class="pond-ripple"/g) || []).length, 2);
  assert.equal((svg.match(/class="pond-reflection"/g) || []).length, 1);
  for (const part of [
    "swing-frame-shadow",
    "watering-can-shadow",
    "little-sign-shadow",
  ]) {
    assert.match(svg, new RegExp(`data-scene-part="${part}"`));
  }
});

test("the whole pond fits on the island without crossing into the flowerbed", () => {
  const svg = landscapeSource();
  const matrix = svg.match(
    /data-scene-part="pond"[^>]*transform="matrix\(([^)]+)\)"/,
  );
  assert.ok(matrix);
  const [a, b, c, d, tx, ty] = matrix[1].trim().split(/\s+/).map(Number);
  const { stepX, stepY, island, bed } = GEOMETRY;
  const distance = (x, y, area) =>
    Math.abs(x - area.x) / area.radius +
    Math.abs(y - area.y) / ((area.radius * stepY) / stepX);
  for (const part of ["pond-shadow", "pond-rim", "pond-water"]) {
    const ellipse = svg.match(
      new RegExp(`<ellipse\\b(?=[^>]*data-scene-part="${part}")[^>]*>`),
    );
    assert.ok(ellipse, part);
    const values = Object.fromEntries(
      ["cx", "cy", "rx", "ry"].map((name) => [
        name,
        Number(ellipse[0].match(new RegExp(`\\b${name}="([-\\d.]+)"`))[1]),
      ]),
    );
    for (let index = 0; index < 360; index++) {
      const angle = (index * Math.PI) / 180;
      const localX = values.cx + values.rx * Math.cos(angle);
      const localY = values.cy + values.ry * Math.sin(angle);
      const x = a * localX + c * localY + tx;
      const y = b * localX + d * localY + ty;
      assert.ok(distance(x, y, island) <= 1, `${part} leaves the island`);
      assert.ok(distance(x, y, bed) >= 1, `${part} crosses the flowerbed`);
    }
  }
});

test("all four actual atlas feet, moving seat bottom and their contact shadows remain on the rounded grass", () => {
  const { readFileSync } = require("node:fs");
  const { join } = require("node:path");
  const svg = landscapeSource();
  const inside = roundedGround(svg);
  const clip = svg.match(
    /<clipPath id="ground-shadow-clip">([\s\S]*?)<\/clipPath>/,
  );
  assert.ok(clip);
  assert.deepEqual(
    pathTokens(clip[1].match(/\bd="([^"]+)"/)[1]),
    pathTokens(scenePath(svg, "grass-surface")),
  );
  const css = readFileSync(join(__dirname, "..", "ui", "style.css"), "utf8");
  const box = css.match(/\.ambience-swing\s*\{([^}]+)\}/)[1];
  const percent = (property) =>
    Number(box.match(new RegExp(`\\b${property}:\\s*([\\d.]+)%`))[1]) / 100;
  const left = percent("left") * GEOMETRY.width;
  const top = percent("top") * GEOMETRY.height;
  const size = percent("width") * GEOMETRY.width;
  const atlas = atlasPixels();
  const cell = atlas.height;
  const contact = (first, last, offset = 0) => {
    let bottom = -1;
    for (let y = cell - 1; y >= Math.round(cell * 0.45) && bottom < 0; y--) {
      for (let x = first; x < last; x++)
        if (atlas.alpha(x + offset, y) > 16) {
          bottom = y;
          break;
        }
    }
    assert.ok(bottom >= 0);
    const points = [];
    for (let y = bottom - 3; y <= bottom; y++) {
      for (let x = first; x < last; x++)
        if (atlas.alpha(x + offset, y) > 16) points.push({ x, y });
    }
    return points;
  };
  const world = (point) => ({
    x: left + (point.x * size) / cell,
    y: top + (point.y * size) / cell,
  });
  const regions = [
    ["left-front", 0, 0.23],
    ["left-back", 0.23, 0.43],
    ["right-front", 0.58, 0.82],
    ["right-back", 0.82, 1],
  ];
  for (const [name, start, end] of regions) {
    const points = contact(Math.round(start * cell), Math.round(end * cell));
    for (const point of points)
      assert.ok(inside(world(point)), `${name} contact pixel leaves the grass`);
    const centre = world({
      x:
        (Math.min(...points.map(({ x }) => x)) +
          Math.max(...points.map(({ x }) => x))) /
        2,
      y: Math.max(...points.map(({ y }) => y)),
    });
    const shadow = svg.match(
      new RegExp(`<ellipse\\b(?=[^>]*data-foot="${name}")[^>]*>`),
    );
    assert.ok(shadow);
    const values = Object.fromEntries(
      ["cx", "cy", "rx", "ry"].map((attribute) => [
        attribute,
        Number(shadow[0].match(new RegExp(`\\b${attribute}="([-\\d.]+)"`))[1]),
      ]),
    );
    assert.ok(
      Math.abs(values.cx - centre.x) < 0.002 &&
        Math.abs(values.cy - centre.y) < 0.002,
      `${name} shadow misses its actual atlas foot`,
    );
    for (let step = 0; step < 36; step++)
      assert.ok(
        inside({
          x: values.cx + values.rx * Math.cos((step * Math.PI) / 18),
          y: values.cy + values.ry * Math.sin((step * Math.PI) / 18),
        }),
        `${name} shadow leaves the grass`,
      );
  }
  const motion = css.match(/@keyframes garden-swing\s*\{([\s\S]*?)\n\}/);
  assert.ok(motion);
  const angles = [
    0,
    ...Array.from(motion[1].matchAll(/rotate\(([-\d.]+)deg\)/g), (match) =>
      Number(match[1]),
    ),
  ];
  const origin = css.match(
    /\.ambience-swing-seat\s*\{[^}]*transform-origin:\s*([\d.]+)%\s+([\d.]+)%/,
  );
  assert.ok(origin);
  const pivot = {
    x: (cell * Number(origin[1])) / 100,
    y: (cell * Number(origin[2])) / 100,
  };
  const seat = contact(0, cell, cell);
  for (const degrees of angles) {
    const angle = (degrees * Math.PI) / 180;
    for (const point of seat) {
      const x = point.x - pivot.x,
        y = point.y - pivot.y;
      const moved = {
        x: pivot.x + x * Math.cos(angle) - y * Math.sin(angle),
        y: pivot.y + x * Math.sin(angle) + y * Math.cos(angle),
      };
      assert.ok(
        inside(world(moved)),
        "The actual moving seat bottom leaves the grass",
      );
    }
  }
});

test("the compact seat shadow follows the real atlas plank and stays on the grass while moving or still", () => {
  const { readFileSync } = require("node:fs");
  const { join } = require("node:path");
  const css = readFileSync(join(__dirname, "..", "ui", "style.css"), "utf8");
  const swing = css.match(/\.ambience-swing\s*\{([^}]+)\}/)[1];
  const shadow = css.match(/\.ambience-swing-shadow\s*\{([^}]+)\}/)[1];
  const percent = (block, key) => Number(block.match(new RegExp(`\\b${key}:\\s*([\\d.]+)%`))[1]) / 100;
  const size = percent(swing, "width") * GEOMETRY.width;
  const width = percent(shadow, "width") * size;
  const height = percent(shadow, "height") * size;
  const left = percent(swing, "left") * GEOMETRY.width + percent(shadow, "left") * size;
  const top = percent(swing, "top") * GEOMETRY.height + percent(shadow, "top") * size;
  assert.ok(height <= size * .06, "The plank shadow must remain narrow");
  const polygon = shadow.match(/clip-path:\s*polygon\(([^)]+)\)/);
  assert.ok(polygon);
  const points = polygon[1].split(",").map((pair) => {
    const [x, y] = pair.trim().split(/\s+/).map((value) => Number(value.replace("%", "")) / 100);
    return { x: x * width, y: y * height };
  });
  assert.equal(points.length, 4, "Use one small plank rather than a broad oval");
  const frame = css.match(/@keyframes garden-swing-shadow\s*\{([\s\S]*?)\n\}/);
  assert.ok(frame);
  const transforms = Array.from(frame[1].matchAll(/transform:\s*([^;]+);/g), (match) => match[1]);
  const staticTransform = shadow.match(/transform:\s*([^;]+);/);
  assert.ok(staticTransform, "The static and reduced-motion plank needs a default ground direction");
  transforms.push(staticTransform[1]);
  const staticOverride = css.match(/\.garden-ambience\[data-enabled="false"\]\s+\.ambience-swing-shadow[^{}]*\{([^}]+)\}/);
  if (staticOverride?.[1].match(/\btransform:/)) transforms.push(staticOverride[1].match(/transform:\s*([^;]+);/)[1]);
  const atlas = atlasPixels();
  const edge = [];
  for (let x = 280; x <= 540; x += 20) {
    for (let y = atlas.height - 1; y >= 500; y--) if (atlas.alpha(atlas.height + x, y) > 16) { edge.push({ x, y }); break; }
  }
  assert.equal(edge.length, 14);
  const mean = edge.reduce((value, point) => ({ x: value.x + point.x / edge.length, y: value.y + point.y / edge.length }), { x: 0, y: 0 });
  const atlasSlope = edge.reduce((sum, point) => sum + (point.x - mean.x) * (point.y - mean.y), 0) /
    edge.reduce((sum, point) => sum + (point.x - mean.x) ** 2, 0);
  const inside = roundedGround(landscapeSource());
  for (const transform of transforms) {
    const degrees = Number(transform.match(/rotate\(([-\d.]+)deg\)/)?.[1] || 0);
    const dx = Number(transform.match(/translateX\(([-\d.]+)%\)/)?.[1] || 0) * width / 100;
    const scale = Number(transform.match(/scaleX\(([-\d.]+)\)/)?.[1] || 1);
    const angle = degrees * Math.PI / 180;
    const moved = points.map((point) => {
      const x = (point.x - width / 2) * scale, y = point.y - height / 2;
      return { x: left + width / 2 + x * Math.cos(angle) - y * Math.sin(angle) + dx,
        y: top + height / 2 + x * Math.sin(angle) + y * Math.cos(angle) };
    });
    for (const point of moved) assert.ok(inside(point), "The whole seat shadow must stay on the actual rounded ground");
    const slope = (moved[1].y - moved[0].y) / (moved[1].x - moved[0].x);
    assert.ok(slope > 0 && Math.abs(slope - atlasSlope) < .05, `Shadow slope ${slope} disagrees with the actual plank ${atlasSlope}`);
  }
});

test("the watering can has one small attached shadow and no old floating stones beside it", () => {
  const svg = landscapeSource();
  assert.doesNotMatch(svg, /cx="176" cy="389"|cx="191" cy="380"|cx="170" cy="393"|cx="180" cy="395"|cx="187" cy="385"/);
  const inside = roundedGround(svg);
  for (const [part, rootX, rootY] of [["watering-can", 164, 371], ["little-sign", 603, 298]]) {
    const group = svg.match(new RegExp(`<g\\b(?=[^>]*data-scene-part="${part}")[^>]*>([\\s\\S]*?)<\\/g>`));
    assert.ok(group);
    const matrix = group[0].match(/transform="matrix\(([^)]+)\)"/);
    const [a, b, c, d, tx, ty] = matrix[1].trim().split(/\s+/).map(Number);
    assert.equal((group[1].match(/class="scene-shadow"/g) || []).length, 1);
    const ellipse = group[1].match(/<ellipse\b[^>]*class="scene-shadow"[^>]*>/)[0];
    const values = Object.fromEntries(["cx", "cy", "rx", "ry"].map((key) => [key, Number(ellipse.match(new RegExp(`\\b${key}="([-\\d.]+)"`))[1])]));
    const dx = a * (values.cx - rootX) + c * (values.cy - rootY);
    const dy = b * (values.cx - rootX) + d * (values.cy - rootY);
    assert.ok(dx > 0 && dy > 0 && Math.abs(dy / dx - GEOMETRY.stepY / GEOMETRY.stepX) < 1e-10);
    for (let index = 0; index < 36; index++) {
      const x = values.cx + values.rx * Math.cos(index * Math.PI / 18);
      const y = values.cy + values.ry * Math.sin(index * Math.PI / 18);
      const point = { x: a * x + c * y + tx, y: b * x + d * y + ty };
      assert.ok(inside(point));
      assert.ok(Math.abs(point.x - GEOMETRY.bed.x) / GEOMETRY.bed.radius +
        Math.abs(point.y - GEOMETRY.bed.y) / (GEOMETRY.bed.radius * GEOMETRY.stepY / GEOMETRY.stepX) >= 1);
    }
    if (part === "watering-can") assert.ok(values.rx * a <= 15 && values.ry * d <= 3.5);
  }
});

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
    assert.ok(plot.x >= 185 && plot.x <= 815);
    assert.ok(plot.y >= 270 && plot.y <= 630);
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
  assert.equal(single.plots[0].y, 450);
  assert.equal(single.plots[0].z, 4);
  const small = createLayout(flowers(8));
  assert.equal(small.plots.length, 8);
  assert.deepEqual(
    small.plots.map(({ x, y }) => [x, y]),
    [
      [500, 450],
      [578.75, 405],
      [421.25, 405],
      [578.75, 495],
      [421.25, 495],
      [657.5, 360],
      [500, 360],
      [342.5, 360],
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

test("collections retain every valid flower beyond the old 200-plant limit", () => {
  const layout = createLayout(flowers(250).reverse(), 100);
  assert.equal(layout.total, 250);
  assert.equal(layout.pageCount, 10);
  assert.equal(layout.page, 9);
  assert.equal(layout.plots.length, 25);
  assert.equal(layout.plots[0].plant.id, "plant-225");
  assert.equal(layout.plots[24].plant.id, "plant-249");
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
      count: 0, current: true, targetMs: 0, speciesCount: 0,
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

test("weekly review assigns completed goals and species to the bloom week without inventing daily activity", () => {
  const plants = [
    { ...bloomed("cross-week", localAt(2026, 9, 1), localAt(2026, 10, 20)), species: "rose", targetMs: 3600000,
      progressMs: 3600000, taskNote: "读完一章", rules: [{ type: "app", value: "editor" }] },
    { ...bloomed("same-week", localAt(2026, 10, 21), localAt(2026, 10, 21)), species: "daisy", targetMs: 1800000 },
    { ...bloomed("earlier", localAt(2026, 10, 2), localAt(2026, 10, 10)), species: "rose", targetMs: 60000 },
  ];
  const before = structuredClone(plants);
  const view = createView(plants, { mode: "week", week: "2026-10-19", now: localAt(2026, 10, 25) });
  assert.deepEqual(view.review, {
    count: 2, speciesCount: 2, targetMs: 5400000,
    species: [{ id: "daisy", count: 1, targetMs: 1800000 }, { id: "rose", count: 1, targetMs: 3600000 }],
  });
  assert.deepEqual(view.weeks.map(({ key, targetMs, speciesCount }) => ({ key, targetMs, speciesCount })), [
    { key: "2026-10-19", targetMs: 5400000, speciesCount: 2 },
    { key: "2026-10-05", targetMs: 60000, speciesCount: 1 },
  ]);
  assert.equal(Object.hasOwn(view.review, "daily"), false);
  assert.equal(Object.hasOwn(view.review, "rules"), false);
  assert.equal(Object.hasOwn(view.review, "taskNote"), false);
  assert.deepEqual(plants, before);
  const all = createView(plants, { mode: "all", now: localAt(2026, 10, 25) });
  assert.equal(all.review.count, 3);
  assert.equal(all.review.speciesCount, 2);
  assert.equal(all.review.targetMs, 5460000);
  assert.deepEqual(createView(plants, { mode: "week", week: "2026-10-12", now: localAt(2026, 10, 25) }).review,
    { count: 0, speciesCount: 0, targetMs: 0, species: [] });
});

test("review keeps flower counts but never guesses missing or malformed goal durations from legacy metadata", () => {
  const now = localAt(2026, 10, 25);
  const invalid = [undefined, null, "60000", NaN, Infinity, -60000, 0, 60001, 30000, 86460000, Number.MAX_SAFE_INTEGER];
  const plants = invalid.map((targetMs, index) => ({
    ...bloomed(`legacy-${index}`, index, now), targetMs, progressMs: 60000, note: "完成30分钟",
  }));
  plants.push({ ...bloomed("good", 100, now), species: "rose", targetMs: 86400000 });
  plants.push({ ...bloomed("missing-species", 101, now), species: undefined, targetMs: 60000 });
  const view = createView(plants, { mode: "week", now });
  assert.equal(view.review.count, invalid.length + 2);
  assert.equal(view.review.targetMs, 86460000);
  assert.equal(view.review.speciesCount, 2);
  assert.deepEqual(view.review.species, [
    { id: "daisy", count: invalid.length, targetMs: 0 },
    { id: "rose", count: 1, targetMs: 86400000 },
  ]);
  assert.equal(view.weeks[0].targetMs, 86460000);
});

test("review respects the local Monday boundary and deduplication independently of the selected garden page", () => {
  const now = localAt(2026, 10, 26, 0);
  const plants = [
    { ...bloomed("sunday", 0, localAt(2026, 10, 25, 23, 59, 59, 999)), species: "rose", targetMs: 60000 },
    { ...bloomed("monday", 1, now), species: "daisy", targetMs: 120000 },
    { ...bloomed("monday", 2, now), species: "lily", targetMs: 180000 },
  ];
  const view = createView(plants, { mode: "week", now, page: 999 });
  assert.deepEqual(view.review, { count: 1, speciesCount: 1, targetMs: 120000,
    species: [{ id: "daisy", count: 1, targetMs: 120000 }] });
  assert.equal(view.weeks.find(({ key }) => key === "2026-10-19").targetMs, 60000);
  assert.equal(view.weeks.find(({ key }) => key === "2026-10-26").targetMs, 120000);
  const large = flowers(5001).map((plant, index) => ({ ...plant, bloomAt: now,
    species: index % 2 ? "rose" : "daisy", targetMs: 60000 }));
  const last = createView(large, { mode: "week", now, page: 200 });
  assert.equal(last.layout.plots.length, 1);
  assert.equal(last.review.count, 5001);
  assert.equal(last.review.targetMs, 5001 * 60000);
  assert.equal(last.review.speciesCount, 2);
  assert.deepEqual(last.review.species, [
    { id: "daisy", count: 2501, targetMs: 2501 * 60000 },
    { id: "rose", count: 2500, targetMs: 2500 * 60000 },
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

test("view deduplicates globally without truncating flowers or mutating the source", () => {
  const now = localAt(2026, 10, 21);
  const plants = flowers(205).map((plant) => ({ ...plant, bloomAt: now }));
  plants.unshift({ ...plants[0], name: "duplicate", createdAt: 1000000, bloomAt: localAt(2026, 10, 7) });
  plants.push({ id: "bad", createdAt: -1, bloomAt: now });
  const snapshot = structuredClone(plants);
  const view = createView(plants, { mode: "week", now, page: 99 });
  assert.equal(view.total, 205);
  assert.equal(view.layout.total, 205);
  assert.equal(view.gardens.length, 9);
  assert.equal(view.weeks.length, 1);
  assert.equal(view.weeks[0].count, 205);
  assert.equal(view.gardens[0].plots[0].plant.name, "小花0");
  assert.deepEqual(plants, snapshot);
});

test("large collections only build twelve album previews at a time without hiding any garden", () => {
  const now = localAt(2026, 10, 21);
  const plants = flowers(5001).map((plant) => ({ ...plant, bloomAt: now }));
  const first = createView(plants, { now });
  assert.equal(first.total, 5001);
  assert.equal(first.layout.pageCount, 201);
  assert.equal(first.gardens.length, 12);
  assert.equal(first.albumPageCount, 17);
  assert.equal(first.albumStart, 0);
  const next = createView(plants, { now, page: 12 });
  assert.equal(next.albumStart, 12);
  assert.equal(next.gardens[0].page, 12);
  assert.equal(next.gardens[0].plots[0].plant.id, "plant-300");
  const last = createView(plants, { now, page: 99999 });
  assert.equal(last.layout.page, 200);
  assert.equal(last.layout.plots.length, 1);
  assert.equal(last.layout.plots[0].plant.id, "plant-5000");
  assert.equal(last.albumPage, 16);
  assert.equal(last.albumStart, 192);
  assert.equal(last.gardens.length, 9);
  const seen = new Set();
  for (let page = 0; page < 201; page += 12) {
    for (const garden of createView(plants, { now, page }).gardens) {
      for (const { plant } of garden.plots) seen.add(plant.id);
    }
  }
  assert.equal(seen.size, 5001);
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

test("an immutable archive selector reuses a view without reading any archive entries on a hit", () => {
  const plants = Object.freeze(flowers(5001).map((plant) => Object.freeze({
    ...plant, bloomAt: localAt(2026, 10, 25), targetMs: 60000,
  })));
  let reads = 0;
  const archive = new Proxy(plants, { get(target, property, receiver) {
    reads++;
    return Reflect.get(target, property, receiver);
  } });
  const select = createViewSelector();
  const first = select(archive, { mode: "week", now: localAt(2026, 10, 25), page: 200 });
  const before = reads;
  const again = select(archive, { mode: "week", now: localAt(2026, 10, 25, 23), page: "200" });
  assert.strictEqual(again, first);
  assert.equal(reads, before, "A polling cache hit must not inspect length, filter, ids or records");
  assert.equal(again.total, 5001);
  assert.deepEqual(again.layout.plots.map(({ plant }) => plant.id), ["plant-5000"]);
});

test("a replaced archive invalidates the selector even when ids and length are unchanged", () => {
  const now = localAt(2026, 10, 25);
  const plants = Object.freeze([Object.freeze({ ...bloomed("same", now - 60000, now), targetMs: 60000 })]);
  const select = createViewSelector();
  const first = select(plants, { mode: "week", now });
  const changed = Object.freeze([Object.freeze({ ...plants[0], name: "A new name", taskNote: "New memory", variant: "hidden" })]);
  const next = select(changed, { mode: "week", now });
  assert.notStrictEqual(next, first);
  assert.equal(next.layout.plots[0].plant.name, "A new name");
  assert.equal(next.layout.plots[0].plant.taskNote, "New memory");
  assert.equal(next.layout.plots[0].plant.variant, "hidden");
  assert.deepEqual(next, createView(changed, { mode: "week", now }));
  assert.notStrictEqual(createView(changed, { now }), createView(changed, { now }),
    "The original API remains uncached");
});

test("selector pages, scope changes and selected empty weeks retain ordinary view semantics", () => {
  const now = localAt(2026, 10, 25);
  const plants = Object.freeze(flowers(61).map((plant, index) => Object.freeze({
    ...plant, bloomAt: index < 51 ? now : localAt(2026, 10, 15), targetMs: 60000,
  })));
  const select = createViewSelector();
  let previous;
  for (const options of [
    { mode: "week", week: "2026-10-19", page: 0, now },
    { mode: "week", week: "2026-10-19", page: 1, now },
    { mode: "week", week: "2026-10-12", page: 0, now },
    { mode: "week", week: "9999-12-27", page: 0, now },
    { mode: "all", week: "9999-12-27", page: 2, now },
    { mode: "week", week: "2026-10-12", page: -8, now },
  ]) {
    const view = select(plants, options);
    assert.deepEqual(view, createView(plants, options));
    assert.notStrictEqual(view, previous);
    assert.strictEqual(select(plants, { ...options, now: now + 1000 }), view);
    previous = view;
  }
});

test("selector current-week markers refresh across midnight even with a fixed selected empty week", () => {
  const plants = Object.freeze([]);
  const select = createViewSelector();
  const options = { mode: "week", week: "9999-12-27" };
  const before = select(plants, { ...options, now: localAt(2026, 10, 25, 23, 59, 59, 999) });
  const afterOptions = { ...options, now: localAt(2026, 10, 26, 0) };
  const after = select(plants, afterOptions);
  assert.notStrictEqual(after, before);
  assert.equal(before.weeks.find((week) => week.current).key, "2026-10-19");
  assert.equal(after.weeks.find((week) => week.current).key, "2026-10-26");
  assert.equal(after.week, "9999-12-27");
  assert.equal(after.layout.total, 0);
  assert.deepEqual(after, createView(plants, afterOptions));
});

test("selector invalidates on timezone changes, including two zones sharing the same current offset", () => {
  const modulePath = require.resolve("../garden-layout.js");
  const source = `
    const assert = require("node:assert/strict");
    const { createView, createViewSelector } = require(${JSON.stringify(modulePath)});
    const plants = Object.freeze([{ id: "boundary", createdAt: 0, bloomAt: Date.UTC(2026, 9, 25, 23, 30) }]);
    const options = { mode: "week", now: Date.UTC(2026, 9, 26, 12) };
    const select = createViewSelector();
    const utc = select(plants, options);
    const offset = new Date(options.now).getTimezoneOffset();
    process.env.TZ = "Africa/Abidjan";
    assert.equal(new Date(options.now).getTimezoneOffset(), offset);
    const otherUtc = select(plants, options);
    assert.notStrictEqual(otherUtc, utc);
    assert.deepEqual(otherUtc, createView(plants, options));
    process.env.TZ = "Asia/Shanghai";
    const shanghai = select(plants, options);
    assert.notStrictEqual(shanghai, otherUtc);
    assert.equal(utc.layout.total, 0);
    assert.equal(shanghai.layout.total, 1);
    assert.deepEqual(shanghai, createView(plants, options));
  `;
  const result = spawnSync(process.execPath, ["-e", source], {
    env: { ...process.env, TZ: "UTC" }, encoding: "utf8", timeout: 10000,
  });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
});
