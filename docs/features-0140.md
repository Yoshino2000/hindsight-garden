# 0.14.0: compact weeks, badge colours and theme ambience

This version changes presentation. Growth rules, the twenty permanent achievement conditions and IDs, earn dates, schema 2, seven permissions and the 64 MB allowance remain unchanged.

## Garden layout

The motion checkbox moves into the garden heading beside the flower count. Garden navigation remains below the scene, on the left. The main scene's shared overflow wrapper trims 9% of its width from its empty top margin, compared with 5.5% in 0.13.0. Landscape, props, flowers and shadows still move together; projection and plot positions do not change. Miniatures keep their original geometry.

## Five weeks per page

The chronological week index now shows at most five weeks per page, with previous/next buttons once there are more than five. The final page contains any remaining weeks. Each page identifies its number and range; no internal scrolling is needed to see the five rows. Selecting a date or returning to the current week reveals its containing page. The separate limit of twelve garden miniatures per group and twenty-five flowers per garden is unchanged. Historical flowers are not deleted.

## Badge colour and completed cards

All nine total-bloom thresholds share one card: 1/5 are white, 10/25 blue, 50/100 purple, 250/500 gold and 1,000 rainbow. Text distinguishes two steps within one colour. The species-count card has white/purple/rainbow levels for 2/4/8 species. Eight species-first-bloom cards are white commemorative badges. Twenty original levels therefore fit in ten cards.

Colour is carried by the badge's ring and backing, with a matching text label. A card stays white until all its original levels have actually been earned; only then is it filled pale yellow. The right drawer retains each original condition, progress and earn date, including theme unlocks. Missing lower awards are never invented from a higher award. No database migration is involved.

## Theme-specific motion

Rain adds occasional leaf-tip drops and a slight canopy movement. Dusk adds soft ground light and occasional fireflies. Blossom adds sparse falling petals and stone-lantern ground light. These effects use fixed decorative nodes and CSS; no additional timers or JavaScript frame loop are introduced. They share the existing motion switch, visibility and reduced-motion controls; disabling motion hides these additions. Album miniatures remain still.

These effects are decorative impressions, not physically calculated reflection or refraction. They do not alter the flowers, growth timing or focus capture.
