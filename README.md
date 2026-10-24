# Time Garden

[简体中文](intro/zh/README.md) · English

Grow a small garden while you use your computer. A third-party plugin for [Hindsight](https://github.com/Tomotsugu-dev/Hindsight), with cute, original AI-generated plants. No account, network connection or runtime dependencies.

## Features

- **Eight plants**: sunflower, hydrangea, tulip, daisy, rose, lavender, cosmos and lily, each with five growth stages.
- **A complete garden scene**: finished flowers grow on an isometric garden island with paths, pond, fence and bench. Names and records stay hidden until you choose a flower; close its details to return to the whole garden.
- **Two illustration roles**: the planting picker uses high-definition potted plant artwork and a large selected-plant preview. The garden uses separately generated, simplified ground-planted flower sprites, without pots or permanent labels.
- **Use your Hindsight categories**: pick an existing category or super-category from a dropdown. No need to re-enter the apps and websites assigned to it. App/domain rules remain available, and any matching rule grows the current plant without multiplying time.
- **Change rules while growing**: edit the active pot's rules without resetting its progress, target or penalty settings.
- **Cumulative growth**: collect time across visits and days. Switching away pauses growth by default.
- **Optional interruption penalty**: after a grace period, subtract either a percentage of the current progress or a fixed number of minutes. Each uninterrupted visit to other apps applies at most one deduction. Progress never goes below zero.
- **A lasting garden**: completed plants remain in your collection, with names and planting/bloom dates. One plant grows at a time.
- **A little window**: compact view shows just the current pot. Bloom notifications are optional and silent.

Manual pause, an away event, background restart and an unobserved clock gap do not cause a penalty. Closing the plugin page does not stop its background worker while Hindsight is running.

![Time Garden overview](docs/screenshots/garden.png)

Preview with synthetic test data. Scenery is original; plant art was created for this plugin with the built-in image generation tool.

## Install

Requires Hindsight **0.10.0 or later**. This is an experimental personal plugin, not an official Hindsight plugin. Basic functionality is usable, and development and iteration are ongoing. It has not been exhaustively tested and may contain problems or risks.

1. Download `hindsight-garden-0.3.0.zip` from [Releases](https://github.com/Yoshino2000/hindsight-garden/releases), or build it below.
2. In Hindsight, open **Settings → Plugins** and choose the local ZIP installation option.
3. Review the seven permissions and the 4 MB database allowance, then install.
4. Open **时光花园**, pick a plant, give it a name and select a Hindsight category or group. App/domain rules are optional.

To upgrade, install this ZIP as an update to the same plugin rather than deleting its data. Existing plants, growth and rules remain. Version 0.3.0 has the same seven permissions and 4 MB storage allowance as 0.2.0. An upgrade from 0.1.0 also adds the three category permissions introduced in 0.2.0. An existing pot's **修改规则** action lets it use categories without planting again.

Each garden bed shows up to 25 real completed flowers, filling from the center outward. Additional beds hold the rest of the collection, up to 200 plants. The scenery is decorative; it does not add fake flowers or completed time. Selecting a flower opens its dates and controls. Closing details or moving to another bed hides the record; background refresh does not open it automatically.

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
| `storage_mb: 4` | Store the current plant, preferences and collection in this plugin's SQLite database |

No history/statistics, screenshot, file-system or program-launch permission is requested. The runtime makes no network requests. It does not keep window titles or an activity history. Rule text, selected category IDs/names, plant metadata and the latest observed app/domain/category are local to the plugin. Hindsight does not sync plugin databases across devices. Uninstalling can delete the garden if you choose to remove plugin data.

## Development

The structure follows the author's [Focus](https://github.com/Tomotsugu-dev/hindsight-focus) plugin: classic JavaScript, `importScripts`, small pure rules, a SQLite store and a plain DOM page. Its implementation and illustrations are original. See [development notes](docs/development.md), [artwork](docs/artwork.md), [verification](docs/verification.md) and [release procedure](docs/releasing.md).

```text
npm test
python scripts/package.py
python scripts/preview.py --port 8766
```

Tests need Node 22.13 or later. Packaging and preview use Python 3 standard-library modules. The preview also needs a sibling `Hindsight` source checkout to extract its actual page/worker bridges. Visit `http://127.0.0.1:8766`; its focus events and notifications are simulated, and its SQLite database is temporary. Preview tools and test data are excluded from the installable ZIP.

Code is under the [MIT license](LICENSE). Plant art was created with the built-in image-generation tool; its prompts and provenance are documented separately. Public-market listing requires a maintainer-reviewed pull request and is not implied by a local build.
