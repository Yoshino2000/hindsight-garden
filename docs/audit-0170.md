# 0.17.0 审查：计时、归档与界面刷新

本轮以 0.16.0 的 `b2bc364` 为基线，使用合成活动、隔离 Worker VM、内存 SQLite 和最小 DOM 树检查极端情形。下面区分已经复现并修正的问题、测量结果，以及仍未验证的范围。没有读写个人 Hindsight 数据库，也没有用模拟界面代替原生安装验证。最终测试数量和浏览器实查结果见[验证记录](verification.md)。

测试文件和函数以代码名标出，供源代码仓库定位；测试、基准脚本和模拟宿主不随安装 ZIP 提供。

## 已复现并修正的问题

### 1. 慢写入队列把切出后的等待算入旧程序

受控场景：匹配活动已经生长到第 2 秒，第 4 秒的 tick 写入被阻塞；第 5 秒收到切到不匹配程序的事件，直到第 12 秒才恢复写入。旧处理在出队时取当前时间，把此前匹配程序算到第 12 秒；正确累计应为 5 秒。

现在 `background.js` 的 `focus.changed` 回调立即记录接收时间 `observedAt`，排队后仍传入这个时刻。`GardenCore.reduce` 在该时刻结算先前活动，再切换状态，不把写入等待当成观察到的活动。事件自己的外部时间戳不作为计时依据。晚于页面操作才处理的旧观察也不能倒写到新状态以前。

回归：`test/background.test.cjs` 的 `queued focus changes settle at reception time instead of crediting the previous app during a slow write`，断言植物进度和有效生长合计均为 5,000 ms；`test/core.test.cjs` 的 `queued worker observations cannot undo a newer page action or count through that action` 检查页面操作边界。

### 2. 墙钟倒退后，旧排队 focus 仍被采信

受控场景：启动写入被阻塞，墙钟第 10 秒收到匹配事件，释放队列前墙钟退回第 0 秒。只检查“事件是否太旧”会漏掉负年龄，旧事件可能重新激活生长。

Worker 现在拒绝负年龄或超过观察间隔的事件，并等待新观察。Reducer 同时检查 `observedAt` 是否晚于当前时刻，以及是否早于已结算的新状态。回退时不会补算跨越的时间，也不把旧排队事件当成恢复后的新活动。

回归：`test/background.test.cjs` 的 `a queued observation from before a clock reversal cannot reactivate focus`；`test/core.test.cjs` 的 `a genuinely fresh post-reversal observation starts a new interval without crediting reversed time`。

### 3. 旧 Worker 的迟到错误和恢复干扰新所有者

受控场景：旧 Worker 的写入阻塞后失败，此时新 Worker 已启动并获得 session。旧错误原先可能清空新状态中的 focus，旧恢复 boot 也可能重新抢回 session。另一个边界是首次 boot 已经落库，但回执丢失；客户端无法仅凭失败判断是否写入成功。

现在错误写入携带 Worker 身份，Reducer 忽略非当前所有者的错误。恢复 boot 带有恢复身份及受保护的原所有者条件，`store.apply` 在重试时保留这次启动的 owner 预期。恢复只允许仍属于这次尝试的状态；若已经被替换，就停止旧 Worker。首次 boot 落库后丢回执的情况同样不能抢回已被新 Worker 接管的状态。被忽略的旧操作不再消耗状态版本。

代码：`background.js` 的 `boot`、`run`、`later`；`core.js` 的 `reduce`；`store.js` 的 `apply` 和 boot claim。

回归：`test/background.test.cjs` 的 `a replaced worker's delayed failure cannot clear the new worker or reclaim its session`、`a first boot with a lost acknowledgement cannot reclaim a session after a replacement worker starts` 和 `a failed first boot can retry its known former owner without blocking a legitimate replacement`；`test/store.test.cjs` 的 `stale worker actions do not consume state versions or overwrite the active owner`。

### 4. 热状态版本越过安全整数后，后续读取失败

把热状态版本设置到 `Number.MAX_SAFE_INTEGER` 后，旧路径仍可能执行 `version + 1`。结果超出 JavaScript 可精确表达的整数范围，后续读取会因版本校验拒绝而无法继续使用。

`store.commit` 现在在写入前检查下一版本。到达上限的现有记录仍可读取；需要增加版本的操作明确拒绝，原 value 和 version 不变。

回归：`test/store.test.cjs` 的 `a hot-row version at the exact integer limit remains readable and refuses an overflowing write`。

### 5. 归档修订号越界同样破坏后续读取

同样把 `garden_archive_meta.version` 放到安全整数上限后，新增、改名或删除等归档操作原先可能让触发器继续增加修订号，导致下一次加载无法识别其版本。

`store.commit` 现在预先检查这次 upsert、删除或迁移所需的归档修订增量。不能安全增加时，整个操作被拒绝，归档记录和热状态仍保留最后可读版本。

