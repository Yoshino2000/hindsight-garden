"use strict";

const frame = document.getElementById("plugin-ui");
const status = document.getElementById("worker-status");
const notifications = [];
let worker = null;
let heartbeat = null;
let generation = 0;

function renderNotifications() {
  const list = document.getElementById("notification-list");
  list.replaceChildren();
  for (const notice of notifications) {
    const item = document.createElement("li");
    const at = document.createElement("time");
    at.dateTime = notice.at;
    at.textContent = new Date(notice.at).toLocaleTimeString();
    item.append(at, document.createTextNode(notice.body));
    list.append(item);
  }
  document.getElementById("notification-count").textContent = String(
    notifications.length,
  );
}

async function callHost(request, reply, isCurrent = () => true) {
  try {
    const response = await fetch("/api/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: request.method,
        params: request.params ?? null,
      }),
    });
    const payload = await response.json();
    if (!isCurrent()) return;
    if (
      ["categories.list", "super_categories.list"].includes(request.method) &&
      Array.isArray(payload.result)
    ) {
      const mode = document.getElementById("catalog-mode").value;
      if (mode === "fail") throw new Error("模拟：分类读取权限不足");
      if (mode === "empty") payload.result = [];
      if (request.method === "categories.list") {
        if (mode === "renamed")
          payload.result = payload.result.map((item) =>
            item.id === "reading" ? { ...item, name: "文献阅读" } : item,
          );
        if (mode === "deleted")
          payload.result = payload.result.filter(
            (item) => item.id !== "reading",
          );
      }
    }
    if ("error" in payload) {
      reply({ id: request.id, error: payload.error });
      return;
    }
    if (request.method === "notifications.send") {
      notifications.push({
        at: new Date().toISOString(),
        body: request.params.body,
      });
      renderNotifications();
    }
    reply({ id: request.id, result: payload.result });
  } catch (error) {
    if (isCurrent()) reply({ id: request.id, error: String(error) });
  }
}

function isRequest(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.id === "number" &&
    typeof value.method === "string"
  );
}

window.addEventListener("message", (event) => {
  if (
    event.source !== frame.contentWindow ||
    event.origin !== location.origin ||
    !isRequest(event.data)
  )
    return;
  void callHost(event.data, (message) =>
    frame.contentWindow.postMessage(message, location.origin),
  );
});

function sendFocus(input = {}) {
  if (!worker || !window.preview.ready) throw new Error("后台尚未就绪");
  const away = Boolean(input.away);
  const categoryId = document.getElementById("focus-category").value;
  const fixtureCategories = {
    reading: {
      id: "reading",
      name: "阅读",
      superCategory: { id: "work", name: "工作" },
    },
    code: {
      id: "code",
      name: "编程",
      superCategory: { id: "work", name: "工作" },
    },
    games: {
      id: "games",
      name: "游戏",
      superCategory: { id: "leisure", name: "娱乐" },
    },
  };
  const data = {
    at: input.at ?? new Date().toISOString(),
    away,
    app: away
      ? null
      : "app" in input
        ? input.app
        : document.getElementById("focus-app").value.trim() || null,
    host: away
      ? null
      : "host" in input
        ? input.host
        : document.getElementById("focus-host").value.trim() || null,
    category: away
      ? null
      : "category" in input
        ? input.category
        : fixtureCategories[categoryId] || null,
    title: input.title ?? null,
  };
  worker.postMessage({ eventName: "focus.changed", data });
  return data;
}

function restartWorker() {
  generation += 1;
  const currentGeneration = generation;
  worker?.terminate();
  if (heartbeat !== null) clearInterval(heartbeat);
  window.preview.ready = false;
  status.textContent = "后台启动中…";
  const currentWorker = new Worker("/plugin/_worker.js");
  worker = currentWorker;
  let missed = 0;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (generation !== currentGeneration) return;
      status.textContent = "后台启动超时";
      reject(new Error("Worker startup timeout"));
    }, 10000);
    currentWorker.addEventListener("message", (event) => {
      if (generation !== currentGeneration) return;
      if (event.data?.pong) {
        missed = 0;
        if (!window.preview.ready) {
          clearTimeout(timeout);
          window.preview.ready = true;
          status.textContent = "后台已就绪";
          resolve();
        }
      } else if (isRequest(event.data)) {
        void callHost(
          event.data,
          (message) => currentWorker.postMessage(message),
          () => generation === currentGeneration,
        );
      }
    });
    currentWorker.addEventListener("error", (event) => {
      clearTimeout(timeout);
      if (generation !== currentGeneration) return;
      status.textContent = `后台错误：${event.message}`;
      window.preview.ready = false;
      reject(new Error(event.message));
    });
    heartbeat = setInterval(() => {
      if (missed === 2) {
        currentWorker.terminate();
        clearInterval(heartbeat);
        window.preview.ready = false;
        status.textContent = "后台无响应，已停止";
        return;
      }
      missed += 1;
      currentWorker.postMessage({ ping: true });
    }, 10000);
    currentWorker.postMessage({ ping: true });
  });
}

