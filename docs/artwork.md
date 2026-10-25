# Original artwork

The original environment sprites and their complete prompts for version 0.6.0 are documented in [Ambience artwork](artwork-ambience.md). Version 0.7.0 adds three original bird pose atlases and two butterfly color variants; their complete prompts are in [0.7.0 ambience artwork](artwork-ambience-070.md). These additions use the built-in image generation tool and retain their original source pixels and alpha channels. Atlas display and animation use CSS rather than rewriting the PNGs.

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

`icon.png` is an original flat flowerpot mark drawn reproducibly by `scripts/make-icon.ps1`, within Hindsight's 256 KB icon limit. Version 0.13.0 replaces the old icon with five flat colours: a pale-green rounded tile, cream flower, golden centre, green leaves and terracotta pot. It is 256×256, 5,800 bytes, and was visually checked at 32 and 24 pixels. The script uses System.Drawing primitives, no fonts, raster source, texture, gradient or shadow. Outside rounded corners are transparent. The plant strips below are separate generated illustrations; the unused full-resolution generated icon study is not part of the package.

## Version 0.3.0: two artwork roles

Added on 2026-10-25 with the built-in image generation tool. The four new high-definition strips follow the existing smiling pot style. Eight dedicated garden sprites are independent ground-planted clump compositions with simpler silhouettes, rather than resized versions of the pot art. All source PNGs retain their generated pixels and alpha transparency. The scene uses CSS/SVG view boxes to ignore transparent margins; no Python or other image editor changed a plant image. The original vector garden scenery was authored in the plugin UI. Forest's visual overview was used as an interaction reference, not as an image source: https://www.forestapp.cc/ . No Forest artwork was copied.

### assets/rose.png

High-definition five-stage strip, 1983 × 793 RGBA. The existing sunflower strip was supplied only as a style reference.

```text
Reference image role: visual style reference only, do not copy its sunflower. Generate a NEW original production plant sprite strip of rose 玫瑰 for the same cute cozy gardening plugin. One transparent PNG with exactly FIVE isolated plants left-to-right in ONE horizontal row, clearly separated by transparent gaps; use an extra-wide canvas. The SAME smiling peach terracotta pot in each view, at the same size and bottom baseline. Stage1: pot of soil with a little seed visible. Stage2: tiny two-leaf sprout. Stage3: juvenile leafy green rose 玫瑰 with NO flowers and NO buds. Stage4: a healthy plant with CLOSED flower buds only, NO open flowers. Stage5: fully mature plant with three soft rosy pink layered rose blossoms. Match the reference's cute non-realistic children's-book watercolor game style, warm dark-olive outlines, rounded forms, gentle pastel shading and soft internal texture. Entire plant and pot fit inside each separate region without touching neighbors, generous transparent spacing and padding. No background, no floor, no labels, no text, no UI, no existing characters or logos. Preserve genuine alpha transparency. All five pots must be identical in scale and alignment.
```

### assets/lavender.png

High-definition five-stage strip, 1983 × 793 RGBA. The existing sunflower strip was supplied only as a style reference.

```text
Reference image role: visual style reference only, do not copy its sunflower. Generate a NEW original production plant sprite strip of lavender 薰衣草 for the same cute cozy gardening plugin. One transparent PNG with exactly FIVE isolated plants left-to-right in ONE horizontal row, clearly separated by transparent gaps; use an extra-wide canvas. The SAME smiling peach terracotta pot in each view, at the same size and bottom baseline. Stage1: pot of soil with a little seed visible. Stage2: tiny two-leaf sprout. Stage3: juvenile leafy green lavender 薰衣草 with NO flowers and NO buds. Stage4: a healthy plant with CLOSED flower buds only, NO open flowers. Stage5: fully mature plant with a tidy tuft of seven soft purple lavender flower spikes. Match the reference's cute non-realistic children's-book watercolor game style, warm dark-olive outlines, rounded forms, gentle pastel shading and soft internal texture. Entire plant and pot fit inside each separate region without touching neighbors, generous transparent spacing and padding. No background, no floor, no labels, no text, no UI, no existing characters or logos. Preserve genuine alpha transparency. All five pots must be identical in scale and alignment.
```

