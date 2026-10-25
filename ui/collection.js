// Optional presentation, kept separate from growth and archive rules.
(function (root) {
  "use strict";

  const THEMES = [
    { id: "meadow", name: "草木晴日", description: "原来的清浅绿意", achievement: null, cell: null },
    { id: "rain", name: "雨后小憩", description: "陶蛙与带着水珠的蕨叶", achievement: "first-bloom", cell: 0 },
    { id: "dusk", name: "晚灯花园", description: "一盏暖灯，陪花慢慢长大", achievement: "ten-blooms", cell: 1 },
    { id: "blossom", name: "樱枝来信", description: "一枝浅粉，把春天留住", achievement: "all-species", cell: 2 },
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

  const api = { THEMES, theme, totalTime };
  root.GardenCollection = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : self);
