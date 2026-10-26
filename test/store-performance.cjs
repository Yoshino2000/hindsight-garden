// Optional, reproducible CPU/SQLite benchmark. No timing assertions and no personal data.
// Run: node test/store-performance.cjs
"use strict";
const { DatabaseSync } = require("node:sqlite");
const { performance } = require("node:perf_hooks");
require("../core.js");
const { createStore } = require("../store.js");

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return Number(sorted[Math.floor(sorted.length / 2)].toFixed(3));
}
async function measured(action) {
  const start = performance.now();
  const value = await action();
  return { value, elapsed: performance.now() - start };
}
async function benchmark(count) {
  const db = new DatabaseSync(":memory:");
  let archiveReads = 0;
  const host = async (method, params) => {
    if (/FROM garden_plants/.test(params.sql)) archiveReads++;
    const statement = db.prepare(params.sql);
    return method === "db.query" ? statement.all(...params.params) : statement.run(...params.params);
  };
  try {
    const initial = createStore(host);
    await initial.load();
    const insert = db.prepare("INSERT INTO garden_plants VALUES (?, ?)");
    db.exec("BEGIN");
    for (let index = 0; index < count; index++) {
      const flower = { id: "bench-" + String(index).padStart(6, "0"), name: "合成花朵" + index,
        species: "daisy", createdAt: index, bloomAt: index + 60000, targetMs: 60000, progressMs: 60000,
        taskNote: "合成演示元数据".repeat(20), legacy: { tags: ["演示", "无个人信息"] } };
      insert.run(flower.id, JSON.stringify(flower));
    }
    db.exec("COMMIT");
    const mutable = createStore(host);
    const readonly = createStore(host, { readonlyArchive: true });
    const coldMutable = await measured(() => mutable.load());
    const coldReadonly = await measured(() => readonly.load());
    const ordinaryTimes = [];
    const readonlyTimes = [];
    for (let sample = 0; sample < 12; sample++) {
      ordinaryTimes.push((await measured(() => mutable.load())).elapsed);
      const result = await measured(() => readonly.load());
      readonlyTimes.push(result.elapsed);
      if (result.value.garden !== coldReadonly.value.garden) throw new Error("Readonly identity changed");
    }
    const archiveBytes = db.prepare("SELECT SUM(length(CAST(value AS BLOB))) AS bytes FROM garden_plants").get().bytes;
    await initial.apply({ type: "boot", sessionId: "benchmark" }, 0);
    await initial.apply({ type: "plant", id: "active-benchmark", plant: { name: "基准盆栽", species: "daisy",
      targetMinutes: 1440, rules: [{ type: "app", value: "reader" }] } }, 0);
    await initial.apply({ type: "focus", sessionId: "benchmark", event: { app: "reader" } }, 0);
    const ticks = [];
    archiveReads = 0;
    for (let sample = 1; sample <= 64; sample++)
      ticks.push((await measured(() => initial.apply({ type: "tick", sessionId: "benchmark" }, sample * 2000))).elapsed);
    return { flowers: count, archiveBytes, cachedSamplesPerMode: 12, tickSamples: 64,
      coldArchiveCacheMs: { mutable: Number(coldMutable.elapsed.toFixed(3)), readonly: Number(coldReadonly.elapsed.toFixed(3)) },
      cachedLoadMedianMs: { mutable: median(ordinaryTimes), readonly: median(readonlyTimes) },
      tickMedianMs: median(ticks), tickArchiveReads: archiveReads,
      readonlyReferenceStable: true, readonlyFrozen: Object.isFrozen(coldReadonly.value.garden) };
  } finally { db.close(); }
}
(async () => {
  const results = [];
  for (const count of [5000, 20000]) results.push(await benchmark(count));
  process.stdout.write(JSON.stringify({ node: process.version, platform: process.platform,
    scope: "Synthetic in-memory Node SQLite, one active pot and no saved plans; excludes native bridge latency, disk and UI rendering", results }, null, 2) + "\n");
})().catch((error) => { process.stderr.write(String(error.stack || error)); process.exitCode = 1; });