### assets/cosmos.png

High-definition five-stage strip, 1983 × 793 RGBA. The existing sunflower strip was supplied only as a style reference.

```text
Reference image role: visual style reference only, do not copy its sunflower. Generate a NEW original production plant sprite strip of cosmos 波斯菊 for the same cute cozy gardening plugin. One transparent PNG with exactly FIVE isolated plants left-to-right in ONE horizontal row, clearly separated by transparent gaps; use an extra-wide canvas. The SAME smiling peach terracotta pot in each view, at the same size and bottom baseline. Stage1: pot of soil with a little seed visible. Stage2: tiny two-leaf sprout. Stage3: juvenile leafy green cosmos 波斯菊 with NO flowers and NO buds. Stage4: a healthy plant with CLOSED flower buds only, NO open flowers. Stage5: fully mature plant with three delicate pale pink cosmos flowers with yellow centers. Match the reference's cute non-realistic children's-book watercolor game style, warm dark-olive outlines, rounded forms, gentle pastel shading and soft internal texture. Entire plant and pot fit inside each separate region without touching neighbors, generous transparent spacing and padding. No background, no floor, no labels, no text, no UI, no existing characters or logos. Preserve genuine alpha transparency. All five pots must be identical in scale and alignment.
```

### assets/lily.png

High-definition five-stage strip, 1983 × 793 RGBA. The existing sunflower strip was supplied only as a style reference.

```text
Reference image role: visual style reference only, do not copy its sunflower. Generate a NEW original production plant sprite strip of lily 百合 for the same cute cozy gardening plugin. One transparent PNG with exactly FIVE isolated plants left-to-right in ONE horizontal row, clearly separated by transparent gaps; use an extra-wide canvas. The SAME smiling peach terracotta pot in each view, at the same size and bottom baseline. Stage1: pot of soil with a little seed visible. Stage2: tiny two-leaf sprout. Stage3: juvenile leafy green lily 百合 with NO flowers and NO buds. Stage4: a healthy plant with CLOSED flower buds only, NO open flowers. Stage5: fully mature plant with two ivory white lily flowers with soft peach throats. Match the reference's cute non-realistic children's-book watercolor game style, warm dark-olive outlines, rounded forms, gentle pastel shading and soft internal texture. Entire plant and pot fit inside each separate region without touching neighbors, generous transparent spacing and padding. No background, no floor, no labels, no text, no UI, no existing characters or logos. Preserve genuine alpha transparency. All five pots must be identical in scale and alignment.
```

### assets/garden/sunflower.png

Dedicated compact garden composition, 1254 × 1254 RGBA, viewed at miniature scene size. It is a separate original illustration without a flowerpot.

```text
Use case: stylized-concept. Asset type: one original tiny garden game sprite for Time Garden. Subject: a short sturdy sunflower clump with two golden yellow flowers and dark brown round centers. Render the mature plant planted directly in the ground, seen from a gentle isometric 3/4 top-down view (camera looking downward about 35 degrees), to sit naturally in a miniature garden scene. Cute, non-realistic rounded 2D game illustration, clean warm dark-olive outlines, softly shaded pastel colors, chunky simplified silhouettes readable at a 48-pixel display size. A few small green leaves at the base, no pot, no container, no smiling face, no grass tile, no dirt platform, no rectangle, no terrain, no text, no UI, no labels, no brand or existing game artwork. Exactly ONE centered isolated flower clump, no duplicated views. Crisp uncluttered shapes with broad petals, very little texture. Actual transparent background, generous padding on all four sides, ground contact point at roughly 80% height. Square canvas. This is a compact garden sprite, distinctly simpler than a high-definition botanical portrait.
```

### assets/garden/hydrangea.png

Dedicated compact garden composition, 1254 × 1254 RGBA, viewed at miniature scene size. It is a separate original illustration without a flowerpot.

