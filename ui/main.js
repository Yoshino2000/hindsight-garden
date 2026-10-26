// The page uses the same small classic-script modules as the worker. Commands are committed
// through the store; an open page never pretends to observe the foreground on its own.
(() => {
  "use strict";
  const I = GardenI18n;
  const t = I.t;
  I.localizeDocument(document);
  const C = GardenCore;
  const $ = (id) => document.getElementById(id);
  const STAGES = [t("种子"), t("发芽"), t("长叶"), t("花苞"), t("开花")];
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
    { readonlyArchive: true },
  );
  const selectGardenView = GardenLayout.createViewSelector();
  let state = null;
  let busy = false;
  let polling = false;
  let generation = 0;
  let selectedFlower = null;
  let flowerSignature = "";
  let noteId = null;
  let planSignature = "";
  let collectionSignature = "";
  let reviewSignature = "";
  let focusSignature = "";
  let gardenTheme = "meadow";
  let selectedAchievement = null;
  let achievementFilter = "all";
  let commandScope = null;
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
  let weekSignature = "";
  let ambienceEnabled = true;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const visitors = GardenAmbience.createVisitors(
    document.querySelector(".ambience-bird"), document.querySelector(".ambience-butterfly"),
  );
  GardenAmbience.createThemeEffects(document.querySelector(".garden-scene:not(.garden-miniature)"));
  const breeze = GardenBreeze.createBreeze($("garden-grid"));
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
    const item = C.SPECIES.find((item) => item.id === id) || C.SPECIES[0];
    return { ...item, name: t(item.name), description: t(item.description) };
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
      ? t("{0} 秒", Math.floor(value * 60))
      : t("{0} 分钟", Number(value.toFixed(1)));
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
      t("资料：") + guide.sources.map((source) => source.label).join(" · ");
    $("species-preview-sources").title = guide.sources.map((source) => source.url).join("\n");
  }

  function gardenArtwork(id, variant = "normal") {
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
    GardenVariants.decorate(svg, image, safeId, variant);
    return svg;
  }

  function date(at) {
    const value = new Date(at);
    return Number.isFinite(value.getTime())
      ? value.toLocaleDateString(I.locale, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";
  }

  function showError(error, source = "action") {
    errorSource = source;
    $("error").textContent = I.message(error?.message || String(error));
    $("error").hidden = source === "action" && commandScope !== null && commandScope !== currentTab();
  }

  function currentTab() { return $("view-garden").hidden ? "current" : "garden"; }

  function notice(text) {
    $("notice").textContent = text;
    $("notice").hidden = !text || (commandScope !== null && commandScope !== currentTab());
  }

  function tab(name, focus = false) {
    if (name !== currentTab()) {
      $("notice").hidden = true;
      $("notice").textContent = "";
      if (["action", "date"].includes(errorSource)) { $("error").hidden = true; $("error").textContent = ""; errorSource = ""; }
      closeFlowerActions();
      closeAchievementDrawer(false);
    }
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
    breeze.setRunning(enabled && running);
    $("garden-motion").checked = enabled;
    $("garden-motion").disabled = reducedMotion.matches;
    $("garden-motion-hint").textContent = reducedMotion.matches
      ? t("已跟随系统减少动态效果")
      : ({
        rain: t("细雨落向草地，叶伞轻动，水面泛起微波"),
        dusk: t("暖灯轻映草地，偶有萤火，小鸟和蝴蝶来访"),
        blossom: t("樱瓣偶落，石灯笼轻映草地，小鸟和蝴蝶来访"),
      }[$("view-garden").dataset.theme] || t("秋千轻摆，小鸟约每 15–30 秒来访，水面泛起微波"));
    $("garden-motion").closest(".garden-motion-setting").title = $("garden-motion-hint").textContent;
  }

  function compact(enabled) {
    document.body.classList.toggle("compact", enabled);
    $("compact-toggle").setAttribute("aria-pressed", String(enabled));
    $("compact-toggle").textContent = enabled ? t("完整花园") : t("紧凑模式");
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
      const type = rule.type === "category" ? t("分类") : t("大类");
      const name = item?.name || rule.label || rule.value;
      return item || !catalog.loaded
        ? `${type} · ${name}`
        : t("已删除{0}（{1}）", type, name);
    }
    return rule.type === "website"
      ? t("网站 · {0}", rule.value)
      : t("程序{0} · {1}", rule.exact ? t("（精确）") : t("（包含）"), rule.value);
  }

  function catalogStatus() {
    const failed = Object.entries(catalogs).filter(([, value]) => value.error);
    const text = catalogRequest
      ? t("正在读取 Hindsight 分类…")
      : failed.length
        ? t("{0}读取失败，可刷新重试；程序和网站仍可手动填写。", failed.map(([type]) => (type === "category" ? t("分类") : t("大类"))).join("、"))
        : t("已读取 {0} 个分类、{1} 个大类。分类变动后请刷新。", catalogs.category.items.length, catalogs.superCategory.items.length);
    for (const id of ["catalog-status", "edit-catalog-status"])
      $(id).textContent = text;
    for (const id of ["refresh-catalogs", "refresh-edit-catalogs"])
      $(id).disabled = Boolean(catalogRequest);
  }

  function readCatalog(method) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error(t("读取分类超时，请稍后刷新。"))),
        8000,
      );
      Promise.resolve()
        .then(() => hindsight.call(method, {}))
        .then(
          (items) => {
            clearTimeout(timeout);
            if (!Array.isArray(items)) throw new Error(t("分类列表格式不正确。"));
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
    const typeName = type === "category" ? t("分类") : t("大类");
    const placeholder = el(
      "option",
      "",
      catalog.items.length
        ? t("请选择{0}", typeName)
        : catalogRequest
          ? t("正在读取{0}…", typeName)
          : catalog.error
            ? t("{0}读取失败，可切换为程序或网站", typeName)
            : t("暂无{0}，可切换为程序或网站", typeName),
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
        ? t("已删除{0}（{1}）", type === "category" ? t("分类") : t("大类"), savedLabel)
        : t("{0}（等待读取）", savedLabel);
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
      if (state) { renderCurrent(); renderPlans(); }
    } finally {
      catalogRequest = null;
      catalogStatus();
    }
  }

  function penaltyText(penalty) {
    if (!penalty?.enabled) return t("累计模式：切到其他活动只暂停，不扣进度。");
    const amount =
      penalty.kind === "minutes"
        ? t("{0} 分钟", penalty.amount)
        : t("当时已有进度的 {0}%", penalty.amount);
    return t("中断惩罚：宽限 {0} 秒后扣减{1}，每次中断只扣一次。手动暂停和离开电脑不扣。", penalty.graceSeconds, amount);
  }

  function idFor(prefix) {
    return globalThis.crypto?.randomUUID?.() || `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function selectedPlan() {
    return $("plan-select").value === "last"
      ? state?.lastPlanting
      : state?.plans.find((item) => item.id === $("plan-select").value);
  }

  function categoryName(rule) {
    const catalog = catalogs[rule.type];
    const item = catalog?.items.find((item) => item.id === rule.value);
    return item?.name || (catalog?.loaded && !catalog.error && rule.value
      ? t("{0}（已删除）", rule.label || rule.value) : "");
  }

  function renderPlanNamePreview() {
    $("plan-name-preview").textContent = t("显示为：") + GardenCollection.planLabel({ ...rawPlant(), name: $("plan-name").value }, categoryName);
  }

  function renderPlanSummary() {
    const plan = selectedPlan();
    const editable = Boolean(plan && $("plan-select").value !== "last");
    $("plan-use").disabled = !plan || busy;
    $("plan-update").disabled = !editable || busy;
    $("plan-delete").disabled = !editable || busy;
    renderPlanNamePreview();
    $("plan-summary").textContent = plan
      ? t("{0} · {1} 分钟 · {2}\n{3}", species(plan.species).name, plan.targetMinutes, plan.rules.map(ruleText).join("；"), penaltyText(plan.penalty))
      : t("选好下方设置后，可以把常用的品种、规则和时长保存成方案。");
  }

  function renderPlans() {
    const signature = JSON.stringify([state.plans, state.lastPlanting, catalogs.category.items, catalogs.superCategory.items]);
    if (signature !== planSignature) {
      planSignature = signature;
      const selected = $("plan-select").value;
      const empty = el("option", "", t("选择方案，或使用上次设置"));
      empty.value = "";
      const options = [empty];
      if (state.lastPlanting) {
        const last = el("option", "", t("沿用上次种植设置"));
        last.value = "last";
        options.push(last);
      }
      for (const plan of state.plans) {
        const option = el("option", "", GardenCollection.planLabel(plan, categoryName));
        option.value = plan.id;
        options.push(option);
      }
      $("plan-select").replaceChildren(...options);
      $("plan-select").value = options.some((item) => item.value === selected) ? selected : "";
    }
    renderPlanSummary();
  }

  function usePlan() {
    const plan = selectedPlan();
    if (!plan || state?.active || busy) return;
    const radio = [...document.querySelectorAll('input[name="species"]')].find((item) => item.value === plan.species);
    if (radio) radio.checked = true;
    previewSpecies(plan.species);
    $("target-minutes").value = String(plan.targetMinutes);
    $("rules").replaceChildren();
    for (const rule of plan.rules) addRule("rules", rule, false);
    $("penalty-enabled").checked = plan.penalty.enabled;
    $("penalty-kind").value = plan.penalty.kind;
    $("penalty-amount-label").textContent = plan.penalty.kind === "percent" ? t("扣减比例（%）") : t("扣减时间（分钟）");
    $("penalty-amount").max = plan.penalty.kind === "percent" ? "100" : "1440";
    $("penalty-amount").value = String(plan.penalty.amount);
    $("penalty-grace").value = String(plan.penalty.graceSeconds);
    $("penalty-options").hidden = !plan.penalty.enabled;
    for (const input of $("penalty-options").querySelectorAll("input, select")) input.disabled = !plan.penalty.enabled;
    notice(t("已载入设置。{0}花名与任务备注由你填写，确认后再播种。", plan.penalty.enabled ? t("本方案启用了中断惩罚，请检查扣减设置。") : t("累计模式，中断只暂停。")));
    // Loading a preset changes settings, never starts a plant or copies an old task.
    $("plant-name-input").focus();
  }

  async function savePlan(update = false) {
    if (!state || busy) return;
    const current = update ? selectedPlan() : null;
    if (update && (!current || $("plan-select").value === "last")) return;
    const id = current?.id || idFor("plan");
    const input = rawPlant();
    input.name = input.name.trim() || species(input.species).name;
    const saved = await command({ type: "savePlan", id, name: $("plan-name").value, plant: input }, () => {
      notice(update ? t("已用当前设置更新方案。") : t("种植方案已保存。以后选中它并点击「使用此方案」即可。"));
    });
    if (saved) { $("plan-select").value = id; renderPlanSummary(); }
  }

  function renderReview() {
    const signature = JSON.stringify([gardenMode, gardenWeek, gardenView.review]);
    if (signature === reviewSignature) return;
    reviewSignature = signature;
    const review = gardenView.review;
    $("week-review-title").textContent = gardenMode === "week" ? t("这一周的回顾") : t("全部收藏回顾");
    $("week-review-stats").replaceChildren(...[
      [t("已开花"), t("{0} 株", review.count)], [t("收集品种"), t("{0} 种", review.speciesCount)],
      [t("完成目标时长"), GardenCollection.totalTime(review.targetMs)],
    ].map(([label, value]) => {
      const item = el("div", "review-stat");
      item.append(el("dt", "", label), el("dd", "", value));
      return item;
    }));
    $("week-review-note").textContent = t("按开花日期归周；跨周生长的花，目标时长全部归到开花周。这不是当周实际活动时长，当前盆栽不计入。");
    $("week-review-species").replaceChildren(...review.species.map((item) =>
      el("span", "", `${species(item.id).name} ${item.count}`),
    ));
  }

  function focusTime(value) {
    return value < 3600000 ? minutes(value) : GardenCollection.totalTime(value);
  }

  function achievementProgressText(item) {
    if (["focusStreak", "focusTotal"].includes(item.metric))
      return `${focusTime(item.current)} / ${focusTime(item.target)}`;
    if (item.metric === "focusCategories") return t("{0} / {1} 个达标分类", item.current, item.target);
    if (item.metric === "focusRatio") return t("{0}% 条件进度", item.current);
    return `${item.current} / ${item.target}${["blooms", "hiddenBlooms"].includes(item.metric) ? t(" 朵") : ["species", "hiddenSpecies"].includes(item.metric) ? t(" 种") : ""}`;
  }

  function focusAchievementActual(item) {
    const summary = C.focusSummary(state);
    if (item.metric === "focusStreak") return t("最长连续 {0}", focusTime(summary.longestMs));
    if (item.metric === "focusTotal") return focusTime(summary.totalMs);
    if (item.metric === "focusCategories") return t("{0} 个分类各达到 10 分钟", summary.qualifiedCategories);
    return t("有效生长 {0}；第 {1} 大分类占比 {2}%", focusTime(summary.totalMs), item.displayTier.requiredCategories, Number(item.displayTier.actualSharePercent.toFixed(1)));
  }

  function renderFocusStatistics() {
    const signature = JSON.stringify(state.focusStats);
    if (signature === focusSignature) return;
    focusSignature = signature;
    const summary = C.focusSummary(state);
    $("focus-statistics-since").textContent = t("{0} · 只统计养花且匹配规则时的有效生长时间，历史花朵不回推。", summary.startedAt === null ? t("从升级后首次记录开始") : t("{0} 起记录", date(summary.startedAt)));
    $("focus-statistics-summary").replaceChildren(...[
      [t("累计有效生长"), summary.totalMs], [t("最长连续"), summary.longestMs], [t("本次连续"), summary.streakMs],
    ].map(([label, value]) => {
      const row = el("div");
      row.append(el("dt", "", label), el("dd", "", focusTime(value)));
      return row;
    }));
    const colors = ["#7e9f79", "#87a6c0", "#b297c4", "#d0ad69", "#ce9f9b", "#8eb8ac"];
    const categoryColors = new Map((state.focusStats?.categories || []).map((bucket, index) =>
      [bucket.id, colors[index % colors.length]]));
    const categoryNames = new Map((state.focusStats?.categories || []).map(bucket => [bucket.id, bucket.name]));
    const buckets = [...summary.buckets].sort((first, second) => second.ms - first.ms);
    const color = (bucket) => {
      if (bucket.kind !== "category") return bucket.kind === "other" ? "#a6afa2" : "#c5c9c1";
      return categoryColors.get(bucket.id) || colors[0];
    };
    $("focus-distribution-bar").replaceChildren(...buckets.map((bucket) => {
      const segment = el("span");
      segment.style.width = `${bucket.percent}%`;
      segment.style.backgroundColor = color(bucket);
      return segment;
    }));
    const rows = buckets.map((bucket) => {
      const row = el("li");
      const dot = el("span", "focus-category-dot");
      dot.style.backgroundColor = color(bucket);
      row.append(dot, el("span", "focus-category-name", bucket.kind === "category" ? categoryNames.get(bucket.id) || t("未命名分类") : I.message(bucket.name)),
        el("span", "", `${Number(bucket.percent.toFixed(1))}% · ${focusTime(bucket.ms)}`));
      return row;
    });
    $("focus-distribution-preview").replaceChildren(...rows.slice(0, 4));
    $("focus-distribution-rest").replaceChildren(...rows.slice(4));
    $("focus-distribution-more").hidden = rows.length <= 4;
    $("focus-distribution-empty").hidden = summary.totalMs !== 0;
    $("focus-distribution-bar").hidden = summary.totalMs === 0;
  }

  function renderCollection() {
    renderFocusStatistics();
    const progress = C.achievementProgress(state).map(I.achievement);
    $("hidden-collection-status").textContent = t("梦色收藏：{0} 株 · {1} / 8 种", state.hiddenCollection?.totalBlooms || 0, state.hiddenCollection?.species.length || 0);
    const chosen = GardenCollection.theme(gardenTheme, state.earnedAchievements);
    const previousTheme = $("view-garden").dataset.theme;
    $("view-garden").dataset.theme = chosen.id;
    if (previousTheme !== chosen.id) updateAmbience();
    $("garden-theme-label").textContent = chosen.name;
    const groups = GardenCollection.achievementGroups(progress);
    $("collection-summary").textContent = t("{0} / {1} 级 · {2} 组成就 · {3}", progress.filter((item) => item.earnedAt !== null).length, progress.length, groups.length, chosen.name);
    const signature = JSON.stringify([progress, chosen.id, achievementFilter]);
    if (signature === collectionSignature) return;
    collectionSignature = signature;
    const matches = (item, filter) => filter === "all" ||
      (filter === "earned" ? item.earnedCount > 0 : filter === "blooms" ? item.metric === "blooms" : filter === "hidden" ? item.metric.startsWith("hidden") : filter === "focus" ? item.metric.startsWith("focus") : ["species", "speciesBloom"].includes(item.metric));
    const visible = groups.filter((item) => matches(item, achievementFilter));
    for (const button of $("achievement-filters").children) {
      const filter = button.dataset.filter;
      button.setAttribute("aria-pressed", String(filter === achievementFilter));
      const name = { all: t("全部"), blooms: t("株数里程碑"), species: t("品种收藏"), focus: t("生长记录"), hidden: t("隐藏收藏"), earned: t("已获得") }[filter];
      button.textContent = `${name} ${groups.filter((item) => matches(item, filter)).length}`;
    }
    $("achievement-empty").hidden = visible.length !== 0;
    $("achievement-list").replaceChildren(...visible.map((item) => {
      const card = el("button", "achievement");
      card.type = "button";
      card.dataset.achievement = item.id;
      card.dataset.earned = String(item.earnedCount > 0);
      card.dataset.metal = item.metal;
      card.dataset.complete = String(item.complete);
      card.setAttribute("aria-expanded", String(selectedAchievement === item.id));
      card.setAttribute("aria-controls", "achievement-drawer");
      const level = item.currentTier?.levelName;
      const status = item.complete ? (item.tiers.length > 1 ? t("{0} · 全部达成", level) : t("已获得 · 查看")) :
        `${level ? `${level} · ` : ""}${achievementProgressText(item)}`;
      card.setAttribute("aria-label", t("{0}，{1}，查看各级条件与日期", item.name, status));
      card.title = item.nextTier?.condition || item.currentTier?.condition;
      const bar = el("progress");
      bar.max = item.target;
      bar.value = item.complete ? item.target : item.current;
      bar.setAttribute("aria-label", item.complete ? t("{0} 已全部获得", item.name) : `${item.name} ${achievementProgressText(item)}`);
      card.append(achievementArtwork(item.displayTier), el("span", "achievement-name", item.name),
        el("span", "achievement-status", status), bar);
      card.addEventListener("click", () => {
        closeFlowerDrawer(false);
        selectedAchievement = item.id;
        renderAchievement();
      });
      return card;
    }));
    renderAchievement();
    $("theme-options").replaceChildren(...GardenCollection.THEMES.map((item) => {
      const unlocked = !item.achievement || state.earnedAchievements[item.achievement] !== undefined;
      const button = el("button", "theme-card");
      button.type = "button";
      button.dataset.theme = item.id;
      button.disabled = !unlocked;
      button.setAttribute("aria-pressed", String(chosen.id === item.id));
      button.title = item.description;
      const art = el("span", "theme-art");
      art.setAttribute("aria-hidden", "true");
      if (item.cell !== null) art.style.setProperty("--theme-position", `${item.cell / 2 * 100}%`);
      const milestone = C.ACHIEVEMENTS.find((entry) => entry.id === item.achievement);
      button.append(art, el("strong", "", item.name), el("small", "", unlocked ? chosen.id === item.id ? t("正在使用") : t("点击使用") : t("{0}后解锁", I.message(milestone.name))));
      button.addEventListener("click", () => {
        gardenTheme = item.id;
        try { localStorage.setItem("garden-theme", gardenTheme); } catch (_) { /* Presentation remains usable without local storage. */ }
        renderCollection();
        [...$("theme-options").children].find((button) => button.dataset.theme === item.id)?.focus({ preventScroll: true });
      });
      return button;
    }));
  }

  function achievementArtwork(item) {
    const art = el("span", "achievement-art");
    art.setAttribute("aria-hidden", "true");
    art.dataset.metal = item.metal || "none";
    if (item.metric.startsWith("focus")) {
      art.dataset.focus = item.metric;
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 48 48");
      svg.setAttribute("focusable", "false");
      const path = document.createElementNS(svg.namespaceURI, "path");
      path.setAttribute("d", {
        focusStreak: "M24 8a16 16 0 1 0 0 32 16 16 0 0 0 0-32M24 15v10l7 4M19 3h10",
        focusTotal: "M13 6h22v6c0 6-8 9-11 12 3 3 11 6 11 12v6H13v-6c0-6 8-9 11-12-3-3-11-6-11-12ZM17 37h14M17 11h14",
        focusCategories: "M8 40h32M11 34V23h6v11ZM21 34V14h6v20ZM31 34V7h6v27Z",
        focusRatio: "M24 7v17h17A17 17 0 1 1 24 7ZM29 6v13h13A17 17 0 0 0 29 6Z",
      }[item.metric]);
      svg.append(path);
      art.append(svg);
    } else if (item.metric === "hiddenSpeciesBloom") {
      art.dataset.variant = "hidden";
      art.append(gardenArtwork(item.species, "hidden"));
    } else if (item.metric === "speciesBloom") {
      art.dataset.species = item.species;
      art.style.backgroundImage = `url("../assets/garden/${species(item.species).id}.png")`;
    } else art.style.setProperty("--badge-position", `${item.badge / 3 * 100}%`);
    return art;
  }

  function closeAchievementDrawer(restoreFocus = false) {
    const previous = selectedAchievement;
    selectedAchievement = null;
    $("achievement-drawer").hidden = true;
    for (const button of $("achievement-list").children) button.setAttribute("aria-expanded", "false");
    if (restoreFocus) [...$("achievement-list").children]
      .find((button) => button.dataset.achievement === previous)?.focus({ preventScroll: true });
  }

  function renderAchievement() {
    const item = GardenCollection.achievementGroups(C.achievementProgress(state).map(I.achievement)).find((entry) => entry.id === selectedAchievement);
    if (!item || $("view-garden").hidden) { closeAchievementDrawer(false); return; }
    const opening = $("achievement-drawer").hidden;
    const title = el("h2", "flower-detail-title", item.name);
    title.id = "achievement-detail-title";
    const art = el("div", "achievement-drawer-art");
    art.dataset.metal = item.metal;
    art.dataset.complete = String(item.complete);
    art.append(achievementArtwork(item.displayTier));
    const actual = item.metric === "blooms" ? t("{0} 朵花", state.collection.totalBlooms) :
      item.metric === "species" ? t("{0} 种", state.collection.species.length) : item.metric === "hiddenBlooms" ? t("{0} 朵花", state.hiddenCollection?.totalBlooms || 0) : item.metric === "hiddenSpecies" ? t("{0} 种", state.hiddenCollection?.species.length || 0) : item.metric.startsWith("focus") ? focusAchievementActual(item) : t("{0} / 1 次首次开花", item.current);
    const stats = el("dl", "achievement-detail-stats");
    for (const [label, value] of [[t("当前累计"), actual], [t("已获等级"), `${item.earnedCount} / ${item.tiers.length}`],
      [t("当前等级"), item.currentTier ? item.tiers.length > 1 ? item.currentTier.levelName : t("已获得") : t("尚未获得")],
      [t("下一目标"), item.nextTier?.condition || t("本组成就已全部达成")]])
      stats.append(el("dt", "", label), el("dd", "", value));
    const tiers = el("ol", "achievement-tiers");
    for (const tier of item.tiers) {
      const row = el("li", "achievement-tier");
      row.dataset.metal = tier.metal;
      row.dataset.earned = String(tier.earnedAt !== null);
      const rewards = GardenCollection.THEMES.filter((theme) => theme.achievement === tier.id).map((theme) => theme.name);
      row.append(el("strong", "", `${item.tiers.length > 1 ? `${tier.levelName} · ` : ""}${tier.name}`),
        el("p", "", tier.condition),
        el("small", "", tier.earnedAt !== null ? t("已获得 · {0}（获得/核验日）", date(tier.earnedAt)) : t("尚未获得 · {0}", achievementProgressText(tier))));
      if (rewards.length) row.append(el("small", "", t("解锁「{0}」主题", rewards.join("、"))));
      tiers.append(row);
    }
    $("achievement-details").replaceChildren(title, art, el("p", "achievement-description", item.displayTier.description), stats, tiers,
      el("p", "note-privacy", item.metric.startsWith("hidden") ? t("隐藏配色只在完成时揭晓，品种与目标时长不影响 5% 概率。一次结果会永久保存在花朵记录中；没有保底，也不需要重复抽取。") : item.metric.startsWith("focus")
        ? t("只统计升级后统计起点以来实际获得的有效生长时间，不回推旧花、目标时长或升级前进度。未分类与其他计入总量；分类比例变化不会撤回已获等级。连续段在暂停、离开、不匹配、花开或未观察到的时间间隔后结束。")
        : t("等级只是合并展示，原有条件与获得日期都保留。累计从首次核验时仍保留的收藏开始，此后新开花继续计入，删除不扣回。新成就可能按永久计数补授；获得日期可能为核验日，旧版本已删除的花不能还原。")));
    for (const button of $("achievement-list").children)
      button.setAttribute("aria-expanded", String(button.dataset.achievement === item.id));
    $("achievement-drawer").hidden = false;
    if (opening) $("achievement-close").focus({ preventScroll: true });
  }

  function animateWeekChange() {
    if (reducedMotion.matches || document.visibilityState !== "visible" || $("view-garden").hidden) return;
    for (const id of ["garden-album-panel", "garden-grid"]) {
      const node = $(id);
      node.classList.remove("week-switching");
      void node.offsetWidth;
      node.classList.add("week-switching");
    }
  }

  function renderCurrent() {
    const plant = state.active;
    const explanation = GardenFocus.explain(state, Date.now(), {
      ruleLabel: ruleText,
      catalogs: Object.fromEntries(Object.entries(catalogs).map(([type, catalog]) =>
        [type, catalog.loaded && !catalog.error ? catalog.items : null])),
    });
    const { fresh, growing } = explanation;
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
      ? t("后台运行中 · 只累计符合规则的前台时间")
      : t("等待后台连接或新的活动信息");
    if (!plant) {
      $("plant-form-hint").textContent = state.paused
        ? t("选品种、设置规则和累计时长，然后直接播种。当前处于暂停状态，播种后可点击「继续生长」。")
        : t("选品种、设置生长规则和累计时长，然后直接播种。默认切换活动只暂停，不扣进度。");
      sprite($("hero-sprite"), "sunflower", 0);
      $("growth-status").textContent = state.paused ? t("已暂停") : t("等待播种");
      $("stage-name").textContent = t("从一颗种子开始");
      $("plant-name").textContent = t("给时间种一朵花");
      $("plant-caption").textContent =
        t("选一个现有分类，让日常活动慢慢养出一朵花。");
      $("growth-hint").textContent = state.garden.length
        ? t("上一朵花已留在花园，准备好再种下一盆。")
        : t("符合规则时慢慢生长，离开时安心暂停。");
      $("start-plant").textContent = state.garden.length
        ? t("再种一盆")
        : t("种下第一颗种子");
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
      t("{0} · 一点点长大，也很好", species(plant.species).name);
    $("current-plan-summary").textContent =
      t("累计 {0} 开花 · {1}", minutes(plant.targetMs), plant.penalty.enabled ? t("已开启中断惩罚") : t("累计模式，中断不扣进度"));
    const rules = plant.rules.map(ruleText);
    $("current-rule-summary").textContent =
      t("生长规则：{0}{1}", rules.slice(0, 2).join("；"), rules.length > 2 ? t(" 等 {0} 条", rules.length) : "");
    $("current-rule-summary").title = rules.join("；");
    $("active-target-summary").textContent =
      t("{0} · 累计目标 {1}", species(plant.species).name, minutes(plant.targetMs));
    $("progress-fill").style.width = `${ratio}%`;
    $("progress").setAttribute("aria-valuenow", String(Math.round(ratio)));
    $("progress-time").textContent =
      `${minutes(plant.progressMs)} / ${minutes(plant.targetMs)}`;
    $("progress-percent").textContent = `${Math.floor(ratio)}%`;
    $("pause").textContent = state.paused ? t("继续生长") : t("暂停生长");
    $("growth-status").textContent = growing ? t("正在生长") : explanation.title;
    $("growth-hint").textContent = explanation.summary;
    $("growth-explanation").dataset.status = explanation.code;
    $("growth-explanation-title").textContent = growing ? t("为什么正在生长") : t("为什么暂时没生长");
    $("growth-explanation-summary").textContent = explanation.title;
    $("growth-observation").replaceChildren(...explanation.observations.flatMap(([label, value]) =>
      [el("dt", "", label), el("dd", "", value)]));
    $("growth-advice").textContent = explanation.advice;
    $("active-rules").replaceChildren(
      ...plant.rules.map((rule) => el("li", "", ruleText(rule))),
    );
    $("penalty-summary").textContent = penaltyText(plant.penalty);
    $("active-task-note").textContent = plant.taskNote || t("还没有任务记忆。可以留下一句话，等花开时再回看。");
    $("planted-at").textContent = t("{0} 种下", date(plant.createdAt));
  }

  function renderGarden() {
    const nextView = selectGardenView(state.garden, {
      mode: gardenMode,
      week: gardenWeek,
      page: gardenPage,
    });
    if (nextView === gardenView) return;
    gardenView = nextView;
    const { layout } = gardenView;
    gardenMode = gardenView.mode;
    gardenWeek = gardenView.week;
    gardenPage = layout.page;
    $("garden-count").textContent = String(gardenView.total);
    $("garden-collection-total").textContent = t("已收藏 {0} 株", gardenView.total);
    $("garden-total").textContent = t("{0} 株已开花", layout.plots.length);
    $("garden-scene-title").textContent =
      layout.total ? t("{0}第 {1} 座花园", gardenMode === "week" ? t("这一周的") : t("我的"), layout.page + 1)
        : gardenMode === "week" ? t("这一周的花园") : t("等待第一朵花的花园");
    $("garden-mode-week").setAttribute("aria-pressed", String(gardenMode === "week"));
    $("garden-mode-all").setAttribute("aria-pressed", String(gardenMode === "all"));
    renderWeekIndex();
    renderReview();
    const selectedWeek = gardenView.weeks.find((week) => week.key === gardenWeek);
    const summary = t("{0} · {1} 株 · {2} 座花园", gardenMode === "week" && selectedWeek ? weekRange(selectedWeek) : t("全部收藏"), layout.total, layout.total ? layout.pageCount : 0);
    if ($("garden-period-summary").textContent !== summary)
      $("garden-period-summary").textContent = summary;
    if ($("garden-album-context").textContent !== summary)
      $("garden-album-context").textContent = summary;
    $("garden-empty").textContent = gardenMode === "week"
      ? selectedWeek?.current
        ? t("这一周还没有花朵开花。花开时，它就会留在本周的花园里。")
        : t("这一周没有已收藏的花朵。可以切换其他周，或回到本周继续种花。")
      : t("第一朵花会种在这里。完成当前盆栽，它就会留在这座花园里。");
    if (gardenMode === "week" && layout.total === 0 && gardenView.total > 0)
      $("garden-empty").textContent = t("这一周还没有收藏的花朵。其他周已收藏 {0} 株，可直接在下方周相册中查看。", gardenView.total);
    $("garden-empty-row").hidden = layout.total > 0;
    $("garden-empty").hidden = layout.total > 0;
    $("garden-start").hidden = layout.total > 0;
    $("garden-interaction-hint").hidden = layout.total === 0;
    $("garden-pagination").hidden = layout.pageCount <= 1;
    $("garden-prev").disabled = layout.page === 0;
    $("garden-next").disabled = layout.page + 1 >= layout.pageCount;
    $("garden-page-label").textContent =
      t("第 {0} / {1} 座花园", layout.page + 1, layout.pageCount);
    const signature = JSON.stringify({
      plots: layout.plots.map(({ plant }) => [plant.id, plant.name, plant.species, C.variantOf(plant)]),
    });
    $("garden-album-navigation").hidden = gardenView.albumPageCount <= 1;
    $("garden-album-prev").disabled = gardenView.albumPage === 0;
    $("garden-album-next").disabled = gardenView.albumPage + 1 >= gardenView.albumPageCount;
    $("garden-album-range").textContent = t("第 {0}—{1} 座 / 共 {2} 座", gardenView.albumStart + 1, gardenView.albumStart + gardenView.gardens.length, layout.pageCount);
    $("garden-jump-control").hidden = layout.pageCount <= 1;
    $("garden-jump").max = String(layout.pageCount);
    if (!$("garden-jump").matches(":focus")) $("garden-jump").value = String(layout.page + 1);
    renderAlbum(JSON.stringify({ plants: gardenView.gardens.map((garden) => garden.plots.map(({ plant }) => [plant.id, plant.species, C.variantOf(plant)])), mode: gardenMode, week: gardenWeek, start: gardenView.albumStart }));
    if (signature === gardenSignature) { renderFlower(); return; }
    gardenSignature = signature;
    if (!layout.plots.some((plot) => plot.plant.id === selectedFlower))
      selectedFlower = null;
    const flowers = layout.plots.map(({ plant, x, y, z, rotation }) => {
      const button = el("button", "garden-flower");
      button.type = "button";
      button.dataset.plantId = plant.id;
      button.dataset.variant = C.variantOf(plant);
      button.setAttribute("aria-label", t("查看 {0}", plant.name));
      button.setAttribute("aria-expanded", String(selectedFlower === plant.id));
      button.setAttribute("aria-controls", "flower-details");
      button.style.left = `${x / 10}%`;
      button.style.top = `${y / 7.6}%`;
      button.style.zIndex = String(z + 1);
      button.style.setProperty("--flower-rotation", `${rotation}deg`);
      const bloom = el("span", "garden-flower-bloom");
      bloom.append(gardenArtwork(plant.species, C.variantOf(plant)));
      button.append(bloom);
      button.addEventListener("click", () => {
        closeFlowerActions();
        closeAchievementDrawer(false);
        selectedFlower = plant.id;
        renderFlower();
      });
      return button;
    });
    $("garden-grid").replaceChildren(...flowers);
    breeze.refresh();
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
      card.setAttribute("aria-label", t("查看第 {0} 座花园，{1} 株花", garden.page + 1, garden.count));
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
      scene.append(document.querySelector(".garden-island-card .theme-props").cloneNode(true));
      const swing = $("garden-ambience").querySelector(".ambience-swing").cloneNode(true);
      scene.append(swing);
      for (const { plant, x, y, z } of garden.plots) {
        const flower = el("span", "garden-flower");
        flower.dataset.variant = C.variantOf(plant);
        flower.style.left = `${x / 10}%`;
        flower.style.top = `${y / 7.6}%`;
        flower.style.zIndex = String(z + 1);
        const bloom = el("span", "garden-flower-bloom");
        bloom.append(gardenArtwork(plant.species, C.variantOf(plant)));
        flower.append(bloom);
        scene.append(flower);
      }
      const caption = el("span", "garden-album-caption");
      caption.append(el("span", "", t("{0} 株", garden.count)));
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
    const index = GardenLayout.weekPage(gardenView.weeks, gardenWeek);
    const { page, start, total, pageCount, weeks: visible } = index;
    const signature = JSON.stringify({ start, weeks: visible });
    if (signature !== weekSignature) {
      weekSignature = signature;
      const cards = visible.map((week) => {
        const entry = el("li", "garden-week-entry");
        entry.dataset.week = week.key;
        const button = el("button", "garden-week-card");
        button.type = "button";
        button.dataset.week = week.key;
        button.setAttribute("aria-controls", "garden-album-panel");
        button.setAttribute("aria-label", t("{0}{1}，{2} 株花", week.current ? t("本周，") : "", weekRange(week), week.count));
        const dates = el("span", "week-card-dates");
        const startDate = new Date(week.start);
        const endDate = new Date(week.end);
        endDate.setDate(endDate.getDate() - 1);
        dates.append(el("span", "week-card-title", `${startDate.getMonth() + 1}/${startDate.getDate()}—${endDate.getMonth() + 1}/${endDate.getDate()}`));
        dates.append(el("span", "week-card-range", week.current ? t("本周") : String(startDate.getFullYear())));
        button.title = weekRange(week);
        button.append(dates, el("span", "week-card-count", t("{0} 株", week.count)));
        button.addEventListener("click", () => changeGardenScope("week", week.key));
        entry.append(button);
        return entry;
      });
      $("garden-week-list").replaceChildren(...cards);
    }
    for (const entry of $("garden-week-list").children) {
      const selected = entry.dataset.week === gardenWeek;
      entry.dataset.selected = String(selected);
      entry.firstElementChild.setAttribute("aria-pressed", String(selected));
    }
    $("garden-album-layout").dataset.mode = gardenMode;
    $("garden-week-navigation").hidden = pageCount <= 1;
    $("garden-week-prev").disabled = page === 0;
    $("garden-week-next").disabled = index.next === null;
    $("garden-week-range").textContent = t("第 {0} / {1} 页 · {2}—{3} / {4} 周", page + 1, pageCount, start + 1, start + visible.length, total);
    $("garden-this-week").disabled = gardenView.weeks.some((week) => week.current && week.key === gardenWeek);
  }

  function placeFlowerActions(inDrawer) {
    const container = $(inDrawer ? "flower-drawer-actions" : "flower-action-home");
    for (const id of ["rename-panel", "delete-panel", "note-panel"])
      if ($(id).parentElement !== container) container.append($(id));
  }

  function closeFlowerDrawer(restoreFocus = false) {
    const previous = selectedFlower;
    const ownedActions = !$("flower-drawer").hidden ||
      $("rename-panel").parentElement === $("flower-drawer-actions") ||
      $("delete-panel").parentElement === $("flower-drawer-actions") ||
      $("note-panel").parentElement === $("flower-drawer-actions");
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
    const signature = JSON.stringify([plant.id, plant.name, plant.species, plant.createdAt, plant.bloomAt, plant.targetMs, plant.taskNote, plant.variant]);
    if (signature === flowerSignature && !opening) return;
    flowerSignature = signature;
    const heading = el("h2", "flower-detail-title", plant.name);
    heading.id = "flower-detail-title";
    const metadata = el("dl", "flower-metadata");
    const artwork = el("div", "flower-detail-art");
    const picture = el("div", "plant-sprite");
    picture.setAttribute("aria-hidden", "true");
    artwork.append(gardenArtwork(plant.species, C.variantOf(plant)));
    for (const [label, value] of [
      [t("种下"), date(plant.createdAt)],
      [t("开花"), date(plant.bloomAt)],
      [t("品种"), species(plant.species).name],
      [t("配色"), C.variantOf(plant) === "hidden" ? t(GardenVariants.PALETTES[plant.species].name) + " · " + t("隐藏配色") : t("普通配色")],
      [t("完成目标时长"), minutes(plant.targetMs)],
    ]) {
      metadata.append(el("dt", "", label), el("dd", "", value));
    }
    const actions = el("div", "action-row");
    const rename = el("button", "button quiet small", t("重命名"));
    rename.id = "flower-rename";
    rename.type = "button";
    rename.addEventListener("click", () => openRename(plant));
    const remove = el("button", "button text-danger small", t("移除这朵花"));
    remove.id = "flower-remove";
    remove.type = "button";
    remove.addEventListener("click", () => openDelete(plant));
    const memory = el("section", "task-memory");
    const memoryHeading = el("div", "task-memory-heading");
    const editNote = el("button", "button quiet small", t("编辑备注"));
    editNote.id = "flower-note";
    editNote.type = "button";
    editNote.addEventListener("click", () => openNote(plant));
    memoryHeading.append(el("h3", "", t("这段时间的记忆")), editNote);
    memory.append(memoryHeading, el("p", "task-copy", plant.taskNote || t("这朵花还没有任务备注。旧记录不会自动补写任务。")));
    actions.append(rename, remove);
    const hiddenBadge = C.variantOf(plant) === "hidden" ? [el("span", "variant-badge", t("✧ {0}", t("隐藏配色")))] : [];
    $("flower-details").replaceChildren(heading, ...hiddenBadge, artwork, metadata, memory, actions);
    $("flower-drawer").hidden = false;
    if (opening) $("flower-drawer-close").focus({ preventScroll: true });
  }

  function changeGardenPage(delta) {
    gardenPage += delta;
    if (typeof closeFlowerDrawer === "function") closeFlowerDrawer(false);
    selectedFlower = null;
    closeFlowerActions();
    closeAchievementDrawer(false);
    gardenSignature = "";
    if (state) renderGarden();
    saveGardenView();
  }

  function closeFlowerActions() {
    $("rules-edit-panel").hidden = true;
    editPlantId = null;
    $("rename-panel").hidden = true;
    $("delete-panel").hidden = true;
    $("note-panel").hidden = true;
    noteId = null;
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
    const previous = `${gardenMode}:${gardenWeek}`;
    gardenMode = mode;
    gardenWeek = week;
    gardenPage = 0;
    changeGardenPage(0);
    if (previous !== `${gardenMode}:${gardenWeek}`) animateWeekChange();
  }

  function locateWeek() {
    const value = $("garden-week-date").value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      showError(new Error(t("请先选择一个日期。")), "date");
      return;
    }
    const [year, month, day] = value.split("-").map(Number);
    const selected = new Date(0);
    selected.setFullYear(year, month - 1, day);
    // An afternoon sample keeps the minimum supported day after the Unix epoch even
    // in UTC+13/+14. This is only a calendar lookup, never an activity timestamp.
    selected.setHours(18, 0, 0, 0);
    if (!Number.isFinite(selected.getTime()) || selected.getFullYear() !== year || selected.getMonth() !== month - 1 || selected.getDate() !== day) {
      showError(new Error(t("日期无法识别，请重新选择。")), "date");
      return;
    }
    if (year < 1970) {
      showError(new Error(t("花园日期从 1970 年 1 月 1 日开始，请选择此日期或之后的日期。")), "date");
      return;
    }
    if (errorSource === "date") { $("error").hidden = true; $("error").textContent = ""; errorSource = ""; }
    const view = GardenLayout.createView([], { mode: "week", now: selected.getTime() });
    changeGardenScope("week", view.week);
  }

  function openNote(plant) {
    closeFlowerActions();
    noteId = plant.id;
    placeFlowerActions(!$("flower-drawer").hidden && plant.id === selectedFlower);
    $("note-input").value = plant.taskNote || "";
    $("note-panel").hidden = false;
    $("note-input").focus();
  }

  async function saveNote() {
    if (!noteId || !$("note-input").reportValidity()) return;
    const id = noteId;
    const saved = await command({ type: "note", id, note: $("note-input").value }, () => {
      $("note-panel").hidden = true;
      noteId = null;
      notice(t("任务记忆已保存。"));
    });
    if (saved) $(state.active?.id === id ? "note-active" : "flower-note")?.focus({ preventScroll: true });
  }

  function render() {
    $("loading").hidden = true;
    const exists = (id) => state.active?.id === id || state.garden.some((plant) => plant.id === id);
    if ((renameId && !exists(renameId)) || (deleteId && !exists(deleteId)) || (noteId && !exists(noteId)))
      closeFlowerActions();
    renderCurrent();
    renderPlans();
    renderCollection();
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
          t("本次中断扣减了 {0}。剩余进度已保存。", minutes(state.lastPenalty.lostMs)),
        );
      seenPenalty = state.lastPenalty.at;
    }
    if (state.lastBloom && state.lastBloom.at !== seenBloom) {
      if (!firstRender) notice(t("有一朵花开了，已为你留在「我的花园」。"));
      seenBloom = state.lastBloom.at;
    }
    firstRender = false;
  }

  async function command(input, success) {
    if (busy) return false;
    busy = true;
    commandScope = currentTab();
    generation += 1;
    for (const button of document.querySelectorAll(
      ".action-panel button, .plant-presets button, #confirm-plant, #pause, #rename-save, #save-rules-edit",
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
      commandScope = null;
      for (const button of document.querySelectorAll(
        ".action-panel button, .plant-presets button, #confirm-plant, #pause, #rename-save, #save-rules-edit",
      ))
        button.disabled = false;
      if (state) renderPlanSummary();
    }
  }

  function addRule(containerId = "rules", seed = null, focusNew = true) {
    const container = $(containerId);
    if (container.children.length >= 20) {
      notice(t("每株植物最多添加 20 条规则。"));
      return;
    }
    const number = ++ruleCounter;
    const row = el("div", "rule-row");
    const top = el("div", "rule-top");
    const type = el("select", "rule-type");
    type.setAttribute("aria-label", t("规则 {0} 类型", number));
    for (const [value, text] of [
      ["category", t("分类")],
      ["superCategory", t("大类")],
      ["app", t("程序")],
      ["website", t("网站")],
    ]) {
      const option = el("option", "", text);
      option.value = value;
      type.append(option);
    }
    type.value = seed?.type || "category";
    const remove = el("button", "button text-danger small remove-rule", t("移除"));
    remove.type = "button";
    remove.setAttribute("aria-label", t("移除规则 {0}", number));
    remove.addEventListener("click", () => {
      if (container.children.length === 1) {
        notice(t("至少保留一条生长规则。"));
        return;
      }
      row.remove();
    });
    top.append(type, remove);
    const value = el("input", "rule-value");
    value.required = true;
    value.maxLength = 120;
    value.placeholder = t("例如：Code、Acrobat");
    value.setAttribute("aria-label", t("规则 {0} 内容", number));
    value.value = ["app", "website"].includes(seed?.type) ? seed.value : "";
    const category = el("select", "rule-category");
    category.required = true;
    category.setAttribute("aria-label", t("规则 {0} 分类", number));
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
    exactLabel.append(exact, t("精确匹配程序名（忽略大小写和 .exe）"));
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
          ? t("例如：example.com，或粘贴网址")
          : t("例如：Code、Acrobat");
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

  function recommendName() {
    if (!state || state.active || busy) return;
    const input = $("plant-name-input");
    const plantSpecies = species(document.querySelector('input[name="species"]:checked')?.value);
    const labels = readRules("rules").filter((rule) => {
      const catalog = catalogs[rule.type];
      return ["category", "superCategory"].includes(rule.type) && rule.value &&
        catalog?.loaded && !catalog.error && catalog.items.some((item) => item.id === rule.value);
    }).map((rule) => categoryName(rule));
    input.value = GardenCollection.suggestName(plantSpecies.name, labels, input.value);
    input.setCustomValidity("");
    $("name-recommendation").textContent = labels.length
      ? t("已用所选分类和当前花朵组合，可继续编辑。") : t("已随机组合任务名称和当前花朵，可继续编辑。");
  }

  function rawPlant() {
    return {
      name: $("plant-name-input").value,
      taskNote: $("plant-task-note").value,
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
    $("name-recommendation").textContent = "";
    previewSpecies(C.SPECIES[0].id);
    $("rules").replaceChildren();
    ruleCounter = 0;
    addRule("rules", null, false);
    $("penalty-options").hidden = true;
    for (const input of $("penalty-options").querySelectorAll("input, select"))
      input.disabled = true;
    $("penalty-amount-label").textContent = t("扣减比例（%）");
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
      for (const rule of input.rules) {
        if (!["category", "superCategory"].includes(rule.type)) continue;
        const catalog = catalogs[rule.type];
        if (!catalog.loaded || catalog.error) throw new Error(t("请先刷新分类，确认方案里的分类仍然可用；也可以改用程序或网站规则。"));
        if (!catalog.items.some((item) => item.id === rule.value))
          throw new Error(t("方案中的分类「{0}」已不存在，请更换或移除这条规则后再播种。", rule.label || rule.value));
      }
    } catch (error) {
      showError(error);
      return;
    }
    const id =
      globalThis.crypto?.randomUUID?.() ||
      `plant-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await command({ type: "plant", id, plant: input }, () => {
      closePlant();
      notice(t("种好了。回到符合分类或规则的活动，它就会开始生长。"));
    });
  }

  function openRulesEdit() {
    if (!state?.active) return;
    closeFlowerActions();
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
      notice(t("生长规则已更新，已有进度、开花目标和惩罚设置都已保留。"));
    });
  }

  function openRename(plant) {
    closeFlowerActions();
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
        notice(t("名字保存好了。"));
      },
    );
    if (saved && !$("flower-drawer").hidden)
      $("flower-rename")?.focus({ preventScroll: true });
  }

  function openDelete(plant) {
    closeFlowerActions();
    placeFlowerActions(!$("flower-drawer").hidden && selectedFlower === plant.id);
    deleteId = plant.id;
    $("delete-message").textContent =
      t("「{0}」和它的生长记录会被移除，此操作无法撤销。", plant.name);
    $("delete-panel").hidden = false;
    $("rename-panel").hidden = true;
    $("delete-cancel").focus();
  }

  async function poll() {
    if (polling || busy || document.visibilityState !== "visible") return;
    polling = true;
    const current = generation;
    try {
      const value = await store.load();
      if (current !== generation || document.visibilityState !== "visible") return;
      state = value;
      render();
    } catch (error) {
      showError(error, "connection");
    } finally {
      polling = false;
    }
  }

  for (const [index, item] of C.SPECIES.map(item => species(item.id)).entries()) {
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
  $("recommend-name").addEventListener("click", recommendName);
  $("garden-start").addEventListener("click", () => tab("current", true));
  $("garden-prev").addEventListener("click", () => changeGardenPage(-1));
  $("garden-next").addEventListener("click", () => changeGardenPage(1));
  $("garden-motion").addEventListener("change", () => {
    ambienceEnabled = $("garden-motion").checked;
    try { localStorage.setItem("garden-ambience", String(ambienceEnabled)); } catch (_) { /* Local display preference only. */ }
    updateAmbience();
  });
  document.addEventListener("visibilitychange", () => {
    updateAmbience();
    if (document.visibilityState === "visible") poll();
  });
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
    const page = GardenLayout.weekPage(gardenView.weeks, gardenWeek);
    const key = delta < 0 ? page.previous : page.next;
    if (key) changeGardenScope("week", key);
  }
  $("garden-week-prev").addEventListener("click", () => moveGardenWeek(-1));
  $("garden-week-next").addEventListener("click", () => moveGardenWeek(1));
  $("plant-form").addEventListener("input", renderPlanNamePreview);
  $("plant-form").addEventListener("change", renderPlanNamePreview);
  $("plan-name").addEventListener("keydown", (event) => {
    if (event.key === "Enter") { event.preventDefault(); savePlan(); }
  });
  $("achievement-close").addEventListener("click", () => closeAchievementDrawer(true));
  for (const button of $("achievement-filters").children) button.addEventListener("click", () => {
    closeAchievementDrawer(false);
    achievementFilter = button.dataset.filter;
    renderCollection();
  });
  document.addEventListener("pointerdown", (event) => {
    if (!$("achievement-drawer").hidden && !$("achievement-drawer").contains(event.target) &&
        !event.target.closest?.(".achievement")) closeAchievementDrawer(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !$("achievement-drawer").hidden) { event.preventDefault(); closeAchievementDrawer(true); }
  });
  $("plan-select").addEventListener("change", () => {
    $("plan-delete-confirm").hidden = true;
    const plan = selectedPlan();
    $("plan-name").value = plan?.name || "";
    renderPlanSummary();
  });
  $("plan-use").addEventListener("click", usePlan);
  $("plan-save").addEventListener("click", () => savePlan());
  $("plan-update").addEventListener("click", () => savePlan(true));
  $("plan-delete").addEventListener("click", () => { $("plan-delete-confirm").hidden = false; });
  $("plan-delete-no").addEventListener("click", () => { $("plan-delete-confirm").hidden = true; });
  $("plan-delete-yes").addEventListener("click", async () => {
    const plan = selectedPlan();
    if (!plan?.id) return;
    await command({ type: "deletePlan", id: plan.id }, () => {
      $("plan-delete-confirm").hidden = true;
      $("plan-name").value = "";
      notice(t("已删除方案，花朵与任务记忆已保留。"));
    });
  });
  $("garden-week-locate").addEventListener("click", locateWeek);
  $("garden-week-date").addEventListener("keydown", (event) => {
    if (event.key === "Enter") { event.preventDefault(); locateWeek(); }
  });
  for (const id of ["garden-album-panel", "garden-grid"]) $(id).addEventListener("animationend", (event) => {
    if (event.target === $(id) && event.animationName === "week-panel-in") $(id).classList.remove("week-switching");
  });
  $("note-active").addEventListener("click", () => state?.active && openNote(state.active));
  $("note-save").addEventListener("click", saveNote);
  $("note-cancel").addEventListener("click", () => {
    const id = noteId;
    $("note-panel").hidden = true;
    noteId = null;
    $(state?.active?.id === id ? "note-active" : "flower-note")?.focus({ preventScroll: true });
  });
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
      event.target.type === "radio" ||
      event.target.id === "plan-name"
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
      ? t("扣减比例（%）")
      : t("扣减时间（分钟）");
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
    if (!$("rename-panel").hidden || !$("delete-panel").hidden || !$("note-panel").hidden) {
      const action = !$("note-panel").hidden ? "flower-note" : !$("rename-panel").hidden ? "flower-rename" : "flower-remove";
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
      notice(t("已移除这株植物。"));
    });
    if (removed && fromDrawer) $("tab-garden").focus({ preventScroll: true });
  });
  try {
    gardenTheme = localStorage.getItem("garden-theme") || "meadow";
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
