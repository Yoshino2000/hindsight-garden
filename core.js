// Pure garden rules. Only observed foreground time can grow a plant.
(function (root) {
  "use strict";

  const MAX_GAP_MS = 10000;
  const ACHIEVEMENT_REVISION = 4;
  const HIDDEN_CHANCE = 0.05;
  const FOCUS_CATEGORY_LIMIT = 24;
  const CATEGORY_GOAL_MS = 10 * 60000;
  const SPECIES = [
    {
      id: "sunflower",
      name: "向日葵",
      description: "把日常积累成一小束阳光。",
    },
    {
      id: "hydrangea",
      name: "绣球",
      description: "细小的花瓣，也能慢慢聚成一团。",
    },
    {
      id: "tulip",
      name: "郁金香",
      description: "留一点时间，等待花苞舒展开。",
    },
    {
      id: "daisy",
      name: "雏菊",
      description: "平常的一天，也值得开一朵小花。",
    },
    {
      id: "rose",
      name: "玫瑰",
      description: "把积累的时光，留成层层舒展的花瓣。",
    },
    {
      id: "lavender",
      name: "薰衣草",
      description: "让细碎的片刻，长成一簇温柔的紫色。",
    },
    {
      id: "cosmos",
      name: "波斯菊",
      description: "轻轻摇曳的小花，也有自己的生长节奏。",
    },
    {
      id: "lily",
      name: "百合",
      description: "等待花苞打开，收藏一段安静的时光。",
    },
  ];
  const ACHIEVEMENTS = [
    {
      id: "first-bloom", name: "第一朵花", metric: "blooms", target: 1, badge: 0,
      condition: "累计成功种出 1 朵花。", description: "从第一颗种子开始，留住一段自己的时光。",
    },
    {
      id: "ten-blooms", name: "小小花匠", metric: "blooms", target: 10, badge: 1,
      condition: "累计成功种出 10 朵花。", description: "十次等待与回来，慢慢积成一束小小的成就。",
    },
    {
      id: "all-species", name: "八色收藏", metric: "species", target: 8, badge: 2,
      condition: "收集到 8 种曾经开花的植物。", description: "八种不同的花，把平常日子染成自己的颜色。",
    },
    {
      id: "hundred-blooms", name: "百花成园", metric: "blooms", target: 100, badge: 3,
      condition: "累计成功种出 100 朵花。", description: "许多细小的片刻，已经长成一座丰盛花园。",
    },
    {
      id: "five-blooms", name: "5 朵花开", metric: "blooms", target: 5, badge: 1,
      condition: "累计成功种出 5 朵花。", description: "五朵花，记录五次愿意为自己留一点时间。",
    },
    {
      id: "twenty-five-blooms", name: "25 朵花开", metric: "blooms", target: 25, badge: 3,
      condition: "累计成功种出 25 朵花。", description: "一座花园的份量，来自一次次慢慢积累。",
    },
    {
      id: "fifty-blooms", name: "50 朵花开", metric: "blooms", target: 50, badge: 3,
      condition: "累计成功种出 50 朵花。", description: "五十朵花，像五十张写给日常的小小花笺。",
    },
    {
      id: "two-hundred-fifty-blooms", name: "250 朵花开", metric: "blooms", target: 250, badge: 3,
      condition: "累计成功种出 250 朵花。", description: "走过许多普通日子，回头看时已有花相伴。",
    },
    {
      id: "five-hundred-blooms", name: "500 朵花开", metric: "blooms", target: 500, badge: 3,
      condition: "累计成功种出 500 朵花。", description: "五百次绽放，把时间织成一片温柔花海。",
    },
    {
      id: "thousand-blooms", name: "1000 朵花开", metric: "blooms", target: 1000, badge: 3,
      condition: "累计成功种出 1000 朵花。", description: "千朵花留下千段时光，仍然可以从下一颗种子开始。",
    },
    {
      id: "two-species", name: "双色初见", metric: "species", target: 2, badge: 2,
      condition: "收集到 2 种曾经开花的植物。", description: "试着种下另一种花，给花园添一点不同。",
    },
    {
      id: "four-species", name: "四色花笺", metric: "species", target: 4, badge: 2,
      condition: "收集到 4 种曾经开花的植物。", description: "四种花朵，把不同心情留在同一座花园里。",
    },
    ...SPECIES.map((item) => ({
      id: "first-" + item.id, name: item.name + "初绽", metric: "speciesBloom",
      species: item.id, target: 1, badge: null,
      condition: `至少让一株${item.name}开花。`, description: item.description,
    })),
    ...[5, 15, 25, 45, 60].map((minutes) => ({
      id: `streak-${minutes}m`, name: `连续 ${minutes} 分钟`, metric: "focusStreak",
      target: minutes * 60000, badge: 0, sinceStats: true,
      condition: `从有效生长统计开始后，单次连续累计 ${minutes} 分钟实际生长时间。切出规则、离开、暂停、休眠、重启、修改规则或开花都会结束连续段。`,
      description: "正在养花、符合生长规则并实际增加进度的时间，会累计成一段连续记录。",
    })),
    ...[1, 5, 10, 25, 50].map((hours) => ({
      id: `focus-${hours}h`, name: `累计 ${hours} 小时`, metric: "focusTotal",
      target: hours * 3600000, badge: 1, sinceStats: true,
      condition: `从有效生长统计开始后，累计 ${hours} 小时实际生长时间。旧花朵、旧目标时长与升级前进度不补算。`,
      description: "可以分多次、跨天积累。惩罚不倒扣已经真实获得的生长时间，规则重叠也只计一次。",
    })),
    ...[2, 3, 5].map((count) => ({
      id: `categories-${count}x10m`, name: `${count} 类时光`, metric: "focusCategories",
      target: count, minCategoryMs: CATEGORY_GOAL_MS, badge: 2, sinceStats: true,
      condition: `从有效生长统计开始后，至少 ${count} 个单列分类各累计 10 分钟实际生长时间。未分类与超出 24 个分类后合并的「其他」不计入。`,
      description: "分类来自当时真实的 Hindsight 分类标识，不从规则名称猜测，也不拆分同一段时间。",
    })),
    ...[
      { id: "ratio-single-80", name: "专心一隅", minTotalMs: 3600000, requiredCategories: 1, sharePercent: 80 },
      { id: "ratio-dual-25", name: "双类均衡", minTotalMs: 3600000, requiredCategories: 2, sharePercent: 25 },
      { id: "ratio-triple-15", name: "三类交响", minTotalMs: 7200000, requiredCategories: 3, sharePercent: 15 },
    ].map((item) => ({
      ...item, metric: "focusRatio", target: 100, badge: 3, sinceStats: true,
      condition: `从有效生长统计开始后，总计至少 ${item.minTotalMs / 3600000} 小时；至少 ${item.requiredCategories} 个单列分类各占总有效生长时间的 ${item.sharePercent}%。总量包含未分类和「其他」，它们不作为合格分类。`,
      description: "进度条表示时长门槛与比例条件的共同完成度，不是实际分类百分比。达成后永久保留，之后比例变化不会撤回。",
    })),
    ...[1, 5, 10, 25, 50].map((count) => ({
      id: count === 1 ? "hidden-first" : `hidden-${count}`,
      name: count === 1 ? "初见梦色" : `${count} 朵梦色花`, metric: "hiddenBlooms",
      target: count, badge: 3, variant: "hidden", sinceHidden: true,
      condition: `累计成功开出 ${count} 朵隐藏配色花朵。每朵完成时独立有 5% 概率获得隐藏配色。`,
      description: "偶然遇到不同的颜色，也留住了同样认真积累的一段时间。删除花朵不撤回已获得的成就。",
    })),
    ...[2, 4, 8].map((count) => ({
      id: `hidden-species-${count}`, name: `${count} 种梦色收藏`, metric: "hiddenSpecies",
      target: count, badge: 2, variant: "hidden", sinceHidden: true,
      condition: `收集到 ${count} 种曾经开花的隐藏配色植物。普通配色不计入隐藏品种数。`,
      description: "慢慢遇见不同品种的隐藏配色，不需要改变原本的种植节奏。",
    })),
    ...SPECIES.map((item) => ({
      id: `hidden-${item.id}-first`, name: `梦色${item.name}初绽`, metric: "hiddenSpeciesBloom",
      species: item.id, target: 1, badge: null, variant: "hidden", sinceHidden: true,
      condition: `至少让一株${item.name}开花，并获得它的隐藏配色。`,
      description: `这株${item.name}留住了一次特别的相遇。旧版已开花的普通配色不会重新抽取。`,
    })),
  ];

  function integer(value, min, max, message) {
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number < min || number > max) {
      throw new Error(message);
    }
    return number;
  }

  function nameOf(value) {
    const name = typeof value === "string" ? value.trim() : "";
    if (!name || name.length > 40)
      throw new Error("植物名称需要 1～40 个字符。");
    return name;
  }

  function taskNoteOf(value) {
    if (value === undefined) return "";
    if (typeof value !== "string" || value.length > 280)
      throw new Error("任务记忆最多 280 个字符。");
    return value.trim();
  }

  function normalizeHost(value) {
    const text = typeof value === "string" ? value.trim() : "";
    if (!text || text.length > 2048)
      throw new Error("请输入有效的网站域名或网址。");
    let url;
    try {
      url = new URL(text.includes("://") ? text : "https://" + text);
    } catch (_) {
      throw new Error("请输入有效的网站域名或网址。");
    }
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    ) {
      throw new Error("网站只支持 http、https 网址或域名。");
    }
    const host = url.hostname
      .toLowerCase()
      .replace(/^www\./, "")
      .replace(/\.$/, "");
    const labels = host.split(".");
    if (
      host.length > 120 ||
      (host !== "localhost" && labels.length < 2) ||
      labels.some(
        (label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label),
      )
    ) {
      throw new Error("网站域名格式不正确或超过 120 个字符。");
    }
    return host;
  }

  function normalizeApp(value) {
    return typeof value === "string"
      ? value
          .trim()
          .toLowerCase()
          .replace(/\.exe$/i, "")
      : "";
  }

  function validateRules(value) {
    if (!Array.isArray(value) || value.length < 1 || value.length > 20) {
      throw new Error("请设置 1～20 条分类、程序或网站规则。");
    }
    return value.map((rule) => {
      if (
        !rule ||
        !["app", "website", "category", "superCategory"].includes(rule.type)
      ) {
        throw new Error("规则类型不正确。");
      }
      if (rule.type === "category" || rule.type === "superCategory") {
        const id = typeof rule.value === "string" ? rule.value.trim() : "";
        if (!id || id.length > 128)
          throw new Error("分类标识需要 1～128 个字符。");
        const result = { type: rule.type, value: id, exact: false };
        if (rule.label !== undefined) {
          if (typeof rule.label !== "string" || rule.label.trim().length > 80) {
            throw new Error("分类名称最多 80 个字符。");
          }
          result.label = rule.label.trim();
        }
        return result;
      }
      if (
        typeof rule.value !== "string" ||
        !rule.value.trim() ||
        rule.value.length > 120
      ) {
        throw new Error("每条规则需要 1～120 个字符。");
      }
      const normalized =
        rule.type === "website"
          ? normalizeHost(rule.value)
          : normalizeApp(rule.value);
      if (!normalized) throw new Error("程序名称不能为空。");
      return {
        type: rule.type,
        value: normalized,
        exact: rule.type === "app" && rule.exact === true,
      };
    });
  }

  function matches(rules, focus) {
    if (!focus || focus.away || !Array.isArray(rules)) return false;
    const app = normalizeApp(focus.app);
    let host = "";
    if (focus.host) {
      try {
        host = normalizeHost(focus.host);
      } catch (_) {
        /* An unknown host never matches. */
      }
    }
    return rules.some((rule) => {
      if (rule.type === "category") {
        return Boolean(focus.category?.id && focus.category.id === rule.value);
      }
      if (rule.type === "superCategory") {
        return Boolean(
          focus.category?.superCategory?.id &&
            focus.category.superCategory.id === rule.value,
        );
      }
      if (rule.type === "app") {
        const value = normalizeApp(rule.value);
        return Boolean(
          app && value && (rule.exact ? app === value : app.includes(value)),
        );
      }
      return (
        rule.type === "website" &&
        Boolean(
          host && (host === rule.value || host.endsWith("." + rule.value)),
        )
      );
    });
  }

  function validatePlant(value) {
    if (!value || typeof value !== "object")
      throw new Error("植物设置不正确。");
    const species = SPECIES.find((item) => item.id === value.species);
    if (!species) throw new Error("请选择一种植物。");
    const targetMinutes = integer(
      value.targetMinutes,
      1,
      1440,
      "生长时间需要是 1～1440 的整数分钟。",
    );
    const supplied = value.penalty || {};
    const kind = supplied.kind === undefined ? "percent" : supplied.kind;
    if (!["percent", "minutes"].includes(kind))
      throw new Error("中断惩罚类型不正确。");
    const amount = integer(
      supplied.amount === undefined ? 10 : supplied.amount,
      1,
      kind === "percent" ? 100 : 1440,
      "请填写有效的中断扣减数值。",
    );
    const graceSeconds = integer(
      supplied.graceSeconds === undefined ? 30 : supplied.graceSeconds,
      0,
      300,
      "宽限时间需要是 0～300 的整数秒。",
    );
    return {
      name: nameOf(value.name),
      taskNote: taskNoteOf(value.taskNote),
      species: species.id,
      targetMs: targetMinutes * 60000,
      rules: validateRules(value.rules),
      penalty: {
        enabled: supplied.enabled === true,
        kind,
        amount,
        graceSeconds,
      },
    };
  }

  function initialState() {
    return {
      schema: 2,
      paused: false,
      notify: true,
      active: null,
      garden: [],
      plans: [],
      lastPlanting: null,
      collection: null,
      hiddenCollection: null,
      earnedAchievements: {},
      achievementRevision: ACHIEVEMENT_REVISION,
      focusStats: null,
      focus: null,
      lastAt: null,
      sessionId: null,
      interruption: null,
      heartbeatAt: null,
      lastPenalty: null,
      lastBloom: null,
      lastError: null,
    };
  }

  // Reusable settings deliberately omit a flower's name and personal task memory.
  function plantingSettings(value) {
    const valid = validatePlant({ ...value, name: "种植方案", taskNote: "" });
    return {
      species: valid.species,
      targetMinutes: valid.targetMs / 60000,
      rules: valid.rules,
      penalty: valid.penalty,
    };
  }

  function savedPlan(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("已保存的种植方案格式不正确。");
    return { id: validId(value.id), name: nameOf(value.name), ...plantingSettings(value) };
  }

  function savedCollection(value) {
    if (value == null) return null;
    if (typeof value !== "object" || Array.isArray(value) || !Array.isArray(value.species) ||
        value.species.length > SPECIES.length ||
        value.species.some((id) => !SPECIES.some((item) => item.id === id)) ||
        new Set(value.species).size !== value.species.length)
      throw new Error("已保存的收藏成就进度不正确。");
    return {
      totalBlooms: integer(value.totalBlooms, value.species.length, Number.MAX_SAFE_INTEGER,
        "已保存的收藏成就数量不正确。"),
      species: [...value.species],
      verifiedAt: timestamp(value.verifiedAt),
    };
  }

  function savedAchievements(value) {
    if (value === undefined) return {};
    if (!value || typeof value !== "object" || Array.isArray(value) ||
        Object.keys(value).some((id) => !ACHIEVEMENTS.some((item) => item.id === id)))
      throw new Error("已保存的收藏成就格式不正确。");
    return Object.fromEntries(Object.entries(value).map(([id, at]) => [id, timestamp(at)]));
  }

  function variantOf(plant) {
    return plant?.variant === "hidden" ? "hidden" : "normal";
  }

  function variantFromRoll(value) {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value >= 1)
      throw new Error("隐藏配色随机签不正确，已停止操作以保留原数据。");
    return value < HIDDEN_CHANCE ? "hidden" : "normal";
  }

  function counter(value) {
    if (!Number.isSafeInteger(value) || value < 0)
      throw new Error("有效生长统计数值不正确，请保留数据并检查。");
    return value;
  }

  function initialFocusStats(now) {
    return {
      schema: 1, startedAt: timestamp(now), totalMs: 0, longestMs: 0, streakMs: 0,
      categories: [], uncategorizedMs: 0, otherMs: 0,
    };
  }

  function savedFocusStats(value) {
    if (value == null) return null;
    if (typeof value !== "object" || Array.isArray(value) || value.schema !== 1 ||
        !Array.isArray(value.categories) || value.categories.length > FOCUS_CATEGORY_LIMIT)
      throw new Error("有效生长统计格式或版本不支持，请保留数据并使用最新版。");
    const stats = {
      schema: 1, startedAt: timestamp(value.startedAt), totalMs: counter(value.totalMs),
      longestMs: counter(value.longestMs), streakMs: counter(value.streakMs),
      categories: value.categories.map((item) => {
        if (!item || typeof item.id !== "string" || !item.id.trim() || item.id.length > 128 ||
            typeof item.name !== "string" || item.name.length > 80 || !counter(item.ms))
          throw new Error("有效生长分类统计不正确，请保留数据并检查。");
        return { id: item.id.trim(), name: item.name.trim(), ms: item.ms };
      }),
      uncategorizedMs: counter(value.uncategorizedMs), otherMs: counter(value.otherMs),
    };
    const sum = counter(stats.categories.reduce((total, item) => counter(total + item.ms),
      counter(stats.uncategorizedMs + stats.otherMs)));
    if (new Set(stats.categories.map((item) => item.id)).size !== stats.categories.length ||
        sum !== stats.totalMs || stats.longestMs > stats.totalMs || stats.streakMs > stats.longestMs)
      throw new Error("有效生长统计合计不一致，请保留数据并检查。");
    return stats;
  }

  function endFocusStreak(state) {
    if (state.focusStats) state.focusStats.streakMs = 0;
  }

  function creditFocus(state, elapsed) {
    if (!elapsed) return;
    const stats = state.focusStats;
    stats.totalMs = counter(stats.totalMs + elapsed);
    stats.streakMs = counter(stats.streakMs + elapsed);
    stats.longestMs = Math.max(stats.longestMs, stats.streakMs);
    const category = state.focus?.category;
    if (!category?.id) {
      stats.uncategorizedMs = counter(stats.uncategorizedMs + elapsed);
      return;
    }
    const bucket = stats.categories.find((item) => item.id === category.id);
    if (bucket) {
      bucket.ms = counter(bucket.ms + elapsed);
      if (category.name) bucket.name = category.name;
    } else if (stats.categories.length < FOCUS_CATEGORY_LIMIT) {
      stats.categories.push({ id: category.id, name: category.name || "", ms: elapsed });
    } else {
      stats.otherMs = counter(stats.otherMs + elapsed);
    }
  }

  function focusSummary(state) {
    const stats = state?.focusStats;
    const totalMs = stats?.totalMs || 0;
    const buckets = (stats?.categories || []).map((item) => ({
      ...item, kind: "category", name: item.name || "未命名分类",
    }));
    if (stats?.uncategorizedMs) buckets.push({ kind: "uncategorized", id: null, name: "未分类", ms: stats.uncategorizedMs });
    if (stats?.otherMs) buckets.push({ kind: "other", id: null, name: "其他", ms: stats.otherMs });
    buckets.sort((first, second) => second.ms - first.ms ||
      String(first.id || first.kind).localeCompare(String(second.id || second.kind)));
    return {
      startedAt: stats?.startedAt ?? null, totalMs, longestMs: stats?.longestMs || 0,
      streakMs: stats?.streakMs || 0, categoryLimit: FOCUS_CATEGORY_LIMIT,
      qualifiedCategories: (stats?.categories || []).filter((item) => item.ms >= CATEGORY_GOAL_MS).length,
      buckets: buckets.map((item) => ({ ...item, percent: totalMs ? item.ms / totalMs * 100 : 0 })),
    };
  }

  function ratioProgress(stats, item) {
    const total = stats?.totalMs || 0;
    const categories = [...(stats?.categories || [])].sort((first, second) => second.ms - first.ms);
    const categoryMs = categories[item.requiredCategories - 1]?.ms || 0;
    const actualSharePercent = total ? categoryMs / total * 100 : 0;
    // Integer comparison guards qualification at the exact boundary; display percentages are
    // approximate, and can never round an unmet condition up into an earned achievement.
    const eligible = total >= item.minTotalMs &&
      BigInt(categoryMs) * 100n >= BigInt(total) * BigInt(item.sharePercent);
    return {
      current: eligible ? 100 : Math.min(99, Math.floor(Math.min(total / item.minTotalMs,
        actualSharePercent / item.sharePercent) * 100)),
      actualSharePercent, observedTotalMs: total, eligible,
    };
  }

  function achievementProgress(state) {
    const collection = state.collection;
    const hidden = state.hiddenCollection;
    const stats = state.focusStats;
    return ACHIEVEMENTS.map((item) => {
      let current = 0;
      let extra = {};
      if (item.metric === "blooms") current = collection?.totalBlooms || 0;
      else if (item.metric === "species") current = collection?.species.length || 0;
      else if (item.metric === "speciesBloom") current = Number(collection?.species.includes(item.species) || false);
      else if (item.metric === "hiddenBlooms") current = hidden?.totalBlooms || 0;
      else if (item.metric === "hiddenSpecies") current = hidden?.species.length || 0;
      else if (item.metric === "hiddenSpeciesBloom") current = Number(hidden?.species.includes(item.species) || false);
      else if (item.metric === "focusStreak") current = stats?.longestMs || 0;
      else if (item.metric === "focusTotal") current = stats?.totalMs || 0;
      else if (item.metric === "focusCategories") current =
        (stats?.categories || []).filter((bucket) => bucket.ms >= item.minCategoryMs).length;
      else if (item.metric === "focusRatio") {
        extra = ratioProgress(stats, item);
        current = extra.current;
      }
      return { ...item, ...extra, current: Math.min(item.target, current), earnedAt: state.earnedAchievements?.[item.id] ?? null };
    });
  }

  function awardAchievements(state, now) {
    for (const item of achievementProgress(state)) {
      if (item.current >= item.target && item.earnedAt === null)
        state.earnedAchievements[item.id] = now;
    }
  }

  // A one-time verification of the current archive establishes the lifetime baseline.
  // Older deleted flowers are unknown, and verification time is not their historical earn date.
  function initializeCollection(state, totalBlooms, species, now) {
    const next = {
      ...state,
      collection: savedCollection({ totalBlooms, species: [...new Set(species)], verifiedAt: now }),
      earnedAchievements: savedAchievements(state.earnedAchievements),
    };
    return refreshAchievements(next, now);
  }

  // New catalog entries use the durable baseline, including flowers deleted since it was
  // established. Existing award dates are facts and are never replaced by an upgrade date.
  function refreshAchievements(state, now) {
    timestamp(now);
    // No old progress or target duration is a time log. Start at zero and require a fresh
    // foreground observation before settling any interval that crosses this upgrade.
    const base = state.focusStats == null ? {
      ...state, focusStats: initialFocusStats(now), focus: null, lastAt: now,
      interruption: null, heartbeatAt: null,
    } : state;
    const next = {
      ...base,
      hiddenCollection: state.hiddenCollection == null
        ? savedCollection({ totalBlooms: 0, species: [], verifiedAt: now }) : state.hiddenCollection,
      achievementRevision: ACHIEVEMENT_REVISION,
      earnedAchievements: savedAchievements(state.earnedAchievements),
    };
    awardAchievements(next, now);
    return next;
  }

  function validId(value) {
    if (typeof value !== "string" || !value.trim() || value.length > 128) {
      throw new Error("植物或后台标识不正确。");
    }
    return value;
  }

  function timestamp(value) {
    if (!Number.isSafeInteger(value) || value < 0)
      throw new Error("已保存的时间格式不正确。");
    return value;
  }

  function savedPlant(value, mature) {
    if (!value || typeof value !== "object")
      throw new Error("已保存的植物格式不正确。");
    const id = validId(value.id);
    const targetMs = integer(
      value.targetMs,
      60000,
      86400000,
      "已保存的生长时长不正确。",
    );
    if (targetMs % 60000 !== 0) throw new Error("已保存的生长时长不正确。");
    const base = {
      id,
      name: nameOf(value.name),
      species: value.species,
      targetMs,
      progressMs: integer(
        value.progressMs,
        0,
        targetMs,
        "已保存的生长进度不正确。",
      ),
      createdAt: timestamp(value.createdAt),
    };
    // Older unrelated metadata named "note" remains untouched by the store.
    if (value.taskNote !== undefined) base.taskNote = taskNoteOf(value.taskNote);
    if (!SPECIES.some((item) => item.id === base.species))
      throw new Error("已保存的植物品种不正确。");
    if (value.variant !== undefined) {
      if (!["normal", "hidden"].includes(value.variant))
        throw new Error("已保存的植物配色不支持，请保留数据并使用最新版。");
      base.variant = value.variant;
    }
    if (mature) {
      if (base.progressMs !== targetMs)
        throw new Error("收藏植物尚未完成生长。");
      base.bloomAt = timestamp(value.bloomAt);
      return base;
    }
    const settings = validatePlant({
      ...value,
      targetMinutes: targetMs / 60000,
    });
    if (value.variantRoll !== undefined) {
      variantFromRoll(value.variantRoll);
      base.variantRoll = value.variantRoll;
    }
    return { ...base, taskNote: settings.taskNote, rules: settings.rules, penalty: settings.penalty };
  }

  function cleanCategory(value, includeParent = true) {
    if (!value || typeof value !== "object" || typeof value.id !== "string")
      return null;
    const id = value.id.trim();
    if (!id || id.length > 128) return null;
    const category = {
      id,
      name:
        typeof value.name === "string" ? value.name.trim().slice(0, 80) : "",
    };
    if (includeParent)
      category.superCategory = cleanCategory(value.superCategory, false);
    return category;
  }

  function cleanFocus(value) {
    if (!value || typeof value !== "object") return null;
    let host = null;
    if (value.host) {
      try {
        host = normalizeHost(value.host);
      } catch (_) {
        /* Ignore unreadable domains. */
      }
    }
    const away = value.away === true;
    return {
      away,
      app: away
        ? null
        : typeof value.app === "string"
          ? value.app.slice(0, 120)
          : null,
      host: away ? null : host,
      category: away ? null : cleanCategory(value.category),
    };
  }

  function normalizeState(value) {
    if (value == null) return initialState();
    if (
      typeof value !== "object" ||
      Array.isArray(value) ||
      ![1, 2].includes(value.schema)
    ) {
      throw new Error("花园数据格式或版本不支持，请保留数据，勿覆盖。");
    }
    if (!Array.isArray(value.garden)) {
      throw new Error("已保存的花园格式不正确。");
    }
    const state = initialState();
    state.paused = value.paused === true;
    state.notify = value.notify !== false;
    state.active =
      value.active == null ? null : savedPlant(value.active, false);
    state.garden = value.garden.map((plant) => savedPlant(plant, true));
    if (value.plans !== undefined) {
      if (!Array.isArray(value.plans) || value.plans.length > 20)
        throw new Error("种植方案最多保存 20 个。");
      state.plans = value.plans.map(savedPlan);
      if (new Set(state.plans.map((plan) => plan.id)).size !== state.plans.length)
        throw new Error("种植方案标识重复。");
    }
    state.lastPlanting = value.lastPlanting == null ? null : plantingSettings(value.lastPlanting);
    state.collection = savedCollection(value.collection);
    state.hiddenCollection = savedCollection(value.hiddenCollection);
    state.earnedAchievements = savedAchievements(value.earnedAchievements);
    state.achievementRevision = value.achievementRevision === undefined ? 0 : integer(
      value.achievementRevision, 0, ACHIEVEMENT_REVISION,
      "收藏成就版本不支持，请保留数据并使用最新版时光花园。",
    );
    state.focusStats = savedFocusStats(value.focusStats);
    const ids = [
      ...state.garden.map((plant) => plant.id),
      ...(state.active ? [state.active.id] : []),
    ];
    if (new Set(ids).size !== ids.length) {
      throw new Error("花园植物标识重复。");
    }
    state.focus = cleanFocus(value.focus);
    state.lastAt = value.lastAt == null ? null : timestamp(value.lastAt);
    state.heartbeatAt =
      value.heartbeatAt == null ? null : timestamp(value.heartbeatAt);
    state.sessionId = value.sessionId == null ? null : validId(value.sessionId);
    if (value.interruption != null) {
      state.interruption = {
        startedAt: timestamp(value.interruption.startedAt),
        applied: value.interruption.applied === true,
      };
    }
    if (value.lastPenalty != null) {
      state.lastPenalty = {
        at: timestamp(value.lastPenalty.at),
        plantId: validId(value.lastPenalty.plantId),
        lostMs: integer(
          value.lastPenalty.lostMs,
          0,
          86400000,
          "已保存的扣减记录不正确。",
        ),
      };
    }
    if (value.lastBloom != null) {
      state.lastBloom = {
        id: validId(value.lastBloom.id),
        at: timestamp(value.lastBloom.at),
      };
    }
    state.lastError =
      value.lastError == null ? null : String(value.lastError).slice(0, 300);
    return state;
  }

  function stage(progressMs, targetMs) {
    if (!(targetMs > 0) || !(progressMs > 0)) return 0;
    return Math.min(4, Math.floor((Math.max(0, progressMs) / targetMs) * 4));
  }

  function growing(state) {
    return Boolean(
      state.active && !state.paused && matches(state.active.rules, state.focus),
    );
  }

  function bloom(state, now, notes) {
    if (!state.active || state.active.progressMs < state.active.targetMs)
      return;
    const plant = state.active;
    const mature = {
      id: plant.id,
      name: plant.name,
      species: plant.species,
      createdAt: plant.createdAt,
      bloomAt: now,
      targetMs: plant.targetMs,
      progressMs: plant.targetMs,
      taskNote: plant.taskNote || "",
      variant: plant.variantRoll === undefined ? "normal" : variantFromRoll(plant.variantRoll),
    };
    state.garden.unshift(mature);
    state.collection.totalBlooms = integer(state.collection.totalBlooms + 1, 1,
      Number.MAX_SAFE_INTEGER, "收藏成就数量超出可保存范围。");
    if (!state.collection.species.includes(mature.species))
      state.collection.species.push(mature.species);
    if (mature.variant === "hidden") {
      state.hiddenCollection.totalBlooms = counter(state.hiddenCollection.totalBlooms + 1);
      if (!state.hiddenCollection.species.includes(mature.species))
        state.hiddenCollection.species.push(mature.species);
    }
    state.active = null;
    state.interruption = null;
    endFocusStreak(state);
    state.lastBloom = { id: mature.id, at: now };
    if (state.notify)
      notes.push({
        id: mature.id,
        body: `你的「${mature.name}」开花了！回花园看看吧。`,
      });
  }

  function applyPenalty(state, now) {
    const plant = state.active;
    const interruption = state.interruption;
    if (
      !plant ||
      state.paused ||
      !plant.penalty.enabled ||
      !interruption ||
      interruption.applied
    )
      return;
    if (now - interruption.startedAt < plant.penalty.graceSeconds * 1000)
      return;
    const requested =
      plant.penalty.kind === "minutes"
        ? plant.penalty.amount * 60000
        : Math.round((plant.progressMs * plant.penalty.amount) / 100);
    const lostMs = Math.min(plant.progressMs, requested);
    plant.progressMs -= lostMs;
    interruption.applied = true;
    state.lastPenalty = { at: now, lostMs, plantId: plant.id };
  }

  function advance(state, now, notes) {
    if (state.lastAt === null) {
      state.lastAt = now;
      endFocusStreak(state);
      return;
    }
    const elapsed = now - state.lastAt;
    state.lastAt = now;
    if (elapsed < 0 || elapsed > MAX_GAP_MS) {
      state.focus = null;
      state.interruption = null;
      endFocusStreak(state);
      return;
    }
    if (growing(state)) {
      const credited = Math.min(elapsed, state.active.targetMs - state.active.progressMs);
      state.active.progressMs += credited;
      creditFocus(state, credited);
      bloom(state, now, notes);
      awardAchievements(state, now);
    } else {
      endFocusStreak(state);
      applyPenalty(state, now);
    }
  }

  function reduce(previous, input, now = Date.now()) {
    let state = normalizeState(previous);
    const notes = [];
    timestamp(now);
    if (state.collection === null) state = initializeCollection(state, state.garden.length,
      state.garden.map((plant) => plant.species), now);
    else if (state.achievementRevision < ACHIEVEMENT_REVISION || state.focusStats === null || state.hiddenCollection === null)
      state = refreshAchievements(state, now);
    if (!input || typeof input !== "object")
      throw new Error("花园操作不正确。");
    if (input.type === "error" && input.sessionId !== undefined && input.sessionId !== state.sessionId)
      return { state, notes, ignored: true };
    if (input.type === "boot") {
      if (input.recoverSessionId !== undefined && input.recoverSessionId !== state.sessionId &&
          state.sessionId !== null &&
          !(Object.hasOwn(input, "expectedPreviousSessionId") && input.expectedPreviousSessionId === state.sessionId))
        return { state, notes, ignored: true };
      state.sessionId = validId(input.sessionId);
      state.focus = null;
      state.interruption = null;
      state.lastAt = now;
      state.heartbeatAt = now;
      state.lastError = null;
      endFocusStreak(state);
      return { state, notes };
    }
    if (input.type === "tick" || input.type === "focus") {
      if (!state.sessionId || input.sessionId !== state.sessionId)
        return { state, notes, ignored: true };
      let observedAt = now;
      if (input.type === "focus" && input.observedAt !== undefined) {
        observedAt = timestamp(input.observedAt);
        // Worker reception time is different from an untrusted event's own timestamp. Drop
        // queued observations that predate a newer page action, or crossed a clock reversal.
        if (observedAt > now || now - observedAt > MAX_GAP_MS ||
            (state.lastAt !== null && observedAt < state.lastAt && now >= state.lastAt)) {
          state.focus = null;
          state.interruption = null;
          state.lastAt = now;
          state.heartbeatAt = now;
          endFocusStreak(state);
          return { state, notes };
        }
      }
      // An away event cancels any pending penalty before the next clock settlement.
      if (input.type === "focus" && input.event?.away === true)
        state.interruption = null;
      advance(state, observedAt, notes);
      if (input.type === "focus") {
        const wasGrowing = growing(state);
        state.focus = cleanFocus(input.event);
        if (!growing(state)) endFocusStreak(state);
        if (
          !state.focus ||
          state.focus.away ||
          growing(state) ||
          state.paused ||
          !state.active
        ) {
          state.interruption = null;
        } else if (wasGrowing && state.active.penalty.enabled) {
          state.interruption = { startedAt: observedAt, applied: false };
          applyPenalty(state, observedAt);
        }
      }
      state.heartbeatAt = now;
      return { state, notes };
    }

    // Page actions never infer activity or charge the elapsed time since a worker tick.
    // Nor can a page action make an old observation appear fresh after sleep.
    if (
      state.lastAt !== null &&
      (now < state.lastAt || now - state.lastAt > MAX_GAP_MS)
    ) {
      state.focus = null;
      state.interruption = null;
      endFocusStreak(state);
    }
    state.lastAt = now;
    switch (input.type) {
      case "plant": {
        if (state.active)
          throw new Error("已有一株正在生长的植物，请先等待开花或移除它。");
        const id = validId(input.id);
        if (state.garden.some((plant) => plant.id === id))
          throw new Error("植物标识重复。");
        state.active = {
          ...validatePlant(input.plant),
          id,
          createdAt: now,
          progressMs: 0,
        };
        if (input.variantRoll !== undefined) {
          variantFromRoll(input.variantRoll);
          state.active.variantRoll = input.variantRoll;
        }
        state.lastPlanting = plantingSettings(input.plant);
        state.interruption = null;
        state.lastPenalty = null;
        endFocusStreak(state);
        break;
      }
      case "pause":
        if (typeof input.paused !== "boolean")
          throw new Error("暂停状态不正确。");
        state.paused = input.paused;
        state.interruption = null;
        endFocusStreak(state);
        break;
      case "notifications":
        if (typeof input.enabled !== "boolean")
          throw new Error("通知设置不正确。");
        state.notify = input.enabled;
        break;
      case "rules":
        if (!state.active || state.active.id !== input.id)
          throw new Error("这株植物已不在生长，请刷新后重试。");
        state.active.rules = validateRules(input.rules);
        // Editing what grows the plant is a user choice, never an interruption.
        state.interruption = null;
        state.lastPenalty = null;
        endFocusStreak(state);
        break;
      case "rename": {
        const plant =
          state.active?.id === input.id
            ? state.active
            : state.garden.find((item) => item.id === input.id);
        if (!plant) throw new Error("这株植物已不存在，请刷新后重试。");
        plant.name = nameOf(input.name);
        break;
      }
      case "note": {
        const plant = state.active?.id === input.id
          ? state.active : state.garden.find((item) => item.id === input.id);
        if (!plant) throw new Error("这株植物已不存在，请刷新后重试。");
        plant.taskNote = taskNoteOf(input.note);
        break;
      }
      case "savePlan": {
        const id = validId(input.id);
        const name = nameOf(input.name);
        const plan = { id, name, ...plantingSettings(input.plant) };
        const index = state.plans.findIndex((item) => item.id === id);
        if (index === -1) {
          if (state.plans.length >= 20) throw new Error("种植方案最多保存 20 个，请先移除一个。");
          state.plans.push(plan);
        } else state.plans[index] = plan;
        break;
      }
      case "deletePlan":
        if (!state.plans.some((plan) => plan.id === input.id))
          throw new Error("这个种植方案已不存在，请刷新后重试。");
        state.plans = state.plans.filter((plan) => plan.id !== input.id);
        break;
      case "delete":
        if (state.active?.id === input.id) {
          state.active = null;
          state.interruption = null;
          endFocusStreak(state);
        } else if (state.garden.some((plant) => plant.id === input.id)) {
          state.garden = state.garden.filter((plant) => plant.id !== input.id);
        } else {
          throw new Error("这株植物已不存在，请刷新后重试。");
        }
        break;
      case "error":
        state.lastError = String(input.message || "后台运行遇到问题。").slice(
          0,
          300,
        );
        state.focus = null;
        state.interruption = null;
        endFocusStreak(state);
        break;
      case "clearError":
        state.lastError = null;
        break;
      default:
        throw new Error("不支持的花园操作。");
    }
    return { state, notes };
  }

  const api = {
    SPECIES,
    ACHIEVEMENTS,
    ACHIEVEMENT_REVISION,
    HIDDEN_CHANCE,
    FOCUS_CATEGORY_LIMIT,
    MAX_GAP_MS,
    initialState,
    normalizeState,
    normalizeFlower: (value) => savedPlant(value, true),
    normalizeHost,
    normalizeApp,
    validateRules,
    validatePlant,
    plantingSettings,
    achievementProgress,
    initializeCollection,
    refreshAchievements,
    initialFocusStats,
    focusSummary,
    variantOf,
    variantFromRoll,
    matches,
    stage,
    reduce,
  };
  root.GardenCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : self);
