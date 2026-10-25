# Ambience artwork (0.6.0)

Three original transparent PNGs were generated with the built-in image generation tool on 2026-10-25. No external image service or CLI was used. The source pixels and alpha channels are unchanged; the swing atlas is displayed as two registered CSS cells. Bird and butterfly source images are each 1254 × 1254; the two-cell swing atlas is 1774 × 887. Decorations do not create plant records.

The support is static, with only the rope-and-seat layer gently pivoting. Album miniatures stay static. Bird visits occur on a 58-second cycle and butterfly visits on a 40-second cycle, with initial delays and long invisible intervals. Animation is optional, pauses outside the visible garden and honors reduced motion.

## assets/ambience/swing.png

```text
Use case: stylized-concept. Asset type: transparent layered sprite atlas for a small calm isometric flower-garden game.
Create ORIGINAL cute hand-painted storybook game art, matte pastel honey-brown wood, thin warm outlines, soft watercolor-like shading, simple silhouettes. Not realistic, not glossy, no text/logos.
A wide 2:1 transparent canvas divided into TWO equal square cells with generous empty separation; no drawn divider or labels.
LEFT CELL: a complete small wooden A-frame garden swing SUPPORT ONLY, slightly top-down three-quarter front view, sturdy horizontal beam across upper 22% of the cell, two slanted side supports reaching 86% height. NO ropes, NO seat, no background.
RIGHT CELL: ONLY the matching suspended swing assembly: two slender cream rope pairs descend from two attachment points at 22% cell height to a small warm wooden plank seat around 65% height, matching the support perspective. Absolutely NO support frame in this right cell.
Both square cells use the same scale, central axis and registration: when the right cell is overlaid directly onto the left, the ropes attach to the beam and the seat hangs between the legs. Keep all components fully inside their own cell with wide transparent margins, no overlap between cells. Each cell independently centered. Actual alpha transparency, no checkerboard, no ground plane, no flowers, no people. This atlas will be cropped by SVG viewBox only; left support stays still and right ropes+seat gently pivot around their upper attachment line.
```

## assets/ambience/bird.png

```text
Use case: stylized-concept. Asset type: original transparent sprite for an occasional bird crossing in a calm cute isometric flower-garden game.
ONE tiny round pastel blue-grey garden songbird in flight, facing RIGHT, shown in a clear slightly top-down three-quarter side view; soft cream belly, small muted yellow beak, subtle sage-blue wings gently lifted, dark dot eye, friendly modest expression, short tail. Cute hand-painted storybook illustration, matte soft colors, thin warm grey outlines, simple clean silhouette readable when displayed 25-35 pixels tall, no realism or glossy 3D. Entire bird and wings visible, centered, fills about 70 percent of a square transparent canvas with generous margins. No other birds, no frame, no lettering, no watermark, no landscape, no ground or shadow. True alpha-transparent background, not a checkerboard. This will float across the far background very occasionally; restrained lovely character rather than an attention-grabbing mascot.
```

## assets/ambience/butterfly.png

```text
Use case: stylized-concept. Asset type: original transparent butterfly sprite for a calm cute isometric flower-garden game.
ONE small delicate pastel lilac and dusty-pink butterfly, gently open wings, tiny dark warm-grey body and fine antennae, slightly top-down three-quarter view as if hovering above flowers. Simple symmetrical rounded wing shapes with just two subtle cream spots, friendly storybook hand-painted matte illustration with fine warm outlines, soft shading, designed to remain legible at 18-24 pixels tall. Muted quiet palette, not neon, not photorealistic, not shiny 3D. Entire insect centered in square frame and occupying about 65 percent of canvas, ample alpha-transparent margins. No flowers, no trail, no sparkles, no extra insects, no text/logo/watermark. Actual transparent background, no checkerboard, no ground shadow. This butterfly should blend with a gentle sage-green flower garden and never look flashy.
```

