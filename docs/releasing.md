# Release procedure

Follow the author's [CONTRIBUTING.md](https://github.com/Tomotsugu-dev/hindsight-plugins/blob/main/CONTRIBUTING.md). Building locally does not publish anything.

1. Finish the checks in `verification.md`. Record actual results and outstanding limits. Install the final ZIP into a real, isolated Hindsight instance.
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
