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
