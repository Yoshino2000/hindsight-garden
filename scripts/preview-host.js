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
  document.getElementById("notification-count").textContent = String(notifications.length);
}

async function callHost(request, reply, isCurrent = () => true) {
  try {
    const response = await fetch("/api/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: request.method, params: request.params ?? null }),
    });
    const payload = await response.json();
    if (!isCurrent()) return;
    if ("error" in payload) {
      reply({ id: request.id, error: payload.error });
      return;
    }
    if (request.method === "notifications.send") {
      notifications.push({ at: new Date().toISOString(), body: request.params.body });
      renderNotifications();
    }
    reply({ id: request.id, result: payload.result });
  } catch (error) {
    if (isCurrent()) reply({ id: request.id, error: String(error) });
  }
}

function isRequest(value) {
  return value && typeof value === "object" && typeof value.id === "number" && typeof value.method === "string";
}

window.addEventListener("message", (event) => {
  if (event.source !== frame.contentWindow || event.origin !== location.origin || !isRequest(event.data)) return;
  void callHost(event.data, (message) => frame.contentWindow.postMessage(message, location.origin));
});

function sendFocus(input = {}) {
  if (!worker || !window.preview.ready) throw new Error("后台尚未就绪");
  const away = Boolean(input.away);
  const data = {
    at: input.at ?? new Date().toISOString(),
    away,
    app: away ? null : ("app" in input ? input.app : (document.getElementById("focus-app").value.trim() || null)),
    host: away ? null : ("host" in input ? input.host : (document.getElementById("focus-host").value.trim() || null)),
    category: input.category ?? null,
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
        void callHost(event.data, (message) => currentWorker.postMessage(message), () => generation === currentGeneration);
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
document.getElementById("send-focus").addEventListener("click", () => sendFocus());
document.getElementById("send-away").addEventListener("click", () => sendFocus({ away: true }));
document.getElementById("restart-worker").addEventListener("click", () => {
  void restartWorker().catch(console.error);
});
document.getElementById("clear-notifications").addEventListener("click", () => {
  notifications.length = 0;
  renderNotifications();
});
void restartWorker().catch(console.error);
