// One timeout per visitor; CSS handles each flight and wing stroke without a frame loop.
(function (root) {
  "use strict";

  function createVisitors(bird, butterfly, environment = {}) {
    const random = environment.random || Math.random;
    const now = environment.now || Date.now;
    const schedule = environment.setTimeout || setTimeout;
    const cancel = environment.clearTimeout || clearTimeout;
    let running = false;
    const visitors = [
      { node: bird, names: ["bird-blue", "bird-robin", "bird-finch"], min: 15000, max: 30000, remaining: 2500 },
      { node: butterfly, names: ["butterfly", "butterfly-amber", "butterfly-blue"], min: 24000, max: 40000, remaining: 6000 },
    ];

    function arm(visitor) {
      visitor.deadline = now() + visitor.remaining;
      visitor.timer = schedule(() => {
        visitor.timer = null;
        if (!running) return;
        const name = visitor.names[Math.floor(random() * visitor.names.length)];
        visitor.node.querySelector(".visitor-art").style.backgroundImage = `url("../assets/ambience/${name}.png")`;
        visitor.node.dataset.kind = name;
        visitor.node.dataset.direction = random() < 0.5 ? "left" : "right";
        visitor.node.style.setProperty("--flight-y", `${18 + random() * 9}%`);
        visitor.node.dataset.visiting = "true";
        visitor.remaining = visitor.min + Math.floor(random() * (visitor.max - visitor.min + 1));
        arm(visitor);
      }, visitor.remaining);
    }

    for (const visitor of visitors) {
      visitor.node.addEventListener("animationend", (event) => {
        if (event.target.classList?.contains("visitor-flight") &&
            !event.target.classList.contains("ground-flight")) visitor.node.dataset.visiting = "false";
      });
    }

    return {
      setRunning(value) {
        if (running === value) return;
        running = value;
        for (const visitor of visitors) {
          if (running) arm(visitor);
          else {
            // display:none cancels a CSS route. End that visit explicitly rather than
            // restarting it into the already scheduled next visitor when shown again.
            visitor.node.dataset.visiting = "false";
            if (visitor.timer != null) {
              cancel(visitor.timer);
              visitor.timer = null;
              visitor.remaining = Math.max(0, visitor.deadline - now());
            }
          }
        }
      },
    };
  }

  root.GardenAmbience = { createVisitors };
  if (typeof module !== "undefined" && module.exports) module.exports = root.GardenAmbience;
})(typeof globalThis !== "undefined" ? globalThis : self);
