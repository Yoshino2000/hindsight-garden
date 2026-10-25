// Optional presentation, kept separate from growth and archive rules.
(function (root) {
  "use strict";
  const t = root.GardenI18n?.t || ((key, ...values) => key.replace(/\{(\d+)\}/g, (match, index) => index < values.length ? String(values[index]) : match));

  const THEMES = [
    { id: "meadow", name: t("草木晴日"), description: t("原来的清浅绿意"), achievement: null, cell: null },
    { id: "rain", name: t("雨后小憩"), description: t("青绿色雨后花园、叶伞长椅、苔石鸟浴和陶蛙"), achievement: "first-bloom", cell: 0 },
    { id: "dusk", name: t("晚灯花园"), description: t("紫暮花园、暖灯拱椅、木鸟屋和小小丰收角"), achievement: "ten-blooms", cell: 1 },
    { id: "blossom", name: t("樱枝来信"), description: t("春樱和风花园、鸟居、神社石灯笼和竹筒手水钵"), achievement: "all-species", cell: 2 },
  ];
  const ACHIEVEMENT_GROUPS = [
    {
      id: "bloom-collection", name: t("花开成园"),
      ids: ["first-bloom", "five-blooms", "ten-blooms", "twenty-five-blooms", "fifty-blooms",
        "hundred-blooms", "two-hundred-fifty-blooms", "five-hundred-blooms", "thousand-blooms"],
      metals: ["white", "white", "blue", "blue", "purple", "purple", "gold", "gold", "rainbow"],
    },
    {
      id: "species-collection", name: t("多彩收藏"), ids: ["two-species", "four-species", "all-species"],
      metals: ["white", "purple", "rainbow"],
    },
    {
      id: "focus-streak", name: t("一段心流"), ids: ["streak-5m", "streak-15m", "streak-25m", "streak-45m", "streak-60m"],
      metals: ["white", "blue", "purple", "gold", "rainbow"],
    },
    {
      id: "focus-total", name: t("时光积累"), ids: ["focus-1h", "focus-5h", "focus-10h", "focus-25h", "focus-50h"],
      metals: ["white", "blue", "purple", "gold", "rainbow"],
    },
    {
      id: "focus-categories", name: t("各有所长"), ids: ["categories-2x10m", "categories-3x10m", "categories-5x10m"],
      metals: ["white", "purple", "rainbow"],
    },
  ];
  ACHIEVEMENT_GROUPS.push(
    { id: "hidden-blooms", name: t("梦色花笺"), ids: ["hidden-first", "hidden-5", "hidden-10", "hidden-25", "hidden-50"], metals: ["white", "blue", "purple", "gold", "rainbow"] },
    { id: "hidden-species", name: t("梦色图鉴"), ids: ["hidden-species-2", "hidden-species-4", "hidden-species-8"], metals: ["white", "purple", "rainbow"] },
  );
  const LEVEL_NAMES = {
    none: t("尚未获得"), white: t("白阶"), blue: t("蓝阶"), purple: t("紫阶"), gold: t("金阶"), rainbow: t("彩阶"),
  };
  const NAME_TASKS = [
    t("论文阅读"), t("写作整理"), t("课程学习"), t("代码创作"), t("项目推进"),
    t("资料查阅"), t("娱乐休息"), t("游戏放松"), t("灵感速记"), t("日常充电"),
  ];

  function theme(value, earned = {}) {
    const selected = THEMES.find((item) => item.id === value) || THEMES[0];
    return !selected.achievement || Number.isSafeInteger(earned[selected.achievement])
      ? selected : THEMES[0];
  }

  function totalTime(ms) {
    const minutes = Math.floor(Math.max(0, Number(ms) || 0) / 60000);
    return minutes >= 60
      ? t("{0} 小时{1}", Math.floor(minutes / 60), minutes % 60 ? t(" {0} 分", minutes % 60) : "")
      : t("{0} 分钟", minutes);
  }

  function planLabel(plan, categoryName = () => "") {
    const labels = (plan.rules || []).map((rule) => {
      if (["category", "superCategory"].includes(rule.type))
        return categoryName(rule) || rule.label || rule.value || t("待选类别");
      return `${rule.type === "app" ? t("程序") : t("网站")} ${rule.value || t("待填写")}`;
    });
    const duration = Number.isSafeInteger(Number(plan.targetMinutes)) && Number(plan.targetMinutes) > 0
      ? t("{0} 分钟", plan.targetMinutes) : t("待定时长");
    return `${plan.name?.trim() || t("未命名方案")} · ${[...new Set(labels)].join("、") || t("待选类别")} · ${duration}`;
  }

  // Grouping is presentation only: every tier retains its own persistent id and earn date.
  // A missing lower tier is not inferred from a higher award, even for an incomplete catalog.
  function achievementGroups(progress) {
    const entries = Array.isArray(progress) ? progress.filter((item) =>
      item && typeof item.id === "string" && item.id) : [];
    const byId = new Map(entries.map((item) => [item.id, item]));
    const used = new Set();
    const definitions = [
      ...ACHIEVEMENT_GROUPS,
      ...entries.filter((item) => !ACHIEVEMENT_GROUPS.some((group) => group.ids.includes(item.id)))
        .map((item) => ({ id: item.id, name: item.name, ids: [item.id], metals: ["white"] })),
    ];
    const groups = [];
    for (const definition of definitions) {
      if (used.has(definition.id)) continue;
      const tiers = definition.ids.flatMap((id, index) => {
        const entry = byId.get(id);
        if (!entry) return [];
        used.add(id);
        const metal = definition.metals[index];
        const colorStep = definition.metals.slice(0, index + 1).filter((value) => value === metal).length;
        const colorSteps = definition.metals.filter((value) => value === metal).length;
        const colorName = LEVEL_NAMES[metal];
        const levelName = colorName + (colorSteps > 1 ? ` ${colorStep}/${colorSteps}` : "");
        const earned = Number.isSafeInteger(entry.earnedAt) && entry.earnedAt >= 0;
        return [{ ...entry, earned, level: index + 1, metal, levelName, colorName, colorStep, colorSteps }];
      });
      if (!tiers.length) continue;
      const earnedTiers = tiers.filter((item) => item.earned);
      const currentTier = earnedTiers[earnedTiers.length - 1] || null;
      const nextTier = tiers.find((item) => !item.earned) || null;
      const progressTier = nextTier || tiers[tiers.length - 1];
      const metal = currentTier?.metal || "none";
      groups.push({
        id: definition.id,
        name: definition.name,
        metric: tiers[0].metric,
        tiers,
        levelCount: definition.ids.length,
        currentLevel: currentTier?.level || 0,
        currentTier,
        nextTier,
        displayTier: currentTier || nextTier || tiers[0],
        current: progressTier.current,
        target: progressTier.target,
        earnedCount: earnedTiers.length,
        earned: earnedTiers.length > 0,
        complete: earnedTiers.length === definition.ids.length,
        metal,
        levelName: currentTier?.levelName || LEVEL_NAMES.none,
        colorName: LEVEL_NAMES[metal],
        colorStep: currentTier?.colorStep || 0,
        colorSteps: currentTier?.colorSteps || 0,
        earnedAt: currentTier?.earnedAt ?? null,
      });
      used.add(definition.id);
    }
    return groups;
  }

  function truncateName(value, length) {
    let result = value.slice(0, length);
    // JS and the form's maxlength both count UTF-16 units. Keep emoji surrogate pairs intact.
    if (/[\uD800-\uDBFF]$/.test(result)) result = result.slice(0, -1);
    return result;
  }

  function suggestName(speciesName, categoryLabels = [], previousName = "", random = Math.random) {
    const flower = typeof speciesName === "string" && speciesName.trim() ? speciesName.trim() : t("小花");
    const categories = [...new Set((Array.isArray(categoryLabels) ? categoryLabels : [])
      .filter((value) => typeof value === "string").map((value) => value.trim()).filter(Boolean))];
    const candidates = [...new Set((categories.length ? categories : NAME_TASKS).map((task) => {
      const firstTaskLength = [...task][0].length;
      const joiner = t("的");
      const suffix = truncateName(flower, 40 - joiner.length - firstTaskLength);
      return truncateName(task, 40 - joiner.length - suffix.length) + joiner + suffix;
    }))];
    const previous = typeof previousName === "string" ? previousName.trim() : "";
    const different = candidates.filter((value) => value !== previous);
    const pool = different.length ? different : candidates;
    const value = Number(random());
    const index = Number.isFinite(value)
      ? Math.floor(Math.min(1 - Number.EPSILON, Math.max(0, value)) * pool.length) : 0;
    return pool[index];
  }

  const api = { THEMES, theme, totalTime, planLabel, achievementGroups, suggestName };
  root.GardenCollection = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : self);
