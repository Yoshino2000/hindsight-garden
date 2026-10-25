// The page and worker share one garden. A version check keeps simultaneous writes from replacing
// one another. Rules run again on conflict; notifications are returned only after a successful save.
(function (root) {
  "use strict";

  function createStore(hostCall, options = {}) {
    if (typeof hostCall !== "function")
      throw new Error("请在 Hindsight 中打开时光花园。");
    const timeoutMs = options.timeoutMs || 8000;
    let readyPromise;

    function call(method, params) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(
          () =>
            reject(
              new Error(
                "连接 Hindsight 超时，已暂停计时；请重新打开插件检查。",
              ),
            ),
          timeoutMs,
        );
        Promise.resolve()
          .then(() => hostCall(method, params))
          .then(
            (value) => {
              clearTimeout(timer);
              resolve(value);
            },
            (error) => {
              clearTimeout(timer);
              reject(error instanceof Error ? error : new Error(String(error)));
            },
          );
      });
    }

    function ready() {
      if (!readyPromise) {
        readyPromise = call("db.execute", {
          sql: "CREATE TABLE IF NOT EXISTS garden_store (key TEXT PRIMARY KEY, value TEXT NOT NULL, version INTEGER NOT NULL)",
          params: [],
        }).catch((error) => {
          readyPromise = null;
          throw error;
        });
      }
      return readyPromise;
    }

    async function read() {
      await ready();
      const rows = await call("db.query", {
        sql: "SELECT value, version FROM garden_store WHERE key = ?",
        params: ["state"],
      });
      if (!Array.isArray(rows))
        throw new Error("花园存储返回了无法识别的数据，已停止写入。");
      if (!rows.length)
        return { state: root.GardenCore.initialState(), version: null };
      if (
        rows.length !== 1 ||
        !Number.isSafeInteger(rows[0].version) ||
        rows[0].version < 0
      )
        throw new Error("花园存储版本损坏，请保留数据并检查。");
      let value;
      try {
        value = JSON.parse(rows[0].value);
      } catch (_) {
        throw new Error("花园数据损坏，已停止写入以保留原数据。");
      }
      return {
        state: root.GardenCore.normalizeState(value),
        version: rows[0].version,
      };
    }

    async function write(state, version) {
      const json = JSON.stringify(state);
      if (new TextEncoder().encode(json).length > 220000)
        throw new Error("花园记录已接近容量限制，请删除部分收藏后重试。");
      const result =
        version === null
          ? await call("db.execute", {
              sql: "INSERT OR IGNORE INTO garden_store (key, value, version) VALUES (?, ?, 0)",
              params: ["state", json],
            })
          : await call("db.execute", {
              sql: "UPDATE garden_store SET value = ?, version = version + 1 WHERE key = ? AND version = ?",
              params: [json, "state", version],
            });
      return result.changes === 1;
    }

    return {
      async load() {
        return (await read()).state;
      },
      async apply(input, now = Date.now()) {
        // Keep `now` stable through retries: a conflicting write must not invent extra elapsed time.
        for (let attempt = 0; attempt < 8; attempt++) {
          const saved = await read();
          const result = root.GardenCore.reduce(saved.state, input, now);
          if (await write(result.state, saved.version)) return result;
        }
        throw new Error("花园正被其他窗口更新，请稍后重试。");
      },
    };
  }

  const api = { createStore };
  root.GardenStore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : self);