```text
Use case: stylized-concept. Asset type: one original tiny garden game sprite for Time Garden. Subject: a compact rounded hydrangea bush with lavender-blue and lilac flower clusters. Render the mature plant planted directly in the ground, seen from a gentle isometric 3/4 top-down view (camera looking downward about 35 degrees), to sit naturally in a miniature garden scene. Cute, non-realistic rounded 2D game illustration, clean warm dark-olive outlines, softly shaded pastel colors, chunky simplified silhouettes readable at a 48-pixel display size. A few small green leaves at the base, no pot, no container, no smiling face, no grass tile, no dirt platform, no rectangle, no terrain, no text, no UI, no labels, no brand or existing game artwork. Exactly ONE centered isolated flower clump, no duplicated views. Crisp uncluttered shapes with broad petals, very little texture. Actual transparent background, generous padding on all four sides, ground contact point at roughly 80% height. Square canvas. This is a compact garden sprite, distinctly simpler than a high-definition botanical portrait.
```

### assets/garden/tulip.png

Dedicated compact garden composition, 1254 × 1254 RGBA, viewed at miniature scene size. It is a separate original illustration without a flowerpot.

```text
Use case: stylized-concept. Asset type: one original tiny garden game sprite for Time Garden. Subject: a small clump of three coral-pink tulips with smooth upright cup-shaped blooms. Render the mature plant planted directly in the ground, seen from a gentle isometric 3/4 top-down view (camera looking downward about 35 degrees), to sit naturally in a miniature garden scene. Cute, non-realistic rounded 2D game illustration, clean warm dark-olive outlines, softly shaded pastel colors, chunky simplified silhouettes readable at a 48-pixel display size. A few small green leaves at the base, no pot, no container, no smiling face, no grass tile, no dirt platform, no rectangle, no terrain, no text, no UI, no labels, no brand or existing game artwork. Exactly ONE centered isolated flower clump, no duplicated views. Crisp uncluttered shapes with broad petals, very little texture. Actual transparent background, generous padding on all four sides, ground contact point at roughly 80% height. Square canvas. This is a compact garden sprite, distinctly simpler than a high-definition botanical portrait.
```

### assets/garden/daisy.png

Dedicated compact garden composition, 1254 × 1254 RGBA, viewed at miniature scene size. It is a separate original illustration without a flowerpot.

```text
Use case: stylized-concept. Asset type: one original tiny garden game sprite for Time Garden. Subject: a low daisy clump with five ivory white flowers and butter-yellow centers. Render the mature plant planted directly in the ground, seen from a gentle isometric 3/4 top-down view (camera looking downward about 35 degrees), to sit naturally in a miniature garden scene. Cute, non-realistic rounded 2D game illustration, clean warm dark-olive outlines, softly shaded pastel colors, chunky simplified silhouettes readable at a 48-pixel display size. A few small green leaves at the base, no pot, no container, no smiling face, no grass tile, no dirt platform, no rectangle, no terrain, no text, no UI, no labels, no brand or existing game artwork. Exactly ONE centered isolated flower clump, no duplicated views. Crisp uncluttered shapes with broad petals, very little texture. Actual transparent background, generous padding on all four sides, ground contact point at roughly 80% height. Square canvas. This is a compact garden sprite, distinctly simpler than a high-definition botanical portrait.
```

### assets/garden/rose.png

Dedicated compact garden composition, 1254 × 1254 RGBA, viewed at miniature scene size. It is a separate original illustration without a flowerpot.