回归：`test/store.test.cjs` 的 `an archive revision at its exact integer limit refuses edits without losing the last readable snapshot`。这是一项极端状态保护，不代表正常使用会接近该上限。

### 6. 旧归档的超深额外元数据造成读取栈溢出

在合法花朵记录上加入嵌套 18,000 层的旧额外元数据，旧 JSON 复制路径触发 JavaScript 调用栈上限，使整个收藏无法正常读取。

`store.js` 的 `clone` 使用迭代工作列表，新的只读快照冻结 `freezeTree` 也采用迭代，读取不再依赖递归深度。当前界面签名只读取展示字段，不再序列化整份旧归档。测试确认这种旧记录可以读取、查看和显式删除。

**这不等于支持无限深编辑。** SQLite JSON 解析仍有深度限制。`archiveJson` 先迭代检查单株记录深度，`ARCHIVE_JSON_DEPTH` 为 997，给热状态的 `_archive.upserts` 包装保留三层。过深记录的改名、备注会给出明确错误，原归档字节、热状态和两类版本均不改变；不会为了编辑而裁掉未知元数据。支持范围内的编辑保留全部嵌套字段，包括自身名为 `__proto__` 的字段。

回归：`test/store.test.cjs` 的 `large legacy metadata can be frozen and copied without recursion-stack failure`、`extremely deep old metadata stays readable and deletable while edits fail clearly without changing stored bytes`、`archive edit depth accounts for the hot delta wrapper and keeps every supported nested field`。边界测试使用 SQLite 的 `json_valid` 验证加入热包装后的实际解析深度。

## 界面边界与渲染回归

- 日期直达原先允许选择 1969 年等早期日期，却因负 `now` 回退成本周，没有明确提示。现在输入范围为 1970-01-01 至 9999-12-31，`locateWeek` 显式拒绝早于 1970 年的选择。本地选日取 18:00，避免 UTC+13/+14 下最早一天的午间样本仍早于 Unix epoch；1970-01-01 正确归入 1969-12-29 开始的周。改成有效日期后，会清除上一次日期错误，切换标签也会清理该局部错误。
- `core.focusSummary` 为缺失分类名生成“未命名分类”，原 UI 把它当成用户名称原样输出，英日界面会漏中文。现在根据原始分类名是否为空选择本地化占位语，真正的自定义分类名称不翻译。
- 原花圃签名包含整个归档，离屏花改名也重建当前 25 个按钮；相册序列化全部记录，改备注也会重建可见的整组缩略图。现在只签可见图像和按钮需要的字段，备注变化独立更新抽屉，保留花圃与相册节点。
- 不变的有效生长统计跳过 DOM 重建。不可见页面停止 UI 轮询，恢复可见时请求刷新；活动盆栽、通知设置和后台错误仍从各自状态刷新，不由花园缓存冻结。

`test/ui-render.test.cjs` 提取并执行实际 `renderGarden`、`renderAlbum`、`renderFlower`、分页和关闭详情函数，检查节点引用、按钮文字、打开的备注、页码选中状态、删除与空周。日期函数在 UTC 和 Pacific/Tongatapu 独立进程执行，覆盖最早／最晚日期及错误路径。这是最小 DOM 树回归，不能验证真实排版、CSS 阴影或 GPU 绘制。

`test/garden-layout.test.cjs` 检查相同不可变引用命中时不读取归档条目，新引用即使长度和 ID 不变也失效，以及页面、周、跨周和时区变化。9999-12-27 空周只保留所选周和本周，不遍历中间的空年代。可见花圃最多 25 株，相册最多 12 × 25 株。

## 性能测量

### 0.16.0 重复工作基线

Node v24.15.0、Asia/Shanghai，合成花朵和任务备注，每项预热后取 25 次中位数，单位 ms。以下是旧路径的 V8 CPU 微基准，不含数据库查询或真实 DOM：

| 花朵数 | JSON 归档字节 | 旧 JSON 复制 | `createView` | 全归档签名 | 组合纯计算路径 |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1,000 | 245,141 | 1.329 | 0.944 | 0.794 | 3.898 |
| 5,000 | 1,230,141 | 7.094 | 4.639 | 4.567 | 16.263 |
| 10,000 | 2,461,391 | 15.663 | 9.791 | 9.049 | 35.921 |
| 25,000 | 6,170,141 | 45.876 | 24.584 | 21.557 | 101.748 |
| 50,000 | 12,324,813 | 79.048 | 51.573 | 50.479 | 178.382 |

组合路径执行归档 JSON 复制、视图构建、全归档签名和有界相册签名。各项中位数不能简单相加。5,000 株的一次视图构建创建 20,003 个 `Date`；只签当前 25 株所需字段约为 0.015–0.025 ms。原始本地 QA 记录为 `output/verification/performance-review-0170.cjs` 和同名 JSON；它们是检查产物，不是随包功能。

### 不变归档的视图命中

