# Verification

Version: **0.4.0**. Basic functionality is usable; development and iteration continue. This is an experimental personal plugin, not an exhaustive or security-audited release.

Verified on 2026-10-25 using Node 24.15.0, Python 3.14.4 and connected desktop Chrome. No native computer-control automation was used.

## Current 0.4.0 results

- **73 automated tests passed**: 33 pure-rule tests, 20 garden-layout/view tests, 10 actual SQLite store tests and 10 worker integration tests. The new weekly checks cover bloom-date grouping, Monday boundaries, year changes, empty weeks, invalid date keys, deduplication, paging and nonmutation. Child processes using `America/New_York` verify real 167/169-hour DST weeks with local calendar boundaries.
- **19 connected Chrome checks passed**, using the real host bridges, restrictive CSP, sandbox and an isolated synthetic database. They cover all-garden and weekly albums, 56 flowers split across two weeks (28 each, each week split into 25 + 3), explicit garden selection, all 200 flowers across eight gardens, refusing another planting at capacity, page clamping after a fixture change, selected empty-week retention, current-week navigation and saved display choices after reload. They also cover initially hidden details, explicit flower selection, closing details across polling/tab changes, closing stale rename/remove panels on scope changes, keyboard focus retention and unique SVG gradient IDs. Normal and narrow layouts have no horizontal overflow; the narrow plugin body measured 354 CSS pixels. The final browser warning/error log was empty.
- The eight existing HD strips and eight garden sprites are unchanged. No new art, permissions, storage allowance or database schema is needed. Old records are grouped for display without rewriting their timestamps; only mode/week/page preferences are saved in local browser storage. No personal Hindsight data was modified.

## Previous 0.3.0 results

- **61 automated tests passed**: 33 pure-rule tests, 8 garden-layout tests, 10 actual SQLite store tests and 10 worker integration tests. New checks cover all eight species, old-garden compatibility, stable center-out positions, pagination, malformed inputs and collection limits.
- Eight high-definition five-stage strips and eight dedicated ground-planted garden PNGs were checked read-only for dimensions, alpha transparency and frame bounds. All PNG source pixels are retained. The source plant artwork totals 15,104,288 bytes.
- **16 connected Chrome checks passed** with the real host bridges, restrictive CSP, sandbox and an isolated synthetic database. They cover the full garden scene, initially collapsed records, explicit click and keyboard selection, closing details without polling reopening them, 0/1/8/26/200-plant layouts, 25-plant paging and page limits, eight high-definition species previews, dedicated garden image paths, narrow layouts without horizontal overflow, and a new rose completing an actual one-minute browser test cycle without automatically opening its record. The narrow plugin viewport measured 329 CSS pixels. The final browser warning/error log was empty.
- The seven permissions, 4 MB storage allowance, plugin identity and database schema remain unchanged from 0.2.0. No personal Hindsight data was modified.

## Previous 0.2.0 results

- **51 automated tests passed**: 31 rule tests, 10 actual SQLite store tests and 10 worker integration tests. The added coverage verifies category/group matching by stable ID, rename independence, missing-category behavior, category-field minimization, editing rules without resetting progress or charging penalties, and compatibility with old 0.1.0 gardens.
- **14 connected Chrome checks passed** using synthetic categories and an isolated temporary database, with the real host bridges and sandbox. They exercise category/group dropdowns, category rename/deletion, empty or failed list reads, manual-rule fallback, refresh recovery while preserving form values, category-driven growth, rules editing while retaining progress and target, group/child matching, missing-category rejection, reload persistence and mixed category/app/domain rules. The edited pot retained exactly `18 seconds / 60 minutes` through reload; an earlier paused edit retained exactly `17 seconds / 60 minutes`.
- 0.2.0 adds exactly three permissions: `focus.category`, `categories.read`, `super_categories.read`. The storage allowance stays 4 MB. No user Hindsight database was opened or edited during development.
- The 0.1.0 ZIP remains unchanged (SHA-256 `f9b1a200d399db0e73f1efeb07949fb4d13070c8576f855f77933990f5488017`). The new package is a separate 0.2.0 build with the same plugin identity and database schema.

