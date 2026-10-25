// Optional presentation, kept separate from growth and archive rules.
(function (root) {
  "use strict";

  const THEMES = [
    { id: "meadow", name: "草木晴日", description: "原来的清浅绿意", achievement: null, cell: null },
    { id: "rain", name: "雨后小憩", description: "青绿色雨后花园、叶伞长椅、苔石鸟浴和陶蛙", achievement: "first-bloom", cell: 0 },
    { id: "dusk", name: "晚灯花园", description: "紫暮花园、暖灯拱椅、木鸟屋和小小丰收角", achievement: "ten-blooms", cell: 1 },
    { id: "blossom", name: "樱枝来信", description: "春樱和风花园、鸟居、神社石灯笼和竹筒手水钵", achievement: "all-species", cell: 2 },
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

  const api = { THEMES, theme, totalTime, planLabel };
  root.GardenCollection = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : self);