window.preview = { sendFocus, notifications, restartWorker, ready: false };

// Scroll only: inspect the whole scene inside the constrained host iframe without resizing it.
const showScene = document.createElement("button");
showScene.id = "show-scene";
showScene.textContent = "全景定位（仅测试）";
showScene.addEventListener("click", () => {
  const page = document.getElementById("plugin-ui").contentDocument;
  const scene = page?.querySelector("#view-garden:not([hidden]) .garden-scene:not(.garden-miniature)");
  if (!scene) return;
  scene.scrollIntoView({ block: "start", behavior: "instant" });
  page.defaultView.scrollBy(0, -70);
});
document.getElementById("seed-garden").after(showScene);

// Preview-only screenshot view: change the harness, never the plugin's DOM or styles.
// F8 returns to the controls. The plugin still runs through the same sandbox/bridge.
function screenshotMode(event) {
  if (event?.key && event.key !== "F8") return;
  event?.preventDefault();
  document.body.classList.toggle("showcase");
}
const showPlugin = document.createElement("button");
showPlugin.id = "show-plugin";
showPlugin.textContent = "纯插件截图视图（F8 返回）";
showPlugin.addEventListener("click", screenshotMode);
showScene.after(showPlugin);
const sectionChoice = document.createElement("select");
sectionChoice.id = "preview-section";
sectionChoice.setAttribute("aria-label", "截图定位区域");
for (const [value, label] of [["#plant-form-panel", "播种表单"], [".current-pot-layout", "当前盆栽"], [".garden-island-card", "完整花园"], [".garden-browser", "花园相册"], [".collection-settings", "成就与主题"]]) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  sectionChoice.append(option);
}
const alignSection = document.createElement("button");
alignSection.id = "align-section";
alignSection.textContent = "定位所选区域（仅测试）";
alignSection.addEventListener("click", () => {
  const page = frame.contentDocument;
  const section = page.querySelector(sectionChoice.value);
  section?.scrollIntoView({ block: "start", behavior: "instant" });
  page.defaultView.scrollBy(0, -8);
});
showPlugin.after(sectionChoice, alignSection);
document.addEventListener("keydown", screenshotMode);
frame.addEventListener("load", () => frame.contentDocument.addEventListener("keydown", screenshotMode));
if (frame.contentDocument) frame.contentDocument.addEventListener("keydown", screenshotMode);
document
  .getElementById("send-focus")
  .addEventListener("click", () => sendFocus());
document
  .getElementById("send-away")
  .addEventListener("click", () => sendFocus({ away: true }));
document.getElementById("restart-worker").addEventListener("click", () => {
  void restartWorker().catch(console.error);
});
document.getElementById("clear-notifications").addEventListener("click", () => {
  notifications.length = 0;
  renderNotifications();
});
document.getElementById("seed-garden").addEventListener("click", async () => {
  const button = document.getElementById("seed-garden");
  button.disabled = true;
  delete button.dataset.loadedCount;
  try {
    const response = await fetch("/api/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "preview.seed",
        params: { count: Number(document.getElementById("scene-count").value) },
      }),
    });
    const result = await response.json();
    if (result.error) throw new Error(result.error);
    await restartWorker();
    await new Promise((resolve) => {
      frame.addEventListener("load", resolve, { once: true });
      frame.src = "/plugin/ui/index.html";
    });
    button.dataset.loadedCount = String(result.result.count);
  } catch (error) {
    status.textContent = String(error.message || error);
  } finally {
    button.disabled = false;
  }
});
void restartWorker().catch(console.error);
