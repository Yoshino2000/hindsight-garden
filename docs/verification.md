# Verification

Version: **0.1.0**. This is an experimental personal plugin, not an exhaustive or security-audited release.

Verified on 2026-10-25 using Node 24.15.0, Python 3.14.4 and connected desktop Chrome. No native computer-control automation was used.

## Recorded results

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

Use the isolated preview with the actual Hindsight bridge, restrictive CSP and sandboxed iframe. Check empty install, all four species, five stage images, multi-rule creation, invalid domains, pause/resume, penalty options, notification settings, compact layout, rename/delete confirmation and reload persistence. Check keyboard operation and a narrow layout. Captured preview notifications are simulated.

## Native checks

**Not yet performed for Time Garden 0.1.0.** The final ZIP has not been installed into a real Hindsight instance, and a real operating-system bloom notification has not been verified. The earlier reminder plugin's successful Windows notification is not evidence for this new plugin. Install the final ZIP through the normal permission review and verify actual app/domain capture, background heartbeat, saved progress and notification presentation. A successful simulated-host call does not establish this result.

macOS/Linux, long-duration use, sleep/resume, multiple monitors, clock changes under a real host and every notification configuration require separate verification. Market installation is subject to a published release and maintainer review. No public-market listing is implied by a local package.

A failed first test-cleanup attempt left a synthetic SQLite test directory in the OS temporary folder; automatic approval rejected that cleanup. No personal Hindsight database was used or modified. All later test runs passed and closed their own databases normally.
