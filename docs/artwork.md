# Original artwork

The four plant strips were created for Time Garden with the built-in image generation tool on 2026-10-25. They are original generated illustrations, not Forest assets or edits of third-party art. They use a cute hand-painted style and real PNG alpha transparency. Five frames show seed, sprout, leaves, bud and bloom. Each strip is 1983 × 793 pixels. The generator did not space every frame equally: the UI uses per-frame horizontal bounds and CSS background positioning to show one plant at its original proportions, without changing the source pixels. No generated plant image was edited with Python or another image editor. The source dimensions and visible frame bounds were inspected read-only.

The software is MIT-licensed. These AI-generated illustrations are provided with the project for use and redistribution to the extent permitted by applicable law; exclusive copyright in generated imagery is not asserted. No affiliation with Forest is implied.

## sunflower.png

Generation prompt:

```text
Use case: stylized-concept. Asset type: production sprite strip for a cozy desktop gardening plugin. Create ONE transparent PNG image, extremely wide 5:1 aspect ratio, exactly FIVE equally spaced SQUARE cells in a single horizontal row, no borders or labels. Each cell shows the SAME cute small terracotta flowerpot at exactly the same size, perspective and bottom baseline, isolated with generous transparent padding. Left to right: (1) pot of soil with one tiny sunflower seed visible, (2) tiny two-leaf sprout, (3) leafy juvenile SUNFLOWER, (4) taller sunflower with a closed rounded flower bud, (5) one fully blooming cheerful golden SUNFLOWER with soft brown center and green leaves. Cute non-realistic hand-painted children's game illustration, rounded shapes, clean warm dark olive outlines, matte pastel colors, gentle dimensional shading, subtle paperlike texture only within painted shapes, readable at small UI sizes. Pot is identical peach terracotta, simple tiny smiling face on the pot in every cell. Each plant entirely inside its own cell, no overlap or props, no floor, no cast shadow outside pot, no text, no watermarks, no existing characters or brands. Actual transparent background. Consistent scale across all five stages, maturity bigger above unchanged pot. Canvas width exactly five times height, e.g.2560x512.
```

## hydrangea.png

Generation prompt:

```text
Use case: stylized-concept. Asset type: production five-stage plant sprite strip for a cozy desktop gardening plugin. Create ONE transparent PNG image in extremely wide 5:1 aspect ratio: exactly FIVE equal SQUARE cells in a single horizontal row, no borders, no labels. Each cell shows the SAME cute little peach terracotta flowerpot at the same size and bottom baseline, with a tiny simple smiling face. The plant is hydrangea 绣球. Left to right: (1) pot with soil and visible little seed, (2) tiny two-leaf sprout, (3) healthy juvenile green plant recognizably pastel lilac hydrangea, (4) leafy plant with closed flower buds, (5) fully blooming a cluster of tiny rounded lavender and periwinkle blossoms. Cute non-realistic hand-painted children's game illustration, soft rounded shapes, clean warm dark olive outlines, matte pastel palette, gentle dimensional shading, subtle paperlike texture only within painted shapes. Clear readable small icon shapes. Keep identical pot design, scale, perspective and baseline across five cells. Generous transparent padding within every cell, no overlap across cells; show entire plants. No floor, props, background, labels, text, existing brands, existing characters, watermarks. Actual transparency. Canvas width exactly five times height, e.g.2560x512.
```

## tulip.png

Generation prompt:

```text
Use case: stylized-concept. Asset type: production five-stage plant sprite strip for a cozy desktop gardening plugin. Create ONE transparent PNG image in extremely wide 5:1 aspect ratio: exactly FIVE equal SQUARE cells in a single horizontal row, no borders, no labels. Each cell shows the SAME cute little peach terracotta flowerpot at the same size and bottom baseline, with a tiny simple smiling face. The plant is tulip 郁金香. Left to right: (1) pot with soil and visible little seed, (2) tiny two-leaf sprout, (3) healthy juvenile green plant recognizably coral-pink tulip, (4) leafy plant with closed flower buds, (5) fully blooming one rounded coral-pink tulip bloom with smooth cupped petals. Cute non-realistic hand-painted children's game illustration, soft rounded shapes, clean warm dark olive outlines, matte pastel palette, gentle dimensional shading, subtle paperlike texture only within painted shapes. Clear readable small icon shapes. Keep identical pot design, scale, perspective and baseline across five cells. Generous transparent padding within every cell, no overlap across cells; show entire plants. No floor, props, background, labels, text, existing brands, existing characters, watermarks. Actual transparency. Canvas width exactly five times height, e.g.2560x512.
```

Targeted edit prompt (only cell three changed using the built-in image tool):

```text
Edit target: the attached five-cell tulip plant sprite strip. Change ONLY the THIRD plant from the left: it must be the leafy juvenile stage with green leaves and NO flower, NO petals, NO flower bud. Keep the identical third pot and its soil. Preserve the other four cells EXACTLY including seed cell1, sprout cell2, closed bud cell4, full bloom cell5, identical pot positions, smiling faces, scale, baseline, canvas dimensions, hand-painted cute cartoon style, colors and genuine alpha transparency. Do not add labels or any background. The result must retain a single five-cell horizontal strip and the original cell alignment.
```

## daisy.png

Generation prompt:

```text
Use case: stylized-concept. Asset type: production five-stage plant sprite strip for a cozy desktop gardening plugin. Create ONE transparent PNG image in extremely wide 5:1 aspect ratio: exactly FIVE equal SQUARE cells in a single horizontal row, no borders, no labels. Each cell shows the SAME cute little peach terracotta flowerpot at the same size and bottom baseline, with a tiny simple smiling face. The plant is daisy 雏菊. Left to right: (1) pot with soil and visible little seed, (2) tiny two-leaf sprout, (3) healthy juvenile green plant recognizably white daisy, (4) leafy plant with closed flower buds, (5) fully blooming three small creamy white daisy flowers with butter-yellow centers. Cute non-realistic hand-painted children's game illustration, soft rounded shapes, clean warm dark olive outlines, matte pastel palette, gentle dimensional shading, subtle paperlike texture only within painted shapes. Clear readable small icon shapes. Keep identical pot design, scale, perspective and baseline across five cells. Generous transparent padding within every cell, no overlap across cells; show entire plants. No floor, props, background, labels, text, existing brands, existing characters, watermarks. Actual transparency. Canvas width exactly five times height, e.g.2560x512.
```

Targeted edit prompt (only cell three changed using the built-in image tool):

```text
Edit target: the attached five-cell daisy plant sprite strip. Change ONLY the THIRD plant from the left: it must be the leafy juvenile stage with green leaves and NO flower, NO petals, NO flower bud. Keep the identical third pot and its soil. Preserve the other four cells EXACTLY including seed cell1, sprout cell2, closed bud cell4, full bloom cell5, identical pot positions, smiling faces, scale, baseline, canvas dimensions, hand-painted cute cartoon style, colors and genuine alpha transparency. Do not add labels or any background. The result must retain a single five-cell horizontal strip and the original cell alignment.
```

## Package icon

`icon.png` is an original compact geometric flowerpot icon drawn by `scripts/make-icon.ps1`, to meet Hindsight's 256 KB icon limit. The four plant strips used in the UI are the generated illustrations above. The full-resolution generated icon study was not included in the runtime package.