```text
Use case: stylized-concept. Asset type: one original tiny garden game sprite for Time Garden. Subject: a compact miniature rose bush with three soft pink-red rounded layered roses. Render the mature plant planted directly in the ground, seen from a gentle isometric 3/4 top-down view (camera looking downward about 35 degrees), to sit naturally in a miniature garden scene. Cute, non-realistic rounded 2D game illustration, clean warm dark-olive outlines, softly shaded pastel colors, chunky simplified silhouettes readable at a 48-pixel display size. A few small green leaves at the base, no pot, no container, no smiling face, no grass tile, no dirt platform, no rectangle, no terrain, no text, no UI, no labels, no brand or existing game artwork. Exactly ONE centered isolated flower clump, no duplicated views. Crisp uncluttered shapes with broad petals, very little texture. Actual transparent background, generous padding on all four sides, ground contact point at roughly 80% height. Square canvas. This is a compact garden sprite, distinctly simpler than a high-definition botanical portrait.
```

### assets/garden/lavender.png

Dedicated compact garden composition, 1254 × 1254 RGBA, viewed at miniature scene size. It is a separate original illustration without a flowerpot.

```text
Use case: stylized-concept. Asset type: one original tiny garden game sprite for Time Garden. Subject: a tidy lavender clump with seven purple flower spikes and grey sage narrow leaves. Render the mature plant planted directly in the ground, seen from a gentle isometric 3/4 top-down view (camera looking downward about 35 degrees), to sit naturally in a miniature garden scene. Cute, non-realistic rounded 2D game illustration, clean warm dark-olive outlines, softly shaded pastel colors, chunky simplified silhouettes readable at a 48-pixel display size. A few small green leaves at the base, no pot, no container, no smiling face, no grass tile, no dirt platform, no rectangle, no terrain, no text, no UI, no labels, no brand or existing game artwork. Exactly ONE centered isolated flower clump, no duplicated views. Crisp uncluttered shapes with broad petals, very little texture. Actual transparent background, generous padding on all four sides, ground contact point at roughly 80% height. Square canvas. This is a compact garden sprite, distinctly simpler than a high-definition botanical portrait.
```

### assets/garden/cosmos.png

Dedicated compact garden composition, 1254 × 1254 RGBA, viewed at miniature scene size. It is a separate original illustration without a flowerpot.

```text
Use case: stylized-concept. Asset type: one original tiny garden game sprite for Time Garden. Subject: a light airy cosmos clump with three pale pink eight-petaled flowers and golden centers. Render the mature plant planted directly in the ground, seen from a gentle isometric 3/4 top-down view (camera looking downward about 35 degrees), to sit naturally in a miniature garden scene. Cute, non-realistic rounded 2D game illustration, clean warm dark-olive outlines, softly shaded pastel colors, chunky simplified silhouettes readable at a 48-pixel display size. A few small green leaves at the base, no pot, no container, no smiling face, no grass tile, no dirt platform, no rectangle, no terrain, no text, no UI, no labels, no brand or existing game artwork. Exactly ONE centered isolated flower clump, no duplicated views. Crisp uncluttered shapes with broad petals, very little texture. Actual transparent background, generous padding on all four sides, ground contact point at roughly 80% height. Square canvas. This is a compact garden sprite, distinctly simpler than a high-definition botanical portrait.
```

### assets/garden/lily.png

Dedicated compact garden composition, 1254 × 1254 RGBA, viewed at miniature scene size. It is a separate original illustration without a flowerpot.

```text
Use case: stylized-concept. Asset type: one original tiny garden game sprite for Time Garden. Subject: a compact clump of two ivory-white lilies with pale peach throats and broad green leaves. Render the mature plant planted directly in the ground, seen from a gentle isometric 3/4 top-down view (camera looking downward about 35 degrees), to sit naturally in a miniature garden scene. Cute, non-realistic rounded 2D game illustration, clean warm dark-olive outlines, softly shaded pastel colors, chunky simplified silhouettes readable at a 48-pixel display size. A few small green leaves at the base, no pot, no container, no smiling face, no grass tile, no dirt platform, no rectangle, no terrain, no text, no UI, no labels, no brand or existing game artwork. Exactly ONE centered isolated flower clump, no duplicated views. Crisp uncluttered shapes with broad petals, very little texture. Actual transparent background, generous padding on all four sides, ground contact point at roughly 80% height. Square canvas. This is a compact garden sprite, distinctly simpler than a high-definition botanical portrait.
```
