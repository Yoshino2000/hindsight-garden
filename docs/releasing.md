# Release procedure

Follow the author's [CONTRIBUTING.md](https://github.com/Tomotsugu-dev/hindsight-plugins/blob/main/CONTRIBUTING.md). Building locally does not publish anything.

1. Finish the applicable checks in `verification.md` and record actual results and outstanding limits. Native coverage requires installing the final ZIP in a real, isolated Hindsight instance; when that check is not performed, state it explicitly in the prerelease and PR rather than treating browser or earlier-version checks as a substitute.
2. Keep source public in a repository owned by the submitter. For the planned repository name, generated metadata uses `Yoshino2000/hindsight-garden`; change it before publishing if the owner/name differs.
3. Set a new three-number version in `manifest.json` and `package.json`, then run tests and `python scripts/package.py`.
4. Publish a GitHub Release in the source repository, with the ZIP and SHA-256 file as release assets. Mark development releases as prereleases while iteration continues. An issue attachment is not a valid market download URL.
5. Download the public asset and verify its SHA-256 against the locally built ZIP. Never replace an already listed ZIP; bump the version instead.
6. Fork `Tomotsugu-dev/hindsight-plugins`, branch from the current upstream and add the generated `dist/market-entry.json` entry. Match the manifest's id, name, version, seven permissions and `storage_mb: 64` exactly. Copy `icon.png` byte-for-byte to `icons/hindsight-garden.png`.
7. Validate the JSON and open a PR titled `feat: list 时光花园`. State that this is an experimental third-party plugin, describe validation limits and disclose AI-generated original plant art. The maintainer reviews before listing.

Version 0.5.0 removes the fixed 200-plant cap, stores mature flowers as individual SQLite archives and limits the album to 12 thumbnails per group. Each garden still holds 25 flowers. Its seven API permissions are unchanged, but the storage allowance increases from 4 MB to 64 MB and schema 1 migrates to schema 2. Explain the storage change, consistent-backup requirement and downgrade incompatibility in the release notes. Archive insertion and migration must commit atomically through the versioned write and SQLite trigger; a failure must roll back without losing old records. Do not promise unlimited physical capacity or delete old flowers automatically when storage fills.

Preserve recorded results for earlier versions and add only checks actually run against the current build. Earlier-version native checks do not verify the final current ZIP. Do not publish private database backups, local data paths, personal demonstration actions or user records. Keep README screenshot paths stable and refresh the image files from the final UI using synthetic data.

## Market format

The upstream index at `3bac380` uses `format_version: 2`, matching the contribution guide. Descriptions are localized objects and must include `en`; include `zh-CN` for the Chinese description. Hindsight 0.10.2 and later read format 2, while 0.10.0 and 0.10.1 read only format 1. This market compatibility requirement is separate from installing the plugin ZIP locally. The generated `dist/market-entry.json` contains a bilingual format-2 entry, not a complete index. Add it without rewriting other plugins, and recheck the upstream contribution requirements before submitting.

## Package contents

The package script allowlists runtime files, the original plant PNGs, icon, license and documentation. It rejects a missing image or injected host bridge. Tests, local preview controls, databases, generated checksums, build scripts and development contracts do not ship. ZIP timestamps are fixed and text is normalized to LF, so identical source produces identical bytes.

## 0.11.0 compatibility

Seven permissions, 64 MB and schema 2 remain. New state fields store plans, last planting settings, task notes, collection counters and earned achievements. Initialization verifies existing archives once using the host-supported grouped query, and CAS protects the result. The persistent feature guard rejects older runtimes that would discard the new fields. Close old plugin pages/workers during update; do not recommend direct downgrade to 0.5–0.10. Restore a consistent pre-upgrade backup to revert. Mature notes are individual archive updates; plans never copy personal tasks into the next plant or notification. Include the two new original collection/theme atlases and their provenance, preserve old package hashes, and disclose the lack of native final-ZIP installation.

## Current listing check and 0.12.0

The author's contribution guide at `99662a7` adds an automated listing check. After committing the listing update, run `python scripts/check_listing.py origin/main HEAD --author Yoshino2000` from the market checkout, with `origin/main` freshly fetched. The script downloads all newly listed release ZIPs and checks their manifests, hashes, permissions and icons. Fix reported problems before requesting maintainer review. Final native installation remains a separate manual verification.