`GardenLayout.createViewSelector()` 要求调用方提供不可变快照，并在任何归档变化后更换数组引用。键还包括 mode、week、page、当前本地周和时区。命中时返回同一个 view，不扫描、排序或序列化整档；原 `createView` API 仍不缓存。

同一合成归档连续取 100 次视图，每批预热后取 5 批中位数，单位 ms：

| 花朵数 | 原 `createView` ×100 | selector 命中 ×100 |
| ---: | ---: | ---: |
| 1,000 | 95.847 | 4.503 |
| 5,000 | 536.640 | 4.176 |
| 25,000 | 2,624.143 | 4.228 |

本轮 UI 已选择 `readonlyArchive: true`，归档修订不变时复用同一冻结数组，视图也能在稳定引用时早退。归档变更、换页、换周或时区变化仍会重新计算；缓存并未建立全档索引。

### 当前 store 的内存 SQLite 基准

运行源仓库中的 `node test/store-performance.cjs`。最终保存结果为 `output/verification/store-performance-0170.json`，完整测试结束后单独运行，避免与测试争用 CPU。本轮 Node v24.15.0 / Windows，合成数据、内存 SQLite、一个活动盆栽、无已保存方案。缓存加载各测 12 次取中位数；cold 是各模式首次加载的单次值，单位 ms：

| 花朵数 | 归档字节 | 普通首次加载 | 只读首次加载 | 普通缓存加载中位 | 只读缓存加载中位 |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 5,000 | 3,072,780 | 50.305 | 46.213 | 4.408 | 0.152 |
| 20,000 | 12,317,780 | 177.774 | 191.281 | 17.763 | 0.143 |

普通模式仍返回独立可变副本；只读模式复用递归冻结快照。两种归档规模各测 64 次不触发开花的 tick，中位分别为 0.230 和 0.214 ms，归档读取计数均为零；只读数组身份保持不变。更换归档版本后的重新读取和冻结不属于缓存命中。

这组数据的花朵备注／旧元数据结构与上一组不同，且当前普通复制已改为迭代实现。不能把两张表拼成一次前后端总耗时，也不能换算为整体 CPU 降低百分比。基准不包含原生桥延迟、磁盘、真实宿主限流、浏览器排版或 GPU。

## 轻风的成本与暂停

最终参数为 1.2–2 度、4.5 秒一阵，结束后随机静歇 3–10 秒；此前更快、更大的原型已替换。`ui/breeze.js` 的 `createBreeze` 用同一个 timeout 在等待和起风阶段之间切换，任何时刻最多一个。八种花及隐藏配色共用父节点变量，没有每株计时器或逐帧 JS。

`ui/breeze.css` 用两组交替名称的动画同步重启花朵和 `::before` 地面椭圆影。阴影只做低精度位移与小幅缩放，隐藏标记另在 `::after`。换页结束当前风并重新等待；关动效、隐藏页面、切出花园、紧凑模式或减少动态时停止，缩略图不匹配动态选择器。`test/breeze.test.cjs` 使用可控时钟检查阶段、随机范围、单 timer、暂停、空花园和刷新。

没有新增 PNG，也没有改变图标、主题几何、落点、生长目标、schema 2、revision 4、七项权限或 64 MB。成就仍为 52 级／26 张卡片。隐藏结果与既有获得日期保持不变。

## 尚未关闭的性能空间与验证缺口

- 首次加载或任何归档变化仍会全档读取和校验；20,000 株首次只读加载约 191 ms 是本次内存基准中的一次值，不是实时宿主承诺，也不能据一次样本判断两种 cold 模式的稳定差异。
- 切换页／周仍执行 O(N) 视图构建；当前仅缓存最近一个视图，后续可评估持久索引或增量归周，但本版未实现。
- 52 项成就进度及其有界卡片重建仍存在，当前没有证据表明它是随收藏规模增长的主要瓶颈。
- 隐藏配色使用静态 SVG 滤镜，可见花朵数量有界；没有测量真实 GPU 栅格、不同显卡、长期开窗温度或资源占用。最小 SVG 对象的创建耗时不能代替这项验证。
- 没有安装最终 ZIP 到原生 Hindsight，没有读写个人数据库，没有验证操作系统通知。浏览器和独立 VM 的通知模板检查不证明操作系统送达；页面语言覆盖也不改变 Worker 的本机语言。

仍需保留升级前的一致备份，关闭旧窗口和后台后更新；不要直接降级或混跑版本。基础功能可用，但本轮受控回归不能覆盖所有真实环境，发布仍明确标为开发迭代与未全面验证。


### 启动前首次读取失败的保守边界

首次 CREATE 或 SELECT 暂时失败后，如果当前没有会话，新前台事件可正常恢复；如果后来已出现新的非空所有者，旧实例会退让。若故障发生在首次所有权读取之前，无法证明一个未知的旧残留会话是否失效，当前选择保守退让；重新打开插件产生的新 Worker 可正常接管。相关回归包含这些恢复与不抢回场景，未通过新增租约或猜测会话时间来绕过所有权。
