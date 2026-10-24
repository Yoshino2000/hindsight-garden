# Release procedure

Follow the author's [CONTRIBUTING.md](https://github.com/Tomotsugu-dev/hindsight-plugins/blob/main/CONTRIBUTING.md). Building locally does not publish anything.

1. Finish the checks in `verification.md`. Record actual results and outstanding limits. Install the final ZIP into a real, isolated Hindsight instance.
2. Keep source public in a repository owned by the submitter. For the planned repository name, generated metadata uses `Yoshino2000/hindsight-garden`; change it before publishing if the owner/name differs.
3. Set a new three-number version in `manifest.json` and `package.json`, then run tests and `python scripts/package.py`.
4. Publish a GitHub Release in the source repository, with the ZIP and SHA-256 file as release assets. An issue attachment is not a valid market download URL.
5. Download the public asset and verify its SHA-256 against the locally built ZIP. Never replace an already listed ZIP; bump the version instead.
6. Fork `Tomotsugu-dev/hindsight-plugins`, branch from the current upstream and add the generated `dist/market-entry.json` entry. Match the manifest's id, name, version, seven permissions and `storage_mb: 4` exactly. Copy `icon.png` byte-for-byte to `icons/hindsight-garden.png`.
7. Validate the JSON and open a PR titled `feat: list 时光花园`. State that this is an experimental third-party plugin, describe validation limits and disclose AI-generated original plant art. The maintainer reviews before listing.

## Market format

The contribution guide currently specifies `format_version: 2`, localized descriptions including `en`, and Hindsight 0.10.2+. Its live index was still format 1 when development began on 2026-10-25. Recheck before submitting. Do not silently migrate the whole market or rewrite existing plugins to add this one. If the mismatch remains, explain it in the PR and coordinate the index format with the maintainer. The generated entry has a bilingual format-2 description; it is not a complete market index.

## Package contents

The package script allowlists runtime files, the original plant PNGs, icon, license and documentation. It rejects a missing image or injected host bridge. Tests, local preview controls, databases, generated checksums, build scripts and development contracts do not ship. ZIP timestamps are fixed and text is normalized to LF, so identical source produces identical bytes.
