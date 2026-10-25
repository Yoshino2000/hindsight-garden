// Explain the same matching decision as the worker, without observing or storing activity.
(function (root) {
  "use strict";
  const t = root.GardenI18n?.t || ((key, ...values) => key.replace(/\{(\d+)\}/g, (match, index) => index < values.length ? String(values[index]) : match));

  function explain(state, now = Date.now(), options = {}) {
    const age = now - state.heartbeatAt;
    const fresh = Number.isSafeInteger(state.heartbeatAt) && age >= 0 && age < 12000;
    const plant = state.active;
    const focus = fresh ? state.focus : null;
    const label = options.ruleLabel || ((rule) => rule.label || rule.value);
    const expected = (plant?.rules || []).map(label);
    const name = (category, type) => category?.name ||
      options.catalogs?.[type]?.find((item) => item.id === category?.id)?.name ||
      (category?.id ? t("已识别，名称暂不可用") : t("未识别"));
    const observations = focus && !focus.away ? [
      [t("当前程序"), focus.app || t("未识别")],
      [t("网站域名"), focus.host || t("未提供")],
      [t("当前分类"), name(focus.category, "category")],
      [t("所属大类"), name(focus.category?.superCategory, "superCategory")],
    ] : [[t("前台信息"), focus?.away ? t("已离开电脑") : t("等待更新")]];
    const result = (code, title, summary, advice, matched = []) => ({
      code, title, summary, advice, fresh, growing: code === "growing",
      observations, expected, matched,
    });
    if (!plant) return result("empty", t("等待播种"), t("种下一盆花后，符合规则的前台活动才会累计。"), t("选择花种、规则与目标时长后播种。"));
    if (state.paused) return result("paused", t("已手动暂停"), t("当前处于手动暂停状态，已有进度保留。"), t("准备好后点击「继续生长」。"));
    if (!fresh) return result("stale", t("等待后台连接"), t("后台状态尚未更新，暂不累计这段时间。"), t("确认 Hindsight 和插件后台仍在运行，并切换一次前台活动以获取新信息。"));
    if (!focus) return result("unknown", t("等待前台信息"), t("尚未收到可用的前台活动信息，暂不累计。"), t("切换一次程序或网站，再查看此处；请同时检查 Hindsight 的活动记录与隐私设置。"));
    if (focus.away) return result("away", t("你已离开电脑"), t("收到离开电脑的状态，植物正在休息。"), t("回来后等待新的前台活动信息；离开期间不扣进度。"));
    const matched = plant.rules.filter((rule) => root.GardenCore.matches([rule], focus)).map(label);
    if (matched.length) return result("growing", t("当前活动符合规则"), t("匹配：{0}。", matched.join("；")), t("只累计后台实际观察到的有效时间，同一段时间不会重复计算。"), matched);
    const deleted = plant.rules.filter((rule) => Array.isArray(options.catalogs?.[rule.type]) &&
      !options.catalogs[rule.type].some((item) => item.id === rule.value));
    const penaltyNotice = plant.penalty.enabled && state.interruption
      ? state.interruption.applied ? t(" 本次中断已扣减过，不会再次扣减。") : t(" 已开启中断惩罚，宽限期后将按约定扣减一次。")
      : t(" 已有进度保留。");
    if (deleted.length === plant.rules.length) return result("deleted", t("所选分类已不存在"), t("这盆花的分类或大类已不在当前列表中。"), t("点击「修改规则」，重新选择现有分类；修改不会清零当前进度。") + penaltyNotice);
    const missing = (rule) => rule.type === "category" ? !focus.category?.id :
      rule.type === "superCategory" ? !focus.category?.superCategory?.id :
      rule.type === "website" ? !focus.host : !focus.app;
    const allMissing = plant.rules.every(missing);
    const title = allMissing ? t("缺少匹配所需的信息") : t("当前活动未匹配规则");
    const categoryOnly = plant.rules.every((rule) => ["category", "superCategory"].includes(rule.type));
    const summary = allMissing ? t("当前活动没有提供这些规则需要的信息，无法确认匹配。") :
      categoryOnly && focus.category?.id ? t("当前分类「{0}」未匹配这盆花的分类规则。", name(focus.category, "category")) :
      t("当前识别到的程序、网站或分类，没有满足这盆花的任何一条规则。");
    let advice = allMissing
      ? t("先查看 Hindsight 是否已识别该分类或网站；域名也可能受浏览器支持情况或隐私设置影响。")
      : t("切回符合下方规则的活动，或点击「修改规则」调整约定。");
    if (deleted.length) advice += t(" 部分已选分类已删除，请在修改规则时更新。");
    advice += penaltyNotice;
    return result(allMissing ? "missing" : "mismatch", title, summary, advice);
  }

  root.GardenFocus = { explain };
  if (typeof module !== "undefined" && module.exports) module.exports = root.GardenFocus;
})(typeof globalThis !== "undefined" ? globalThis : self);