## Previous 0.1.0 results

- **42 automated tests passed**: 23 pure-rule tests, 10 actual SQLite store tests, 9 worker integration tests. Command: `npm test`.
- `node --check` passed for the page and background entry. The Python package/preview scripts compiled successfully.
- The browser ran the original plugin page and worker with the actual Hindsight page/worker bridges extracted from local host revision `effa7ba`, a restrictive CSP, iframe `allow-scripts allow-same-origin`, and a temporary SQLite database. These bridges have no changes in the newer `v0.10.2` host release (`9053648`).
- **21 connected Chrome checks passed**, exercising an empty garden, all four species selectors, multiple rules, URL normalization, app-name normalization, subdomain matching, cumulative pause, manual pause/away, restart persistence, real one-minute test cycles, bloom collection and one captured notification, Enter-to-save, rename, invalid domain rejection, confirmed/cancelled removal, optional penalty selectors, one percentage deduction after grace and no repeated deduction, compact-mode persistence, and narrow layouts. A second one-minute cycle completed with notifications disabled and no captured notification. The narrowest measured plugin viewport was 314 CSS pixels with no horizontal overflow. No browser warning or error was reported in the final log check.
- Original generated plant strips were inspected for alpha transparency and five ordered stages. Two premature flowers were corrected using the built-in image editing tool. Unequal frame spacing is handled by explicit CSS source bounds, leaving image pixels unchanged.
- The package builder verifies the manifest, four permissions, 4 MB storage request, icon limit, all assets, ZIP integrity and omission of injected host scripts/test data.

Evidence is retained locally under `output/verification/` and the sibling task QA folder. Local test data is excluded from source tracking and from the installable ZIP.

## Automated checks

- Matching: case and `.exe` app names; exact/contains rules; URL normalization and domain boundaries.
- Growth: only observed matching time; one active plant; no overlapping-rule double credit; progress clamp and one-time bloom collection.
- Penalties: default off; grace cancellation; percentage versus fixed minutes; zero clamp; one deduction per interruption; nonmatching switches do not reset it.
- Breaks: away, manual pause, worker restart, long gaps and backwards clocks do not credit or punish unknown time.
- Persistence: SQLite parameter binding, compare-and-swap contention and saved state recovery.
- Worker: serialized events, session changes, storage failures and notification errors.

## Browser checks

Use the isolated preview with the actual Hindsight bridge, restrictive CSP and sandboxed iframe. Check empty install, all eight species, five stage images, multi-rule creation, invalid domains, pause/resume, penalty options, notification settings, compact layout, rename/delete confirmation and reload persistence. Check all-garden and weekly albums, week boundaries, same-week overflow, empty weeks, scope changes, keyboard operation and a narrow layout. Captured preview notifications are simulated.

## Native checks

**A native installation of the final 0.4.0 ZIP has not been performed in this development run.** User-provided Hindsight screenshots show completed flowers from an earlier build, establishing basic planting/bloom use for that build; they do not establish native validation of all 0.4.0 changes. Real operating-system bloom notification presentation for this plugin has not been separately verified. Install the final ZIP through the normal permission review and verify actual category/app/domain capture, background heartbeat, saved progress and notification presentation. A successful simulated-host call does not establish this result.

macOS/Linux, long-duration use, sleep/resume, multiple monitors, clock changes under a real host and every notification configuration require separate verification. Market installation is subject to a published release and maintainer review. No public-market listing is implied by a local package.

A failed first test-cleanup attempt left a synthetic SQLite test directory in the OS temporary folder; automatic approval rejected that cleanup. No personal Hindsight database was used or modified. All later test runs passed and closed their own databases normally.
