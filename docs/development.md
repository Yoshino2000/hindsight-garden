# Development

## References and style

Read the author's [getting started](https://github.com/Tomotsugu-dev/hindsight-plugins/blob/main/docs/en/getting-started.md), [API](https://github.com/Tomotsugu-dev/hindsight-plugins/blob/main/docs/en/api.md), [permissions](https://github.com/Tomotsugu-dev/hindsight-plugins/blob/main/docs/en/permissions.md), and [contribution requirements](https://github.com/Tomotsugu-dev/hindsight-plugins/blob/main/CONTRIBUTING.md).

The reference plugin is [Focus](https://github.com/Tomotsugu-dev/hindsight-focus), particularly its classic worker entry, pure `core.js`, SQLite `store.js`, and `ui/main.js`. Time Garden uses the same small-module approach, two-space indentation, double quotes and semicolons. It has no runtime framework or bundler. Its rules, UI and art are independently implemented; Focus source and illustrations are not copied.

## Files

| File | Responsibility |
|---|---|
| `background.js` | Serialize fresh focus events and timer ticks; deliver bloom notifications after persistence |
| `core.js` | Pure matching, growth, interruption and plant lifecycle rules |
| `store.js` | Parameter-bound SQLite reads and version-checked writes |
| `ui/main.js` | DOM UI, validated commands and polling |
| `ui/style.css` | Responsive garden, compact view and stage-sprite display |
| `assets/*.png` | Original four-species, five-stage image strips |
| `test/*.test.cjs` | Isolated deterministic rules/store/worker tests |
| `scripts/preview.py` | Local simulated host, actual extracted bridges and temporary SQLite |
| `scripts/package.py` | Allowlisted, deterministic installable ZIP and release metadata |

The worker and page share versioned state. Compare-and-swap writes retry from a fresh read so a page command cannot silently overwrite a worker's growth update. Notifications must follow a successful state commit, rather than happen during a reducer retry. The one active plant prevents overlapping-rule double credit. A worker identity prevents an older worker from advancing a new worker's session.

## Timing decisions

Only matching, not-away foreground stretches observed by the running worker earn time. No sleep or offline catch-up. A backwards clock or gap over ten seconds invalidates the observed focus and pending penalty. Boot also clears them. Page commands do not invent elapsed time.

An interruption begins when a matching stretch switches to a nonmatching app/domain. Other nonmatching events do not restart its grace period. After grace, one deduction applies to that whole interruption. Matching return cancels/rearms it. Away, manual pause and unobserved gaps cancel it without penalty. A percentage is measured against the progress at deduction time; a fixed penalty is measured in minutes; both clamp at zero.

All user-facing text is inserted with `textContent`. Inline scripts, `onclick`, form navigation and outside resources are incompatible with the host sandbox/CSP. The page loads Hindsight's injected `../_page.js`, which must never be shipped in the ZIP. Save actions use explicit buttons, browser validation and intentional Enter handling.

## Run locally

Run `npm test` with Node 22.13 or later. Run `python scripts/package.py` with Python 3 to build the ZIP. On Windows, `npm run build` uses `py -3`.

For browser checks, put Hindsight source in the sibling `Hindsight` folder, then run `python scripts/preview.py --port 8766`. The preview extracts the real `PAGE_JS` and `WORKER_JS` bridges from `src-tauri/src/plugins/file_reader.rs`; it gives the plugin the same iframe sandbox and CSP. Focus controls and captured notifications belong to the outer test page, not the packaged plugin. Every server run creates a fresh temporary database. This checks browser integration, not native installation, host capture accuracy, sleep behavior or actual OS notification display.