Version 0.12.0 keeps schema 2, seven permissions and 64 MB. Achievement catalogue revision 2 awards newly eligible badges once from the saved permanent counters and preserves older earn dates. Version 0.11.0 rejects the new achievement identifiers; close old runtimes, keep a consistent backup and do not downgrade directly. Three new transparent furniture atlases replace props only in nondefault themes; source flower/ambience images remain unchanged. Preview positioning controls, synthetic databases and tests are excluded from the ZIP.

## 0.13.0 publication

This is a presentation update with the same seven permissions, 64 MB, schema 2 and achievement revision 2. Related levels are grouped without replacing IDs or dates. Publish the changed flat `icon.png` byte-for-byte to the listing icon as well as the ZIP. The source's Chinese default README and English counterpart use new browser screenshots; detailed rules and compatibility information live in `docs/usage.*.md`.

Before branching, fetch upstream and check the previous PR status: 0.12.0 PR #3 was merged into upstream `b11646f`, so 0.13.0 needs a new branch and update PR. Preserve every previously listed ZIP and checksum. Run the official listing check after the release is reachable. The final native-host installation remains unverified and must stay disclosed.


## 0.14.0 presentation update

The week index uses `GardenLayout.weekPage` with five chronological entries per page, independently of the twelve-miniature garden grouping. The motion checkbox is in the heading and the shared main-scene top trim is 9%. Badge colours use the twenty original persistent conditions in ten grouped cards; white cards fill pale yellow only when every tier is earned. IDs, earn dates, counters, schema 2, seven permissions and 64 MB are unchanged.

`GardenAmbience.createThemeEffects` mounts nine decorative nodes once. `ui/theme-effects.css` provides rain, dusk and blossom details without new timers or per-frame JavaScript. The existing scene motion flag controls them, and miniatures stay static. Package the new stylesheet and the 0.14.0 feature notes. See [feature notes](features-0140.md) and [verification](verification.md).


## 0.15.0 observed statistics

`focusStats` is a bounded CAS-protected hot-state object, initialized at upgrade without historical backfill. Achievement revision 3 adds sixteen conditions to the original twenty. A persistent SQL guard rejects older writers that drop these records; close older runtimes and use a consistent pre-upgrade backup for rollback. Seven permissions, 64 MB and archive schema 2 remain. `ui/focus-status.js` explains the worker decision without observing activity itself; `ui/focus.css` styles its UI and statistics. `ui/pond.css` supplies shared clipped water motion; the existing theme layer has eleven fixed decorative nodes. Package these modules and [0.15 notes](features-0150.md). See [verification](verification.md) for current evidence and native limitations.

## 0.16.0 publication

Publish as a development prerelease: basic functionality is usable, iteration continues, and testing is not exhaustive. Record 52 achievement levels in 26 cards, sixteen new permanent hidden-color conditions and automatic Simplified Chinese/English/Japanese interfaces. Language fallback is `zh*` → Simplified Chinese, `ja*` → Japanese, otherwise English. User-authored names/notes and Hindsight category labels are not rewritten.

Achievement revision 4 and hidden state are new; archive schema 2, seven permissions and 64 MB remain. Explain the persisted per-plant lottery ticket and bloom-time reveal, independent 5% chance without a guaranteed drop, unchanged probability across species/durations, no reroll for old mature flowers, and permanent hidden counters after deletion. Retain the original 36 conditions and their earned dates. Versions through 0.15.0 are incompatible writers/readers: close old pages/workers and require a consistent pre-upgrade backup for rollback.

The allowlist must include `i18n.js`, `ui/variants.js`, `ui/variants.css`, the existing shared pond/theme modules and `docs/features-0160.md`. Hidden palettes are code-defined SVG recoloring, not newly generated AI images; preserve all original 29 plant/scenery PNGs and previously released ZIP hashes. Copy the new 256-pixel transparent green-line `icon.png` (5,448 bytes) byte-for-byte into the listing icon. Keep the manifest identity, permissions and quota exactly matched to the market entry.

Include the current `hidden-colors.jpg`, `hidden-detail.jpg`, `interface-en.jpg`, `interface-ja.jpg` and refreshed theme/collection screenshots. Label the eight-normal/eight-hidden image as a manually arranged visual comparison, not a probability sample. The English/Japanese images show actual localized plugin pages in the isolated simulated host; some older planting, growing and guide examples remain Chinese. Do not describe a screenshot as native-host proof or paint a translated replacement UI.

