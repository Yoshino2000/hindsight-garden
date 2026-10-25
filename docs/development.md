# Development

## References and style

Read the author's [getting started](https://github.com/Tomotsugu-dev/hindsight-plugins/blob/main/docs/en/getting-started.md), [API](https://github.com/Tomotsugu-dev/hindsight-plugins/blob/main/docs/en/api.md), [permissions](https://github.com/Tomotsugu-dev/hindsight-plugins/blob/main/docs/en/permissions.md), and [contribution requirements](https://github.com/Tomotsugu-dev/hindsight-plugins/blob/main/CONTRIBUTING.md).

The reference plugin is [Focus](https://github.com/Tomotsugu-dev/hindsight-focus), particularly its classic worker entry, pure `core.js`, SQLite `store.js`, and `ui/main.js`. Time Garden uses the same small-module approach, two-space indentation, double quotes and semicolons. It has no runtime framework or bundler. Its rules, UI and art are independently implemented; Focus source and illustrations are not copied.

## Files

| File | Responsibility |
|---|---|
| `background.js` | Serialize fresh focus events and timer ticks; deliver bloom notifications after persistence |
| `core.js` | Pure matching, growth, interruption and plant lifecycle rules |
| `store.js` | Parameter-bound SQLite archives, version-checked hot-state writes and atomic schema migration |
| `ui/main.js` | DOM UI, validated commands and polling |
| `ui/plant-guide.js` | Offline origin, story, cultural meaning and source data for eight plants |
| `ui/ambience.js` | Randomized visitor timers; CSS performs flights, wing poses and shadows |
| `ui/style.css` | Responsive garden, compact view and stage-sprite display |
| `ui/album.css` | Direct week cards, grouped album thumbnails and scope controls |
| `ui/drawer.css` | Nonmodal right-side flower-detail overlay |
| `garden-layout.js` | Pure local-week grouping, garden album pages and stable center-out positions, 25 flowers per garden |
| `assets/*.png` | Eight high-definition five-stage potted plant strips for growth and selection |
| `assets/garden/*.png` | Eight independently generated, simpler ground-planted garden sprites |
| `assets/ambience/*.png` | Original layered swing, three bird pose atlases and butterfly variants |
| `test/*.test.cjs` | Isolated deterministic rules/store/worker tests |
| `scripts/preview.py` | Local simulated host, actual extracted bridges and temporary SQLite |
| `scripts/package.py` | Allowlisted, deterministic installable ZIP and release metadata |

The worker and page share versioned state. Compare-and-swap writes retry from a fresh read so a page command cannot silently overwrite a worker's growth update. Notifications must follow a successful state commit, rather than happen during a reducer retry. The one active plant prevents overlapping-rule double credit. A worker identity prevents an older worker from advancing a new worker's session.

## Storage and upgrade

Version 0.5.0 separates the hot runtime state from completed flowers. Mature plants are archived as individual SQLite rows instead of rewriting the entire garden every two seconds. Loads check an archive revision and reuse the cached collection while it is unchanged. The fixed 200-plant cap is removed, with no automatic deletion of old plants. This is not unlimited storage: `storage_mb` increases from 4 to 64, while Hindsight's per-value/per-row 256,000-byte limit and other database limits remain in force. A full database must report insufficient space and retain existing records. Version 0.9.0 retains schema 2, the 64 MB allowance, seven API permissions and the same growth/archive logic; upgrading from 0.5.0, 0.6.0, 0.7.0 or 0.8.0 only updates the ZIP, preserves data and needs no additional migration.

Schema-1 to schema-2 migration uses a compare-and-swap state update and SQLite triggers so archive insertion and state conversion are atomic within the database write. It must not depend on a transaction held across separate host calls: the host opens a new database connection for each call. If an archive operation fails, the entire migration transaction rolls back, preserving the old state. Keep the active plant, progress, preferences and existing completed-plant metadata. Test failures and contention explicitly; do not count layout stress tests as evidence of migration integrity.

Back up the plugin database before upgrading, with Hindsight stopped or through SQLite online backup. Releases before 0.5.0 do not understand schema 2. Returning to one of those releases requires restoring the backup made before migration, not running example deletion commands against a live garden or merely reinstalling an older ZIP. The seven API permissions are unchanged from 0.4.0; the storage increase introduced in 0.5.0 appears in normal update authorization when coming from an earlier release.

## Timing decisions

Only matching, not-away foreground stretches observed by the running worker earn time. No sleep or offline catch-up. A backwards clock or gap over ten seconds invalidates the observed focus and pending penalty. Boot also clears them. Page commands do not invent elapsed time.

Category rules use the `category.id` or `category.superCategory.id` in `focus.changed`. The page reads `categories.list` and `super_categories.list` to display choices. It never copies application membership lists or infers categories from names. IDs are opaque, case-sensitive values; stored labels are optional display snapshots, not matching keys. A rules-only page command preserves the active plant and its progress and clears pending interruption, so changing a rule cannot itself charge a penalty. Existing schema-1 app/domain gardens from 0.1.0 enter through the atomic migration described above.

The garden view is a decorative SVG/CSS scene plus real interactive plant images, not a metadata card grid. `GardenLayout` places completed plants by planting date (`createdAt`) and ID, using fixed center-out slots with depth order. Each garden holds 25 plants. Since 0.6.0 the selected panorama sits above the album. Version 0.9.0 exposes weekly/whole-collection controls at the top level and replaces the secondary week menu with directly clickable cards showing dates, flower counts and a current-week marker. Week cards and garden thumbnails each use groups of at most 12. The main scene renders only its selected garden, avoiding thousands of simultaneous flower elements. The garden sprites are different compositions from the high-definition pot artwork, not just CSS-scaled versions of it.

The island top and side faces share their boundary coordinates, with a consistent 25-unit side depth. Pond water plants and lily pads, pebbles, a watering can, a wooden sign, birds, butterflies and mossy grass are decorative scenery. They never add archive records, completed flowers or earned growth time.

The 0.6.0 geometry change concerned the flowerbed's front point against the path and pebbles, separate from the earlier island-side-face repair. Version 0.7.0 extends the shared projection to the whole island, flowerbed edges/grid and planting positions, with a 4/7 projected-axis slope and matching left-right geometry. The front edge remains clear of the walkway.

Version 0.8.0 increases the flowerbed area by 23.5% and scales peripheral scenery to 0.8, while retaining that shared 4/7 projection. The watering can has one close-fitting base shadow; the old grey stone-like patch is removed. The swing seat shadow is a small quadrilateral aligned to the atlas's seat direction, including its static pose.

Version 0.9.0 adds static, faint SVG distance scenery at the four corners: a round-crowned tree and slope behind the left, distant hills and a hedge behind the right, and small stone paths with grass in the two front corners. Its layer is below the island at opacity 0.26 and clips out the island region, so it cannot cover the garden. Album miniatures hide this distant scenery. All source PNG pixels remain unchanged.

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

The current-pot view exposes the complete planting form whenever no plant is active. Wide windows split it into 35% species and 65% plan columns; narrow windows show a compact four-column species selector above the plan. The high-definition gallery is a collapsed native `details` section. An active plant instead shows target, growth/penalty mode and rule summaries. These presentation changes do not alter stored plants or require a data migration.

The 0.8.0 gallery uses 150-pixel plant art beside short offline reading cards. `GardenPlantGuide` supplies each plant's representative botanical name, origin, story, qualified cultural meaning and source labels/URLs. Sources include Kew POWO, RHS, universities and Greenaway's public-domain historical flower-language text. Custom meanings are explicitly labelled as the garden's interpretation. Full references and verification boundaries are in [plant guide sources](plant-guide-sources.md); the module makes no network requests and does not identify the original stylized artwork as an exact species.

The bloom-notification setting is one DOM control. It is moved into the right-hand planting plan when no pot is active and into the active pot's plan card otherwise; it is not cloned and has no extra bottom settings card. Its value still uses the existing persisted notification preference, without a new permission or data migration.

Whole-collection and weekly views include the complete archive without a fixed plant-count cutoff. Weekly grouping uses `bloomAt` and calendar weeks in the user's local time zone: Monday 00:00 inclusive to the next Monday 00:00 exclusive. Calendar arithmetic handles daylight-saving changes rather than assuming that every week is exactly 168 hours. Historical records without a usable bloom timestamp fall back to their planting timestamp for display only. Direct week cards include the current week, weeks with completed flowers and an explicitly selected empty week. An empty current week points to flowers in historical weeks instead of implying that the archive is empty. More than 25 flowers in a week produce additional gardens within that week.

Version 0.9.0 starts the album in weekly mode regardless of a previously stored whole-collection preference, while retaining the saved week and garden page. Garden display preferences remain in local storage, alongside separate compact-view and ambient-motion preferences; collection data stays in SQLite. Explicit flower selection opens a nonmodal right-side overlay drawer without scrolling to content below the garden or blocking other flowers. Selecting another flower updates it. Rename/delete controls stay inside the drawer. The close button, Escape or an outside click closes it; changing mode, week, garden or tab clears the selection. Polling, blooming and pagination must not implicitly select the first flower or reopen details. Demo gardens and weekly fixtures exist only in the isolated preview tools and are excluded from the package.

An interruption begins when a matching stretch switches to a nonmatching app/domain. Other nonmatching events do not restart its grace period. After grace, one deduction applies to that whole interruption. Matching return cancels/rearms it. Away, manual pause and unobserved gaps cancel it without penalty. A percentage is measured against the progress at deduction time; a fixed penalty is measured in minutes; both clamp at zero.

All user-facing text is inserted with `textContent`. Inline scripts, `onclick`, form navigation and outside resources are incompatible with the host sandbox/CSP. The page loads Hindsight's injected `../_page.js`, which must never be shipped in the ZIP. Save actions use explicit buttons, browser validation and intentional Enter handling.

## Run locally

Run `npm test` with Node 22.13 or later and Python 3.11 or later. The SQLite host-limit test runs `py -3` on Windows and the `PYTHON` executable path or `python3` on other platforms. The downgrade check uses frozen local 0.4.0 fixtures, so the tests also work in a source archive without `.git` and do not fetch old code. Run `python scripts/package.py` with Python 3 to build the ZIP. On Windows, `npm run build` uses `py -3`.

For browser checks, put Hindsight source in the sibling `Hindsight` folder, then run `python scripts/preview.py --port 8766`. The preview extracts the real `PAGE_JS` and `WORKER_JS` bridges from `src-tauri/src/plugins/file_reader.rs`; it gives the plugin the same iframe sandbox and CSP. Focus controls and captured notifications belong to the outer test page, not the packaged plugin. Every server run creates a fresh temporary database. This checks browser integration, not native installation, host capture accuracy, sleep behavior or actual OS notification display.
