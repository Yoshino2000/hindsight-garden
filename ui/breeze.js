// One shared gust clock for the visible garden. CSS moves every flower in the same frame.
// No per-flower timeout, frame loop or image filter is needed for wind or its ground shadow.
(function (root) {
  "use strict";
  const MIN_INTERVAL = 3000;
  const MAX_INTERVAL = 10000;
  const DURATION = 4500;

  function createBreeze(grid, environment = {}) {
    const random = environment.random || Math.random;
    const now = environment.now || (() => root.performance?.now() ?? Date.now());
    const schedule = environment.setTimeout || setTimeout;
    const cancel = environment.clearTimeout || clearTimeout;
    let running = false;
    let timer = null;
    let deadline = 0;
    let remaining = null;
    let phase = false;
    let stage = "waiting";
    const sample = () => {
      const value = Number(random());
      return Number.isFinite(value) ? Math.max(0, Math.min(1 - Number.EPSILON, value)) : .5;
    };
    const interval = () => MIN_INTERVAL + Math.floor(sample() * (MAX_INTERVAL - MIN_INTERVAL + 1));
    function rest() { if (grid) delete grid.dataset.breeze; }
    function stopTimer() {
      if (timer !== null) cancel(timer);
      timer = null;
    }
    function arm() {
      if (!running || !grid?.childElementCount || timer !== null) return;
      if (remaining === null) remaining = stage === "gust" ? DURATION : interval();
      deadline = now() + remaining;
      timer = schedule(() => {
        timer = null;
        if (!running || !grid.childElementCount) { rest(); stage = "waiting"; remaining = null; return; }
        if (stage === "gust") {
          rest(); stage = "waiting"; remaining = null; arm(); return;
        }
        const direction = sample() < .5 ? -1 : 1;
        const angle = direction * (1.2 + sample() * .8);
        grid.style.setProperty("--breeze-angle", `${angle.toFixed(3)}deg`);
        grid.style.setProperty("--breeze-return", `${(-angle * .45).toFixed(3)}deg`);
        grid.style.setProperty("--breeze-settle", `${(angle * .2).toFixed(3)}deg`);
        grid.style.setProperty("--breeze-shadow-x", `${direction * 3}%`);
        phase = !phase;
        grid.dataset.breeze = phase ? "a" : "b";
        stage = "gust";
        remaining = null;
        arm();
      }, remaining);
    }
    return {
      setRunning(value) {
        value = Boolean(value);
        if (value === running) return;
        running = value;
        if (running) arm();
        else {
          if (stage === "waiting" && timer !== null) remaining = Math.max(0, Math.min(MAX_INTERVAL, deadline - now()));
          else { stage = "waiting"; remaining = null; }
          stopTimer(); rest();
        }
      },
      // A page/collection change starts a new common wait, never one clock per new plant.
      refresh() { stopTimer(); rest(); stage = "waiting"; remaining = null; arm(); },
    };
  }
  root.GardenBreeze = { MIN_INTERVAL, MAX_INTERVAL, DURATION, createBreeze };
  if (typeof module !== "undefined" && module.exports) module.exports = root.GardenBreeze;
})(typeof globalThis !== "undefined" ? globalThis : self);
