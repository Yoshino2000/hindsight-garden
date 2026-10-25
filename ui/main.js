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
    rose: [
      [51, 277],
      [437, 276],
      [799, 319],
      [1160, 374],
      [1562, 402],
    ],
    lavender: [
      [51, 275],
      [451, 275],
      [837, 286],
      [1216, 310],
      [1595, 359],
    ],
    cosmos: [
      [48, 280],
      [446, 279],
      [797, 343],
      [1171, 373],
      [1566, 411],
    ],
    lily: [
      [50, 275],
      [449, 274],
      [800, 343],
      [1177, 364],
      [1542, 430],
    ],
  };
  const GARDEN_FRAMES = {
    sunflower: [238, 188, 806, 839],
    hydrangea: [210, 269, 853, 738],
    tulip: [286, 204, 697, 845],
    daisy: [199, 299, 892, 721],
    rose: [255, 251, 761, 766],
    lavender: [234, 191, 794, 857],
    cosmos: [183, 178, 939, 896],
    lily: [247, 208, 797, 814],
  };
  const store = GardenStore.createStore((method, params) =>
    hindsight.call(method, params),
  );
  let state = null;
  let busy = false;
  let polling = false;
  let generation = 0;
  let selectedFlower = null;
  let flowerSignature = "";
  let renameId = null;
  let deleteId = null;
  let ruleCounter = 0;
  let seenPenalty = null;
  let seenBloom = null;
  let firstRender = true;
  let gardenSignature = "";
  let gardenPage = 0;
  let gardenMode = "week";
  let gardenWeek = "";
  let gardenView = null;
  let albumSignature = "";
  const WEEK_GROUP_SIZE = 12;
  let weekSignature = "";
  let ambienceEnabled = true;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const visitors = GardenAmbience.createVisitors(
    document.querySelector(".ambience-bird"), document.querySelector(".ambience-butterfly"),
  );
  let errorSource = "";
  let editPlantId = null;
  let catalogRequest = null;
  const catalogs = {
    category: { items: [], loaded: false, error: null },
    superCategory: { items: [], loaded: false, error: null },
  };

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
    // The last two lily frames are only one pixel apart, so they need no extra padding.
    const padding = safeId === "lily" && frame >= 3 ? 0 : 3;
    const frameWidth = width + padding * 2;
    const x = left - padding;
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

  function previewSpecies(id) {
    const item = species(id);
    const guide = GardenPlantGuide[item.id];
    sprite($("species-preview-sprite"), item.id, 4);
    $("species-preview-name").textContent = item.name;
    $("species-preview-description").textContent = item.description;
    $("species-preview-botanical").textContent = guide.botanical;
    for (const field of ["origin", "story", "meaning"])
      $("species-preview-" + field).textContent = guide[field];
    $("species-preview-sources").textContent =
      "资料：" + guide.sources.map((source) => source.label).join(" · ");
    $("species-preview-sources").title = guide.sources.map((source) => source.url).join("\n");
  }

  function gardenArtwork(id) {
    const safeId = species(id).id;
    const [x, y, width, height] = GARDEN_FRAMES[safeId];
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "garden-flower-art");
    svg.setAttribute(
      "viewBox",
      `${Math.max(0, x - 4)} ${Math.max(0, y - 4)} ${width + 8} ${height + 8}`,
    );
    svg.setAttribute("preserveAspectRatio", "xMidYMax meet");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const image = document.createElementNS(ns, "image");
    image.setAttribute("href", `../assets/garden/${safeId}.png`);
    image.setAttribute("width", "1254");
    image.setAttribute("height", "1254");
    svg.append(image);
    return svg;
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
    if (name !== "garden") closeFlowerDrawer(false);
    for (const item of ["current", "garden"]) {
      const selected = item === name;
      $("tab-" + item).setAttribute("aria-selected", String(selected));
      $("tab-" + item).tabIndex = selected ? 0 : -1;
      $("view-" + item).hidden = !selected;
    }
    if (focus) $("tab-" + name).focus();
    updateAmbience();
  }

  function updateAmbience() {
    const enabled = ambienceEnabled && !reducedMotion.matches;
    const running = document.visibilityState === "visible" &&
      !$("view-garden").hidden && !document.body.classList.contains("compact");
    $("garden-ambience").dataset.enabled = String(enabled);
    $("garden-ambience").dataset.running = String(running);
    document.querySelector(".garden-scene:not(.garden-miniature)").dataset.motion = String(enabled && running);
    visitors.setRunning(enabled && running);
    $("garden-motion").checked = enabled;
    $("garden-motion").disabled = reducedMotion.matches;
    $("garden-motion-hint").textContent = reducedMotion.matches
      ? "已跟随系统减少动态效果"
      : "秋千轻摆，小鸟约每 15–30 秒来访，水面泛起微波";
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
    if (rule.type === "category" || rule.type === "superCategory") {
      const catalog = catalogs[rule.type];
      const item = catalog.items.find((entry) => entry.id === rule.value);
      const type = rule.type === "category" ? "分类" : "大类";
      const name = item?.name || rule.label || rule.value;
      return item || !catalog.loaded
        ? `${type} · ${name}`
        : `已删除${type}（${name}）`;
    }
    return rule.type === "website"
      ? `网站 · ${rule.value}`
      : `程序${rule.exact ? "（精确）" : "（包含）"} · ${rule.value}`;
  }

  function catalogStatus() {
    const failed = Object.entries(catalogs).filter(([, value]) => value.error);
    const text = catalogRequest
      ? "正在读取 Hindsight 分类…"
      : failed.length
        ? `${failed.map(([type]) => (type === "category" ? "分类" : "大类")).join("、")}读取失败，可刷新重试；程序和网站仍可手动填写。`
        : `已读取 ${catalogs.category.items.length} 个分类、${catalogs.superCategory.items.length} 个大类。分类变动后请刷新。`;
    for (const id of ["catalog-status", "edit-catalog-status"])
      $(id).textContent = text;
    for (const id of ["refresh-catalogs", "refresh-edit-catalogs"])
      $(id).disabled = Boolean(catalogRequest);
  }

  function readCatalog(method) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("读取分类超时，请稍后刷新。")),
        8000,
      );
      Promise.resolve()
        .then(() => hindsight.call(method, {}))
        .then(
          (items) => {
            clearTimeout(timeout);
            if (!Array.isArray(items)) throw new Error("分类列表格式不正确。");
            resolve(
              items.filter(
                (item) =>
                  item &&
                  typeof item.id === "string" &&
                  item.id &&
                  typeof item.name === "string",
              ),
            );
          },
          (error) => {
            clearTimeout(timeout);
            reject(error);
          },
        )
        .catch(reject);
    });
  }

  function refreshRuleOptions(row) {
    const type = row.querySelector(".rule-type").value;
    const select = row.querySelector(".rule-category");
    if (!["category", "superCategory"].includes(type)) return;
    const selectedId = select.value || select.dataset.savedValue || "";
    const savedLabel =
      select.selectedOptions[0]?.dataset.label ||
      select.dataset.savedLabel ||
      selectedId;
    const catalog = catalogs[type];
    const typeName = type === "category" ? "分类" : "大类";
    const placeholder = el(
      "option",
      "",
      catalog.items.length
        ? `请选择${typeName}`
        : catalogRequest
          ? `正在读取${typeName}…`
          : catalog.error
            ? `${typeName}读取失败，可切换为程序或网站`
            : `暂无${typeName}，可切换为程序或网站`,
    );
    placeholder.value = "";
    const options = [
      placeholder,
      ...catalog.items.map((item) => {
        const parent = type === "category" ? item.superCategory?.name : null;
        const option = el(
          "option",
          "",
          parent ? `${item.name} · ${parent}` : item.name,
        );
        option.value = item.id;
        option.dataset.label = item.name;
        return option;
      }),
    ];
    if (selectedId && !catalog.items.some((item) => item.id === selectedId)) {
      const label = catalog.loaded
        ? `已删除${type === "category" ? "分类" : "大类"}（${savedLabel}）`
        : `${savedLabel}（等待读取）`;
      const missing = el("option", "", label);
      missing.value = selectedId;
      missing.dataset.label = savedLabel;
      options.push(missing);
    }
    select.replaceChildren(...options);
    select.value = selectedId;
    select.dataset.savedValue = selectedId;
    select.dataset.savedLabel = savedLabel;
  }

  async function refreshCatalogs() {
    if (catalogRequest) return catalogRequest;
    catalogRequest = Promise.allSettled([
      readCatalog("categories.list"),
      readCatalog("super_categories.list"),
    ]);
    catalogStatus();
    try {
      const results = await catalogRequest;
      for (const [index, type] of ["category", "superCategory"].entries()) {
        const result = results[index];
        if (result.status === "fulfilled") {
          catalogs[type].items = result.value;
          catalogs[type].loaded = true;
          catalogs[type].error = null;
        } else
          catalogs[type].error =
            result.reason?.message || String(result.reason);
      }
      for (const row of document.querySelectorAll(".rule-row"))
        refreshRuleOptions(row);
      if (state) renderCurrent();
    } finally {
      catalogRequest = null;
      catalogStatus();
    }
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
    $("current-hero").hidden = !plant;
    $("current-plan").hidden = !plant;
    $("plant-form-panel").hidden = Boolean(plant);
    document.body.classList.toggle("has-active-plant", Boolean(plant));
    $("active-details").hidden = !plant;
    $("progress-area").hidden = !plant;
    $("start-plant").hidden = true;
    $("pause").hidden = !plant;
    $("notify").checked = state.notify;
    const notificationSlot = $(plant ? "active-notification-slot" : "plant-notification-slot");
    if ($("notification-settings").parentElement !== notificationSlot)
      notificationSlot.append($("notification-settings"));
    $("connection").textContent = fresh
      ? "后台运行中 · 只累计符合规则的前台时间"
      : "等待后台连接或新的活动信息";
    if (!plant) {
      $("plant-form-hint").textContent = state.paused
        ? "选品种、设置规则和累计时长，然后直接播种。当前处于暂停状态，播种后可点击「继续生长」。"
        : "选品种、设置生长规则和累计时长，然后直接播种。默认切换活动只暂停，不扣进度。";
      sprite($("hero-sprite"), "sunflower", 0);
      $("growth-status").textContent = state.paused ? "已暂停" : "等待播种";
      $("stage-name").textContent = "从一颗种子开始";
      $("plant-name").textContent = "给时间种一朵花";
      $("plant-caption").textContent =
        "选一个现有分类，让日常活动慢慢养出一朵花。";
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
    $("current-plan-summary").textContent =
      `累计 ${minutes(plant.targetMs)} 开花 · ${plant.penalty.enabled ? "已开启中断惩罚" : "累计模式，中断不扣进度"}`;
    const rules = plant.rules.map(ruleText);
    $("current-rule-summary").textContent =
      `生长规则：${rules.slice(0, 2).join("；")}${rules.length > 2 ? ` 等 ${rules.length} 条` : ""}`;
    $("current-rule-summary").title = rules.join("；");
    $("active-target-summary").textContent =
      `${species(plant.species).name} · 累计目标 ${minutes(plant.targetMs)}`;
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
    gardenView = GardenLayout.createView(state.garden, {
      mode: gardenMode,
      week: gardenWeek,
      page: gardenPage,
    });
    const { layout } = gardenView;
    gardenMode = gardenView.mode;
    gardenWeek = gardenView.week;
    gardenPage = layout.page;
    $("garden-count").textContent = String(gardenView.total);
    $("garden-collection-total").textContent = `已收藏 ${gardenView.total} 株`;
    $("garden-total").textContent = `${layout.plots.length} 株已开花`;
    $("garden-scene-title").textContent =
      layout.total ? `${gardenMode === "week" ? "这一周的" : "我的"}第 ${layout.page + 1} 座花园`
        : gardenMode === "week" ? "这一周的花园" : "等待第一朵花的花园";
    $("garden-mode-week").setAttribute("aria-pressed", String(gardenMode === "week"));
    $("garden-mode-all").setAttribute("aria-pressed", String(gardenMode === "all"));
    renderWeekIndex();
    const selectedWeek = gardenView.weeks.find((week) => week.key === gardenWeek);
    const summary = `${gardenMode === "week" && selectedWeek ? weekRange(selectedWeek) : "全部收藏"} · ${layout.total} 株 · ${layout.total ? layout.pageCount : 0} 座花园`;
    if ($("garden-period-summary").textContent !== summary)
      $("garden-period-summary").textContent = summary;
    if ($("garden-album-context").textContent !== summary)
      $("garden-album-context").textContent = summary;
    $("garden-empty").textContent = gardenMode === "week"
      ? selectedWeek?.current
        ? "这一周还没有花朵开花。花开时，它就会留在本周的花园里。"
        : "这一周没有已收藏的花朵。可以切换其他周，或回到本周继续种花。"
      : "第一朵花会种在这里。完成当前盆栽，它就会留在这座花园里。";
    if (gardenMode === "week" && layout.total === 0 && gardenView.total > 0)
      $("garden-empty").textContent = `这一周还没有收藏的花朵。其他周已收藏 ${gardenView.total} 株，可直接在下方周相册中查看。`;
    $("garden-empty").hidden = layout.total > 0;
    $("garden-start").hidden = layout.total > 0;
    $("garden-interaction-hint").hidden = layout.total === 0;
    $("garden-pagination").hidden = layout.pageCount <= 1;
    $("garden-prev").disabled = layout.page === 0;
    $("garden-next").disabled = layout.page + 1 >= layout.pageCount;
    $("garden-page-label").textContent =
      `第 ${layout.page + 1} / ${layout.pageCount} 座花园`;
    const signature = JSON.stringify({
      plants: state.garden,
      page: gardenPage,
      mode: gardenMode,
      week: gardenWeek,
    });
    $("garden-album-navigation").hidden = gardenView.albumPageCount <= 1;
    $("garden-album-prev").disabled = gardenView.albumPage === 0;
    $("garden-album-next").disabled = gardenView.albumPage + 1 >= gardenView.albumPageCount;
    $("garden-album-range").textContent = `第 ${gardenView.albumStart + 1}—${gardenView.albumStart + gardenView.gardens.length} 座 / 共 ${layout.pageCount} 座`;
    $("garden-jump-control").hidden = layout.pageCount <= 1;
    $("garden-jump").max = String(layout.pageCount);
    if (!$("garden-jump").matches(":focus")) $("garden-jump").value = String(layout.page + 1);
    renderAlbum(JSON.stringify({ plants: gardenView.gardens.map((garden) => garden.plots.map(({ plant }) => plant)), mode: gardenMode, week: gardenWeek, start: gardenView.albumStart }));
    if (signature === gardenSignature) return;
    gardenSignature = signature;
    if (!layout.plots.some((plot) => plot.plant.id === selectedFlower))
      selectedFlower = null;
    const flowers = layout.plots.map(({ plant, x, y, z, rotation }) => {
      const button = el("button", "garden-flower");
      button.type = "button";
      button.dataset.plantId = plant.id;
      button.setAttribute("aria-label", `查看 ${plant.name}`);
      button.setAttribute("aria-expanded", String(selectedFlower === plant.id));
      button.setAttribute("aria-controls", "flower-details");
      button.style.left = `${x / 10}%`;
      button.style.top = `${y / 7.6}%`;
      button.style.zIndex = String(z + 1);
      button.style.setProperty("--flower-rotation", `${rotation}deg`);
      button.append(gardenArtwork(plant.species));
      button.addEventListener("click", () => {
        closeFlowerActions();
        selectedFlower = plant.id;
        renderFlower();
      });
      return button;
    });
    $("garden-grid").replaceChildren(...flowers);
    renderFlower();
  }

  function weekRange(week) {
    const start = new Date(week.start);
    const end = new Date(week.end);
    // end is the exclusive next Monday; calendar subtraction also handles DST.
    end.setDate(end.getDate() - 1);
    const format = (day) => `${day.getFullYear()}/${day.getMonth() + 1}/${day.getDate()}`;
    return `${format(start)}—${format(end)}`;
  }

  function renderAlbum(signature) {
    $("garden-album").hidden = gardenView.layout.total === 0;
    if (signature === albumSignature) {
      for (const card of $("garden-album").querySelectorAll("button")) {
        card.setAttribute("aria-pressed", String(Number(card.dataset.gardenPage) === gardenPage));
      }
      return;
    }
    albumSignature = signature;
    const cards = gardenView.gardens.map((garden) => {
      const card = el("button", "garden-album-card");
      card.type = "button";
      card.dataset.gardenPage = String(garden.page);
      card.setAttribute("aria-pressed", String(garden.page === gardenPage));
      card.setAttribute("aria-label", `查看第 ${garden.page + 1} 座花园，${garden.count} 株花`);
      const scene = el("div", "garden-scene garden-miniature");
      scene.setAttribute("aria-hidden", "true");
      const landscape = document.querySelector(".garden-island-card .garden-landscape").cloneNode(true);
      // Each miniature needs its own paint IDs instead of duplicate SVG IDs.
      const prefix = `album-${garden.page}-`;
      for (const node of landscape.querySelectorAll("[id]")) node.id = prefix + node.id;
      for (const node of landscape.querySelectorAll("*")) {
        for (const attribute of [...node.attributes]) {
          if (attribute.value.includes("url(#")) {
            node.setAttribute(attribute.name, attribute.value.replace(/url\(#([^)]*)\)/g, `url(#${prefix}$1)`));
          }
        }
      }
      scene.append(landscape);
      const swing = $("garden-ambience").querySelector(".ambience-swing").cloneNode(true);
      scene.append(swing);
      for (const { plant, x, y, z } of garden.plots) {
        const flower = el("span", "garden-flower");
        flower.style.left = `${x / 10}%`;
        flower.style.top = `${y / 7.6}%`;
        flower.style.zIndex = String(z + 1);
        flower.append(gardenArtwork(plant.species));
        scene.append(flower);
      }
      const caption = el("span", "garden-album-caption");
      caption.append(el("span", "", `${garden.count} 株`));
      card.append(scene, caption);
      card.addEventListener("click", () => {
        gardenPage = garden.page;
        changeGardenPage(0);
      });
      return card;
    });
    $("garden-album").replaceChildren(...cards);
  }

  function renderWeekIndex() {
    $("garden-week-browser").hidden = gardenMode !== "week";
    const index = Math.max(0, gardenView.weeks.findIndex((week) => week.key === gardenWeek));
    const page = Math.floor(index / WEEK_GROUP_SIZE);
    const start = page * WEEK_GROUP_SIZE;
    const visible = gardenView.weeks.slice(start, start + WEEK_GROUP_SIZE);
    const signature = JSON.stringify({ start, weeks: visible });
    if (signature !== weekSignature) {
      weekSignature = signature;
      const cards = visible.map((week) => {
        const button = el("button", "garden-week-card");
        button.type = "button";
        button.dataset.week = week.key;
        button.setAttribute("aria-label", `${week.current ? "本周，" : ""}${weekRange(week)}，${week.count} 株花`);
        button.append(
          el("span", "week-card-title", week.current ? "本周" : `${new Date(week.start).getMonth() + 1} 月 ${new Date(week.start).getDate()} 日这一周`),
          el("span", "week-card-range", weekRange(week)),
          el("span", "week-card-count", `${week.count} 株已开花`),
        );
        button.addEventListener("click", () => changeGardenScope("week", week.key));
        return button;
      });
      $("garden-week-list").replaceChildren(...cards);
    }
    for (const button of $("garden-week-list").querySelectorAll("button"))
      button.setAttribute("aria-pressed", String(button.dataset.week === gardenWeek));
    $("garden-week-navigation").hidden = gardenView.weeks.length <= WEEK_GROUP_SIZE;
    $("garden-week-prev").disabled = start + visible.length >= gardenView.weeks.length;
    $("garden-week-next").disabled = page === 0;
    $("garden-week-range").textContent = `第 ${start + 1}—${start + visible.length} 周 / 共 ${gardenView.weeks.length} 周`;
    $("garden-this-week").disabled = gardenView.weeks.some((week) => week.current && week.key === gardenWeek);
  }

  function placeFlowerActions(inDrawer) {
    const container = $(inDrawer ? "flower-drawer-actions" : "flower-action-home");
    for (const id of ["rename-panel", "delete-panel"])
      if ($(id).parentElement !== container) container.append($(id));
  }

  function closeFlowerDrawer(restoreFocus = false) {
    const previous = selectedFlower;
    const ownedActions = !$("flower-drawer").hidden ||
      $("rename-panel").parentElement === $("flower-drawer-actions") ||
      $("delete-panel").parentElement === $("flower-drawer-actions");
    selectedFlower = null;
    flowerSignature = "";
    $("flower-drawer").hidden = true;
    $("flower-details").hidden = true;
    if (ownedActions) closeFlowerActions();
    placeFlowerActions(false);
    for (const button of $("garden-grid").querySelectorAll("button"))
      button.setAttribute("aria-expanded", "false");
    if (restoreFocus && previous)
      [...$("garden-grid").querySelectorAll("button")]
        .find((button) => button.dataset.plantId === previous)?.focus({ preventScroll: true });
  }

  function renderFlower() {
    const plant = state.garden.find((item) => item.id === selectedFlower);
    if (!plant || $("view-garden").hidden) {
      closeFlowerDrawer(false);
      return;
    }
    const opening = $("flower-drawer").hidden;
    $("flower-details").hidden = false;
    for (const button of $("garden-grid").querySelectorAll("button")) {
      button.setAttribute(
        "aria-expanded",
        String(button.dataset.plantId === selectedFlower),
      );
    }
    const signature = JSON.stringify([plant.id, plant.name, plant.species, plant.createdAt, plant.bloomAt, plant.targetMs]);
    if (signature === flowerSignature && !opening) return;
    flowerSignature = signature;
    const heading = el("h2", "flower-detail-title", plant.name);
    heading.id = "flower-detail-title";
    const metadata = el("dl", "flower-metadata");
    const artwork = el("div", "flower-detail-art");
    const picture = el("div", "plant-sprite");
    picture.setAttribute("aria-hidden", "true");
    sprite(picture, plant.species, 4);
    artwork.append(picture);
    for (const [label, value] of [
      ["种下", date(plant.createdAt)],
      ["开花", date(plant.bloomAt)],
      ["品种", species(plant.species).name],
      ["累计生长", minutes(plant.targetMs)],
    ]) {
      metadata.append(el("dt", "", label), el("dd", "", value));
    }
    const actions = el("div", "action-row");
    const rename = el("button", "button quiet small", "重命名");
    rename.id = "flower-rename";
    rename.type = "button";
    rename.addEventListener("click", () => openRename(plant));
    const remove = el("button", "button text-danger small", "移除这朵花");
    remove.id = "flower-remove";
    remove.type = "button";
    remove.addEventListener("click", () => openDelete(plant));
    actions.append(rename, remove);
    $("flower-details").replaceChildren(heading, artwork, metadata, actions);
    $("flower-drawer").hidden = false;
    if (opening) $("flower-drawer-close").focus({ preventScroll: true });
  }

  function changeGardenPage(delta) {
    gardenPage += delta;
    if (typeof closeFlowerDrawer === "function") closeFlowerDrawer(false);
    selectedFlower = null;
    closeFlowerActions();
    gardenSignature = "";
    if (state) renderGarden();
    saveGardenView();
  }

  function closeFlowerActions() {
    $("rename-panel").hidden = true;
    $("delete-panel").hidden = true;
    renameId = null;
    deleteId = null;
  }

  function saveGardenView() {
    try {
      localStorage.setItem("garden-view", JSON.stringify({ mode: gardenMode, week: gardenWeek, page: gardenPage }));
    } catch (_) {
      // A blocked local preference store must not affect the plant database.
    }
  }

  function changeGardenScope(mode, week = gardenWeek) {
    gardenMode = mode;
    gardenWeek = week;
    gardenPage = 0;
    changeGardenPage(0);
  }

  function render() {
    $("loading").hidden = true;
    const exists = (id) => state.active?.id === id || state.garden.some((plant) => plant.id === id);
    if ((renameId && !exists(renameId)) || (deleteId && !exists(deleteId)))
      closeFlowerActions();
    renderCurrent();
    renderGarden();
    if (!$("rules-edit-panel").hidden && editPlantId !== state.active?.id) {
      $("rules-edit-panel").hidden = true;
      editPlantId = null;
    }
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
      ".action-panel button, #confirm-plant, #pause, #rename-save, #save-rules-edit",
    ))
      button.disabled = true;
    $("error").hidden = true;
    try {
      const result = await store.apply(input);
      state = result.partial ? await store.load() : result.state;
      if (success) success();
      render();
      return true;
    } catch (error) {
      showError(error);
      return false;
    } finally {
      busy = false;
      for (const button of document.querySelectorAll(
        ".action-panel button, #confirm-plant, #pause, #rename-save, #save-rules-edit",
      ))
        button.disabled = false;
    }
  }

  function addRule(containerId = "rules", seed = null, focusNew = true) {
    const container = $(containerId);
    if (container.children.length >= 20) {
      notice("每株植物最多添加 20 条规则。");
      return;
    }
    const number = ++ruleCounter;
    const row = el("div", "rule-row");
    const top = el("div", "rule-top");
    const type = el("select", "rule-type");
    type.setAttribute("aria-label", `规则 ${number} 类型`);
    for (const [value, text] of [
      ["category", "分类"],
      ["superCategory", "大类"],
      ["app", "程序"],
      ["website", "网站"],
    ]) {
      const option = el("option", "", text);
      option.value = value;
      type.append(option);
    }
    type.value = seed?.type || "category";
    const remove = el("button", "button text-danger small remove-rule", "移除");
    remove.type = "button";
    remove.setAttribute("aria-label", `移除规则 ${number}`);
    remove.addEventListener("click", () => {
      if (container.children.length === 1) {
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
    value.value = ["app", "website"].includes(seed?.type) ? seed.value : "";
    const category = el("select", "rule-category");
    category.required = true;
    category.setAttribute("aria-label", `规则 ${number} 分类`);
    category.dataset.savedValue = ["category", "superCategory"].includes(
      seed?.type,
    )
      ? seed.value
      : "";
    category.dataset.savedLabel = seed?.label || category.dataset.savedValue;
    category.addEventListener("change", () => {
      category.dataset.savedValue = category.value;
      category.dataset.savedLabel =
        category.selectedOptions[0]?.dataset.label || "";
      category.setCustomValidity("");
    });
    const exactLabel = el("label", "rule-exact");
    const exact = el("input");
    exact.type = "checkbox";
    exact.className = "rule-exact-input";
    exact.checked = seed?.exact === true;
    exactLabel.append(exact, "精确匹配程序名（忽略大小写和 .exe）");
    function changeType() {
      const grouped = ["category", "superCategory"].includes(type.value);
      category.hidden = !grouped;
      category.disabled = !grouped;
      value.hidden = grouped;
      value.disabled = grouped;
      exactLabel.hidden = type.value !== "app";
      exact.disabled = type.value !== "app";
      value.placeholder =
        type.value === "website"
          ? "例如：example.com，或粘贴网址"
          : "例如：Code、Acrobat";
      value.setCustomValidity("");
      refreshRuleOptions(row);
    }
    type.addEventListener("change", () => {
      category.value = "";
      category.dataset.savedValue = "";
      category.dataset.savedLabel = "";
      changeType();
    });
    value.addEventListener("input", () => value.setCustomValidity(""));
    row.append(top, category, value, exactLabel);
    container.append(row);
    changeType();
    if (focusNew && container.children.length > 1) {
      (category.disabled ? value : category).focus();
    }
  }

  function readRules(containerId) {
    return [...$(containerId).children].map((row) => {
      const type = row.querySelector(".rule-type").value;
      const grouped = ["category", "superCategory"].includes(type);
      const category = row.querySelector(".rule-category");
      return {
        type,
        value: grouped
          ? category.value
          : row.querySelector(".rule-value").value,
        label: grouped
          ? (
              category.selectedOptions[0]?.dataset.label ||
              category.dataset.savedLabel ||
              category.value
            ).slice(0, 80)
          : "",
        exact: type === "app" && row.querySelector(".rule-exact-input").checked,
      };
    });
  }

  function rawPlant() {
    return {
      name: $("plant-name-input").value,
      species:
        document.querySelector('input[name="species"]:checked')?.value ||
        C.SPECIES[0].id,
      targetMinutes: Number($("target-minutes").value),
      rules: readRules("rules"),
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
    previewSpecies(C.SPECIES[0].id);
    $("rules").replaceChildren();
    ruleCounter = 0;
    addRule("rules", null, false);
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
    tab("current");
    resetPlantForm();
    $("plant-form-panel").hidden = false;
    $("start-plant").hidden = true;
    $("plant-name-input").focus();
    refreshCatalogs();
  }

  function closePlant() {
    resetPlantForm();
    $("plant-form-panel").hidden = Boolean(state?.active);
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
      notice("种好了。回到符合分类或规则的活动，它就会开始生长。");
    });
  }

  function openRulesEdit() {
    if (!state?.active) return;
    editPlantId = state.active.id;
    $("edit-rules-list").replaceChildren();
    for (const rule of state.active.rules)
      addRule("edit-rules-list", rule, false);
    $("rules-edit-panel").hidden = false;
    $("rename-panel").hidden = true;
    $("delete-panel").hidden = true;
    $("cancel-rules-edit").focus();
    refreshCatalogs();
  }

  async function saveRulesEdit() {
    if (!$("rules-edit-form").reportValidity()) return;
    const rules = readRules("edit-rules-list");
    try {
      C.validateRules(rules);
    } catch (error) {
      showError(error);
      return;
    }
    await command({ type: "rules", id: editPlantId, rules }, () => {
      $("rules-edit-panel").hidden = true;
      editPlantId = null;
      notice("生长规则已更新，已有进度、开花目标和惩罚设置都已保留。");
    });
  }

  function openRename(plant) {
    placeFlowerActions(!$("flower-drawer").hidden && selectedFlower === plant.id);
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
    const saved = await command(
      { type: "rename", id: renameId, name: $("rename-input").value },
      () => {
        $("rename-panel").hidden = true;
        notice("名字保存好了。");
      },
    );
    if (saved && !$("flower-drawer").hidden)
      $("flower-rename")?.focus({ preventScroll: true });
  }

  function openDelete(plant) {
    placeFlowerActions(!$("flower-drawer").hidden && selectedFlower === plant.id);
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
    radio.addEventListener("change", () => previewSpecies(item.id));
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
  $("garden-prev").addEventListener("click", () => changeGardenPage(-1));
  $("garden-next").addEventListener("click", () => changeGardenPage(1));
  $("garden-motion").addEventListener("change", () => {
    ambienceEnabled = $("garden-motion").checked;
    try { localStorage.setItem("garden-ambience", String(ambienceEnabled)); } catch (_) { /* Local display preference only. */ }
    updateAmbience();
  });
  document.addEventListener("visibilitychange", updateAmbience);
  reducedMotion.addEventListener("change", updateAmbience);
  $("garden-album-prev").addEventListener("click", () => {
    if (gardenView) changeGardenPage((gardenView.albumPage - 1) * GardenLayout.ALBUM_SIZE - gardenPage);
  });
  $("garden-album-next").addEventListener("click", () => {
    if (gardenView) changeGardenPage((gardenView.albumPage + 1) * GardenLayout.ALBUM_SIZE - gardenPage);
  });
  function jumpToGarden() {
    if (!gardenView || !$("garden-jump").reportValidity()) return;
    const page = Number($("garden-jump").value) - 1;
    if (Number.isSafeInteger(page)) changeGardenPage(page - gardenPage);
  }
  $("garden-jump-confirm").addEventListener("click", jumpToGarden);
  $("garden-jump").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      jumpToGarden();
    }
  });
  $("garden-mode-week").addEventListener("click", () => changeGardenScope("week"));
  $("garden-mode-all").addEventListener("click", () => changeGardenScope("all"));
  $("garden-this-week").addEventListener("click", () => changeGardenScope("week", ""));
  function moveGardenWeek(delta) {
    if (!gardenView) return;
    const index = gardenView.weeks.findIndex((week) => week.key === gardenWeek);
    const group = Math.floor(Math.max(0, index) / WEEK_GROUP_SIZE) + delta;
    const week = group >= 0 ? gardenView.weeks[group * WEEK_GROUP_SIZE] : null;
    if (week) changeGardenScope("week", week.key);
  }
  $("garden-week-prev").addEventListener("click", () => moveGardenWeek(1));
  $("garden-week-next").addEventListener("click", () => moveGardenWeek(-1));
  $("cancel-plant").addEventListener("click", closePlant);
  $("confirm-plant").addEventListener("click", plant);
  $("add-rule").addEventListener("click", () => addRule());
  $("edit-rules").addEventListener("click", openRulesEdit);
  $("add-edit-rule").addEventListener("click", () =>
    addRule("edit-rules-list"),
  );
  $("save-rules-edit").addEventListener("click", saveRulesEdit);
  $("cancel-rules-edit").addEventListener("click", () => {
    $("rules-edit-panel").hidden = true;
    editPlantId = null;
  });
  for (const id of ["refresh-catalogs", "refresh-edit-catalogs"]) {
    $(id).addEventListener("click", refreshCatalogs);
  }
  $("rules-edit-form").addEventListener("submit", (event) =>
    event.preventDefault(),
  );
  $("rules-edit-form").addEventListener("keydown", (event) => {
    if (
      event.key !== "Enter" ||
      event.target.tagName !== "INPUT" ||
      event.target.type === "checkbox"
    )
      return;
    event.preventDefault();
    saveRulesEdit();
  });
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
  $("flower-drawer-close").addEventListener("click", () => closeFlowerDrawer(true));
  document.addEventListener("pointerdown", (event) => {
    if (!$("flower-drawer").hidden && !$("flower-drawer").contains(event.target) &&
        !event.target.closest?.(".garden-flower")) closeFlowerDrawer(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || $("flower-drawer").hidden) return;
    event.preventDefault();
    if (!$("rename-panel").hidden || !$("delete-panel").hidden) {
      const action = !$("rename-panel").hidden ? "flower-rename" : "flower-remove";
      closeFlowerActions();
      $(action)?.focus({ preventScroll: true });
    } else closeFlowerDrawer(true);
  });
  $("rename-cancel").addEventListener("click", () => {
    $("rename-panel").hidden = true;
    if (!$("flower-drawer").hidden) $("flower-rename")?.focus({ preventScroll: true });
  });
  $("delete-cancel").addEventListener("click", () => {
    $("delete-panel").hidden = true;
    if (!$("flower-drawer").hidden) $("flower-remove")?.focus({ preventScroll: true });
  });
  $("delete-confirm").addEventListener("click", async () => {
    const fromDrawer = !$("flower-drawer").hidden;
    const removed = await command({ type: "delete", id: deleteId }, () => {
      $("delete-panel").hidden = true;
      notice("已移除这株植物。");
    });
    if (removed && fromDrawer) $("tab-garden").focus({ preventScroll: true });
  });
  try {
    ambienceEnabled = localStorage.getItem("garden-ambience") !== "false";
    compact(localStorage.getItem("garden-compact") === "true");
    const saved = JSON.parse(localStorage.getItem("garden-view") || "null");
    if (saved && typeof saved === "object") {
      // Weekly albums are the default even when an older page saved the all-time mode.
      gardenMode = "week";
      gardenWeek = typeof saved.week === "string" ? saved.week : "";
      gardenPage = Number.isSafeInteger(saved.page) ? Math.max(0, saved.page) : 0;
    }
  } catch (_) {
    compact(false);
  }
  updateAmbience();
  resetPlantForm();
  refreshCatalogs();
  poll();
  setInterval(poll, 2000);
})();
