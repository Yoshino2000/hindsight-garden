// Optional presentation, kept separate from growth and archive rules.
(function (root) {
  "use strict";

  const THEMES = [
    { id: "meadow", name: "草木晴日", description: "原来的清浅绿意", achievement: null, cell: null },
    { id: "rain", name: "雨后小憩", description: "青绿色雨后花园、叶伞长椅、苔石鸟浴和陶蛙", achievement: "first-bloom", cell: 0 },
    { id: "dusk", name: "晚灯花园", description: "紫暮花园、暖灯拱椅、木鸟屋和小小丰收角", achievement: "ten-blooms", cell: 1 },
    { id: "blossom", name: "樱枝来信", description: "春樱和风花园、鸟居、神社石灯笼和竹筒手水钵", achievement: "all-species", cell: 2 },
  ];
  const ACHIEVEMENT_GROUPS = [
    { id: "first-bloom", name: "第一朵花", ids: ["first-bloom"] },
    { id: "bloom-sprouts", name: "花开小记", ids: ["five-blooms", "ten-blooms", "twenty-five-blooms"] },
    { id: "bloom-gardens", name: "满园花开", ids: ["fifty-blooms", "hundred-blooms"] },
    { id: "bloom-landscape", name: "繁花长卷", ids: ["two-hundred-fifty-blooms", "five-hundred-blooms", "thousand-blooms"] },
    { id: "species-collection", name: "多彩收藏", ids: ["two-species", "four-species", "all-species"] },
  ];
  const LEVELS = {
    1: ["gold"],
    2: ["white", "gold"],
    3: ["white", "silver", "gold"],
  };
  const LEVEL_NAMES = { none: "尚未获得", white: "白阶", silver: "银阶", gold: "金阶" };
  const NAME_TASKS = [
    "论文阅读", "写作整理", "课程学习", "代码创作", "项目推进",
    "资料查阅", "娱乐休息", "游戏放松", "灵感速记", "日常充电",
  ];

  function theme(value, earned = {}) {
    const selected = THEMES.find((item) => item.id === value) || THEMES[0];
    return !selected.achievement || Number.isSafeInteger(earned[selected.achievement])
      ? selected : THEMES[0];
  }

  function totalTime(ms) {
    const minutes = Math.floor(Math.max(0, Number(ms) || 0) / 60000);
    return minutes >= 60
      ? `${Math.floor(minutes / 60)} 小时${minutes % 60 ? ` ${minutes % 60} 分` : ""}`
      : `${minutes} 分钟`;
  }

  function planLabel(plan, categoryName = () => "") {
    const labels = (plan.rules || []).map((rule) => {
      if (["category", "superCategory"].includes(rule.type))
        return categoryName(rule) || rule.label || rule.value || "待选类别";
      return `${rule.type === "app" ? "程序" : "网站"} ${rule.value || "待填写"}`;
    });
    const duration = Number.isSafeInteger(Number(plan.targetMinutes)) && Number(plan.targetMinutes) > 0
      ? `${plan.targetMinutes} 分钟` : "待定时长";
    return `${plan.name?.trim() || "未命名方案"} · ${[...new Set(labels)].join("、") || "待选类别"} · ${duration}`;
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
        .map((item) => ({ id: item.id, name: item.name, ids: [item.id] })),
    ];
    const groups = [];
    for (const definition of definitions) {
      if (used.has(definition.id)) continue;
      const tiers = definition.ids.flatMap((id, index) => {
        const entry = byId.get(id);
        if (!entry) return [];
        used.add(id);
        const metal = LEVELS[definition.ids.length][index];
        const earned = Number.isSafeInteger(entry.earnedAt) && entry.earnedAt >= 0;
        return [{ ...entry, earned, level: index + 1, metal, levelName: LEVEL_NAMES[metal] }];
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
        levelName: LEVEL_NAMES[metal],
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
    const flower = typeof speciesName === "string" && speciesName.trim() ? speciesName.trim() : "小花";
    const categories = [...new Set((Array.isArray(categoryLabels) ? categoryLabels : [])
      .filter((value) => typeof value === "string").map((value) => value.trim()).filter(Boolean))];
    const candidates = [...new Set((categories.length ? categories : NAME_TASKS).map((task) => {
      const firstTaskLength = [...task][0].length;
      const suffix = truncateName(flower, 39 - firstTaskLength);
      return truncateName(task, 39 - suffix.length) + "的" + suffix;
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
