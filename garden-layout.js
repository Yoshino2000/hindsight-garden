// Stable garden positions: polling and renaming a flower never rearrange its plot.
(function (root) {
  "use strict";

  const PAGE_SIZE = 25;
  const ALBUM_SIZE = 12;
  const WEEK_PAGE_SIZE = 5;
  // One ground projection for the island, flowerbed and plot lattice. Static SVG paths are
  // checked against these dimensions so the scene cannot quietly acquire a second slope.
  const GEOMETRY = Object.freeze({
    width: 1000,
    height: 760,
    stepX: 78.75,
    stepY: 45,
    island: Object.freeze({
      x: 500,
      y: 400,
      radius: 472.5,
      cornerCut: 17.5,
      depth: 25,
    }),
    bed: Object.freeze({ x: 500, y: 450, radius: 350, innerRadius: 341.25 }),
  });
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
    }
    return unique;
  }

  function createLayout(plants, page = 0) {
    return layoutFromOrdered(collect(plants), page);
  }

  function layoutFromOrdered(unique, page = 0) {
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
          x: GEOMETRY.bed.x + (col - row) * GEOMETRY.stepX,
          y: GEOMETRY.bed.y + (col + row - 4) * GEOMETRY.stepY,
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

  function emptyReview() {
    return { count: 0, targetMs: 0, species: new Map() };
  }

  function addToReview(review, plant) {
    // A completed goal is not a daily time log. Do not reconstruct missing or malformed
    // durations from progress, planting dates, task notes or other foreign metadata.
    const targetMs = Number.isSafeInteger(plant.targetMs) &&
      plant.targetMs >= 60000 && plant.targetMs <= 86400000 && plant.targetMs % 60000 === 0
      ? plant.targetMs : 0;
    review.count++;
    review.targetMs += targetMs;
    const id = typeof plant.species === "string" ? plant.species.trim() : "";
    if (!id || id.length > 128) return;
    if (!review.species.has(id)) review.species.set(id, { id, count: 0, targetMs: 0 });
    const species = review.species.get(id);
    species.count++;
    species.targetMs += targetMs;
  }

  function finishReview(review) {
    return {
      count: review.count,
      speciesCount: review.species.size,
      targetMs: review.targetMs,
      species: [...review.species.values()].sort((first, second) =>
        first.id < second.id ? -1 : first.id > second.id ? 1 : 0,
      ),
    };
  }

  function createView(plants, options = {}) {
    const settings = options && typeof options === "object" ? options : {};
    const now = calendarTime(settings.now) ?? Date.now();
    const current = localWeek(now);
    const requested = readWeek(settings.week);
    const week = requested ? requested.key : current.key;
    const mode = settings.mode === "week" ? "week" : "all";
    // Ignore unusable foreign dates without truncating any valid collection records.
    const unique = collect(Array.isArray(plants)
      ? plants.filter((plant) => usable(plant) && bloomTime(plant) !== null)
      : []);
    const weeksByKey = new Map([[current.key, { ...current, count: 0, current: true }]]);
    // Keep an explicitly selected empty week selectable after its last flower is removed.
    if (requested && !weeksByKey.has(requested.key)) {
      weeksByKey.set(requested.key, { ...requested, count: 0, current: false });
    }
    const reviewsByKey = new Map();
    const selectedReview = emptyReview();
    const selected = [];
    for (const plant of unique) {
      const group = localWeek(bloomTime(plant));
      if (!weeksByKey.has(group.key)) {
        weeksByKey.set(group.key, { ...group, count: 0, current: group.key === current.key });
      }
      weeksByKey.get(group.key).count++;
      if (!reviewsByKey.has(group.key)) reviewsByKey.set(group.key, emptyReview());
      addToReview(reviewsByKey.get(group.key), plant);
      if (mode === "all" || group.key === week) {
        selected.push(plant);
        addToReview(selectedReview, plant);
      }
    }
    const weeks = [...weeksByKey.values()].map((item) => {
      const review = reviewsByKey.get(item.key);
      return { ...item, targetMs: review?.targetMs || 0, speciesCount: review?.species.size || 0 };
    }).sort((first, second) =>
      first.key < second.key ? 1 : first.key > second.key ? -1 : 0,
    );
    const layout = layoutFromOrdered(selected, settings.page);
    const albumPage = Math.floor(layout.page / ALBUM_SIZE);
    const albumStart = albumPage * ALBUM_SIZE;
    // Only build the visible album window, even after years of collected flowers.
    const gardens = Array.from({ length: Math.min(ALBUM_SIZE, layout.pageCount - albumStart) }, (_, index) => {
      const garden = layoutFromOrdered(selected, albumStart + index);
      return { ...garden, count: garden.plots.length };
    });
    return { mode, week, weeks, gardens, layout, total: unique.length, review: finishReview(selectedReview),
      albumPage, albumPageCount: Math.ceil(layout.pageCount / ALBUM_SIZE), albumStart };
  }

  // Opt-in for callers holding an immutable archive snapshot. A new archive revision must
  // replace the array reference, including edits that keep the same length and plant ids.
  // The ordinary createView API remains uncached and accepts mutable/foreign input.
  function createViewSelector() {
    let cached = null;
    return function selectView(plants, options = {}) {
      const settings = options && typeof options === "object" ? options : {};
      const now = calendarTime(settings.now) ?? Date.now();
      const current = localWeek(now);
      const mode = settings.mode === "week" ? "week" : "all";
      const week = readWeek(settings.week)?.key || current.key;
      const requestedPage = typeof settings.page === "number" ? settings.page
        : typeof settings.page === "string" ? Number(settings.page) : 0;
      const page = Math.max(0, Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 0);
      // Resolve afresh: an existing Intl formatter retains the timezone from its creation.
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (cached && cached.plants === plants && cached.mode === mode && cached.week === week &&
          cached.page === page && cached.start === current.start && cached.end === current.end &&
          cached.zone === zone) return cached.view;
      const view = createView(plants, { mode, week, page, now });
      cached = { plants, mode, week, page, start: current.start, end: current.end, zone, view };
      return view;
    };
  }

  // A bounded index, independent of flower/garden pagination. Input weeks are newest first.
  function weekPage(weeks, selectedKey) {
    const ordered = [...weeks].reverse();
    const index = Math.max(0, ordered.findIndex((week) => week.key === selectedKey));
    const page = Math.floor(index / WEEK_PAGE_SIZE);
    const start = page * WEEK_PAGE_SIZE;
    return {
      page, start, total: ordered.length,
      pageCount: Math.ceil(ordered.length / WEEK_PAGE_SIZE),
      weeks: ordered.slice(start, start + WEEK_PAGE_SIZE),
      previous: ordered[start - WEEK_PAGE_SIZE]?.key || null,
      next: ordered[start + WEEK_PAGE_SIZE]?.key || null,
    };
  }

  const api = { PAGE_SIZE, ALBUM_SIZE, WEEK_PAGE_SIZE, GEOMETRY, createLayout, createView, createViewSelector, weekPage };
  root.GardenLayout = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : self);
