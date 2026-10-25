# Time Garden

[简体中文](intro/zh/README.md) · English

Grow a small garden while you use your computer. A third-party plugin for [Hindsight](https://github.com/Tomotsugu-dev/Hindsight), with cute, original AI-generated plants. No account, network connection or runtime dependencies.

## Features

- **Eight plants**: sunflower, hydrangea, tulip, daisy, rose, lavender, cosmos and lily, each with five growth stages.
- **A complete garden scene**: finished flowers grow on an isometric garden island with paths, pond and fence. The island, flowerbed and planting positions share one left-right-symmetric perspective. An expanded rear lawn grounds the swing; water plants, lily pads, pebbles, a watering can, a wooden sign, birds, butterflies and mossy grass add scenery. Names and records stay hidden until you choose a flower; close its details to return to the whole garden.
- **A garden album**: the current garden panorama sits above a compact album of small thumbnails and flower counts. Each group holds at most 12 gardens. Expand the filters to change the whole-collection/weekly scope, choose a week or jump to a garden number.
- **Gentle ambient motion**: a lightly swaying swing, randomly visiting blue tits, robins or greenfinches, and lilac, honey-orange or sky-blue butterflies appear only in the large scene, alongside soft pond ripples, reflections and simple shadows. Thumbnails stay still. Motion can be disabled and follows reduced-motion settings. Disabling it, leaving the garden tab or hiding the page cancels current flights while retaining the next-visit wait, and pauses the swing and water effects.
- **Start planting immediately**: when no pot is active, the current-pot page shows the full planting form with eight compact plant choices first. Wide windows place species and plan side by side; narrow windows put a four-column species selector above the plan. The high-definition plant gallery is expandable. An active pot shows its target, growth/penalty mode and rule summary.
- **Two illustration roles**: the planting form offers high-definition potted plant art in its optional gallery. The garden uses separately generated, simplified ground-planted flower sprites, without pots or permanent labels.
- **Use your Hindsight categories**: pick an existing category or super-category from a dropdown. No need to re-enter the apps and websites assigned to it. App/domain rules remain available, and any matching rule grows the current plant without multiplying time.
- **Change rules while growing**: edit the active pot's rules without resetting its progress, target or penalty settings.
- **Cumulative growth**: collect time across visits and days. Switching away pauses growth by default.
- **Optional interruption penalty**: after a grace period, subtract either a percentage of the current progress or a fixed number of minutes. Each uninterrupted visit to other apps applies at most one deduction. Progress never goes below zero.
- **A lasting garden**: completed plants remain in your collection, with names and planting/bloom dates. The fixed 200-plant limit is removed; one plant grows at a time, and old flowers are never automatically deleted.
- **A little window**: compact view shows just the current pot. Bloom notifications are optional and silent.

Manual pause, an away event, background restart and an unobserved clock gap do not cause a penalty. Closing the plugin page does not stop its background worker while Hindsight is running.

![Time Garden overview](docs/screenshots/garden.png)

![Compact garden album](docs/screenshots/album.png)

[Current-pot planting layout](docs/screenshots/current.png)

Preview with synthetic test data. Scenery is original; plant art was created for this plugin with the built-in image generation tool.

## Install

Requires Hindsight **0.10.0 or later**. Version 0.7.0 is a prerelease of an experimental personal plugin, not an official Hindsight plugin. Basic functionality is usable, and development and iteration are ongoing. It has not been exhaustively tested and may contain problems or risks.

1. Download the prerelease `hindsight-garden-0.7.0.zip` from [Releases](https://github.com/Yoshino2000/hindsight-garden/releases), or build it below.
2. In Hindsight, open **Settings → Plugins** and choose the local ZIP installation option.
3. Review the seven permissions and the 64 MB database allowance, then install.
4. Open **时光花园**, pick a plant, give it a name and select a Hindsight category or group. App/domain rules are optional.

**Back up the plugin database before upgrading.** Make the backup while Hindsight is stopped, or use SQLite's online backup facility for a consistent backup while it runs. Install this ZIP as an update to the same plugin rather than deleting its data. Version 0.7.0 keeps the seven API permissions, 64 MB allowance and schema 2 used by 0.5.0 and 0.6.0. Those versions can update directly with their data retained, without another migration or changes to growth/archive rules. The increase from 4 MB to 64 MB was introduced in 0.5.0 and is shown in Hindsight's normal update authorization when upgrading from an earlier version. An upgrade from 0.1.0 also includes the three category permissions introduced in 0.2.0.

An upgrade from a schema-1 version atomically migrates its garden to schema 2, keeping completed plants in individual SQLite archive rows and retaining the active plant, progress and settings. If archiving fails, the migration transaction rolls back and the old records remain. Plugin versions before 0.5.0 cannot read schema 2: do not directly downgrade to them; restore the backup made before migration if you need to return. An existing pot's **修改规则** action still lets it use categories without planting again.

Each garden shows up to 25 real completed flowers, filling from the center outward. When a week has more than 25 flowers, a second garden, then a third, holds the rest. The fixed plant-count cap is removed, but the 64 MB database allowance, host limits and available disk space still apply. When storage is full, old records are retained and the plugin reports insufficient space; it does not silently delete flowers. In the whole-collection view, plants use a stable planting-date/ID order. The scenery is decorative; it does not add fake flowers or completed time.

Weekly gardens use each plant's **bloom date**, not its planting date. A week runs from local Monday at 00:00 to the next Monday at 00:00, excluding that final instant. The selector includes this week, historical weeks with flowers and a selected empty week. Earlier/later navigation skips unlisted empty weeks; return to this week with **回本周**. These views group the existing collection without changing its records.

Selecting a flower opens its dates and controls. Closing details or changing the view mode, week or garden hides the record; background refresh does not open it automatically. The garden view remembers its display mode, selected week and garden page in local storage, separately from the saved collection, compact-view preference and ambient-motion preference. Pausing decorative motion does not pause plant growth.

The final 0.7.0 ZIP has not yet been installed in a native Hindsight instance in this round. Earlier-version checks do not establish native verification of 0.7.0. See [verification](docs/verification.md) for the actual checks and their limits.

The default opens in a separate **ordinary window**. Its title bar, background and overlap with other windows are controlled by Hindsight. Transparent desktop overlays, always-on-top, click-through and autonomous window movement are not supported. Use Hindsight's plugin settings to change where the page opens; compact view only changes this plugin's layout.

## Growth rules

The target is 1–1,440 minutes. Category rules use Hindsight's stable category IDs; super-category rules match any category currently assigned to that group. Renaming a category does not change the rule. Deleted categories do not match; use **刷新分类** to refresh names and choices. Assignment changes take effect when Hindsight reports a new foreground event. The plugin does not copy category memberships or edit Hindsight's classifications.

App rules can match a whole app name or part of it, ignoring case and a trailing `.exe`. Website rules match a domain and its subdomains on label boundaries: `example.com` includes `docs.example.com`, not `notexample.com`. A full URL is reduced to its hostname; page paths are not tracked. Multiple rules are alternatives.

Optional penalties have a 0–300 second grace period. A percentage applies to the accumulated progress at the time of deduction, **not the target**. For example, 40 accumulated minutes with a 10% penalty becomes 36 minutes. A five-minute penalty leaves 35 minutes. Returning within the grace period cancels it. Away/manual pause cancels a pending deduction; returning from a break does not itself incur a penalty.

Time means observed, matching **foreground use**, not proof of attention or completion. Hindsight's sampling and idle settings affect it. Background tabs do not count. A worker restart waits for a fresh focus event. A gap over ten seconds or a backwards clock change discards that unobserved stretch and waits for a fresh event. No offline time or past Hindsight activity is backfilled. Page commands may conservatively lose a partial tick rather than invent usage.

## Data and permissions

| Permission | Why |
|---|---|
| `focus.changed` | Observe foreground changes and away events |
| `focus.app` | Match app rules |
| `focus.title` | Obtain the website domain; the API also exposes window titles, which this plugin discards |
| `focus.category` | Match the current foreground category and its super-category |
| `categories.read` | List existing Hindsight categories for the dropdown |
| `super_categories.read` | List existing Hindsight super-categories for the dropdown |
| `notifications` | Send an optional bloom notification |
| `storage_mb: 64` | Store the current plant, preferences and individual completed-plant archives in this plugin's SQLite database |

No history/statistics, screenshot, file-system or program-launch permission is requested. The runtime makes no network requests. It does not keep window titles or an activity history. Rule text, selected category IDs/names, plant metadata and the latest observed app/domain/category are local to the plugin. Hindsight does not sync plugin databases across devices. Uninstalling can delete the garden if you choose to remove plugin data.

## Development

The structure follows the author's [Focus](https://github.com/Tomotsugu-dev/hindsight-focus) plugin: classic JavaScript, `importScripts`, small pure rules, a SQLite store and a plain DOM page. Its implementation and illustrations are original. See [development notes](docs/development.md), [artwork](docs/artwork.md), [verification](docs/verification.md) and [release procedure](docs/releasing.md).

```text
npm test
python scripts/package.py
python scripts/preview.py --port 8766
```

Tests need Node 22.13 or later and Python 3.11 or later for the SQLite host-limit checks. On Windows, tests use `py -3`; on other platforms they use the `PYTHON` executable path, if set, or `python3`. Tests use bundled frozen 0.4.0 fixtures and do not need Git history or network access. Packaging and preview use Python 3 standard-library modules. The preview also needs a sibling `Hindsight` source checkout to extract its actual page/worker bridges. Visit `http://127.0.0.1:8766`; its focus events and notifications are simulated, and its SQLite database is temporary. Preview tools and test data are excluded from the installable ZIP.

Code is under the [MIT license](LICENSE). Plant art was created with the built-in image-generation tool; its prompts and provenance are documented separately. Public-market listing requires a maintainer-reviewed pull request and is not implied by a local build.
