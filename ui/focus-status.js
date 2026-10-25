// Explain the same matching decision as the worker, without observing or storing activity.
(function (root) {
  "use strict";

  function explain(state, now = Date.now(), options = {}) {
    const age = now - state.heartbeatAt;
    const fresh = Number.isSafeInteger(state.heartbeatAt) && age >= 0 && age < 12000;
    const plant = state.active;
    const focus = fresh ? state.focus : null;
    const label = options.ruleLabel || ((rule) => rule.label || rule.value);
    const expected = (plant?.rules || []).map(label);
    const name = (category, type) => category?.name ||
      options.catalogs?.[type]?.find((item) => item.id === category?.id)?.name ||
      (category?.id ? "已识别，名称暂不可用" : "未识别");
    const observations = focus && !focus.away ? [
      ["当前程序", focus.app || "未识别"],
      ["网站域名", focus.host || "未提供"],
      ["当前分类", name(focus.category, "category")],
      ["所属大类", name(focus.category?.superCategory, "superCategory")],
    ] : [["前台信息", focus?.away ? "已离开电脑" : "等待更新"]];
    const result = (code, title, summary, advice, matched = []) => ({
      code, title, summary, advice, fresh, growing: code === "growing",
      observations, expected, matched,
    });
    if (!plant) return result("empty", "等待播种", "种下一盆花后，符合规则的前台活动才会累计。", "选择花种、规则与目标时长后播种。");
    if (state.paused) return result("paused", "已手动暂停", "当前处于手动暂停状态，已有进度保留。", "准备好后点击「继续生长」。");
    if (!fresh) return result("stale", "等待后台连接", "后台状态尚未更新，暂不累计这段时间。", "确认 Hindsight 和插件后台仍在运行，并切换一次前台活动以获取新信息。");
    if (!focus) return result("unknown", "等待前台信息", "尚未收到可用的前台活动信息，暂不累计。", "切换一次程序或网站，再查看此处；请同时检查 Hindsight 的活动记录与隐私设置。");
    if (focus.away) return result("away", "你已离开电脑", "收到离开电脑的状态，植物正在休息。", "回来后等待新的前台活动信息；离开期间不扣进度。");
    const matched = plant.rules.filter((rule) => root.GardenCore.matches([rule], focus)).map(label);
    if (matched.length) return result("growing", "当前活动符合规则", `匹配：${matched.join("；")}。`, "只累计后台实际观察到的有效时间，同一段时间不会重复计算。", matched);
    const deleted = plant.rules.filter((rule) => Array.isArray(options.catalogs?.[rule.type]) &&
      !options.catalogs[rule.type].some((item) => item.id === rule.value));
    const penaltyNotice = plant.penalty.enabled && state.interruption
      ? state.interruption.applied ? " 本次中断已扣减过，不会再次扣减。" : " 已开启中断惩罚，宽限期后将按约定扣减一次。"
      : " 已有进度保留。";
    if (deleted.length === plant.rules.length) return result("deleted", "所选分类已不存在", "这盆花的分类或大类已不在当前列表中。", "点击「修改规则」，重新选择现有分类；修改不会清零当前进度。" + penaltyNotice);
    const missing = (rule) => rule.type === "category" ? !focus.category?.id :
      rule.type === "superCategory" ? !focus.category?.superCategory?.id :
      rule.type === "website" ? !focus.host : !focus.app;
    const allMissing = plant.rules.every(missing);
    const title = allMissing ? "缺少匹配所需的信息" : "当前活动未匹配规则";
    const categoryOnly = plant.rules.every((rule) => ["category", "superCategory"].includes(rule.type));
    const summary = allMissing ? "当前活动没有提供这些规则需要的信息，无法确认匹配。" :
      categoryOnly && focus.category?.id ? `当前分类「${name(focus.category, "category")}」未匹配这盆花的分类规则。` :
      "当前识别到的程序、网站或分类，没有满足这盆花的任何一条规则。";
    let advice = allMissing
      ? "先查看 Hindsight 是否已识别该分类或网站；域名也可能受浏览器支持情况或隐私设置影响。"
      : "切回符合下方规则的活动，或点击「修改规则」调整约定。";
    if (deleted.length) advice += " 部分已选分类已删除，请在修改规则时更新。";
    advice += penaltyNotice;
    return result(allMissing ? "missing" : "mismatch", title, summary, advice);
  }

  root.GardenFocus = { explain };
  if (typeof module !== "undefined" && module.exports) module.exports = root.GardenFocus;
})(typeof globalThis !== "undefined" ? globalThis : self);
