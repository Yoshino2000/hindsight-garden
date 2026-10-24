// The page uses the same small classic-script modules as the worker. Commands are committed
// through the store; an open page never pretends to observe the foreground on its own.
(() => {
  "use strict";
  const C = GardenCore;
  const $ = (id) => document.getElementById(id);
  const STAGES = ["种子", "发芽", "长叶", "花苞", "开花"];
  // The original generated strips have uneven spacing. Frame bounds keep each plant intact
  // without changing the artwork or showing a neighbour at the edge of a frame.
  const FRAMES = {
    sunflower: [
      [51, 274],
      [454, 274],
      [818, 331],
      [1214, 324],
      [1606, 346],
    ],
    hydrangea: [
      [64, 293],
      [449, 289],
      [776, 332],
      [1137, 375],
      [1520, 429],
    ],
    tulip: [
      [58, 315],
      [450, 315],
      [835, 315],
      [1234, 321],
      [1629, 334],
    ],
    daisy: [
      [49, 324],
      [438, 325],
      [829, 324],
      [1220, 325],
      [1599, 367],
    ],
  };
  const store = GardenStore.createStore((method, params) =>
    hindsight.call(method, params),
  );
  let state = null;
  let busy = false;
  let polling = false;
  let generation = 0;
  let selectedFlower = null;
  let renameId = null;
  let deleteId = null;
  let ruleCounter = 0;
  let seenPenalty = null;
  let seenBloom = null;
  let firstRender = true;
  let gardenSignature = "";
  let errorSource = "";

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function species(id) {
    return C.SPECIES.find((item) => item.id === id) || C.SPECIES[0];
  }

  function sprite(node, id, stage) {
    const safeId = species(id).id;
    const frame = Math.max(0, Math.min(4, Math.floor(Number(stage) || 0)));
    const [left, width] = FRAMES[safeId][frame];
    const frameWidth = width + 6;
    const x = left - 3;
    node.style.setProperty("--sprite-ratio", String(frameWidth / 793));
    node.style.backgroundImage = `url("../assets/${safeId}.png")`;
    node.style.backgroundSize = `${(1983 / frameWidth) * 100}% 100%`;
    node.style.backgroundPosition = `${(x / (1983 - frameWidth)) * 100}% 50%`;
  }

  function minutes(ms) {
    const value = Math.max(0, Number(ms) || 0) / 60000;
    return value < 1
      ? `${Math.floor(value * 60)} 秒`
      : `${Number(value.toFixed(1))} 分钟`;
  }

  function date(at) {
    const value = new Date(at);
    return Number.isFinite(value.getTime())
      ? value.toLocaleDateString("zh-CN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";
  }

  function showError(error, source = "action") {
    errorSource = source;
    $("error").textContent = error?.message || String(error);
    $("error").hidden = false;
  }

  function notice(text) {
    $("notice").textContent = text;
    $("notice").hidden = !text;
  }

  function tab(name, focus = false) {
    for (const item of ["current", "garden"]) {
      const selected = item === name;
      $("tab-" + item).setAttribute("aria-selected", String(selected));
      $("tab-" + item).tabIndex = selected ? 0 : -1;
      $("view-" + item).hidden = !selected;
    }
    if (focus) $("tab-" + name).focus();
  }

  function compact(enabled) {
    document.body.classList.toggle("compact", enabled);
    $("compact-toggle").setAttribute("aria-pressed", String(enabled));
    $("compact-toggle").textContent = enabled ? "完整花园" : "紧凑模式";
    if (enabled) tab("current");
    try {
      localStorage.setItem("garden-compact", String(enabled));
    } catch (_) {
      /* Storage can be unavailable in a preview. */
    }
  }

  function ruleText(rule) {
    return rule.type === "website"
      ? `网站 · ${rule.value}`
      : `程序${rule.exact ? "（精确）" : "（包含）"} · ${rule.value}`;
  }

  function penaltyText(penalty) {
    if (!penalty?.enabled) return "累计模式：切到其他活动只暂停，不扣进度。";
    const amount =
      penalty.kind === "minutes"
        ? `${penalty.amount} 分钟`
        : `当时已有进度的 ${penalty.amount}%`;
    return `中断惩罚：宽限 ${penalty.graceSeconds} 秒后扣减${amount}，每次中断只扣一次。手动暂停和离开电脑不扣。`;
  }

  function renderCurrent() {
    const plant = state.active;
    const fresh =
      Number.isFinite(state.heartbeatAt) &&
      Date.now() - state.heartbeatAt < 12000;
    const growing = Boolean(
      plant &&
        fresh &&
        !state.paused &&
        state.focus &&
        C.matches(plant.rules, state.focus),
    );
    $("growth-status").classList.toggle("growing", growing);
    document.querySelector(".hero").classList.toggle("growing", growing);
    $("active-details").hidden = !plant;
    $("progress-area").hidden = !plant;
    $("start-plant").hidden = Boolean(plant) || !$("plant-form-panel").hidden;
    $("pause").hidden = !plant;
    $("notify").checked = state.notify;
    $("connection").textContent = fresh
      ? "后台运行中 · 只累计符合规则的前台时间"
      : "等待后台连接或新的活动信息";
    if (!plant) {
      sprite($("hero-sprite"), "sunflower", 0);
      $("growth-status").textContent = state.paused ? "已暂停" : "等待播种";
      $("stage-name").textContent = "从一颗种子开始";
      $("plant-name").textContent = "给时间种一朵花";
      $("plant-caption").textContent = "把一盆花和你常用的程序、网站关联起来。";
      $("growth-hint").textContent = state.garden.length
        ? "上一朵花已留在花园，准备好再种下一盆。"
        : "符合规则时慢慢生长，离开时安心暂停。";
      $("start-plant").textContent = state.garden.length
        ? "再种一盆"
        : "种下第一颗种子";
      return;
    }
    const stage = C.stage(plant.progressMs, plant.targetMs);
    const ratio = Math.max(
      0,
      Math.min(100, (plant.progressMs / plant.targetMs) * 100),
    );
    sprite($("hero-sprite"), plant.species, stage);
    $("stage-name").textContent = STAGES[stage];
    $("plant-name").textContent = plant.name;
    $("plant-caption").textContent =
      `${species(plant.species).name} · 一点点长大，也很好`;
    $("progress-fill").style.width = `${ratio}%`;
    $("progress").setAttribute("aria-valuenow", String(Math.round(ratio)));
    $("progress-time").textContent =
      `${minutes(plant.progressMs)} / ${minutes(plant.targetMs)}`;
    $("progress-percent").textContent = `${Math.floor(ratio)}%`;
    $("pause").textContent = state.paused ? "继续生长" : "暂停生长";
    $("growth-status").textContent = state.paused
      ? "安心暂停中"
      : growing
        ? "正在生长"
        : "等待你回来";
    $("growth-hint").textContent = state.paused
      ? "进度已经保存。准备好了，再继续。"
      : !fresh || !state.focus
        ? "等待新的前台活动信息，暂不累计时间。"
        : state.focus.away
          ? "你离开了电脑，植物正在休息，不会扣进度。"
          : growing
            ? "当前活动符合约定，小花正在慢慢生长。"
            : plant.penalty.enabled && state.interruption
              ? state.interruption.applied
                ? "本次中断已处理。停在这里不会再次扣减，回来后继续生长。"
                : "当前活动不在规则中。超过宽限时间，将按约定扣减一次进度。"
              : "当前活动不在规则中，生长暂停，已有进度保留。";
    $("active-rules").replaceChildren(
      ...plant.rules.map((rule) => el("li", "", ruleText(rule))),
    );
    $("penalty-summary").textContent = penaltyText(plant.penalty);
    $("planted-at").textContent = `${date(plant.createdAt)} 种下`;
  }

  function renderGarden() {
    $("garden-count").textContent = String(state.garden.length);
    $("garden-empty").hidden = state.garden.length > 0;
    const signature = JSON.stringify(state.garden);
    if (signature === gardenSignature) return;
    gardenSignature = signature;
    const cards = [...state.garden]
      .sort((a, b) => b.bloomAt - a.bloomAt)
      .map((plant) => {
        const button = el("button", "flower-card");
        button.type = "button";
        button.dataset.plantId = plant.id;
        button.setAttribute("aria-label", `查看 ${plant.name}`);
        button.setAttribute(
          "aria-pressed",
          String(selectedFlower === plant.id),
        );
        const picture = el("div", "plant-sprite");
        picture.setAttribute("aria-hidden", "true");
        sprite(picture, plant.species, 4);
        button.append(
          picture,
          el("span", "flower-name", plant.name),
          el("span", "subtle", `${date(plant.bloomAt)} 开花`),
        );
        button.addEventListener("click", () => {
          selectedFlower = plant.id;
          renderFlower();
        });
        return button;
      });
    $("garden-grid").replaceChildren(...cards);
    renderFlower();
  }

  function renderFlower() {
    const plant = state.garden.find((item) => item.id === selectedFlower);
    $("flower-details").hidden = !plant;
    for (const button of $("garden-grid").querySelectorAll("button")) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.plantId === selectedFlower),
      );
    }
    if (!plant) return;
    const heading = el("div", "section-heading");
    heading.append(
      el("h2", "", plant.name),
      el("span", "badge", species(plant.species).name),
    );
    const metadata = el("dl", "flower-metadata");
    for (const [label, value] of [
      ["种下", date(plant.createdAt)],
      ["开花", date(plant.bloomAt)],
      ["累计生长", minutes(plant.targetMs)],
    ]) {
      metadata.append(el("dt", "", label), el("dd", "", value));
    }
    const actions = el("div", "action-row");
    const rename = el("button", "button quiet small", "重命名");
    rename.type = "button";
    rename.addEventListener("click", () => openRename(plant));
    const remove = el("button", "button text-danger small", "移除这朵花");
    remove.type = "button";
    remove.addEventListener("click", () => openDelete(plant));
    actions.append(rename, remove);
    $("flower-details").replaceChildren(heading, metadata, actions);
  }

  function render() {
    $("loading").hidden = true;
    renderCurrent();
    renderGarden();
    if (state.lastError) showError(new Error(state.lastError), "runtime");
    else if (["runtime", "connection"].includes(errorSource)) {
      $("error").hidden = true;
      errorSource = "";
    }
    if (state.lastPenalty && state.lastPenalty.at !== seenPenalty) {
      if (!firstRender && state.active?.id === state.lastPenalty.plantId)
        notice(
          `本次中断扣减了 ${minutes(state.lastPenalty.lostMs)}。剩余进度已保存。`,
        );
      seenPenalty = state.lastPenalty.at;
    }
    if (state.lastBloom && state.lastBloom.at !== seenBloom) {
      if (!firstRender) notice("有一朵花开了，已为你留在「我的花园」。");
      seenBloom = state.lastBloom.at;
    }
    firstRender = false;
  }

  async function command(input, success) {
    if (busy) return false;
    busy = true;
    generation += 1;
    for (const button of document.querySelectorAll(
      ".action-panel button, #confirm-plant, #pause, #rename-save",
    ))
      button.disabled = true;
    $("error").hidden = true;
    try {
      const result = await store.apply(input);
      state = result.state;
      if (success) success();
      render();
      return true;
    } catch (error) {
      showError(error);
      return false;
    } finally {
      busy = false;
      for (const button of document.querySelectorAll(
        ".action-panel button, #confirm-plant, #pause, #rename-save",
      ))
        button.disabled = false;
    }
  }

  function addRule() {
    if ($("rules").children.length >= 20) {
      notice("每株植物最多添加 20 条规则。");
      return;
    }
    const number = ++ruleCounter;
    const row = el("div", "rule-row");
    const top = el("div", "rule-top");
    const type = el("select", "rule-type");
    type.setAttribute("aria-label", `规则 ${number} 类型`);
    for (const [value, text] of [
      ["app", "程序"],
      ["website", "网站"],
    ]) {
      const option = el("option", "", text);
      option.value = value;
      type.append(option);
    }
    const remove = el("button", "button text-danger small remove-rule", "移除");
    remove.type = "button";
    remove.setAttribute("aria-label", `移除规则 ${number}`);
    remove.addEventListener("click", () => {
      if ($("rules").children.length === 1) {
        notice("至少保留一条生长规则。");
        return;
      }
      row.remove();
    });
    top.append(type, remove);
    const value = el("input", "rule-value");
    value.required = true;
    value.maxLength = 120;
    value.placeholder = "例如：Code、Acrobat";
    value.setAttribute("aria-label", `规则 ${number} 内容`);
    const exactLabel = el("label", "rule-exact");
    const exact = el("input");
    exact.type = "checkbox";
    exactLabel.append(exact, "精确匹配程序名（忽略大小写和 .exe）");
    type.addEventListener("change", () => {
      exactLabel.hidden = type.value === "website";
      value.placeholder =
        type.value === "website"
          ? "例如：example.com，或粘贴网址"
          : "例如：Code、Acrobat";
      value.setCustomValidity("");
    });
    value.addEventListener("input", () => value.setCustomValidity(""));
    row.append(top, value, exactLabel);
    $("rules").append(row);
    if (number > 1) value.focus();
  }

  function rawPlant() {
    return {
      name: $("plant-name-input").value,
      species:
        document.querySelector('input[name="species"]:checked')?.value ||
        C.SPECIES[0].id,
      targetMinutes: Number($("target-minutes").value),
      rules: [...$("rules").children].map((row) => ({
        type: row.querySelector("select").value,
        value: row.querySelector(".rule-value").value,
        exact: row.querySelector('input[type="checkbox"]').checked,
      })),
      penalty: {
        enabled: $("penalty-enabled").checked,
        kind: $("penalty-kind").value,
        amount: Number($("penalty-amount").value),
        graceSeconds: Number($("penalty-grace").value),
      },
    };
  }

  function resetPlantForm() {
    $("plant-form").reset();
    $("rules").replaceChildren();
    ruleCounter = 0;
    addRule();
    $("penalty-options").hidden = true;
    for (const input of $("penalty-options").querySelectorAll("input, select"))
      input.disabled = true;
    $("penalty-amount-label").textContent = "扣减比例（%）";
    $("penalty-amount").max = "100";
    for (const input of $("plant-form").querySelectorAll("input"))
      input.setCustomValidity("");
  }

  function openPlant() {
    if (!state || state.active) return;
    if (state.garden.length >= 200) {
      notice("花园已收藏 200 株植物，请先移除一株再播种。");
      return;
    }
    tab("current");
    resetPlantForm();
    $("plant-form-panel").hidden = false;
    $("start-plant").hidden = true;
    $("plant-name-input").focus();
  }

  function closePlant() {
    $("plant-form-panel").hidden = true;
    resetPlantForm();
    if (state) renderCurrent();
  }

  async function plant() {
    if (!$("plant-form").reportValidity()) return;
    const input = rawPlant();
    try {
      C.validatePlant(input);
    } catch (error) {
      showError(error);
      return;
    }
    const id =
      globalThis.crypto?.randomUUID?.() ||
      `plant-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await command({ type: "plant", id, plant: input }, () => {
      closePlant();
      notice("种好了。回到设定的程序或网站，它就会开始生长。");
    });
  }

  function openRename(plant) {
    renameId = plant.id;
    $("rename-input").value = plant.name;
    $("rename-input").setCustomValidity("");
    $("rename-panel").hidden = false;
    $("delete-panel").hidden = true;
    $("rename-input").focus();
    $("rename-input").select();
  }

  async function saveRename() {
    if (!$("rename-input").reportValidity()) return;
    await command(
      { type: "rename", id: renameId, name: $("rename-input").value },
      () => {
        $("rename-panel").hidden = true;
        notice("名字保存好了。");
      },
    );
  }

  function openDelete(plant) {
    deleteId = plant.id;
    $("delete-message").textContent =
      `「${plant.name}」和它的生长记录会被移除，此操作无法撤销。`;
    $("delete-panel").hidden = false;
    $("rename-panel").hidden = true;
    $("delete-cancel").focus();
  }

  async function poll() {
    if (polling || busy) return;
    polling = true;
    const current = generation;
    try {
      const value = await store.load();
      if (current !== generation) return;
      state = value;
      render();
    } catch (error) {
      showError(error, "connection");
    } finally {
      polling = false;
    }
  }

  for (const [index, item] of C.SPECIES.entries()) {
    const label = el("label", "species-option");
    const picture = el("div", "plant-sprite");
    picture.setAttribute("aria-hidden", "true");
    sprite(picture, item.id, 4);
    const radio = el("input");
    radio.type = "radio";
    radio.name = "species";
    radio.value = item.id;
    radio.checked = index === 0;
    radio.defaultChecked = index === 0;
    radio.setAttribute("aria-label", item.name);
    label.title = item.description;
    label.append(picture, el("span", "", item.name), radio);
    $("species-options").append(label);
  }

  for (const name of ["current", "garden"]) {
    $("tab-" + name).addEventListener("click", () => tab(name));
    $("tab-" + name).addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
        return;
      event.preventDefault();
      tab(
        event.key === "Home"
          ? "current"
          : event.key === "End"
            ? "garden"
            : name === "current"
              ? "garden"
              : "current",
        true,
      );
    });
  }
  $("compact-toggle").addEventListener("click", () =>
    compact(!document.body.classList.contains("compact")),
  );
  $("start-plant").addEventListener("click", openPlant);
  $("garden-start").addEventListener("click", () => tab("current", true));
  $("cancel-plant").addEventListener("click", closePlant);
  $("confirm-plant").addEventListener("click", plant);
  $("add-rule").addEventListener("click", addRule);
  $("plant-form").addEventListener("submit", (event) => event.preventDefault());
  $("plant-form").addEventListener("keydown", (event) => {
    if (
      event.key !== "Enter" ||
      event.target.tagName !== "INPUT" ||
      event.target.type === "checkbox" ||
      event.target.type === "radio"
    )
      return;
    event.preventDefault();
    plant();
  });
  $("penalty-enabled").addEventListener("change", () => {
    $("penalty-options").hidden = !$("penalty-enabled").checked;
    for (const input of $("penalty-options").querySelectorAll("input, select"))
      input.disabled = !$("penalty-enabled").checked;
  });
  $("penalty-kind").addEventListener("change", () => {
    const percent = $("penalty-kind").value === "percent";
    $("penalty-amount-label").textContent = percent
      ? "扣减比例（%）"
      : "扣减时间（分钟）";
    $("penalty-amount").max = percent ? "100" : "1440";
    $("penalty-amount").value = percent ? "10" : "1";
  });
  $("pause").addEventListener(
    "click",
    () => state && command({ type: "pause", paused: !state.paused }),
  );
  $("notify").addEventListener("change", async () => {
    if (
      !(await command({
        type: "notifications",
        enabled: $("notify").checked,
      })) &&
      state
    )
      $("notify").checked = state.notify;
  });
  $("rename-active").addEventListener(
    "click",
    () => state?.active && openRename(state.active),
  );
  $("delete-active").addEventListener(
    "click",
    () => state?.active && openDelete(state.active),
  );
  $("rename-save").addEventListener("click", saveRename);
  $("rename-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveRename();
    }
  });
  $("rename-cancel").addEventListener("click", () => {
    $("rename-panel").hidden = true;
  });
  $("delete-cancel").addEventListener("click", () => {
    $("delete-panel").hidden = true;
  });
  $("delete-confirm").addEventListener("click", () =>
    command({ type: "delete", id: deleteId }, () => {
      $("delete-panel").hidden = true;
      notice("已移除这株植物。");
    }),
  );
  try {
    compact(localStorage.getItem("garden-compact") === "true");
  } catch (_) {
    compact(false);
  }
  resetPlantForm();
  poll();
  setInterval(poll, 2000);
})();
