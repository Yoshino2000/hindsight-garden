# 0.15.0: visible ambience and observed growth records

## Compact empty-garden footer

The empty-week message sits on the left and the current-pot button on the right. The message wraps within its column in narrow windows; the button stays beside it. Populated gardens put navigation on the left and the interaction hint on the right in one vertically centered row. Narrow hints wrap within their right-hand column rather than moving above the controls.

## Visible, bounded theme motion

Five blossom petals follow staggered eighteen-second CSS routes. Usually two or three are visible: they enter near the scene top, fall to safe rear/side lawn positions, then stay in place while fading. Petals measure 6–9 CSS pixels. Air details render above the flowers, while ground light remains below props. Rain drops and dusk fireflies are larger and more frequent than in 0.14.0, with stronger but bounded ground light. No new timers, external textures or JavaScript frame loop are used.

All four themes share clearer expanding pond ripples, a moving reflection and two independently drifting lily pads. Water details are clipped to the existing pond ellipse; shore reeds and stones remain fixed. The existing motion switch, hidden-page/tab handling and reduced-motion preference control the new effects. Miniatures remain static and use unique SVG paint/clip IDs. The background projection and original PNG pixels are unchanged.

## Effective growth statistics

`focusStats` is a small versioned object in the existing CAS-protected hot state. Its start date is the upgrade/initialization instant. Old flowers, target durations and existing active-pot progress are not historical time logs and are not backfilled.

Only the milliseconds actually credited to a growing plant are counted, capped by its remaining target. OR rules do not duplicate time. Interruption deductions never subtract previously observed time. This is this plugin's effective growth time, not a measurement of attention or all Hindsight activity.

- `totalMs`: lifetime effective growth since the recorded start.
- `longestMs` / `streakMs`: longest and current uninterrupted effective growth stretches. Matching activity/category changes may continue a stretch. Manual pause, away, mismatch, worker boot, a gap over ten seconds, clock reversal, rule replacement, blooming or deleting the active pot ends it. Naming, notes and notification settings do not end it.
- At most 24 category IDs retain separate millisecond buckets and their last observed category names. Later new category IDs accumulate in `otherMs`; missing category IDs accumulate in `uncategorizedMs`. Every millisecond belongs to exactly one bucket. The distribution's denominator includes both special buckets; they do not count as named categories for achievements. No title, application or domain history is added to these statistics.

## Sixteen new achievement conditions

The twenty original IDs, conditions and dates remain. There are now 36 permanent levels in 16 display cards.

| Group | Conditions |
| --- | --- |
| Continuous growth | 5 / 15 / 25 / 45 / 60 uninterrupted minutes |
| Total effective growth | 1 / 5 / 10 / 25 / 50 hours |
| Category variety | 2 / 3 / 5 separately tracked categories, each with at least ten minutes |
| One main category | At least one total hour, with one named category at 80% or more |
| Two balanced categories | At least one total hour, with two named categories each at 25% or more |
| Three categories | At least two total hours, with three named categories each at 15% or more |

Ratio cards show qualification progress, explicitly labelled as such. The distribution and detail drawer separately show actual category shares. Minimum duration and ratio conditions must both hold; unmet progress never rounds up to an earned award. A ratio award is permanent even if later activity changes the distribution. Card backgrounds stay white until all their levels are earned, then turn pale yellow. Focus achievements have simple local SVG icons and use the existing five badge colours.

## Why growth is paused

The current-pot page explains manual pause, stale worker state, missing foreground information, away, missing classification/domain fields, unmatched rules and deleted categories. It shows the observed app/domain/category alongside the existing required rules, and gives an appropriate next action. Successful matches identify the matching rule. Catalog failures are not described as deleted categories. Explanations do not collect activity themselves or change the worker's matching decision. Window titles are not displayed by this module.

## Upgrade boundaries

Seven permissions, 64 MB and archive schema 2 remain. Achievement revision advances to 3 and `focusStats` has its own schema 1. A persistent SQL guard prevents older writers from dropping the statistics. Close old plugin pages/workers before updating. Versions up to 0.14.0 cannot safely read/write the new state; rollback requires a consistent pre-upgrade backup, not direct downgrade. Original art, garden geometry and visitor scheduling remain unchanged.

The preview's optional three-hour distribution is an explicit disposable synthetic fixture. It is not inferred from its 36 example flowers, does not access personal data and is excluded from the package. Native final-ZIP validation remains separate from simulated-host checks.
