"""Builds the runtime PNGs from the full-size originals in assets-source/.

Each copy is sized for the largest place it appears (the 790 px wide scene, the 200 px tall pot,
the 135 px flower drawer) at 3x device pixels, so no screen shows it below its native detail.
CSS and SVG address the artwork in proportions or source coordinates, so only resolution changes.
The swing keeps its original size in assets/: its foot shadows are tested against exact atlas pixels.
"""

import argparse
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SPECIES = ("sunflower", "hydrangea", "tulip", "daisy", "rose", "lavender", "cosmos", "lily")
# Relative path -> output size. Atlases keep exact 3:1 / 2:1 cells.
SIZES = {
    **{f"{name}.png": (1586, 634) for name in SPECIES},           # pot stages: 200 px tall
    **{f"garden/{name}.png": (640, 640) for name in SPECIES},     # drawer: 135 px
    "collection/props-rain.png": (1298, 436),                     # bench: 145 px for 780 columns
    "collection/props-dusk.png": (1302, 434),
    "collection/props-blossom.png": (1302, 434),
    "collection/themes.png": (870, 290),                          # branch and theme cards: 87 px
    "collection/milestones.png": (978, 326),                      # drawer badge: 78 × 104 px
    **{f"ambience/bird-{name}.png": (543, 181) for name in ("blue", "robin", "finch")},  # 28 px
    **{f"ambience/{name}.png": (256, 256) for name in ("butterfly", "butterfly-amber", "butterfly-blue")},  # 32 px
}


def resize(source, size):
    image = Image.open(source)
    image.load()
    if image.mode != "RGBA":
        raise ValueError(f"{source}: expected RGBA artwork")
    # Premultiplied filtering keeps transparent pixels' hidden colours out of the outline.
    return image.convert("RGBa").resize(size, Image.Resampling.LANCZOS).convert("RGBA")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=ROOT / "assets-source")
    parser.add_argument("--out", type=Path, default=ROOT / "assets")
    options = parser.parse_args()
    before = after = 0
    for relative, size in SIZES.items():
        source, target = options.source / relative, options.out / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        resize(source, size).save(target, optimize=True)
        before += source.stat().st_size
        after += target.stat().st_size
        print(f"{relative:34s} {Image.open(source).size} -> {size}  {source.stat().st_size // 1024} KB -> {target.stat().st_size // 1024} KB")
    print(f"total {before / 1e6:.2f} MB -> {after / 1e6:.2f} MB")


if __name__ == "__main__":
    main()
