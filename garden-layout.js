// Stable garden positions: polling and renaming a flower never rearrange its plot.
(function (root) {
  "use strict";

  const PAGE_SIZE = 25;
  const MAX_PLANTS = 200;
  const SLOTS = Array.from({ length: PAGE_SIZE }, (_, index) => ({
    row: Math.floor(index / 5),
    col: index % 5,
  })).sort((first, second) => {
    const firstDistance = Math.abs(first.row - 2) + Math.abs(first.col - 2);
    const secondDistance = Math.abs(second.row - 2) + Math.abs(second.col - 2);
    return (
      firstDistance - secondDistance ||
      first.row + first.col - second.row - second.col ||
      first.row - second.row ||
      first.col - second.col
    );
  });

  function usable(plant) {
    return Boolean(
      plant &&
        typeof plant === "object" &&
        typeof plant.id === "string" &&
        plant.id.trim() &&
        plant.id.length <= 128 &&
        Number.isSafeInteger(plant.createdAt) &&
        plant.createdAt >= 0,
    );
  }

  function oldestFirst(first, second) {
    if (first.createdAt !== second.createdAt)
      return first.createdAt - second.createdAt;
    return first.id < second.id ? -1 : first.id > second.id ? 1 : 0;
  }

  function collect(plants) {
    const ordered = Array.isArray(plants)
      ? plants.filter(usable).sort(oldestFirst)
      : [];
    const ids = new Set();
    const unique = [];
    for (const plant of ordered) {
      if (ids.has(plant.id)) continue;
      ids.add(plant.id);
      unique.push(plant);
      if (unique.length === MAX_PLANTS) break;
    }
    return unique;
  }

  function createLayout(plants, page = 0) {
    const unique = collect(plants);
    const total = unique.length;
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const requested =
      typeof page === "number"
        ? page
        : typeof page === "string"
          ? Number(page)
          : 0;
    const current = Math.min(
      pageCount - 1,
      Math.max(0, Number.isFinite(requested) ? Math.trunc(requested) : 0),
    );
    const plots = unique
      .slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)
      .map((plant, index) => {
        const { row, col } = SLOTS[index];
        return {
          plant,
          // The bottom-center of each flower, within a 1000 × 760 scene.
          x: 500 + (col - row) * 70,
          y: 340 + (col + row) * 32,
          z: row + col,
          rotation: 0,
        };
      });
    return { page: current, pageCount, plots, total };
  }

  function calendarTime(value) {
    if (!Number.isSafeInteger(value) || value < 0) return null;
    const date = new Date(value);
    const year = date.getFullYear();
    return Number.isFinite(date.getTime()) && year >= 0 && year <= 9999 ? value : null;
  }

  function bloomTime(plant) {
    // Old heterogeneous records without a usable bloom date still have a planting date.
    return calendarTime(plant.bloomAt) ?? calendarTime(plant.createdAt);
  }

  function localWeek(at) {
    const start = new Date(at);
    // Work from local noon when moving dates; then find the calendar Monday's midnight.
    start.setHours(12, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    end.setHours(0, 0, 0, 0);
    const key = [
      String(start.getFullYear()).padStart(4, "0"),
      String(start.getMonth() + 1).padStart(2, "0"),
      String(start.getDate()).padStart(2, "0"),
    ].join("-");
    // End is exclusive. Calendar arithmetic keeps weeks correct through 23/25-hour days.
    return { key, start: start.getTime(), end: end.getTime() };
  }

  function readWeek(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(0);
    // setFullYear also handles years 0000..0099 without Date's 1900-year shortcut.
    date.setFullYear(year, month - 1, day);
    date.setHours(12, 0, 0, 0);
    if (
      date.getFullYear() !== year || date.getMonth() !== month - 1 ||
      date.getDate() !== day || date.getDay() !== 1
    ) return null;
    return localWeek(date.getTime());
  }

  function createView(plants, options = {}) {
    const settings = options && typeof options === "object" ? options : {};
    const now = calendarTime(settings.now) ?? Date.now();
    const current = localWeek(now);
    const requested = readWeek(settings.week);
    const week = requested ? requested.key : current.key;
    const mode = settings.mode === "week" ? "week" : "all";
    // Reject ungroupable dates before the 200-flower cap, rather than hiding later valid data.
    const unique = collect(Array.isArray(plants)
      ? plants.filter((plant) => usable(plant) && bloomTime(plant) !== null)
      : []);
    const weeksByKey = new Map([[current.key, { ...current, count: 0, current: true }]]);
    // Keep an explicitly selected empty week selectable after its last flower is removed.
    if (requested && !weeksByKey.has(requested.key)) {
      weeksByKey.set(requested.key, { ...requested, count: 0, current: false });
    }
    const selected = [];
    for (const plant of unique) {
      const group = localWeek(bloomTime(plant));
      if (!weeksByKey.has(group.key)) {
        weeksByKey.set(group.key, { ...group, count: 0, current: group.key === current.key });
      }
      weeksByKey.get(group.key).count++;
      if (mode === "all" || group.key === week) selected.push(plant);
    }
    const weeks = [...weeksByKey.values()].sort((first, second) =>
      first.key < second.key ? 1 : first.key > second.key ? -1 : 0,
    );
    const layout = createLayout(selected, settings.page);
    const gardens = Array.from({ length: layout.pageCount }, (_, page) => {
      const garden = createLayout(selected, page);
      return { ...garden, count: garden.plots.length };
    });
    return { mode, week, weeks, gardens, layout, total: unique.length };
  }

  const api = { PAGE_SIZE, MAX_PLANTS, createLayout, createView };
  root.GardenLayout = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : self);
