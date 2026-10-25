// Pure garden rules. Only observed foreground time can grow a plant.
(function (root) {
  "use strict";

  const MAX_GAP_MS = 10000;
  const MAX_GARDEN = 200;
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
      schema: 1,
      paused: false,
      notify: true,
      active: null,
      garden: [],
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
    if (!SPECIES.some((item) => item.id === base.species))
      throw new Error("已保存的植物品种不正确。");
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
    return { ...base, rules: settings.rules, penalty: settings.penalty };
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
      value.schema !== 1
    ) {
      throw new Error("花园数据格式或版本不支持，请保留数据，勿覆盖。");
    }
    if (!Array.isArray(value.garden) || value.garden.length > MAX_GARDEN) {
      throw new Error("已保存的花园格式不正确。");
    }
    const state = initialState();
    state.paused = value.paused === true;
    state.notify = value.notify !== false;
    state.active =
      value.active == null ? null : savedPlant(value.active, false);
    state.garden = value.garden.map((plant) => savedPlant(plant, true));
    const ids = [
      ...state.garden.map((plant) => plant.id),
      ...(state.active ? [state.active.id] : []),
    ];
    if (
      new Set(ids).size !== ids.length ||
      (state.active && state.garden.length >= MAX_GARDEN)
    ) {
      throw new Error("花园植物标识重复或收藏数量已超限。");
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
    };
    state.garden.unshift(mature);
    state.active = null;
    state.interruption = null;
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
      return;
    }
    const elapsed = now - state.lastAt;
    state.lastAt = now;
    if (elapsed < 0 || elapsed > MAX_GAP_MS) {
      state.focus = null;
      state.interruption = null;
      return;
    }
    if (growing(state)) {
      state.active.progressMs = Math.min(
        state.active.targetMs,
        state.active.progressMs + elapsed,
      );
      bloom(state, now, notes);
    } else {
      applyPenalty(state, now);
    }
  }

  function reduce(previous, input, now = Date.now()) {
    const state = normalizeState(previous);
    const notes = [];
    timestamp(now);
    if (!input || typeof input !== "object")
      throw new Error("花园操作不正确。");
    if (input.type === "boot") {
      state.sessionId = validId(input.sessionId);
      state.focus = null;
      state.interruption = null;
      state.lastAt = now;
      state.heartbeatAt = now;
      state.lastError = null;
      return { state, notes };
    }
    if (input.type === "tick" || input.type === "focus") {
      if (!state.sessionId || input.sessionId !== state.sessionId)
        return { state, notes };
      // An away event cancels any pending penalty before the next clock settlement.
      if (input.type === "focus" && input.event?.away === true)
        state.interruption = null;
      advance(state, now, notes);
      if (input.type === "focus") {
        const wasGrowing = growing(state);
        state.focus = cleanFocus(input.event);
        if (
          !state.focus ||
          state.focus.away ||
          growing(state) ||
          state.paused ||
          !state.active
        ) {
          state.interruption = null;
        } else if (wasGrowing && state.active.penalty.enabled) {
          state.interruption = { startedAt: now, applied: false };
          applyPenalty(state, now);
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
    }
    state.lastAt = now;
    switch (input.type) {
      case "plant": {
        if (state.active)
          throw new Error("已有一株正在生长的植物，请先等待开花或移除它。");
        if (state.garden.length >= MAX_GARDEN)
          throw new Error("花园已满 200 株，请先移除一株收藏。");
        const id = validId(input.id);
        if (state.garden.some((plant) => plant.id === id))
          throw new Error("植物标识重复。");
        state.active = {
          ...validatePlant(input.plant),
          id,
          createdAt: now,
          progressMs: 0,
        };
        state.interruption = null;
        state.lastPenalty = null;
        break;
      }
      case "pause":
        if (typeof input.paused !== "boolean")
          throw new Error("暂停状态不正确。");
        state.paused = input.paused;
        state.interruption = null;
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
      case "delete":
        if (state.active?.id === input.id) {
          state.active = null;
          state.interruption = null;
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
    MAX_GAP_MS,
    MAX_GARDEN,
    initialState,
    normalizeState,
    normalizeHost,
    normalizeApp,
    validateRules,
    validatePlant,
    matches,
    stage,
    reduce,
  };
  root.GardenCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : self);