The recorded evidence is 194 passing automated tests, connected-Chrome English/Japanese/French-fallback and narrow-layout checks, and natural rain/lighting observation. No personal Hindsight database was read or written. The final ZIP has not been installed in native Hindsight, and OS bloom notification delivery is unverified. Page-language simulation affects the page, while the worker remained in the local Chinese environment; only independent VM tests verified English/Japanese/fallback notification templates. Keep that distinction in the release and PR, without claiming a successful English notification in Chrome or the OS.

Before submission, fetch upstream and inspect the current PR state. Update the applicable open listing PR, or create a fresh update branch when the prior one has merged; avoid duplicate submissions. Verify the public ZIP/hash, run the author's current listing check, preserve every prior version, and retain the development/testing limitations in the final description.

## 0.17.0 publication

Publish 0.17.0 as a development prerelease with usable basic functionality and incomplete validation. Link [feature notes](features-0170.md), [the reproduced-issue/performance audit](audit-0170.md) and the final [verification record](verification.md). Do not copy an intermediate passing-test count into the release before the final run completes.

Describe the final slower breeze: all eight species and hidden palettes share a 1.2–2-degree, 4.5-second gust, followed by a random 3–10-second rest. One timeout handles the shared stages; coarse ground ellipses move with the flowers, and miniatures remain still. The motion switch, visibility and reduced-motion handling stop it. Do not publish the earlier 3–5-degree/2.4-second prototype parameters. The theme palettes, original 29 PNGs, icon, plot geometry, schema 2, achievement revision 4, seven permissions and 64 MB are unchanged.

Include `ui/breeze.js`, `ui/breeze.css`, the updated runtime files, `docs/features-0170.md`, `docs/audit-0170.md` and `docs/screenshots/breeze.jpg` in the package allowlist. The breeze image must be an actual final-UI capture with synthetic data; label other images as retained 0.16.0/earlier examples. Preserve the hidden-palette comparison's manually arranged/non-probability-sample explanation. Source tests, benchmark scripts, preview controls and databases remain excluded. Write source-test/function pointers as code names rather than broken links from packaged docs to excluded test files.

The audit must distinguish controlled reproductions from native-device observations: delayed-write focus timing, backwards clocks, replaced-worker errors/recovery (including a committed first boot with lost acknowledgement), safe-integer version limits, and deep legacy metadata handling. Deep records can be read and removed; over-limit rename/note edits are refused without changing original bytes. Do not claim arbitrary-depth editing or unlimited storage. Keep upgrade backups and the existing no-mixed-runtime/no-direct-downgrade guidance.

State benchmark scope explicitly. The SQLite results use synthetic in-memory Node SQLite, one active plant and no saved plans; they exclude the native bridge, disk and UI. Cached read-only loads and selector hits are faster in those measurements, while first loads and archive/page/scope changes still perform collection work. Do not turn these measurements into an overall CPU-saving percentage or a proven GPU result.

No personal Hindsight database was accessed. The final ZIP has not been installed in native Hindsight, and OS notification delivery and long-running GPU performance remain unverified. Page-language overrides do not establish the worker's notification language; independent VM notification checks remain separate. Recheck upstream requirements and PR state, validate the final public ZIP/hash and listing entry, and preserve all prior releases without reusing their validation as evidence for this ZIP.

## 0.18.0 publication

Publish 0.18.0 as a development prerelease from `main`, attaching the ZIP and its `.sha256`. Link [feature notes](features-0180.md) and the final [verification record](verification.md).

Describe the resized runtime artwork (originals in `assets-source/`, not packaged; the swing atlas stays original), the 29.3 → 12.1 MB package, the 6-second idle write throttle with immediate writes for growth, penalties, gap resets and reversed clocks, the queued-focus race fix, the bench/blossom layout fixes and the shortened copy. Schema 2, achievement revision 4 (IDs, names and thresholds), seven permissions, 64 MB and the icon are unchanged.

The final ZIP has not been installed in native Hindsight; native worker timer cadence, OS notification delivery and long-running GPU behavior remain unverified. Market listing updates are a separate step.
