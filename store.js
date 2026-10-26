// Hot state is one small CAS row. Mature flowers live in their own rows; a persistent trigger
// applies their deltas in the SAME SQLite statement as the state update, including old-data migration.
(function (root) {
  "use strict";

  const ROW_BYTES = 220000;
  const PAGE_ROWS = 200;
  const RESULT_BYTES = 4000000;
  // SQLite accepts at most 1000 JSON container levels. The existing hot delta adds
  // three around each record: state object, _archive object and upserts array.
  const ARCHIVE_JSON_DEPTH = 997;
  const DEEP_ARCHIVE_ERROR = "这条旧收藏的额外数据嵌套过深，暂时只能查看或移除，无法改名或编辑备注；原始记录已保留。";
  const ARCHIVE_PAGE = "WITH batch AS (SELECT id, value FROM garden_plants WHERE id > ? ORDER BY id LIMIT ?), sized AS (SELECT id, value, SUM(length(CAST(value AS BLOB)) + length(CAST(id AS BLOB)) + 128) OVER (ORDER BY id) AS bytes, ROW_NUMBER() OVER (ORDER BY id) AS item FROM batch) SELECT id, value FROM sized WHERE bytes <= ? OR item = 1 ORDER BY id";
  const TABLES = [
    "CREATE TABLE IF NOT EXISTS garden_store (key TEXT PRIMARY KEY, value TEXT NOT NULL, version INTEGER NOT NULL)",
    // Keep schema-2 archive compatibility, but reject an older runtime that would strip the new
    // hot metadata. The guard persists in SQLite after this page/worker closes and aborts the
    // complete statement before any archive delta can run. Our own json_remove(_archive) keeps
    // these fields and remains valid with either recursive_triggers setting.
    "CREATE TRIGGER IF NOT EXISTS garden_require_features_v1 BEFORE UPDATE OF value ON garden_store WHEN OLD.key = 'state' AND NEW.key = 'state' AND json_type(OLD.value, '$.collection') = 'object' AND json_type(OLD.value, '$.plans') = 'array' AND json_type(OLD.value, '$.earnedAchievements') = 'object' AND (json_type(NEW.value, '$.collection') IS NOT 'object' OR json_type(NEW.value, '$.plans') IS NOT 'array' OR json_type(NEW.value, '$.earnedAchievements') IS NOT 'object') BEGIN SELECT RAISE(ABORT, '此版本的时光花园已过期，已阻止写入以保留种植方案、任务记忆和收藏成就。请关闭旧版本窗口并重新打开最新版。'); END",
    "CREATE TRIGGER IF NOT EXISTS garden_require_focus_stats_v1 BEFORE UPDATE OF value ON garden_store WHEN OLD.key = 'state' AND NEW.key = 'state' AND json_type(OLD.value, '$.focusStats') = 'object' AND json_type(NEW.value, '$.focusStats') IS NOT 'object' BEGIN SELECT RAISE(ABORT, '此版本的时光花园已过期，已阻止写入以保留有效生长统计。请关闭旧版本窗口并重新打开最新版。'); END",
    "CREATE TRIGGER IF NOT EXISTS garden_require_variants_v1 BEFORE UPDATE OF value ON garden_store WHEN OLD.key = 'state' AND NEW.key = 'state' AND ((json_type(OLD.value, '$.hiddenCollection') = 'object' AND json_type(NEW.value, '$.hiddenCollection') IS NOT 'object') OR (json_type(OLD.value, '$.active.variantRoll') IN ('integer', 'real') AND json_extract(OLD.value, '$.active.id') = json_extract(NEW.value, '$.active.id') AND json_extract(NEW.value, '$.active.variantRoll') IS NOT json_extract(OLD.value, '$.active.variantRoll'))) BEGIN SELECT RAISE(ABORT, '此版本的时光花园已过期或尝试修改已保存的隐藏配色随机签，已阻止写入以保留数据。请关闭旧版本窗口并重新打开最新版。'); END",
    "CREATE TABLE IF NOT EXISTS garden_plants (id TEXT PRIMARY KEY, value TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS garden_archive_meta (key TEXT PRIMARY KEY, version INTEGER NOT NULL)",
    "INSERT OR IGNORE INTO garden_archive_meta (key, version) VALUES ('archive', 0)",
    ...["INSERT", "UPDATE", "DELETE"].map((action) =>
      "CREATE TRIGGER IF NOT EXISTS garden_archive_" + action.toLowerCase() + " AFTER " + action + " ON garden_plants BEGIN UPDATE garden_archive_meta SET version = version + 1 WHERE key = 'archive'; END",
    ),
    // These are ordinary main-database triggers, allowed by Hindsight's SQLite authorizer.
    // json_each reads the old garden directly: migration never binds a second giant state string.
    "CREATE TRIGGER IF NOT EXISTS garden_commit_v2 AFTER UPDATE OF value ON garden_store WHEN NEW.key = 'state' AND json_extract(NEW.value, '$.schema') = 2 AND (json_extract(OLD.value, '$.schema') = 1 OR json_type(NEW.value, '$._archive') = 'object') BEGIN INSERT INTO garden_plants (id, value) SELECT json_extract(value, '$.id'), value FROM json_each(OLD.value, '$.garden') WHERE json_extract(OLD.value, '$.schema') = 1; INSERT INTO garden_plants (id, value) SELECT json_extract(value, '$.id'), value FROM json_each(NEW.value, '$._archive.upserts') WHERE 1 ON CONFLICT(id) DO UPDATE SET value = excluded.value; DELETE FROM garden_plants WHERE id IN (SELECT value FROM json_each(NEW.value, '$._archive.deleted')); UPDATE garden_store SET value = json_remove(NEW.value, '$._archive') WHERE key = NEW.key AND version = NEW.version; END",
  ];

  // Archive values have already been parsed as JSON. Copy their plain objects/arrays
  // iteratively so unusually deep legacy metadata cannot overflow the JS call stack.
  function clone(value) {
    const result = Array.isArray(value) ? [] : {};
    const copies = new WeakMap([[value, result]]);
    const pending = [[value, result]];
    while (pending.length) {
      const [source, target] = pending.pop();
      for (const key of Object.keys(source)) {
        const item = source[key];
        let copy = item;
        if (item && typeof item === "object") {
          copy = copies.get(item);
          if (!copy) {
            copy = Array.isArray(item) ? [] : {};
            copies.set(item, copy);
            pending.push([item, copy]);
          }
        }
        if (key === "__proto__") Object.defineProperty(target, key, { value: copy, enumerable: true, writable: true, configurable: true });
        else target[key] = copy;
      }
    }
    return result;
  }
  function freezeTree(value) {
    const pending = [value];
    const seen = new WeakSet();
    while (pending.length) {
      const item = pending.pop();
      if (!item || typeof item !== "object" || seen.has(item)) continue;
      seen.add(item);
      for (const child of Object.values(item)) if (child && typeof child === "object") pending.push(child);
      Object.freeze(item);
    }
    return value;
  }
  function archiveJson(value) {
    const pending = [[value, 1]];
    while (pending.length) {
      const [item, depth] = pending.pop();
      if (!item || typeof item !== "object") continue;
      if (depth > ARCHIVE_JSON_DEPTH) throw new Error(DEEP_ARCHIVE_ERROR);
      for (const child of Object.values(item))
        if (child && typeof child === "object") pending.push([child, depth + 1]);
    }
    try { return JSON.stringify(value); }
    catch (error) {
      if (error instanceof RangeError) throw new Error(DEEP_ARCHIVE_ERROR);
      throw error;
    }
  }
  function bytes(value) { return new TextEncoder().encode(value).length; }

  function createStore(hostCall, options = {}) {
    if (typeof hostCall !== "function") throw new Error("请在 Hindsight 中打开时光花园。");
    const timeoutMs = options.timeoutMs || 8000;
    const readonlyArchive = options.readonlyArchive === true;
    const random = options.random === undefined ? Math.random : options.random;
    if (typeof random !== "function") throw new Error("隐藏配色随机来源不正确。");
    let readyPromise;
    let archiveCache = null;
    let activeRollCandidate = null;
    let bootClaim = null;

    function drawRoll() {
      const roll = random();
      root.GardenCore.variantFromRoll(roll);
      return roll;
    }

    function withActiveRoll(state) {
      if (!state.active || state.active.variantRoll !== undefined) {
        activeRollCandidate = null;
        return state;
      }
      // An old growing pot receives one candidate during migration. A lost CAS always
      // rereads the winner's persisted ticket instead of drawing again on the next tick.
      if (activeRollCandidate?.id !== state.active.id)
        activeRollCandidate = { id: state.active.id, roll: drawRoll() };
      return { ...state, active: { ...state.active, variantRoll: activeRollCandidate.roll } };
    }

    function call(method, params) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("连接 Hindsight 超时，已暂停计时；请重新打开插件检查。")), timeoutMs);
        Promise.resolve().then(() => hostCall(method, params)).then(
          (value) => { clearTimeout(timer); resolve(value); },
          (error) => {
            clearTimeout(timer);
            const message = String(error?.message || error);
            if (/database or disk is full|SQLITE_FULL/i.test(message + " " + String(error?.code || ""))) {
              reject(new Error("花园存储空间不足，已有记录已保留，本次操作未完成。"));
            } else {
              reject(error instanceof Error ? error : new Error(message));
            }
          },
        );
      });
    }

    function ready() {
      if (!readyPromise) {
        readyPromise = (async () => {
          for (const sql of TABLES) await call("db.execute", { sql, params: [] });
        })().catch((error) => { readyPromise = null; throw error; });
      }
      return readyPromise;
    }

    function rows(value) {
      if (!Array.isArray(value)) throw new Error("花园存储返回了无法识别的数据，已停止写入。");
      return value;
    }

    async function readStored() {
      await ready();
      const result = rows(await call("db.query", {
        sql: "SELECT s.value, s.version, m.version AS archiveVersion FROM garden_archive_meta AS m LEFT JOIN garden_store AS s ON s.key = ? WHERE m.key = ?",
        params: ["state", "archive"],
      }));
      if (result.length !== 1 || !Number.isSafeInteger(result[0].archiveVersion) || result[0].archiveVersion < 0)
        throw new Error("花园归档版本损坏，请保留数据并检查。");
      const row = result[0];
      if (row.value === null && row.version === null) {
        return { state: root.GardenCore.initialState(), version: null, archiveVersion: row.archiveVersion, legacy: false };
      }
      if (!Number.isSafeInteger(row.version) || row.version < 0)
        throw new Error("花园存储版本损坏，请保留数据并检查。");
      let value;
      try { value = JSON.parse(row.value); }
      catch (_) { throw new Error("花园数据损坏，已停止写入以保留原数据。"); }
      if (!value || ![1, 2].includes(value.schema) || !Array.isArray(value.garden))
        throw new Error("花园数据格式或版本不支持，请保留数据，勿覆盖。");
      if (value.schema === 2 && (value.garden.length || Object.hasOwn(value, "_archive")))
        throw new Error("花园归档状态不完整，请保留数据并检查。");
      return { state: root.GardenCore.normalizeState(value), version: row.version,
        archiveVersion: row.archiveVersion, legacy: value.schema === 1 };
    }

    async function commit(state, saved, delta = { upserts: [], deleted: [] }) {
      if (saved.version !== null && !Number.isSafeInteger(saved.version + 1))
        throw new Error("花园存储版本已到上限，已有记录已保留，请备份后检查。");
      const archiveChanges = delta.upserts.length + delta.deleted.length + (saved.legacy ? saved.state.garden.length : 0);
      if (!Number.isSafeInteger(saved.archiveVersion + archiveChanges))
        throw new Error("花园归档版本已到上限，已有记录已保留，请备份后检查。");
      const hot = { ...state, schema: 2, garden: [] };
      if (delta.upserts.length || delta.deleted.length) hot._archive = delta;
      const json = JSON.stringify(hot);
      if (bytes(json) > ROW_BYTES) throw new Error("单条花园状态超出存储接口限制，已保留原数据。");
      const result = saved.version === null
        ? await call("db.execute", {
            sql: "INSERT OR IGNORE INTO garden_store (key, value, version) SELECT ?, ?, 0 WHERE (SELECT version FROM garden_archive_meta WHERE key = 'archive') = ?",
            params: ["state", json, saved.archiveVersion],
          })
        : await call("db.execute", {
            sql: "UPDATE garden_store SET value = ?, version = version + 1 WHERE key = ? AND version = ? AND (SELECT version FROM garden_archive_meta WHERE key = 'archive') = ?",
            params: [json, "state", saved.version, saved.archiveVersion],
          });
      return result.changes === 1;
    }

    async function readHot(captureBootOrigin) {
      for (let attempt = 0; attempt < 8; attempt++) {
        const saved = await readStored();
        if (captureBootOrigin && bootClaim?.id !== captureBootOrigin)
          bootClaim = { id: captureBootOrigin, previous: saved.state.sessionId };
        if (saved.version === null) {
          // Establish the hot row before any delta: archive changes always use the UPDATE trigger.
          await commit(withActiveRoll(await withArchiveCollection(saved.state)), saved);
          continue;
        }
        if (saved.legacy) {
          // CAS + trigger is an atomic migration. The lifetime baseline is committed with it.
          const state = root.GardenCore.initializeCollection(saved.state, saved.state.garden.length,
            saved.state.garden.map((plant) => plant.species), Date.now());
          await commit(withActiveRoll({ ...state, garden: [] }), saved);
          continue;
        }
        if (saved.state.collection !== null) {
          let state = saved.state;
          // Catalog-only upgrades reuse lifetime counters. No archive scan and no rewriting
          // earlier award dates; the CAS also preserves concurrent page and worker changes.
          if (state.achievementRevision < root.GardenCore.ACHIEVEMENT_REVISION || state.focusStats === null || state.hiddenCollection === null)
            state = root.GardenCore.refreshAchievements(state, Date.now());
          state = withActiveRoll(state);
          if (state === saved.state) return saved;
          await commit(state, saved);
          continue;
        }
        // Pre-0.11 schema-2 data already has a separate archive. Count it once, guarded by the
        // SAME archive revision as the hot-row CAS, rather than scanning it on every worker tick.
        await commit(withActiveRoll(await withArchiveCollection(saved.state)), saved);
      }
      throw new Error("花园升级正遇到并发更新，请稍后重试。");
    }

    async function withArchiveCollection(state) {
      const summary = rows(await call("db.query", {
        sql: "SELECT json_extract(value, '$.species') AS species, COUNT(*) AS count FROM garden_plants GROUP BY json_extract(value, '$.species') LIMIT 9",
        params: [],
      }));
      if (summary.length > root.GardenCore.SPECIES.length || summary.some((item) =>
        typeof item.species !== "string" || !Number.isSafeInteger(item.count) || item.count < 1))
        throw new Error("无法核验收藏成就，已保留原数据。");
      return root.GardenCore.initializeCollection(state,
        summary.reduce((total, item) => total + item.count, 0),
        summary.map((item) => item.species), Date.now());
    }

    function readFlower(row) {
      if (!row || typeof row.id !== "string" || typeof row.value !== "string" || bytes(row.value) > ROW_BYTES)
        throw new Error("花园中有无法读取的收藏记录，请保留原数据。");
      let value;
      try { value = JSON.parse(row.value); }
      catch (_) { throw new Error("花园收藏数据损坏，已停止写入。"); }
      const valid = root.GardenCore.normalizeFlower(value);
      if (valid.id !== row.id) throw new Error("花园收藏标识不一致，请保留原数据。");
      // Preserve any older extra metadata; validation never turns migration into data pruning.
      return { ...value, ...valid };
    }

    async function findFlower(id) {
      const result = rows(await call("db.query", {
        sql: "SELECT id, value FROM garden_plants WHERE id = ?", params: [id],
      }));
      if (result.length > 1) throw new Error("花园收藏标识重复。");
      return result.length ? readFlower(result[0]) : null;
    }

    async function load() {
      for (let attempt = 0; attempt < 5; attempt++) {
        const first = await readHot();
        if (archiveCache && archiveCache.revision === first.archiveVersion) {
          if (first.state.active && archiveCache.ids.has(first.state.active.id)) throw new Error("花园植物标识重复。");
          return { ...first.state, garden: readonlyArchive ? archiveCache.plants : clone(archiveCache.plants) };
        }
        const plants = [];
        const ids = new Set();
        let cursor = "";
        while (true) {
          // Bound both rows and approximate encoded JSON bytes; even unusually large legacy
          // metadata cannot make a page exceed Hindsight's 10 MB response limit.
          const batch = rows(await call("db.query", {
            sql: ARCHIVE_PAGE, params: [cursor, PAGE_ROWS, RESULT_BYTES],
          }));
          if (!batch.length) break;
          for (const row of batch) {
            const plant = readFlower(row);
            if (ids.has(plant.id)) throw new Error("花园收藏分页返回了重复记录。");
            ids.add(plant.id);
            plants.push(plant);
          }
          cursor = batch[batch.length - 1].id;
        }
        const latest = await readHot();
        if (latest.archiveVersion !== first.archiveVersion) continue;
        if (latest.state.active && ids.has(latest.state.active.id)) throw new Error("花园植物标识重复。");
        // Another overlapping load may already have published this same revision.
        if (archiveCache?.revision === latest.archiveVersion)
          return { ...latest.state, garden: readonlyArchive ? archiveCache.plants : clone(archiveCache.plants) };
        archiveCache = { revision: latest.archiveVersion, plants: readonlyArchive ? freezeTree(plants) : plants, ids };
        return { ...latest.state, garden: readonlyArchive ? archiveCache.plants : clone(plants) };
      }
      throw new Error("花园收藏正在频繁变化，请稍后重试。");
    }

    async function apply(input, now = Date.now()) {
      // Retry the same instant. Background ticks only read the small hot state; page edits read
      // at most the one flower they change. Successful results are intentionally partial.
      let plantRoll;
      for (let attempt = 0; attempt < 8; attempt++) {
        const saved = await readHot(input?.type === "boot" && input.recoverSessionId === undefined ? input.sessionId : null);
        const state = saved.state;
        let existing = null;
        if (["rename", "delete", "note"].includes(input?.type) && state.active?.id !== input.id) {
          existing = await findFlower(input.id);
          if (existing) state.garden = [existing];
        }
        // Only the store supplies new lottery tickets; UI-supplied roll fields are ignored.
        // One request keeps the same candidate through every failed CAS attempt.
        let action = input?.type === "plant" ? { ...input, variantRoll: plantRoll } : input;
        // The first read fixes which former owner this instance intended to replace. A
        // recovery may retry that claim or its own acknowledged/lost-ack claim, never a later
        // worker's session. Keep this token in memory, outside persisted garden state.
        if (input?.type === "boot" && input.recoverSessionId !== undefined && bootClaim?.id === input.sessionId)
          action = { ...input, expectedPreviousSessionId: bootClaim.previous };
        const result = root.GardenCore.reduce(state, action, now);
        if (result.ignored) return { ...result, partial: true };
        if (input.type === "plant" && await findFlower(result.state.active.id)) throw new Error("植物标识重复。");
        if (input.type === "plant" && plantRoll === undefined) {
          plantRoll = drawRoll();
          result.state.active.variantRoll = plantRoll;
        }
        const upserts = [];
        for (const value of result.state.garden) {
          const plant = existing?.id === value.id ? { ...existing, ...value } : value;
          const json = archiveJson(plant);
          if (existing && json === archiveJson(existing)) continue;
          if (bytes(json) > ROW_BYTES) throw new Error("单株收藏记录超出存储接口限制，已保留原数据。");
          upserts.push(plant);
        }
        const deleted = existing && !result.state.garden.some((plant) => plant.id === existing.id) ? [existing.id] : [];
        if (await commit(result.state, saved, { upserts, deleted })) return { ...result, partial: true };
      }
      throw new Error("花园正被其他窗口更新，请稍后重试。");
    }

    return { load, apply };
  }

  const api = { createStore };
  root.GardenStore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : self);
