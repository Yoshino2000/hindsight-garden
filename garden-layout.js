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

  function createLayout(plants, page = 0) {
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

  const api = { PAGE_SIZE, MAX_PLANTS, createLayout };
  root.GardenLayout = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : self);
