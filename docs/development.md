# Development

## References and style

Read the author's [getting started](https://github.com/Tomotsugu-dev/hindsight-plugins/blob/main/docs/en/getting-started.md), [API](https://github.com/Tomotsugu-dev/hindsight-plugins/blob/main/docs/en/api.md), [permissions](https://github.com/Tomotsugu-dev/hindsight-plugins/blob/main/docs/en/permissions.md), and [contribution requirements](https://github.com/Tomotsugu-dev/hindsight-plugins/blob/main/CONTRIBUTING.md).

The reference plugin is [Focus](https://github.com/Tomotsugu-dev/hindsight-focus), particularly its classic worker entry, pure `core.js`, SQLite `store.js`, and `ui/main.js`. Time Garden uses the same small-module approach, two-space indentation, double quotes and semicolons. It has no runtime framework or bundler. Its rules, UI and art are independently implemented; Focus source and illustrations are not copied.

## Files

| File | Responsibility |
|---|---|
| `background.js` | Serialize fresh focus events and timer ticks; deliver bloom notifications after persistence |
| `core.js` | Pure matching, growth, interruption, planting plans, task notes and persistent milestones |
| `store.js` | Parameter-bound SQLite archives, version-checked hot-state writes and atomic schema migration |
| `ui/main.js` | DOM UI, validated commands and polling |
| `ui/plant-guide.js` | Offline origin, story, cultural meaning and source data for eight plants |
| `ui/collection.js` | Theme definitions, unlock lookup and completed-goal time formatting |
| `ui/ambience.js` | Randomized visitor timers; CSS performs flights, wing poses and shadows |
| `ui/style.css` | Responsive garden, compact view and stage-sprite display |
| `ui/album.css` | Bounded chronological week index, fixed review/album panel and scope controls |
| `ui/features.css` | Planting-plan controls, task notes, review, milestones and theme appearance |
| `ui/compact.css` | Denser two-column current-pot and planting layouts, excluding compact-pot mode |
| `ui/achievements.css` | Filterable compact achievement list and its nonmodal detail drawer |
| `ui/themes.css` | Complete scene palettes, replacement props and static miniature equivalents |
| `ui/drawer.css` | Nonmodal right-side flower-detail overlay |
| `garden-layout.js` | Pure local-week grouping/review, album pages and stable center-out positions, 25 flowers per garden |
| `assets/*.png` | Eight high-definition five-stage potted plant strips for growth and selection |
| `assets/garden/*.png` | Eight independently generated, simpler ground-planted garden sprites |
| `assets/ambience/*.png` | Original layered swing, three bird pose atlases and butterfly variants |
| `assets/collection/*.png` | Original milestone/theme illustrations and 0.12.0 three-prop theme atlases |
| `test/*.test.cjs` | Isolated deterministic rules/store/worker tests |
| `scripts/preview.py` | Local simulated host, actual extracted bridges and temporary SQLite |
| `scripts/package.py` | Allowlisted, deterministic installable ZIP and release metadata |

The worker and page share versioned state. Compare-and-swap writes retry from a fresh read so a page command cannot silently overwrite a worker's growth update. Notifications must follow a successful state commit, rather than happen during a reducer retry. The one active plant prevents overlapping-rule double credit. A worker identity prevents an older worker from advancing a new worker's session.

## Storage and upgrade

Version 0.5.0 separates the hot runtime state from completed flowers. Mature plants are archived as individual SQLite rows instead of rewriting the entire garden every two seconds. Loads check an archive revision and reuse the cached collection while it is unchanged. The fixed 200-plant cap is removed, with no automatic deletion of old plants. This is not unlimited storage: `storage_mb` increases from 4 to 64, while Hindsight's per-value/per-row 256,000-byte limit and other database limits remain in force. A full database must report insufficient space and retain existing records. Version 0.11.0 retains schema 2, the 64 MB allowance and seven API permissions. It adds hot-state fields for `plans`, `lastPlanting`, `collection` and `earnedAchievements`, plus optional `taskNote` on active and mature plants; the matching and growth rules remain unchanged.

Version 0.12.0 keeps these storage, permission and growth boundaries. `achievementRevision: 2` marks the expanded achievement catalog. An existing permanent collection counter is reused to award newly reached catalog entries in one CAS update; the upgrade does not scan the mature archive or replace the original four earned timestamps. New awards use the verification instant. Gardens older than 0.11.0 still establish their one-time archive baseline as described below.

Schema-1 to schema-2 migration uses a compare-and-swap state update and SQLite triggers so archive insertion and state conversion are atomic within the database write. It must not depend on a transaction held across separate host calls: the host opens a new database connection for each call. If an archive operation fails, the entire migration transaction rolls back, preserving the old state. Keep the active plant, progress, preferences and existing completed-plant metadata. Test failures and contention explicitly; do not count layout stress tests as evidence of migration integrity.

Back up the plugin database before upgrading, with Hindsight stopped or through SQLite online backup. Releases before 0.5.0 do not understand schema 2. Returning to one of those releases requires restoring the backup made before migration, not running example deletion commands against a live garden or merely reinstalling an older ZIP. The seven API permissions are unchanged from 0.4.0; the storage increase introduced in 0.5.0 appears in normal update authorization when coming from an earlier release.

Schema 2 does not make downgrades from 0.11.0 safe. Versions 0.5.0–0.10.0 do not preserve the new hot-state fields when normalizing and writing state, and cannot preserve an active plant's task note. Do not downgrade or run old and new versions together. Restore a consistent pre-upgrade backup to return to those versions. An older version's successful schema-2 read does not establish compatible writes.

After a 0.12.0 update, 0.11.0 also cannot be used as a downgrade: it rejects achievement IDs outside its original four-entry catalog. Do not remove IDs, edit the database or bypass the compatibility guard to make an old version start. Restore a consistent pre-upgrade backup when returning to a previous release.

The persistent SQLite `garden_require_features_v1` trigger runs before updates to the state value. Once the old row contains a `collection` object, `plans` array and `earnedAchievements` object, a new row that drops those fields or changes their required types is rejected with `RAISE(ABORT)`. This blocks legacy reducer writes that would discard the new metadata; the old page or worker receives an error and must be closed and reopened on the latest version. Initial schema-1 migration, other state keys and the current version's internal archive-cleanup update remain allowed. This guard is a compatibility boundary, not permission to downgrade or a substitute for a consistent backup.

The first read of an older schema-2 garden establishes `collection` from an aggregate of the current archive, then commits it with the hot version and the same archive revision guard. Schema-1 migration establishes this baseline from its existing garden in the same migration write. Later blooms increment `totalBlooms`, add their species and award any reached milestones in the same CAS commit as archive insertion. Deletes never decrement this lifetime progress or revoke `earnedAchievements`; ordinary worker ticks do not rescan the collection. Flowers deleted before the baseline are unknown. `verifiedAt` and badges awarded at upgrade record the verification instant, not a guessed historical date.

Plans are bounded to 20, with 1–40-character names. `savePlan` upserts an ID and `deletePlan` removes it. Reusable settings contain species, target minutes, rules and penalty settings; neither the flower's name nor `taskNote` is copied. `lastPlanting` uses the same reduced settings. Loading a plan fills the form without starting a plant. Category IDs remain matching keys; the UI reports missing/unreadable categories and validates category rules before planting. A saved strict penalty remains visible in the plan preview and loaded form.

In 0.12.0 `GardenCollection.planLabel` formats choices as the saved custom name, current category/rule labels and target minutes. Category display names come from the current catalog, with saved labels as a fallback. This is presentation only: it does not rewrite old custom names or replace category IDs. Enter in `#plan-name` saves the plan and is excluded from the planting form's Enter-to-plant handler. Changing tabs clears stale success notices and page-action errors while retaining a current background runtime error.

`taskNote` is optional, limited to 280 characters and retained through bloom. The `note` command edits an active or archived plant through the same versioned store. New notes do not overwrite an unrelated legacy `note` metadata field. Old flowers render an empty task memory rather than receiving a fabricated task or activity snapshot. Notification bodies contain the flower's name, not its task note.

## Timing decisions

Only matching, not-away foreground stretches observed by the running worker earn time. No sleep or offline catch-up. A backwards clock or gap over ten seconds invalidates the observed focus and pending penalty. Boot also clears them. Page commands do not invent elapsed time.

Category rules use the `category.id` or `category.superCategory.id` in `focus.changed`. The page reads `categories.list` and `super_categories.list` to display choices. It never copies application membership lists or infers categories from names. IDs are opaque, case-sensitive values; stored labels are optional display snapshots, not matching keys. A rules-only page command preserves the active plant and its progress and clears pending interruption, so changing a rule cannot itself charge a penalty. Existing schema-1 app/domain gardens from 0.1.0 enter through the atomic migration described above.

The garden view is a decorative SVG/CSS scene plus real interactive plant images, not a metadata card grid. `GardenLayout` places completed plants by planting date (`createdAt`) and ID, using fixed center-out slots with depth order. Each garden holds 25 plants. Since 0.6.0 the selected panorama sits above the album. Version 0.9.0 exposes weekly/whole-collection controls at the top level and replaces the secondary week menu with directly clickable cards. Version 0.10.0 introduced an older-to-newer vertical timeline and placed the live album under its selected row. Version 0.11.0 keeps chronological selection but places a compact bounded index beside a fixed review/album panel, avoiding page-length growth as weeks accumulate. Narrow windows stack the sections. Week rows and garden thumbnails each use groups of at most 12; the week list has a 260-pixel internal scroll limit, or 168 pixels in narrow windows. Date navigation selects the containing local Monday week, including an empty one. Explicit week changes animate for 220 ms and respect reduced-motion settings. The layout module's newest-first week index remains unchanged. The main scene renders only its selected garden. Garden sprites are different compositions from the high-definition pot artwork, not just CSS-scaled versions of it.

`GardenLayout.createView` returns `review: { count, speciesCount, targetMs, species }` for the entire selected week or all-time collection, independent of the current page and thumbnail group. `species` contains `{ id, count, targetMs }` entries. Each week-index entry also includes completed-goal `targetMs` and `speciesCount`. Only valid completed-goal durations are summed; missing or malformed values are not inferred from progress or dates. The active pot is excluded. A cross-week plant contributes its whole target to its bloom week, so this is not daily activity or actual weekly focus time. No new history/statistics permission or daily ledger is introduced.

The island top and side faces share their boundary coordinates, with a consistent 25-unit side depth. Pond water plants and lily pads, pebbles, a watering can, a wooden sign, birds, butterflies and mossy grass are decorative scenery. They never add archive records, completed flowers or earned growth time.

The 0.6.0 geometry change concerned the flowerbed's front point against the path and pebbles, separate from the earlier island-side-face repair. Version 0.7.0 extends the shared projection to the whole island, flowerbed edges/grid and planting positions, with a 4/7 projected-axis slope and matching left-right geometry. The front edge remains clear of the walkway.

Version 0.8.0 increases the flowerbed area by 23.5% and scales peripheral scenery to 0.8, while retaining that shared 4/7 projection. The watering can has one close-fitting base shadow; the old grey stone-like patch is removed. The swing seat shadow is a small quadrilateral aligned to the atlas's seat direction, including its static pose.

Version 0.9.0 adds static, faint SVG distance scenery at the four corners: a round-crowned tree and slope behind the left, distant hills and a hedge behind the right, and small stone paths with grass in the two front corners. Its layer is below the island at opacity 0.26 and clips out the island region, so it cannot cover the garden. Album miniatures hide this distant scenery. All source PNG pixels remain unchanged.

Version 0.10.0 enriches that same clipped layer with canopy highlights, layered hills and conifers, a small seed basket, ferns and verge details, at opacity 0.56. The original island, flowerbed and flower roots remain unchanged. Scenery is static native SVG, with no extra timer or external request. [Forest design notes](design-notes-forest.md) distinguish the article's historical observations, the features implemented in 0.11.0 and remaining proposals.

Version 0.11.0 adds four persistent milestones: `first-bloom` at 1 bloom, `ten-blooms` at 10, `all-species` at all eight species and `hundred-blooms` at 100. The `meadow` theme is available initially; `rain`, `dusk` and `blossom` require the first three milestones respectively. `GardenCollection` checks unlocks and falls back to the default for an unknown or locked theme. The selected theme is a local-storage display preference; it does not change timing, penalties, plant positions or records. New `assets/collection/milestones.png` and `themes.png` are original 2172 × 724 transparent PNG atlases generated with the built-in image tool to match the existing cute painted art. Existing plant and ambience PNGs are unchanged. See [0.11.0 feature notes](features-0110.md).

Version 0.12.0 expands the catalog to 20 permanent achievements: total-bloom thresholds of 1, 5, 10, 25, 50, 100, 250, 500 and 1,000; species-count thresholds of 2, 4 and 8; and one first-bloom entry for each of the eight species. Progress still uses the permanent counter and species set, not the currently deletable archive. The compact filterable list uses 32-pixel artwork, or 28 pixels in narrow windows. A selected achievement opens its condition, description, progress, earned date and any theme reward in a nonmodal right-side drawer. It does not select a flower or change collection records.

The new `props-rain.png`, `props-dusk.png` and `props-blossom.png` are originally generated transparent three-cell atlases in `assets/collection/`. Rain replaces the swing/sign/watering-can positions with a leaf-umbrella bench, birdbath and ceramic frog; dusk uses a lantern arch bench, birdhouse and pumpkin decoration; blossom uses a torii, shrine stone lantern and bamboo water basin. Meadow retains the original props. Replacement props use simple fixed shadows, without per-frame shadow computation. The large scene and miniatures use matching theme props and palette; miniatures stay still. Palettes cover lawn, front faces, flowerbed/grid, pond, fence, paths, distant leaves and page/card surfaces. Flower illustrations receive no color filter. Projection, plot positions, visitor schedule and growth timing remain unchanged. See [0.12.0 feature notes](features-0120.md).

Ambient scene artwork is generated originally with the built-in image-generation tool and bundled locally, preserving the original PNG pixels. Version 0.7.0 keeps the two-layer swing and lilac butterfly and adds three three-pose bird atlases (blue tit, robin and greenfinch) plus honey-orange and sky-blue butterflies. Complete new prompts are in [0.7.0 ambience artwork](artwork-ambience-070.md); [the original ambience notes](artwork-ambience.md) retain the earlier sources.

| Large-scene motion | Timing |
|---|---|
| Swing | ±4 degrees over 8.5 seconds |
| Birds | First visit after 2.5 seconds; subsequent starts 15–30 seconds apart, randomly choosing species, direction and height; each flight lasts 6 seconds |
| Bird wings | Three source poses play up → middle → down → middle over a 0.72-second cycle |
| Butterflies | First visit after 6 seconds; subsequent starts 24–40 seconds apart with a random color variant; each flight lasts 12 seconds |
| Pond | Ripple cycle 7 seconds; reflection cycle 9 seconds |

In 0.9.0 bird width changes from 5.8% to 3.6% of the scene, about 38% smaller, with matching shadow scale. Visit intervals, the three bird variants and the wing-pose animation remain unchanged.

Static objects use fixed SVG shadows, the swing seat uses its aligned quadrilateral, and flying animals use simple CSS ellipse shadows. The expanded rear lawn accommodates all four swing feet. Frame placement, the moving seat edge and fixed foot shadows are calibrated against the atlas's actual alpha bounds. A clip matching the grass outline contains bird shadows. JavaScript schedules visitors, without a per-frame update loop or shadow filters. Only the large scene animates; album thumbnails remain static. Disabling motion, reduced-motion settings, leaving the garden tab or hiding the page cancels the currently visible bird and butterfly flights while retaining the remaining wait for their next visits; it pauses continuous swing and water animations. A cancelled flight does not resume midway. These display changes do not pause the background growth worker. Keep this plain DOM/CSS behavior within the existing classic-script structure, without a UI framework or external resources.

The current-pot view exposes the complete planting form whenever no plant is active. In 0.12.0, normal mode uses two columns at viewport widths of at least 540 CSS pixels. The planting form puts presets and species in a 38% column beside a 62% plan column. An active plant uses a 44% plant/progress column beside a 56% agreement/rules/task/notification column; its illustration is 200 pixels with reduced surrounding space. Below the breakpoint these sections stack, and the planting species selector uses four columns. The high-definition gallery remains a collapsed native `details` section. All density overrides exclude `body.compact`, preserving the separate compact-pot layout. Presets live inside the planting form's catalog column without a nested form or duplicate controls. These layout changes do not alter stored plants.

The 0.8.0 gallery uses 150-pixel plant art beside short offline reading cards. `GardenPlantGuide` supplies each plant's representative botanical name, origin, story, qualified cultural meaning and source labels/URLs. Sources include Kew POWO, RHS, universities and Greenaway's public-domain historical flower-language text. Custom meanings are explicitly labelled as the garden's interpretation. Full references and verification boundaries are in [plant guide sources](plant-guide-sources.md); the module makes no network requests and does not identify the original stylized artwork as an exact species.

The bloom-notification setting is one DOM control. It is moved into the right-hand planting plan when no pot is active and into the active pot's plan card otherwise; it is not cloned and has no extra bottom settings card. Its value still uses the existing persisted notification preference, without a new permission or data migration.

Whole-collection and weekly views include the complete archive without a fixed plant-count cutoff. Weekly grouping uses `bloomAt` and calendar weeks in the user's local time zone: Monday 00:00 inclusive to the next Monday 00:00 exclusive. Calendar arithmetic handles daylight-saving changes rather than assuming that every week is exactly 168 hours. Historical records without a usable bloom timestamp fall back to their planting timestamp for display only. Direct week cards include the current week, weeks with completed flowers and an explicitly selected empty week. An empty current week points to flowers in historical weeks instead of implying that the archive is empty. More than 25 flowers in a week produce additional gardens within that week.

Version 0.9.0 starts the album in weekly mode regardless of a previously stored whole-collection preference, while retaining the saved week and garden page. Garden display preferences remain in local storage, alongside separate compact-view and ambient-motion preferences; collection data stays in SQLite. Explicit flower selection opens a nonmodal right-side overlay drawer without scrolling to content below the garden or blocking other flowers. Selecting another flower updates it. Rename/delete controls stay inside the drawer. The close button, Escape or an outside click closes it; changing mode, week, garden or tab clears the selection. Polling, blooming and pagination must not implicitly select the first flower or reopen details. Demo gardens and weekly fixtures exist only in the isolated preview tools and are excluded from the package.

An interruption begins when a matching stretch switches to a nonmatching app/domain. Other nonmatching events do not restart its grace period. After grace, one deduction applies to that whole interruption. Matching return cancels/rearms it. Away, manual pause and unobserved gaps cancel it without penalty. A percentage is measured against the progress at deduction time; a fixed penalty is measured in minutes; both clamp at zero.

All user-facing text is inserted with `textContent`. Inline scripts, `onclick`, form navigation and outside resources are incompatible with the host sandbox/CSP. The page loads Hindsight's injected `../_page.js`, which must never be shipped in the ZIP. Save actions use explicit buttons, browser validation and intentional Enter handling.

## Run locally

Run `npm test` with Node 22.13 or later and Python 3.11 or later. The SQLite host-limit test runs `py -3` on Windows and the `PYTHON` executable path or `python3` on other platforms. The downgrade check uses frozen local 0.4.0 fixtures, so the tests also work in a source archive without `.git` and do not fetch old code. Run `python scripts/package.py` with Python 3 to build the ZIP. On Windows, `npm run build` uses `py -3`.

For browser checks, put Hindsight source in the sibling `Hindsight` folder, then run `python scripts/preview.py --port 8766`. The preview extracts the real `PAGE_JS` and `WORKER_JS` bridges from `src-tauri/src/plugins/file_reader.rs`; it gives the plugin the same iframe sandbox and CSP. Focus controls and captured notifications belong to the outer test page, not the packaged plugin. Every server run creates a fresh temporary database. This checks browser integration, not native installation, host capture accuracy, sleep behavior or actual OS notification display.

Current results and version-specific limits are recorded in [verification](verification.md). The final 0.14.0 ZIP has not been installed in a native Hindsight instance in this round; older test counts and browser previews do not establish native verification of this build.

## 0.13.0 presentation changes

`GardenCollection.achievementGroups` maps the existing twenty progress definitions onto thirteen display cards. Every tier retains its persistent ID, condition and date. Only presentation changes: core/store, achievement revision 2, counters, schema, permissions, geometry and visitor timing remain untouched. The right drawer lists all constituent tiers; grade styling is paired with text labels. The next unmet tier is shown even for an unusual incomplete award set.

`GardenCollection.suggestName` combines valid category labels, or ten task presets, with the selected flower. Only an explicit `#recommend-name` button click writes the new-flower input. Current category names are resolved through the existing catalog, unavailable categories are skipped, and no persistence or planting command is issued. UTF-16 length matches the form/core limit; surrogate pairs are not cut in half.

The main scene has one overflow wrapper with a negative 5.5%-of-width top margin; SVG, flowers, props, visitors and shadows move together. Miniature coordinates and geometry do not change. A wrapping toolbar places page navigation left and the motion toggle right. The motion description is visually hidden, exposed through the checkbox's `aria-describedby` and a tooltip.

Preview-only controls can align a section and switch the harness into a pure-plugin screenshot view; F8 restores the controls. This changes only the surrounding test host, not the plugin's DOM/styles. It continues to use the same sandbox, strict CSP, actual bridges and disposable SQLite. These controls and fixtures do not ship. Screenshots are browser captures with simple browser-native clipping, without painted or reconstructed UI.


## 0.14.0 presentation update

The week index uses `GardenLayout.weekPage` with five chronological entries per page, independently of the twelve-miniature garden grouping. The motion checkbox is in the heading and the shared main-scene top trim is 9%. Badge colours use the twenty original persistent conditions in ten grouped cards; white cards fill pale yellow only when every tier is earned. IDs, earn dates, counters, schema 2, seven permissions and 64 MB are unchanged.

`GardenAmbience.createThemeEffects` mounts nine decorative nodes once. `ui/theme-effects.css` provides rain, dusk and blossom details without new timers or per-frame JavaScript. The existing scene motion flag controls them, and miniatures stay static. Package the new stylesheet and the 0.14.0 feature notes. See [feature notes](features-0140.md) and [verification](verification.md).


## 0.15.0 observed statistics

`focusStats` is a bounded CAS-protected hot-state object, initialized at upgrade without historical backfill. Achievement revision 3 adds sixteen conditions to the original twenty. A persistent SQL guard rejects older writers that drop these records; close older runtimes and use a consistent pre-upgrade backup for rollback. Seven permissions, 64 MB and archive schema 2 remain. `ui/focus-status.js` explains the worker decision without observing activity itself; `ui/focus.css` styles its UI and statistics. `ui/pond.css` supplies shared clipped water motion; the existing theme layer has eleven fixed decorative nodes. Package these modules and [0.15 notes](features-0150.md). See [verification](verification.md) for current evidence and native limitations.
