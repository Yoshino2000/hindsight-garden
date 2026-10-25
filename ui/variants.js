// SVG-native petal palettes: retain the original linework, shading and green leaves.
// Nothing changes until bloom. No extra bitmap copies, timers or animated sparkles.
(function (root) {
  "use strict";
  const PALETTES = {
    sunflower: { name: "晨粉向日葵", color: "#efb8d4", mask: [8, -8, 0, -.2], brightness: true },
    hydrangea: { name: "杏霞绣球", color: "#f6c4a6", mask: [1, -3, 2, -.15] },
    tulip: { name: "晴蓝郁金香", color: "#a9d9f7", mask: [4, -3, -1, -.5] },
    daisy: { name: "浅紫雏菊", color: "#d6b8ed", mask: [2, 2, 2, -4.2] },
    rose: { name: "月蓝玫瑰", color: "#b8cafa", mask: [4, -3, -1, -.5] },
    lavender: { name: "薄荷薰衣草", color: "#b2e5d5", mask: [1, -3, 2, -.15] },
    cosmos: { name: "蜜橙波斯菊", color: "#f7cb8e", mask: [4, -3, -1, -.5] },
    lily: { name: "淡樱百合", color: "#f1bfd4", mask: [2, 2, 2, -4.2] },
  };
  let sequence = 0;
  function coefficients(color) {
    const rgb = color.match(/[a-f\d]{2}/gi).map(value => parseInt(value, 16) / 255);
    return rgb.flatMap(value => [.2126, .7152, .0722].map(weight => weight * (.35 + .65 * value))
      .concat([0, .22 * value])).concat([0, 0, 0, 1, 0]);
  }
  function decorate(svg, image, id, variant) {
    const palette = PALETTES[id];
    if (variant !== "hidden" || !palette) return;
    const doc = svg.ownerDocument;
    const node = (tag, attributes) => {
      const result = doc.createElementNS("http://www.w3.org/2000/svg", tag);
      for (const [key, value] of Object.entries(attributes || {})) result.setAttribute(key, String(value));
      return result;
    };
    const filterId = `hidden-petals-${++sequence}`;
    const defs = node("defs");
    const filter = node("filter", { id: filterId, x: "0%", y: "0%", width: "100%", height: "100%", "color-interpolation-filters": "sRGB" });
    filter.append(node("feColorMatrix", { in: "SourceGraphic", type: "matrix", values: coefficients(palette.color).join(" "), result: "tone" }));
    filter.append(node("feColorMatrix", { in: "SourceGraphic", type: "matrix", values: [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0,
      palette.mask[0],palette.mask[1],palette.mask[2],0,palette.mask[3]].join(" "), result: palette.brightness ? "chroma" : "petals" }));
    if (palette.brightness) {
      filter.append(node("feColorMatrix", { in: "SourceGraphic", type: "matrix", values: "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 2.5 2.5 0 0 -2.4", result: "light" }));
      filter.append(node("feComposite", { in: "chroma", in2: "light", operator: "in", result: "petals" }));
    }
    filter.append(node("feComposite", { in: "tone", in2: "petals", operator: "in", result: "colored" }));
    filter.append(node("feComposite", { in: "SourceGraphic", in2: "petals", operator: "out", result: "foliage" }));
    filter.append(node("feComposite", { in: "colored", in2: "foliage", operator: "arithmetic", k2: 1, k3: 1 }));
    defs.append(filter); svg.prepend(defs);
    image.setAttribute("filter", `url(#${filterId})`);
    svg.dataset.variant = "hidden";
  }
  const api = { PALETTES, coefficients, decorate };
  root.GardenVariants = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : self);
