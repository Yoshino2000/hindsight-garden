<p align="center"><img src="icon.png" width="72" alt="时光花园图标"></p>

# 时光花园

简体中文 · [English](README.en.md)

让一段日常，长成一座花园。为 [Hindsight](https://github.com/Tomotsugu-dev/Hindsight) 制作的第三方插件：选择已有分类，累计前台使用时间，慢慢等花开。

**[下载 0.17.0](https://github.com/Yoshino2000/hindsight-garden/releases/tag/0.17.0)** · [安装与使用](docs/usage.zh-CN.md) · [开发与验证](docs/verification.md)

![时光花园：完整花圃、专属装饰、顶部动效开关和紧凑切园导航](docs/screenshots/garden.jpg)

## 一阵风，轻轻经过

八种花与隐藏配色一起轻摇，贴地小阴影跟着缓动。一阵风持续 4.5 秒，结束后静歇 3–10 秒；可随时关闭，相册小图保持安静。0.17.0 也修正了慢写入时的计时与旧后台恢复问题，减少大收藏的重复刷新。

![0.17.0：同一阵风中的花朵与贴地阴影](docs/screenshots/breeze.jpg)

## 等花开，也等一次梦色相遇

八种花各有一种隐藏配色，每次开花独立有 **5%** 概率遇见。结果永久留在花园与相册，旧花保持原色，没有保底。

![八种普通配色与八种隐藏配色对照](docs/screenshots/hidden-colors.jpg)

上图是人工安排的配色展示，不是概率抽样结果。

![隐藏配色花朵的详情与任务记忆](docs/screenshots/hidden-detail.jpg)

## 选一朵花，种下一点期待

八种植物。直接选 Hindsight 分类；点「推荐」，把分类或随机任务名与花名组合。可保存方案，也可给这朵花留一句任务记忆。

![双列播种页：左侧选植物与方案，右侧推荐花名、设置分类与时长](docs/screenshots/current.png)

## 日常积累，暂停也没关系

默认累计模式，中断只暂停。左侧看生长进度，右侧查看规则、任务记忆和开花通知；需要时也能自行启用中断扣减。

![当前盆栽双列页：进度与规则、任务备注并排展示](docs/screenshots/growing.png)

## 知道为什么生长，也知道为什么暂停

当前盆栽会展示识别到的程序、网站、分类和匹配结果。手动暂停、缺少信息、规则未匹配、分类删除都有具体说明。

![当前盆栽的生长原因说明](docs/screenshots/why-growth.jpg)

## 每一周，都有自己的花园

按周收藏，种满 25 株自动分园。相册按时间先后每页展示 5 周，超过后翻页，旧花不会为了腾位置而自动删除。周回顾展示已开花数量、品种与完成目标时长。

![按时间排列的每周花园、缩略图与周回顾](docs/screenshots/album.jpg)

## 把时光，收进五色徽章

52 级永久成就收在 26 张卡片中，包含新增的 16 项隐藏收藏条件。白、蓝、紫、金、彩五档徽章保留各级记录；点开可看条件、进度和日期。删花不撤回已获得成就。

![紧凑的分级成就与四种整体花园主题](docs/screenshots/collection.jpg)

![成就详情保留各级条件与获得记录](docs/screenshots/achievement.jpg)

## 给花园换个心情

草木晴日有轻摆秋千；雨后小憩持续落少量细雨，触地后泛起小水花；晚灯花园略暗，三盏暖灯映着草地。樱枝来信有落地渐隐的花瓣。四个主题都有水波与荷叶微漂，动效可关闭。

| 草木晴日 | 雨后小憩 |
| :--: | :--: |
| ![草木晴日：浅绿花园与秋千](docs/screenshots/meadow.jpg) | ![雨后小憩：雨后青绿、叶伞长椅与陶蛙](docs/screenshots/rain.jpg) |
| **晚灯花园** | **樱枝来信** |
| ![晚灯花园：紫暮配色、暖灯与木鸟屋](docs/screenshots/dusk.jpg) | ![樱枝来信：和风鸟居、石灯笼和手水钵](docs/screenshots/garden.jpg) |

## 用熟悉的语言，留下自己的记录

自动跟随环境语言显示简体中文、English 或日本語，其他语言回退英语。你写的花名、任务备注和 Hindsight 分类名保持原样。

![真实英文界面：一分钟生长中的双列盆栽](docs/screenshots/interface-en.jpg)

![真实日文界面：隐藏收藏成就](docs/screenshots/interface-ja.jpg)

## 开始使用

下载 ZIP，在 Hindsight「设置 → 插件」中安装，打开「时光花园」即可。需要 Hindsight 0.10.0+；从插件市场安装需 0.10.2+。升级前请备份数据，具体兼容与回退说明见[详细指南](docs/usage.zh-CN.md)。

**仍在开发迭代，基础功能已可用，未经严格全面测试，可能有问题和风险。** 本轮检查与最终测试结果见[验证范围](docs/verification.md)及[0.17.0 审查](docs/audit-0170.md)。截图使用隔离模拟宿主和演示数据；除本版风动图外，其余图片沿用 0.16.0 及更早的真实 Chrome 示例，部分旧图为中文。最终 ZIP 尚未原生安装验证，操作系统通知与长期 GPU 表现也未验证。插件运行时不联网，数据保存在本机；卸载时删除插件数据也会删除花园。

[权限与数据](docs/usage.zh-CN.md#权限和数据) · [开发说明](docs/development.md) · [素材来源](docs/artwork.md) · [验证范围](docs/verification.md) · [MIT](LICENSE)
