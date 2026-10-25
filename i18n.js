// Offline interface translations. Plant names, notes and host category names are never rewritten.
(function (root) {
  "use strict";
  const MESSAGES = {
  "种子": [
    "Seed",
    "種"
  ],
  "发芽": [
    "Sprout",
    "芽"
  ],
  "长叶": [
    "Leaves",
    "葉"
  ],
  "花苞": [
    "Bud",
    "つぼみ"
  ],
  "开花": [
    "Bloom",
    "開花"
  ],
  "{0} 秒": [
    "{0} sec",
    "{0} 秒"
  ],
  "{0} 分钟": [
    "{0} min",
    "{0} 分"
  ],
  "资料：": [
    "Sources: ",
    "出典："
  ],
  "已跟随系统减少动态效果": [
    "Following system reduced motion",
    "システムの動きを減らす設定に従っています"
  ],
  "叶尖偶落水滴，叶伞轻动，小鸟和蝴蝶偶尔来访": [
    "Gentle rain, a swaying leaf canopy, occasional birds and butterflies",
    "小雨と葉の傘の揺れ、ときどき鳥や蝶"
  ],
  "暖灯轻映草地，偶有萤火，小鸟和蝴蝶来访": [
    "Warm lamplight, occasional fireflies, birds and butterflies",
    "暖かな灯り、ときどき蛍や鳥、蝶"
  ],
  "樱瓣偶落，石灯笼轻映草地，小鸟和蝴蝶来访": [
    "Falling cherry petals, soft stone-lantern light, birds and butterflies",
    "舞い落ちる桜、石灯籠の柔らかな灯り、鳥や蝶"
  ],
  "秋千轻摆，小鸟约每 15–30 秒来访，水面泛起微波": [
    "A gentle swing, birds every 15–30 seconds, ripples on the pond",
    "揺れるブランコ、15〜30秒ごとの小鳥、池の波紋"
  ],
  "完整花园": [
    "Full garden",
    "全体表示"
  ],
  "紧凑模式": [
    "Compact mode",
    "コンパクト表示"
  ],
  "分类": [
    "Category",
    "分類"
  ],
  "大类": [
    "Group",
    "大分類"
  ],
  "已删除{0}（{1}）": [
    "Deleted {0} ({1})",
    "削除済みの{0}（{1}）"
  ],
  "网站 · {0}": [
    "Website · {0}",
    "サイト · {0}"
  ],
  "程序{0} · {1}": [
    "App {0} · {1}",
    "アプリ{0} · {1}"
  ],
  "（精确）": [
    "(exact)",
    "（完全一致）"
  ],
  "（包含）": [
    "(contains)",
    "（部分一致）"
  ],
  "正在读取 Hindsight 分类…": [
    "Loading Hindsight categories…",
    "Hindsight の分類を読み込み中…"
  ],
  "{0}读取失败，可刷新重试；程序和网站仍可手动填写。": [
    "Could not load {0}. Refresh to retry; app and website rules can still be entered manually.",
    "{0}を読み込めません。更新して再試行してください。アプリやサイトのルールは手入力できます。"
  ],
  "已读取 {0} 个分类、{1} 个大类。分类变动后请刷新。": [
    "Loaded {0} categories and {1} groups. Refresh after changing categories.",
    "{0} 個の分類と {1} 個の大分類を読み込みました。変更後は更新してください。"
  ],
  "读取分类超时，请稍后刷新。": [
    "Category request timed out. Please refresh later.",
    "分類の読み込みがタイムアウトしました。後で更新してください。"
  ],
  "分类列表格式不正确。": [
    "Invalid category list.",
    "分類一覧の形式が正しくありません。"
  ],
  "请选择{0}": [
    "Select {0}",
    "{0}を選択"
  ],
  "正在读取{0}…": [
    "Loading {0}…",
    "{0}を読み込み中…"
  ],
  "{0}读取失败，可切换为程序或网站": [
    "Could not load {0}; try an app or website rule",
    "{0}を読み込めません。アプリかサイトのルールを選べます"
  ],
  "暂无{0}，可切换为程序或网站": [
    "No {0} yet; try an app or website rule",
    "{0}はありません。アプリかサイトのルールを選べます"
  ],
  "{0}（等待读取）": [
    "{0} (waiting to load)",
    "{0}（読み込み待ち）"
  ],
  "累计模式：切到其他活动只暂停，不扣进度。": [
    "Cumulative mode: other activities pause growth without losing progress.",
    "累積モード：別の活動では一時停止し、進捗は減りません。"
  ],
  "当时已有进度的 {0}%": [
    "{0}% of progress at interruption",
    "中断時の進捗の {0}%"
  ],
  "中断惩罚：宽限 {0} 秒后扣减{1}，每次中断只扣一次。手动暂停和离开电脑不扣。": [
    "Interruption penalty: after a {0}-second grace period, deduct {1} once per interruption. Manual pause and time away incur no penalty.",
    "中断ペナルティ：猶予 {0} 秒後に {1} を中断1回につき1度だけ差し引きます。手動停止と離席では減りません。"
  ],
  "{0}（已删除）": [
    "{0} (deleted)",
    "{0}（削除済み）"
  ],
  "显示为：": [
    "Preview: ",
    "表示名："
  ],
  "{0} · {1} 分钟 · {2}\n{3}": [
    "{0} · {1} min · {2}\n{3}",
    "{0} · {1} 分 · {2}\n{3}"
  ],
  "选好下方设置后，可以把常用的品种、规则和时长保存成方案。": [
    "Choose settings below, then save a favorite species, rules and duration as a plan.",
    "下で設定して、よく使う品種・ルール・時間をプランに保存できます。"
  ],
  "选择方案，或使用上次设置": [
    "Select a plan or reuse your last settings",
    "プランを選択、または前回の設定を使用"
  ],
  "沿用上次种植设置": [
    "Reuse last planting settings",
    "前回の栽培設定を使う"
  ],
  "扣减比例（%）": [
    "Deduction (%)",
    "差し引く割合（%）"
  ],
  "扣减时间（分钟）": [
    "Deduction (minutes)",
    "差し引く時間（分）"
  ],
  "已载入设置。{0}花名与任务备注由你填写，确认后再播种。": [
    "Settings loaded. {0}Enter a flower name and task note, then confirm planting.",
    "設定を読み込みました。{0}花の名前とメモを入力してから植えてください。"
  ],
  "本方案启用了中断惩罚，请检查扣减设置。": [
    "This plan enables interruption penalties; review the deduction settings. ",
    "このプランは中断ペナルティが有効です。差し引く量を確認してください。"
  ],
  "累计模式，中断只暂停。": [
    "Cumulative mode; interruptions only pause growth. ",
    "累積モードで、中断時は一時停止のみです。"
  ],
  "已用当前设置更新方案。": [
    "Plan updated with the current settings.",
    "現在の設定でプランを更新しました。"
  ],
  "种植方案已保存。以后选中它并点击「使用此方案」即可。": [
    "Plan saved. Select it and choose “Use plan” next time.",
    "プランを保存しました。次回は選択して「このプランを使う」を押してください。"
  ],
  "这一周的回顾": [
    "This week's review",
    "今週の振り返り"
  ],
  "全部收藏回顾": [
    "Collection review",
    "すべての振り返り"
  ],
  "已开花": [
    "Bloomed",
    "開花済み"
  ],
  "{0} 株": [
    "{0} flowers",
    "{0} 株"
  ],
  "收集品种": [
    "Species collected",
    "集めた品種"
  ],
  "{0} 种": [
    "{0} species",
    "{0} 種"
  ],
  "完成目标时长": [
    "Completed target time",
    "達成した目標時間"
  ],
  "按开花日期归周；跨周生长的花，目标时长全部归到开花周。这不是当周实际活动时长，当前盆栽不计入。": [
    "Grouped by bloom date. A flower's full target belongs to its bloom week, even if it grew across weeks. This is not actual activity time for that week; the current pot is excluded.",
    "開花日で集計します。週をまたぐ花の目標時間も開花週に含みます。その週の実活動時間ではなく、現在の鉢は含みません。"
  ],
  "{0} / {1} 个达标分类": [
    "{0} / {1} qualifying categories",
    "達成した分類 {0} / {1}"
  ],
  "{0}% 条件进度": [
    "{0}% qualification progress",
    "条件の達成率 {0}%"
  ],
  " 朵": [
    " flowers",
    " 株"
  ],
  " 种": [
    " species",
    " 種"
  ],
  "最长连续 {0}": [
    "Longest stretch: {0}",
    "最長連続：{0}"
  ],
  "{0} 个分类各达到 10 分钟": [
    "{0} categories with at least 10 min each",
    "各10分以上の分類が {0} 個"
  ],
  "有效生长 {0}；第 {1} 大分类占比 {2}%": [
    "Effective growth: {0}; category ranked {1} holds {2}%",
    "有効成長 {0}；{1} 番目の分類の割合 {2}%"
  ],
  "{0} · 只统计养花且匹配规则时的有效生长时间，历史花朵不回推。": [
    "{0} · Only observed growth while raising a flower and matching its rules. No historical backfill.",
    "{0} · 花を育て、ルールに一致した実際の成長時間だけを記録。過去の時間は補いません。"
  ],
  "从升级后首次记录开始": [
    "From the first record after upgrading",
    "更新後の最初の記録から"
  ],
  "{0} 起记录": [
    "Recorded since {0}",
    "{0} から記録"
  ],
  "累计有效生长": [
    "Total effective growth",
    "累計有効成長"
  ],
  "最长连续": [
    "Longest stretch",
    "最長連続"
  ],
  "本次连续": [
    "Current stretch",
    "今回の連続"
  ],
  "{0} / {1} 级 · {2} 组成就 · {3}": [
    "{0} / {1} levels · {2} achievements · {3}",
    "{0} / {1} 段階 · {2} 組の実績 · {3}"
  ],
  "全部": [
    "All",
    "すべて"
  ],
  "株数里程碑": [
    "Bloom milestones",
    "開花の節目"
  ],
  "品种收藏": [
    "Species collection",
    "品種コレクション"
  ],
  "生长记录": [
    "Growth records",
    "成長記録"
  ],
  "已获得": [
    "Earned",
    "獲得済み"
  ],
  "{0} · 全部达成": [
    "{0} · All earned",
    "{0} · 全達成"
  ],
  "已获得 · 查看": [
    "Earned · Details",
    "獲得済み · 詳細"
  ],
  "{0}，{1}，查看各级条件与日期": [
    "{0}, {1}. View requirements and dates for each level",
    "{0}、{1}。各段階の条件と日付を見る"
  ],
  "{0} 已全部获得": [
    "{0}: all levels earned",
    "{0}：全段階を獲得済み"
  ],
  "正在使用": [
    "In use",
    "使用中"
  ],
  "点击使用": [
    "Use theme",
    "このテーマを使う"
  ],
  "{0}后解锁": [
    "Unlock after {0}",
    "{0}で解放"
  ],
  "{0} 朵花": [
    "{0} flowers",
    "{0} 株の花"
  ],
  "{0} / 1 次首次开花": [
    "{0} / 1 first bloom",
    "初開花 {0} / 1"
  ],
  "当前累计": [
    "Current total",
    "現在の累計"
  ],
  "已获等级": [
    "Levels earned",
    "獲得した段階"
  ],
  "当前等级": [
    "Current level",
    "現在の段階"
  ],
  "尚未获得": [
    "Not earned yet",
    "未獲得"
  ],
  "下一目标": [
    "Next goal",
    "次の目標"
  ],
  "本组成就已全部达成": [
    "All levels in this achievement are complete",
    "この実績は全段階達成済み"
  ],
  "已获得 · {0}（获得/核验日）": [
    "Earned · {0} (award/verification date)",
    "獲得済み · {0}（獲得・確認日）"
  ],
  "尚未获得 · {0}": [
    "Not yet earned · {0}",
    "未獲得 · {0}"
  ],
  "解锁「{0}」主题": [
    "Unlocks the “{0}” theme",
    "「{0}」テーマを解放"
  ],
  "只统计升级后统计起点以来实际获得的有效生长时间，不回推旧花、目标时长或升级前进度。未分类与其他计入总量；分类比例变化不会撤回已获等级。连续段在暂停、离开、不匹配、花开或未观察到的时间间隔后结束。": [
    "Only effective growth observed since the statistics start is counted. Old flowers, targets and pre-upgrade progress are not backfilled. Unclassified and Other are included in the total. Changing shares never revokes awards. Pause, time away, mismatch, bloom or an unobserved gap ends a stretch.",
    "統計開始後の実際の有効成長のみを集計します。過去の花・目標・更新前の進捗は補いません。未分類とその他も総量に含みます。割合が変わっても実績は失われません。停止、離席、不一致、開花、観測できない空白で連続記録は終了します。"
  ],
  "等级只是合并展示，原有条件与获得日期都保留。累计从首次核验时仍保留的收藏开始，此后新开花继续计入，删除不扣回。新成就可能按永久计数补授；获得日期可能为核验日，旧版本已删除的花不能还原。": [
    "Levels are grouped for display; their original conditions and dates remain. Collection totals start with flowers present at first verification, then include new blooms permanently. Deletion does not subtract awards. New achievements may be granted from saved totals; dates may be verification dates. Previously deleted flowers cannot be restored.",
    "段階は表示上まとめていますが、元の条件と日付は保持します。初回確認時の花と以降の開花を累積し、削除しても実績は失われません。保存済みの累計で新実績が付与され、日付が確認日になる場合があります。過去に削除された花は復元できません。"
  ],
  "后台运行中 · 只累计符合规则的前台时间": [
    "Background running · only matching foreground time counts",
    "バックグラウンド稼働中 · 一致する前面活動の時間のみ集計"
  ],
  "等待后台连接或新的活动信息": [
    "Waiting for background connection or new activity",
    "バックグラウンド接続または新しい活動を待っています"
  ],
  "选品种、设置规则和累计时长，然后直接播种。当前处于暂停状态，播种后可点击「继续生长」。": [
    "Choose a species, rules and duration, then plant. Growth is currently paused; choose “Resume growth” after planting.",
    "品種・ルール・時間を選んで植えましょう。現在は停止中です。植えた後に「成長を再開」を押せます。"
  ],
  "选品种、设置生长规则和累计时长，然后直接播种。默认切换活动只暂停，不扣进度。": [
    "Choose a species, growth rules and duration, then plant. By default, other activities only pause growth without losing progress.",
    "品種・成長ルール・時間を選んで植えましょう。初期設定では別の活動に切り替えても進捗は減りません。"
  ],
  "已暂停": [
    "Paused",
    "一時停止中"
  ],
  "等待播种": [
    "Ready to plant",
    "種まき待ち"
  ],
  "从一颗种子开始": [
    "Start with a seed",
    "一粒の種から"
  ],
  "给时间种一朵花": [
    "Grow a flower with your time",
    "時間に花を咲かせよう"
  ],
  "选一个现有分类，让日常活动慢慢养出一朵花。": [
    "Choose an existing category and let everyday activity nurture a flower.",
    "既存の分類を選び、日々の活動で花を育てましょう。"
  ],
  "上一朵花已留在花园，准备好再种下一盆。": [
    "Your last flower is in the garden. Plant another when you're ready.",
    "前の花は庭に残っています。準備ができたら次の一鉢を。"
  ],
  "符合规则时慢慢生长，离开时安心暂停。": [
    "Grow gently during matching activities; pause comfortably when away.",
    "ルールに合う活動で少しずつ成長し、離席中は安心して休みます。"
  ],
  "再种一盆": [
    "Plant another",
    "もう一鉢植える"
  ],
  "种下第一颗种子": [
    "Plant your first seed",
    "最初の種をまく"
  ],
  "{0} · 一点点长大，也很好": [
    "{0} · A little growth is enough",
    "{0} · 少しずつの成長で大丈夫"
  ],
  "累计 {0} 开花 · {1}": [
    "Bloom after {0} · {1}",
    "{0} で開花 · {1}"
  ],
  "已开启中断惩罚": [
    "Interruption penalties enabled",
    "中断ペナルティ有効"
  ],
  "累计模式，中断不扣进度": [
    "Cumulative mode; no interruption loss",
    "累積モード・中断で進捗は減りません"
  ],
  "生长规则：{0}{1}": [
    "Growth rules: {0}{1}",
    "成長ルール：{0}{1}"
  ],
  " 等 {0} 条": [
    " ({0} rules total)",
    " など計 {0} 件"
  ],
  "{0} · 累计目标 {1}": [
    "{0} · Target {1}",
    "{0} · 累計目標 {1}"
  ],
  "继续生长": [
    "Resume growth",
    "成長を再開"
  ],
  "暂停生长": [
    "Pause growth",
    "成長を一時停止"
  ],
  "正在生长": [
    "Growing",
    "成長中"
  ],
  "为什么正在生长": [
    "Why it is growing",
    "成長している理由"
  ],
  "为什么暂时没生长": [
    "Why growth is paused",
    "成長していない理由"
  ],
  "还没有任务记忆。可以留下一句话，等花开时再回看。": [
    "No task memory yet. Leave a sentence to revisit when the flower blooms.",
    "まだ思い出のメモはありません。開花したときに見返す一言を残せます。"
  ],
  "{0} 种下": [
    "Planted {0}",
    "{0} に植えました"
  ],
  "已收藏 {0} 株": [
    "{0} flowers collected",
    "{0} 株を収集済み"
  ],
  "{0} 株已开花": [
    "{0} flowers bloomed",
    "{0} 株が開花"
  ],
  "{0}第 {1} 座花园": [
    "{0}garden {1}",
    "{0}第 {1} の庭"
  ],
  "这一周的": [
    "This week's ",
    "今週の"
  ],
  "我的": [
    "My ",
    "私の"
  ],
  "这一周的花园": [
    "This week's garden",
    "今週の庭"
  ],
  "等待第一朵花的花园": [
    "A garden awaiting its first flower",
    "最初の花を待つ庭"
  ],
  "{0} · {1} 株 · {2} 座花园": [
    "{0} · {1} flowers · {2} gardens",
    "{0} · {1} 株 · {2} 庭"
  ],
  "全部收藏": [
    "All collected flowers",
    "すべての花"
  ],
  "这一周还没有花朵开花。花开时，它就会留在本周的花园里。": [
    "No blooms yet this week. A flower will stay in this week's garden when it blooms.",
    "今週はまだ開花していません。咲いた花は今週の庭に残ります。"
  ],
  "这一周没有已收藏的花朵。可以切换其他周，或回到本周继续种花。": [
    "No collected flowers this week. Visit another week or return to this week to keep growing.",
    "この週に花はありません。別の週を見るか、今週に戻って育てましょう。"
  ],
  "第一朵花会种在这里。完成当前盆栽，它就会留在这座花园里。": [
    "Your first flower will stay here when the current pot finishes growing.",
    "最初の鉢が育ち終わると、この庭に花が残ります。"
  ],
  "这一周还没有收藏的花朵。其他周已收藏 {0} 株，可直接在下方周相册中查看。": [
    "No flowers this week. You have {0} flowers in other weeks; explore them in the album below.",
    "この週に花はありません。ほかの週の {0} 株は下の相冊で見られます。"
  ],
  "第 {0} / {1} 座花园": [
    "Garden {0} / {1}",
    "第 {0} / {1} の庭"
  ],
  "第 {0}—{1} 座 / 共 {2} 座": [
    "Gardens {0}–{1} / {2}",
    "第 {0}〜{1} / {2} の庭"
  ],
  "查看 {0}": [
    "View {0}",
    "{0}を見る"
  ],
  "查看第 {0} 座花园，{1} 株花": [
    "View garden {0}, {1} flowers",
    "第 {0} の庭、{1} 株を見る"
  ],
  "{0}{1}，{2} 株花": [
    "{0}{1}, {2} flowers",
    "{0}{1}、{2} 株"
  ],
  "本周，": [
    "This week, ",
    "今週、"
  ],
  "本周": [
    "This week",
    "今週"
  ],
  "第 {0} / {1} 页 · {2}—{3} / {4} 周": [
    "Page {0} / {1} · weeks {2}–{3} / {4}",
    "{0} / {1} ページ · 第 {2}〜{3} / {4} 週"
  ],
  "种下": [
    "Planted",
    "種まき"
  ],
  "品种": [
    "Species",
    "品種"
  ],
  "重命名": [
    "Rename",
    "名前を変更"
  ],
  "移除这朵花": [
    "Remove flower",
    "この花を削除"
  ],
  "编辑备注": [
    "Edit note",
    "メモを編集"
  ],
  "这段时间的记忆": [
    "Memories of this time",
    "この時間の思い出"
  ],
  "这朵花还没有任务备注。旧记录不会自动补写任务。": [
    "No task note for this flower. Older records are never given invented notes.",
    "この花にメモはありません。古い記録のメモは自動で補いません。"
  ],
  "请先选择一个日期。": [
    "Choose a date first.",
    "先に日付を選んでください。"
  ],
  "日期无法识别，请重新选择。": [
    "Date not recognized. Choose it again.",
    "日付を認識できません。選び直してください。"
  ],
  "任务记忆已保存。": [
    "Task memory saved.",
    "思い出のメモを保存しました。"
  ],
  "本次中断扣减了 {0}。剩余进度已保存。": [
    "This interruption deducted {0}. Remaining progress is saved.",
    "この中断で {0} を差し引きました。残りの進捗は保存済みです。"
  ],
  "有一朵花开了，已为你留在「我的花园」。": [
    "A flower bloomed and is now in “My garden”.",
    "花が咲き、「私の庭」に残りました。"
  ],
  "每株植物最多添加 20 条规则。": [
    "A plant can have up to 20 rules.",
    "1株に設定できるルールは20件までです。"
  ],
  "规则 {0} 类型": [
    "Rule {0} type",
    "ルール {0} の種類"
  ],
  "程序": [
    "App",
    "アプリ"
  ],
  "网站": [
    "Website",
    "サイト"
  ],
  "移除": [
    "Remove",
    "削除"
  ],
  "移除规则 {0}": [
    "Remove rule {0}",
    "ルール {0} を削除"
  ],
  "至少保留一条生长规则。": [
    "Keep at least one growth rule.",
    "成長ルールを1件以上残してください。"
  ],
  "例如：Code、Acrobat": [
    "Example: Code, Acrobat",
    "例：Code、Acrobat"
  ],
  "规则 {0} 内容": [
    "Rule {0} content",
    "ルール {0} の内容"
  ],
  "规则 {0} 分类": [
    "Rule {0} category",
    "ルール {0} の分類"
  ],
  "精确匹配程序名（忽略大小写和 .exe）": [
    "Match app name exactly (ignore case and .exe)",
    "アプリ名の完全一致（大文字・小文字と .exe は区別しません）"
  ],
  "例如：example.com，或粘贴网址": [
    "Example: example.com, or paste a URL",
    "例：example.com、またはURLを貼り付け"
  ],
  "已用所选分类和当前花朵组合，可继续编辑。": [
    "Combined the selected category and flower. You can edit the name.",
    "選択した分類と花を組み合わせました。名前は編集できます。"
  ],
  "已随机组合任务名称和当前花朵，可继续编辑。": [
    "Combined a random task and flower. You can edit the name.",
    "ランダムな作業名と花を組み合わせました。名前は編集できます。"
  ],
  "请先刷新分类，确认方案里的分类仍然可用；也可以改用程序或网站规则。": [
    "Refresh categories to verify the plan's selections, or use an app or website rule.",
    "分類を更新してプランの選択を確認するか、アプリ・サイトのルールを使ってください。"
  ],
  "方案中的分类「{0}」已不存在，请更换或移除这条规则后再播种。": [
    "The plan's category “{0}” no longer exists. Replace or remove that rule before planting.",
    "プランの分類「{0}」は存在しません。ルールを変更または削除してから植えてください。"
  ],
  "种好了。回到符合分类或规则的活动，它就会开始生长。": [
    "Planted. Return to an activity matching the category or rules to start growth.",
    "植えました。分類やルールに合う活動に戻ると成長が始まります。"
  ],
  "生长规则已更新，已有进度、开花目标和惩罚设置都已保留。": [
    "Growth rules updated. Progress, target and penalty settings are preserved.",
    "成長ルールを更新しました。進捗・目標・ペナルティ設定は保持しています。"
  ],
  "名字保存好了。": [
    "Name saved.",
    "名前を保存しました。"
  ],
  "「{0}」和它的生长记录会被移除，此操作无法撤销。": [
    "“{0}” and its growth record will be removed. This cannot be undone.",
    "「{0}」とその成長記録を削除します。元には戻せません。"
  ],
  "已删除方案，花朵与任务记忆已保留。": [
    "Plan removed. Flowers and task memories are preserved.",
    "プランを削除しました。花と思い出のメモは残っています。"
  ],
  "已移除这株植物。": [
    "Plant removed.",
    "植物を削除しました。"
  ],
  "草木晴日": [
    "Meadow daylight",
    "草木の晴れ日"
  ],
  "原来的清浅绿意": [
    "The original gentle greens",
    "もとの柔らかな緑"
  ],
  "雨后小憩": [
    "Rest after rain",
    "雨上がりのひと休み"
  ],
  "青绿色雨后花园、叶伞长椅、苔石鸟浴和陶蛙": [
    "A teal garden, leaf-canopy bench, mossy birdbath and ceramic frog",
    "青緑の庭、葉の傘のベンチ、苔むす水浴び場と陶器のカエル"
  ],
  "晚灯花园": [
    "Lantern garden",
    "宵灯りの庭"
  ],
  "紫暮花园、暖灯拱椅、木鸟屋和小小丰收角": [
    "A violet evening garden, lantern bench, wooden birdhouse and harvest corner",
    "紫の夕庭、灯りのベンチ、木の巣箱と収穫の一角"
  ],
  "樱枝来信": [
    "Letters in blossom",
    "桜からの便り"
  ],
  "春樱和风花园、鸟居、神社石灯笼和竹筒手水钵": [
    "A cherry garden with a torii, shrine lanterns and a bamboo washbasin",
    "桜の和風庭園、鳥居、石灯籠と竹の手水鉢"
  ],
  "花开成园": [
    "A garden in bloom",
    "花咲く庭"
  ],
  "多彩收藏": [
    "A colorful collection",
    "彩りのコレクション"
  ],
  "一段心流": [
    "A stretch of flow",
    "ひとときの集中"
  ],
  "时光积累": [
    "Time well grown",
    "積み重ねた時間"
  ],
  "各有所长": [
    "Many ways to grow",
    "さまざまな成長"
  ],
  "白阶": [
    "White",
    "白"
  ],
  "蓝阶": [
    "Blue",
    "青"
  ],
  "紫阶": [
    "Purple",
    "紫"
  ],
  "金阶": [
    "Gold",
    "金"
  ],
  "彩阶": [
    "Rainbow",
    "虹"
  ],
  "论文阅读": [
    "Paper reading",
    "論文読み"
  ],
  "写作整理": [
    "Writing",
    "文章整理"
  ],
  "课程学习": [
    "Course study",
    "授業の学習"
  ],
  "代码创作": [
    "Coding",
    "コード制作"
  ],
  "项目推进": [
    "Project work",
    "プロジェクト作業"
  ],
  "资料查阅": [
    "Research",
    "資料調べ"
  ],
  "娱乐休息": [
    "Leisure break",
    "ひと休み"
  ],
  "游戏放松": [
    "Gaming break",
    "ゲーム休憩"
  ],
  "灵感速记": [
    "Idea notes",
    "アイデアメモ"
  ],
  "日常充电": [
    "Daily recharge",
    "日々の充電"
  ],
  "{0} 小时{1}": [
    "{0} hr{1}",
    "{0} 時間{1}"
  ],
  " {0} 分": [
    " {0} min",
    " {0} 分"
  ],
  "待选类别": [
    "Choose category",
    "分類未選択"
  ],
  "待填写": [
    "Not set",
    "未入力"
  ],
  "待定时长": [
    "Duration not set",
    "時間未設定"
  ],
  "未命名方案": [
    "Untitled plan",
    "無題のプラン"
  ],
  "小花": [
    "Flower",
    "小さな花"
  ],
  "的": [
    " · ",
    "の"
  ],
  "已识别，名称暂不可用": [
    "Recognized; name unavailable",
    "識別済み・名前は未取得"
  ],
  "未识别": [
    "Unrecognized",
    "未識別"
  ],
  "当前程序": [
    "Current app",
    "現在のアプリ"
  ],
  "网站域名": [
    "Website domain",
    "サイトのドメイン"
  ],
  "未提供": [
    "Not provided",
    "未提供"
  ],
  "当前分类": [
    "Current category",
    "現在の分類"
  ],
  "所属大类": [
    "Parent group",
    "所属する大分類"
  ],
  "前台信息": [
    "Foreground information",
    "前面活動の情報"
  ],
  "已离开电脑": [
    "Away from computer",
    "離席中"
  ],
  "等待更新": [
    "Waiting for update",
    "更新待ち"
  ],
  "种下一盆花后，符合规则的前台活动才会累计。": [
    "After planting, foreground activity matching your rules will count.",
    "植えた後、ルールに合う前面活動が集計されます。"
  ],
  "选择花种、规则与目标时长后播种。": [
    "Choose a species, rules and target time, then plant.",
    "品種・ルール・目標時間を選んで植えてください。"
  ],
  "已手动暂停": [
    "Manually paused",
    "手動で一時停止中"
  ],
  "当前处于手动暂停状态，已有进度保留。": [
    "Growth is manually paused. Existing progress is preserved.",
    "手動で停止しています。これまでの進捗は保持しています。"
  ],
  "准备好后点击「继续生长」。": [
    "Choose “Resume growth” when ready.",
    "準備ができたら「成長を再開」を押してください。"
  ],
  "等待后台连接": [
    "Waiting for background connection",
    "バックグラウンド接続待ち"
  ],
  "后台状态尚未更新，暂不累计这段时间。": [
    "Background status has not updated; this interval is not counted.",
    "バックグラウンド状態が未更新のため、この時間は集計しません。"
  ],
  "确认 Hindsight 和插件后台仍在运行，并切换一次前台活动以获取新信息。": [
    "Check that Hindsight and the plugin background are running, then switch foreground activity once for fresh information.",
    "Hindsight とプラグインが動作しているか確認し、前面の活動を一度切り替えて情報を更新してください。"
  ],
  "等待前台信息": [
    "Waiting for foreground information",
    "前面活動の情報待ち"
  ],
  "尚未收到可用的前台活动信息，暂不累计。": [
    "No usable foreground observation has arrived; time is not counted yet.",
    "利用できる前面活動の情報がないため、まだ集計していません。"
  ],
  "切换一次程序或网站，再查看此处；请同时检查 Hindsight 的活动记录与隐私设置。": [
    "Switch app or website and check again; also review Hindsight activity recording and privacy settings.",
    "アプリやサイトを切り替えて再確認し、Hindsight の活動記録とプライバシー設定も確認してください。"
  ],
  "你已离开电脑": [
    "You are away",
    "離席中です"
  ],
  "收到离开电脑的状态，植物正在休息。": [
    "An away status was received; your plant is resting.",
    "離席状態を受け取り、植物は休んでいます。"
  ],
  "回来后等待新的前台活动信息；离开期间不扣进度。": [
    "After returning, wait for new activity information. No penalty applies while away.",
    "戻ったら新しい活動情報をお待ちください。離席中は進捗を差し引きません。"
  ],
  "当前活动符合规则": [
    "Current activity matches",
    "現在の活動がルールに一致"
  ],
  "匹配：{0}。": [
    "Matched: {0}.",
    "一致：{0}。"
  ],
  "只累计后台实际观察到的有效时间，同一段时间不会重复计算。": [
    "Only effective time actually observed by the background counts, once per interval.",
    "バックグラウンドで実際に観測した有効時間だけを、重複せずに集計します。"
  ],
  " 本次中断已扣减过，不会再次扣减。": [
    " This interruption has already been penalized; it will not be deducted again.",
    " この中断では差し引き済みです。再度は差し引きません。"
  ],
  " 已开启中断惩罚，宽限期后将按约定扣减一次。": [
    " Interruption penalties are enabled; one deduction applies after the grace period.",
    " 中断ペナルティが有効です。猶予後に1度差し引きます。"
  ],
  " 已有进度保留。": [
    " Existing progress is preserved.",
    " これまでの進捗は保持しています。"
  ],
  "所选分类已不存在": [
    "Selected categories no longer exist",
    "選択した分類がありません"
  ],
  "这盆花的分类或大类已不在当前列表中。": [
    "This plant's categories or groups are absent from the current list.",
    "この鉢の分類・大分類が現在の一覧にありません。"
  ],
  "点击「修改规则」，重新选择现有分类；修改不会清零当前进度。": [
    "Choose “Edit rules” and select existing categories. Editing does not reset current progress.",
    "「ルールを変更」で現存する分類を選んでください。変更しても進捗はリセットされません。"
  ],
  "缺少匹配所需的信息": [
    "Information needed to match is missing",
    "照合に必要な情報が不足"
  ],
  "当前活动未匹配规则": [
    "Current activity does not match",
    "現在の活動はルールと不一致"
  ],
  "当前活动没有提供这些规则需要的信息，无法确认匹配。": [
    "This activity does not provide the information required by these rules, so a match cannot be confirmed.",
    "活動からルールに必要な情報を取得できず、一致を確認できません。"
  ],
  "当前分类「{0}」未匹配这盆花的分类规则。": [
    "Current category “{0}” does not match this plant's category rules.",
    "現在の分類「{0}」はこの鉢の分類ルールに一致しません。"
  ],
  "当前识别到的程序、网站或分类，没有满足这盆花的任何一条规则。": [
    "The detected app, website or category satisfies none of this plant's rules.",
    "検出されたアプリ・サイト・分類は、この鉢のどのルールにも一致しません。"
  ],
  "先查看 Hindsight 是否已识别该分类或网站；域名也可能受浏览器支持情况或隐私设置影响。": [
    "Check whether Hindsight recognizes the category or website. Domain availability can also depend on browser support or privacy settings.",
    "Hindsight が分類やサイトを識別しているか確認してください。ドメイン取得はブラウザの対応やプライバシー設定にも依存します。"
  ],
  "切回符合下方规则的活动，或点击「修改规则」调整约定。": [
    "Return to a matching activity, or choose “Edit rules” to adjust the plan.",
    "ルールに合う活動に戻るか、「ルールを変更」で設定を調整してください。"
  ],
  " 部分已选分类已删除，请在修改规则时更新。": [
    " Some selected categories were deleted; update them when editing rules.",
    " 選択した分類の一部は削除されています。ルール変更時に更新してください。"
  ],
  "Greenaway《花语》（1884）": [
    "Greenaway, Language of Flowers (1884)",
    "Greenaway『花言葉』（1884）"
  ],
  "代表种：向日葵（Helianthus annuus）": [
    "Representative: sunflower (Helianthus annuus)",
    "代表種：ヒマワリ（Helianthus annuus）"
  ],
  "原生于美国西部及墨西哥部分地区，属于菊科一年生植物。如今已广泛引种，既常见于花园，也会出现在路旁和田野。": [
    "Native to the western United States and parts of Mexico, this annual belongs to the daisy family. It is now widely cultivated, in gardens as well as along roads and fields.",
    "米国西部とメキシコの一部を原産とするキク科の一年草。今では広く栽培され、庭だけでなく道端や畑でも見られます。"
  ],
  "幼年的向日葵会随太阳移动，夜间又转回东方；成熟后通常不再追日，而是朝东迎接清晨。研究发现，较早暖起来的花盘也更受传粉昆虫欢迎。": [
    "Young sunflowers follow the sun and turn back east at night. Mature heads usually stop tracking and face east. Research found that heads warmed earlier in the morning also attract more pollinators.",
    "若いヒマワリは太陽を追い、夜には東へ戻ります。成熟すると通常は追わず東を向きます。朝早く温まる花盤は、花粉を運ぶ昆虫にも好まれると研究で示されています。"
  ],
  "本花园寓意：向光与耐心。愿每天的一点时间，都能慢慢积成阳光。": [
    "Our garden's meaning: light and patience. A little time each day can slowly become sunshine.",
    "この庭での意味：光と忍耐。毎日の小さな時間が、ゆっくり陽だまりになりますように。"
  ],
  "北卡罗来纳州立大学 · 向日葵": [
    "NC State · Sunflower",
    "ノースカロライナ州立大学 · ヒマワリ"
  ],
  "加州大学戴维斯分校 · 向日葵的生物钟": [
    "UC Davis · The sunflower's clock",
    "カリフォルニア大学デービス校 · ヒマワリの体内時計"
  ],
  "代表种：大叶绣球（Hydrangea macrophylla）": [
    "Representative: bigleaf hydrangea (Hydrangea macrophylla)",
    "代表種：ガクアジサイ（Hydrangea macrophylla）"
  ],
  "大叶绣球的野生原生范围在日本。经过丰富的园艺选择，它在花园里展现出饱满的球形花序，也有花瓣轻盈舒展的蕾丝状花序。": [
    "Bigleaf hydrangea's wild native range is Japan. Horticultural selection has produced full, rounded flower heads as well as airy lacecap forms.",
    "ガクアジサイの野生での原産地は日本です。園芸での選抜により、丸い花房から軽やかな額咲きまで、多彩な姿が生まれました。"
  ],
  "部分大叶绣球会在蓝色和粉色之间变化，其中的秘密，与土壤酸碱度影响铝的可利用性有关。白花等品种则有自己的颜色规律，这种变化并不适用于所有绣球。": [
    "Some bigleaf hydrangeas change between blue and pink as soil pH affects aluminum availability. White-flowered and other cultivars have different color patterns; this does not apply to every hydrangea.",
    "一部のアジサイは、土壌の酸性度がアルミニウムの利用に影響することで、青やピンクに変化します。白花などには別の規則があり、すべてのアジサイに当てはまるわけではありません。"
  ],
  "本花园寓意：相聚与感谢。让细小的努力聚成花团，也把感谢留给陪伴你的人。": [
    "Our garden's meaning: togetherness and gratitude. Let small efforts gather into a bouquet, with thanks for those beside you.",
    "この庭での意味：集いと感謝。小さな努力を花房に集め、そばにいる人へ感謝を。"
  ],
  "英国皇家植物园 Kew · 大叶绣球": [
    "Kew · Bigleaf hydrangea",
    "英国王立植物園 Kew · ガクアジサイ"
  ],
  "英国皇家园艺学会 RHS · 绣球种植指南": [
    "RHS · Growing hydrangeas",
    "英国王立園芸協会 RHS · アジサイの育て方"
  ],
  "园艺意象：郁金香属（Tulipa），不特指品种": [
    "Garden inspiration: tulips (Tulipa), no particular cultivar",
    "園芸イメージ：チューリップ属（Tulipa）、特定の品種ではありません"
  ],
  "郁金香不只属于荷兰。郁金香属的许多野生种来自中亚，后来进入奥斯曼宫廷与欧洲花园，才形成今天熟悉的园艺景观。": [
    "Tulips are not only Dutch. Many wild Tulipa species come from Central Asia, later entering Ottoman courts and European gardens before becoming familiar garden flowers.",
    "チューリップはオランダだけの花ではありません。多くの野生種は中央アジアに由来し、オスマン宮廷や欧州の庭へ渡って、今日の園芸風景につながりました。"
  ],
  "十四世纪，野生郁金香已被种进奥斯曼宫廷；十七世纪，它又在欧洲引发收藏热潮。花园里一只安静的花杯，背后曾连着漫长的旅行与园艺交流。": [
    "Wild tulips were cultivated at the Ottoman court by the fourteenth century. In the seventeenth century they inspired European collectors. A quiet flower cup carries a long history of travel and horticultural exchange.",
    "14世紀にはオスマン宮廷で野生のチューリップが栽培され、17世紀には欧州で収集熱を呼びました。静かな花の杯の背景には、長い旅と園芸交流があります。"
  ],
  "在 Greenaway 的十九世纪花语书里，红色郁金香代表「爱的告白」。一只安静的花杯，也可以盛放真诚的心意。": [
    "In Greenaway's nineteenth-century flower-language book, a red tulip means a declaration of love. A quiet cup of petals can hold an honest feeling.",
    "Greenaway の19世紀の花言葉では、赤いチューリップは「愛の告白」。静かな花の杯に、素直な気持ちを託せます。"
  ],
  "英国国家信托 · 郁金香的历史": [
    "National Trust · Tulip history",
    "英国ナショナル・トラスト · チューリップの歴史"
  ],
  "英国皇家园艺学会 RHS · 郁金香属": [
    "RHS · Tulips",
    "英国王立園芸協会 RHS · チューリップ"
  ],
  "代表种：雏菊（Bellis perennis）": [
    "Representative: common daisy (Bellis perennis)",
    "代表種：デージー（Bellis perennis）"
  ],
  "这里以多年生的雏菊为代表，原生范围包括马德拉、欧洲至地中海和中亚。它是低矮的小草花，常见于修剪过的草地。": [
    "The perennial common daisy represents this flower. Its native range includes Madeira and Europe through the Mediterranean to Central Asia. It is a small, low-growing flower often found in mown grass.",
    "多年草のデージーを代表にしています。マデイラ、欧州から地中海・中央アジアに分布し、刈り込んだ草地によく咲く小さな草花です。"
  ],
  "英国人把雏菊叫作「白昼的眼睛」：清晨，花序逐渐展开，草坪便像睁开许多小眼睛。牛津大学的植物档案记录了这个名字的来历，平常的小花也有昼夜节律。": [
    "Its English name comes from “day's eye”: flower heads open in the morning like little eyes in the lawn. Oxford's plant archive records this origin. Even familiar small flowers have a daily rhythm.",
    "英名は「昼の目」に由来し、朝に花が開く様子を草地の小さな目に見立てています。オックスフォード大学の植物記録にもその由来が残ります。身近な花にも昼夜のリズムがあります。"
  ],
  "Greenaway 的十九世纪花语书赋予雏菊「纯真」之意。平常的一天，也值得为那些小美好开一朵花。": [
    "Greenaway's nineteenth-century book associates the daisy with innocence. An ordinary day deserves a flower for its small delights.",
    "Greenaway の19世紀の花言葉では「無邪気」。いつもの一日にも、小さな喜びのために花を。"
  ],
  "英国皇家植物园 Kew · 雏菊": [
    "Kew · Common daisy",
    "英国王立植物園 Kew · デージー"
  ],
  "牛津大学 · 雏菊与白昼的眼睛": [
    "Oxford · Daisy, the day's eye",
    "オックスフォード大学 · 昼の目、デージー"
  ],
  "园艺意象：蔷薇属（Rosa），泛指园艺玫瑰": [
    "Garden inspiration: roses (Rosa), cultivated roses in general",
    "園芸イメージ：バラ属（Rosa）、園芸バラ全般"
  ],
  "这里的「玫瑰」取蔷薇属园艺花卉的意象。它的野生成员分布于北半球，现代园艺类型则经历了长期杂交，拥有丰富多样的家谱。": [
    "This artwork evokes cultivated roses in the genus Rosa. Wild members occur across the Northern Hemisphere; modern garden forms have complex histories of hybridization.",
    "この絵はバラ属の園芸花をイメージしています。野生種は北半球に分布し、現代の園芸バラには長い交配の歴史があります。"
  ],
  "中国月季很早就受到园艺家的喜爱；传入欧洲后，它们反复开花的特性也参与了现代园艺玫瑰的育种。今天看见的一朵花，可能藏着跨越许多花园的家谱。": [
    "Chinese roses were long admired by gardeners. After reaching Europe, their repeat-flowering trait helped shape modern rose breeding. One flower may carry a family history spanning many gardens.",
    "中国のバラは古くから園芸家に愛され、欧州へ伝わった後は返り咲きの性質が現代バラの育種にも生かされました。一輪にも、いくつもの庭を渡る系譜が隠れています。"
  ],
  "Greenaway 的十九世纪花语书以「爱」解释玫瑰，不同颜色另有不同寄意。本花园借它表达珍爱：把值得珍惜的时光，留成层层舒展的花瓣。": [
    "Greenaway's nineteenth-century book links roses with love, with different meanings for different colors. Here they stand for cherishing: keeping precious time in unfolding layers of petals.",
    "Greenaway の19世紀の花言葉ではバラは「愛」で、色にもそれぞれ意味があります。この庭では、大切な時間を重なる花びらに残す「慈しみ」を託します。"
  ],
  "伊利诺伊大学推广服务 · 玫瑰类型与育种": [
    "Illinois Extension · Rose types and breeding",
    "イリノイ大学エクステンション · バラの種類と育種"
  ],
  "代表种：狭叶薰衣草（Lavandula angustifolia）": [
    "Representative: English lavender (Lavandula angustifolia)",
    "代表種：ラベンダー（Lavandula angustifolia）"
  ],
  "这里以狭叶薰衣草为代表，原生于西班牙东北部至意大利一带。它属于唇形科，带着地中海地区日照与山地环境的印记。": [
    "English lavender represents this flower. Native from northeastern Spain to Italy, it belongs to the mint family and reflects Mediterranean sunshine and mountain habitats.",
    "スペイン北東部からイタリアに自生するラベンダーを代表にしています。シソ科の植物で、地中海の日差しと山地の環境に育まれました。"
  ],
  "紫色花田不一定种着同一种薰衣草。法国自然历史博物馆介绍，常见的杂交薰衣草来自狭叶与宽叶薰衣草；相似的紫色和香气背后，也藏着不同的植物家谱。": [
    "Purple fields need not contain the same lavender. France's natural history museum explains that common lavandin is a hybrid of narrow- and broad-leaved lavender. Similar colors and scents can hide different lineages.",
    "紫の花畑も、同じ種類とは限りません。フランス国立自然史博物館によると、ラバンディンはラベンダーと広葉の近縁種の交雑です。似た色や香りにも異なる系譜があります。"
  ],
  "本花园寓意：安静与休息。让一簇温柔的紫色，提醒你给自己留一点余裕。": [
    "Our garden's meaning: quiet and rest. A gentle cluster of purple reminds you to leave room for yourself.",
    "この庭での意味：静けさと休息。優しい紫が、自分のための余白を思い出させてくれます。"
  ],
  "英国皇家植物园 Kew · 狭叶薰衣草": [
    "Kew · English lavender",
    "英国王立植物園 Kew · ラベンダー"
  ],
  "法国国家自然历史博物馆 · 真薰衣草与杂交薰衣草": [
    "MNHN France · Lavender and lavandin",
    "フランス国立自然史博物館 · ラベンダーとラバンディン"
  ],
  "代表种：秋英／波斯菊（Cosmos bipinnatus）": [
    "Representative: garden cosmos (Cosmos bipinnatus)",
    "代表種：コスモス（Cosmos bipinnatus）"
  ],
  "波斯菊的名字容易让人想到波斯，这里介绍的秋英却原生于墨西哥。它是一年生菊科草本，常被用作公园和花境中的观赏植物。": [
    "The Chinese name may suggest Persia, but Cosmos bipinnatus is native to Mexico. This annual in the daisy family is widely grown in parks and flower borders.",
    "中国名からペルシャを連想しがちですが、このコスモスの原産地はメキシコです。キク科の一年草で、公園や花壇でよく栽培されます。"
  ],
  "它的属名 Cosmos 来自含有「秩序」之意的希腊词。那一圈轻盈的花瓣，其实围着由许多小花组成的黄色中心；看似随风散漫，也有整齐的结构。": [
    "Cosmos comes from a Greek word associated with order. The light outer petals surround a yellow center made of many small florets: a tidy structure behind a carefree appearance.",
    "Cosmos の属名は「秩序」に関わるギリシャ語に由来します。軽やかな花びらが、多数の小花からなる黄色い中心を囲み、自由な姿にも整った構造があります。"
  ],
  "本花园寓意：自在与秩序。不必赶着长大，也能按自己的节奏开花。": [
    "Our garden's meaning: freedom and order. There is no need to hurry; bloom at your own pace.",
    "この庭での意味：自由と秩序。急がなくても、自分のリズムで咲けます。"
  ],
  "新加坡国家公园局 NParks · 秋英": [
    "NParks Singapore · Garden cosmos",
    "シンガポール国立公園局 · コスモス"
  ],
  "加州大学尔湾分校 · 波斯菊与名字来历": [
    "UC Irvine · Cosmos and its name",
    "カリフォルニア大学アーバイン校 · コスモスの名の由来"
  ],
  "园艺意象：百合属（Lilium），不特指品种": [
    "Garden inspiration: lilies (Lilium), no particular cultivar",
    "園芸イメージ：ユリ属（Lilium）、特定の品種ではありません"
  ],
  "百合属的野生成员分布于北美、欧洲和亚洲，生活环境相当多样。园艺百合有丰富的颜色和花形，舒展的花瓣为花园带来明亮的层次。": [
    "Wild lilies occur in North America, Europe and Asia in varied habitats. Garden lilies offer many colors and shapes, their spreading petals adding brightness and depth.",
    "野生のユリは北米・欧州・アジアのさまざまな環境に分布します。園芸ユリには多彩な色と形があり、広がる花びらが庭に明るい奥行きを添えます。"
  ],
  "百合的地下鳞茎由一片片肉质鳞片组成。园艺上能用鳞片繁殖：在合适条件下，鳞片基部会长出小鳞茎；一小片储藏着的能量，也能慢慢成为新植株。": [
    "A lily bulb consists of fleshy scales. Gardeners can propagate it by scaling: under suitable conditions, small bulbs form at a scale's base. A little stored energy can become a new plant.",
    "ユリの球根は肉厚な鱗片でできています。適した条件では鱗片の基部に小球根が育ち、鱗片挿しで増やせます。蓄えた小さな力が、新しい株になります。"
  ],
  "Greenaway 的十九世纪花语书将白百合与「纯洁、甜美」相连。把这一朵明亮的花，送给温柔的祝愿。": [
    "Greenaway's nineteenth-century book connects white lilies with purity and sweetness. Offer this bright flower as a gentle wish.",
    "Greenaway の19世紀の花言葉では、白いユリは「純潔、優しさ」。明るい一輪に、穏やかな願いを託しましょう。"
  ],
  "英国皇家园艺学会 RHS · 百合属": [
    "RHS · Lilies",
    "英国王立園芸協会 RHS · ユリ"
  ],
  "爱荷华州立大学 · 百合的繁殖": [
    "Iowa State · Propagating garden lilies",
    "アイオワ州立大学 · 園芸ユリの増やし方"
  ],
  "向日葵": [
    "Sunflower",
    "ヒマワリ"
  ],
  "把日常积累成一小束阳光。": [
    "Let daily moments become a small bundle of sunshine.",
    "日々のひとときを、小さな陽だまりに。"
  ],
  "绣球": [
    "Hydrangea",
    "アジサイ"
  ],
  "细小的花瓣，也能慢慢聚成一团。": [
    "Small petals can slowly gather into a full bouquet.",
    "小さな花びらも、少しずつ豊かな花房に。"
  ],
  "郁金香": [
    "Tulip",
    "チューリップ"
  ],
  "留一点时间，等待花苞舒展开。": [
    "Leave a little time for the buds to open.",
    "つぼみが開くのを待つ時間を。"
  ],
  "雏菊": [
    "Daisy",
    "デージー"
  ],
  "平常的一天，也值得开一朵小花。": [
    "An ordinary day deserves a little flower too.",
    "いつもの一日にも、小さな花を。"
  ],
  "玫瑰": [
    "Rose",
    "バラ"
  ],
  "把积累的时光，留成层层舒展的花瓣。": [
    "Keep accumulated time in unfolding layers of petals.",
    "重ねた時間を、ほどける花びらに。"
  ],
  "薰衣草": [
    "Lavender",
    "ラベンダー"
  ],
  "让细碎的片刻，长成一簇温柔的紫色。": [
    "Let little moments grow into a gentle purple cluster.",
    "小さなひとときを、優しい紫の花束に。"
  ],
  "波斯菊": [
    "Cosmos",
    "コスモス"
  ],
  "轻轻摇曳的小花，也有自己的生长节奏。": [
    "Even a lightly swaying flower grows at its own pace.",
    "そよぐ小花にも、自分の成長のリズム。"
  ],
  "百合": [
    "Lily",
    "ユリ"
  ],
  "等待花苞打开，收藏一段安静的时光。": [
    "Wait for the buds to open and keep a quiet moment.",
    "つぼみが開くのを待ち、静かな時間を残す。"
  ],
  "第一朵花": [
    "First flower",
    "最初の一輪"
  ],
  "累计成功种出 1 朵花。": [
    "Successfully grow 1 flower in total.",
    "累計1株の花を咲かせる。"
  ],
  "从第一颗种子开始，留住一段自己的时光。": [
    "Begin with a seed and keep a little time of your own.",
    "一粒の種から、自分の時間を残しましょう。"
  ],
  "小小花匠": [
    "Little gardener",
    "小さな庭師"
  ],
  "累计成功种出 10 朵花。": [
    "Successfully grow 10 flowers in total.",
    "累計10株の花を咲かせる。"
  ],
  "十次等待与回来，慢慢积成一束小小的成就。": [
    "Ten times waiting and returning become a small bouquet of achievement.",
    "10回の待つ時間と帰る時間が、小さな達成の花束に。"
  ],
  "八色收藏": [
    "Eight colors collected",
    "八色のコレクション"
  ],
  "收集到 8 种曾经开花的植物。": [
    "Collect 8 species that have bloomed.",
    "開花した植物を8種類集める。"
  ],
  "八种不同的花，把平常日子染成自己的颜色。": [
    "Eight flowers color everyday life in your own way.",
    "8種類の花が、日々を自分らしい色に。"
  ],
  "百花成园": [
    "Hundred-flower garden",
    "百花の庭"
  ],
  "累计成功种出 100 朵花。": [
    "Successfully grow 100 flowers in total.",
    "累計100株の花を咲かせる。"
  ],
  "许多细小的片刻，已经长成一座丰盛花园。": [
    "Many little moments have grown into a generous garden.",
    "小さなひとときが、豊かな庭に育ちました。"
  ],
  "5 朵花开": [
    "5 flowers",
    "5株の開花"
  ],
  "累计成功种出 5 朵花。": [
    "Successfully grow 5 flowers in total.",
    "累計5株の花を咲かせる。"
  ],
  "五朵花，记录五次愿意为自己留一点时间。": [
    "Five flowers mark five times making room for yourself.",
    "5株の花は、自分のために時間を作った5つの記録。"
  ],
  "25 朵花开": [
    "25 flowers",
    "25株の開花"
  ],
  "累计成功种出 25 朵花。": [
    "Successfully grow 25 flowers in total.",
    "累計25株の花を咲かせる。"
  ],
  "一座花园的份量，来自一次次慢慢积累。": [
    "A whole garden comes from growing a little at a time.",
    "少しずつの積み重ねから、一つの庭へ。"
  ],
  "50 朵花开": [
    "50 flowers",
    "50株の開花"
  ],
  "累计成功种出 50 朵花。": [
    "Successfully grow 50 flowers in total.",
    "累計50株の花を咲かせる。"
  ],
  "五十朵花，像五十张写给日常的小小花笺。": [
    "Fifty flowers, fifty little letters to everyday life.",
    "50株の花は、日々へ宛てた50通の小さな便り。"
  ],
  "250 朵花开": [
    "250 flowers",
    "250株の開花"
  ],
  "累计成功种出 250 朵花。": [
    "Successfully grow 250 flowers in total.",
    "累計250株の花を咲かせる。"
  ],
  "走过许多普通日子，回头看时已有花相伴。": [
    "Look back over ordinary days and find flowers beside you.",
    "いつもの日々を振り返れば、そばには花が。"
  ],
  "500 朵花开": [
    "500 flowers",
    "500株の開花"
  ],
  "累计成功种出 500 朵花。": [
    "Successfully grow 500 flowers in total.",
    "累計500株の花を咲かせる。"
  ],
  "五百次绽放，把时间织成一片温柔花海。": [
    "Five hundred blooms weave time into a gentle sea of flowers.",
    "500回の開花が、時間を優しい花の海に。"
  ],
  "1000 朵花开": [
    "1000 flowers",
    "1000株の開花"
  ],
  "累计成功种出 1000 朵花。": [
    "Successfully grow 1000 flowers in total.",
    "累計1000株の花を咲かせる。"
  ],
  "千朵花留下千段时光，仍然可以从下一颗种子开始。": [
    "A thousand blooms keep a thousand moments. Another seed can always follow.",
    "千の花が千の時間を残します。また次の一粒から。"
  ],
  "双色初见": [
    "Two colors",
    "二色の出会い"
  ],
  "收集到 2 种曾经开花的植物。": [
    "Collect 2 species that have bloomed.",
    "開花した植物を2種類集める。"
  ],
  "试着种下另一种花，给花园添一点不同。": [
    "Try a different flower and add something new to your garden.",
    "別の花を植えて、庭に新しい彩りを。"
  ],
  "四色花笺": [
    "Four colors",
    "四色の便り"
  ],
  "收集到 4 种曾经开花的植物。": [
    "Collect 4 species that have bloomed.",
    "開花した植物を4種類集める。"
  ],
  "四种花朵，把不同心情留在同一座花园里。": [
    "Four flowers keep different moods in the same garden.",
    "4種類の花が、さまざまな気持ちを同じ庭に。"
  ],
  "初绽": [
    " first bloom",
    "初咲き"
  ],
  "至少让一株{0}开花。": [
    "Let at least one {0} bloom.",
    "{0}を1株以上咲かせる。"
  ],
  "连续 {0} 分钟": [
    "{0} min uninterrupted",
    "連続 {0} 分"
  ],
  "从有效生长统计开始后，单次连续累计 {0} 分钟实际生长时间。切出规则、离开、暂停、休眠、重启、修改规则或开花都会结束连续段。": [
    "After growth statistics begin, accumulate {0} minutes of actual growth in one stretch. Mismatch, time away, pause, sleep, restart, rule changes or bloom end the stretch.",
    "統計開始後、1回で連続 {0} 分の実成長を達成。不一致、離席、停止、スリープ、再起動、ルール変更、開花で連続記録は終了します。"
  ],
  "正在养花、符合生长规则并实际增加进度的时间，会累计成一段连续记录。": [
    "Time spent raising a flower while matching its rules and actually adding progress forms an uninterrupted record.",
    "花を育て、ルールに一致して実際に進捗が増えた時間が、連続記録になります。"
  ],
  "累计 {0} 小时": [
    "{0} hours total",
    "累計 {0} 時間"
  ],
  "从有效生长统计开始后，累计 {0} 小时实际生长时间。旧花朵、旧目标时长与升级前进度不补算。": [
    "Accumulate {0} hours of actual growth after statistics begin. Old flowers, targets and pre-upgrade progress are not backfilled.",
    "統計開始後、実成長を累計 {0} 時間。過去の花・目標時間・更新前の進捗は補いません。"
  ],
  "可以分多次、跨天积累。惩罚不倒扣已经真实获得的生长时间，规则重叠也只计一次。": [
    "Accumulate across sessions and days. Penalties do not subtract time already observed, and overlapping rules count each interval only once.",
    "何度かに分け、日をまたいで累積できます。ペナルティでも観測済み時間は減らず、ルールが重なっても重複集計しません。"
  ],
  "{0} 类时光": [
    "{0} kinds of time",
    "{0} 種類の時間"
  ],
  "从有效生长统计开始后，至少 {0} 个单列分类各累计 10 分钟实际生长时间。未分类与超出 24 个分类后合并的「其他」不计入。": [
    "After statistics begin, at least {0} individually tracked categories must each reach 10 minutes of actual growth. Unclassified and Other (beyond 24 categories) do not qualify.",
    "統計開始後、個別記録する分類のうち {0} 個以上で各10分の実成長を達成。未分類と24分類を超えた「その他」は対象外です。"
  ],
  "分类来自当时真实的 Hindsight 分类标识，不从规则名称猜测，也不拆分同一段时间。": [
    "Categories use actual Hindsight category IDs at the time, never guesses from rule names. The same interval is not split or duplicated.",
    "当時の Hindsight の分類IDで集計し、ルール名から推測しません。同じ時間を重複して計上しません。"
  ],
  "专心一隅": [
    "A focused corner",
    "ひとつに集中"
  ],
  "双类均衡": [
    "A balanced pair",
    "二つのバランス"
  ],
  "三类交响": [
    "A trio in harmony",
    "三つのハーモニー"
  ],
  "从有效生长统计开始后，总计至少 {0} 小时；至少 {1} 个单列分类各占总有效生长时间的 {2}%。总量包含未分类和「其他」，它们不作为合格分类。": [
    "After statistics begin, reach at least {0} hours total; at least {1} individually tracked categories must each hold {2}% of total effective growth. Unclassified and Other remain in the denominator but do not qualify.",
    "統計開始後、総量 {0} 時間以上、個別分類のうち {1} 個以上が各 {2}% を占める。未分類とその他は分母に含みますが、達成分類には数えません。"
  ],
  "进度条表示时长门槛与比例条件的共同完成度，不是实际分类百分比。达成后永久保留，之后比例变化不会撤回。": [
    "The bar combines the duration threshold and share requirements, rather than displaying actual category share. Once earned, awards remain even if shares change.",
    "バーは時間と割合条件を合わせた達成率で、実際の分類割合ではありません。一度獲得した実績は割合が変わっても残ります。"
  ],
  "植物名称需要 1～40 个字符。": [
    "Plant names must contain 1–40 characters.",
    "植物名は1〜40文字で入力してください。"
  ],
  "任务记忆最多 280 个字符。": [
    "Task memories may contain up to 280 characters.",
    "思い出のメモは280文字までです。"
  ],
  "请输入有效的网站域名或网址。": [
    "Enter a valid website domain or URL.",
    "有効なドメインまたはURLを入力してください。"
  ],
  "网站只支持 http、https 网址或域名。": [
    "Only http/https URLs or domains are supported.",
    "http・httpsのURL、またはドメインに対応しています。"
  ],
  "网站域名格式不正确或超过 120 个字符。": [
    "Invalid domain or more than 120 characters.",
    "ドメインの形式が不正か、120文字を超えています。"
  ],
  "请设置 1～20 条分类、程序或网站规则。": [
    "Set 1–20 category, app or website rules.",
    "分類・アプリ・サイトのルールを1〜20件設定してください。"
  ],
  "规则类型不正确。": [
    "Invalid rule type.",
    "ルールの種類が正しくありません。"
  ],
  "分类标识需要 1～128 个字符。": [
    "Category IDs must contain 1–128 characters.",
    "分類IDは1〜128文字である必要があります。"
  ],
  "分类名称最多 80 个字符。": [
    "Category names may contain up to 80 characters.",
    "分類名は80文字までです。"
  ],
  "每条规则需要 1～120 个字符。": [
    "Each rule must contain 1–120 characters.",
    "各ルールは1〜120文字で入力してください。"
  ],
  "程序名称不能为空。": [
    "App name cannot be empty.",
    "アプリ名は空にできません。"
  ],
  "植物设置不正确。": [
    "Invalid plant settings.",
    "植物の設定が正しくありません。"
  ],
  "请选择一种植物。": [
    "Choose a plant species.",
    "植物の種類を選んでください。"
  ],
  "生长时间需要是 1～1440 的整数分钟。": [
    "Growth time must be an integer from 1 to 1440 minutes.",
    "成長時間は1〜1440分の整数で入力してください。"
  ],
  "中断惩罚类型不正确。": [
    "Invalid interruption penalty type.",
    "中断ペナルティの種類が正しくありません。"
  ],
  "请填写有效的中断扣减数值。": [
    "Enter a valid interruption deduction.",
    "有効な差し引き量を入力してください。"
  ],
  "宽限时间需要是 0～300 的整数秒。": [
    "Grace period must be an integer from 0 to 300 seconds.",
    "猶予時間は0〜300秒の整数で入力してください。"
  ],
  "种植方案": [
    "Planting plan",
    "栽培プラン"
  ],
  "已保存的种植方案格式不正确。": [
    "Invalid saved plan format.",
    "保存済みプランの形式が正しくありません。"
  ],
  "已保存的收藏成就进度不正确。": [
    "Invalid saved achievement progress.",
    "保存済み実績の進捗が正しくありません。"
  ],
  "已保存的收藏成就数量不正确。": [
    "Invalid saved achievement count.",
    "保存済み実績の数が正しくありません。"
  ],
  "已保存的收藏成就格式不正确。": [
    "Invalid saved achievement format.",
    "保存済み実績の形式が正しくありません。"
  ],
  "有效生长统计数值不正确，请保留数据并检查。": [
    "Invalid effective-growth values. Preserve the data and inspect it.",
    "有効成長の値が不正です。データを保持して確認してください。"
  ],
  "有效生长统计格式或版本不支持，请保留数据并使用最新版。": [
    "Unsupported effective-growth format or version. Preserve the data and use the latest version.",
    "有効成長の形式・バージョンが未対応です。データを保持し最新版を使ってください。"
  ],
  "有效生长分类统计不正确，请保留数据并检查。": [
    "Invalid category growth statistics. Preserve the data and inspect it.",
    "分類の成長統計が不正です。データを保持して確認してください。"
  ],
  "有效生长统计合计不一致，请保留数据并检查。": [
    "Growth totals do not agree. Preserve the data and inspect it.",
    "成長統計の合計が一致しません。データを保持して確認してください。"
  ],
  "未命名分类": [
    "Unnamed category",
    "名前のない分類"
  ],
  "未分类": [
    "Unclassified",
    "未分類"
  ],
  "其他": [
    "Other",
    "その他"
  ],
  "植物或后台标识不正确。": [
    "Invalid plant or background identifier.",
    "植物またはバックグラウンドIDが不正です。"
  ],
  "已保存的时间格式不正确。": [
    "Invalid saved timestamp.",
    "保存済み時刻の形式が正しくありません。"
  ],
  "已保存的植物格式不正确。": [
    "Invalid saved plant format.",
    "保存済み植物の形式が正しくありません。"
  ],
  "已保存的生长时长不正确。": [
    "Invalid saved growth duration.",
    "保存済み成長時間が正しくありません。"
  ],
  "已保存的生长进度不正确。": [
    "Invalid saved growth progress.",
    "保存済み成長進捗が正しくありません。"
  ],
  "已保存的植物品种不正确。": [
    "Invalid saved plant species.",
    "保存済み植物の種類が正しくありません。"
  ],
  "收藏植物尚未完成生长。": [
    "An archived plant has not finished growing.",
    "保存された花が成長を完了していません。"
  ],
  "花园数据格式或版本不支持，请保留数据，勿覆盖。": [
    "Unsupported garden data format or version. Preserve it without overwriting.",
    "庭データの形式・バージョンが未対応です。上書きせず保持してください。"
  ],
  "已保存的花园格式不正确。": [
    "Invalid saved garden format.",
    "保存済みの庭の形式が正しくありません。"
  ],
  "种植方案最多保存 20 个。": [
    "You can save up to 20 planting plans.",
    "栽培プランは20件まで保存できます。"
  ],
  "种植方案标识重复。": [
    "Duplicate plan identifier.",
    "プランIDが重複しています。"
  ],
  "收藏成就版本不支持，请保留数据并使用最新版时光花园。": [
    "Unsupported achievement version. Preserve the data and use the latest Time Garden.",
    "実績のバージョンが未対応です。データを保持して最新版を使用してください。"
  ],
  "花园植物标识重复。": [
    "Duplicate garden plant identifier.",
    "庭の植物IDが重複しています。"
  ],
  "已保存的扣减记录不正确。": [
    "Invalid saved deduction record.",
    "保存済み差し引き記録が正しくありません。"
  ],
  "收藏成就数量超出可保存范围。": [
    "Achievement count exceeds the supported range.",
    "実績数が保存可能な範囲を超えました。"
  ],
  "你的「{0}」开花了！回花园看看吧。": [
    "“{0}” has bloomed! Come see your garden.",
    "「{0}」が咲きました！庭を見に来てください。"
  ],
  "花园操作不正确。": [
    "Invalid garden operation.",
    "庭の操作が正しくありません。"
  ],
  "已有一株正在生长的植物，请先等待开花或移除它。": [
    "A plant is already growing. Wait for it to bloom or remove it first.",
    "すでに成長中の鉢があります。開花を待つか、先に削除してください。"
  ],
  "植物标识重复。": [
    "Duplicate plant identifier.",
    "植物IDが重複しています。"
  ],
  "暂停状态不正确。": [
    "Invalid pause state.",
    "一時停止の状態が正しくありません。"
  ],
  "通知设置不正确。": [
    "Invalid notification settings.",
    "通知設定が正しくありません。"
  ],
  "这株植物已不在生长，请刷新后重试。": [
    "This plant is no longer growing. Refresh and try again.",
    "この植物は成長中ではありません。更新して再試行してください。"
  ],
  "这株植物已不存在，请刷新后重试。": [
    "This plant no longer exists. Refresh and try again.",
    "この植物は存在しません。更新して再試行してください。"
  ],
  "种植方案最多保存 20 个，请先移除一个。": [
    "You already have 20 plans. Remove one before saving another.",
    "プランは20件までです。保存前に1件削除してください。"
  ],
  "这个种植方案已不存在，请刷新后重试。": [
    "This plan no longer exists. Refresh and try again.",
    "このプランは存在しません。更新して再試行してください。"
  ],
  "后台运行遇到问题。": [
    "The background encountered a problem.",
    "バックグラウンドで問題が発生しました。"
  ],
  "不支持的花园操作。": [
    "Unsupported garden operation.",
    "未対応の庭の操作です。"
  ],
  "请在 Hindsight 中打开时光花园。": [
    "Open Time Garden inside Hindsight.",
    "Hindsight 内で時光花園を開いてください。"
  ],
  "连接 Hindsight 超时，已暂停计时；请重新打开插件检查。": [
    "Connection to Hindsight timed out; timing is paused. Reopen the plugin to check.",
    "Hindsight への接続がタイムアウトし、計時を停止しました。プラグインを開き直してください。"
  ],
  "花园存储空间不足，已有记录已保留，本次操作未完成。": [
    "Garden storage is full. Existing records are preserved; this operation was not completed.",
    "庭の保存容量が不足しています。既存記録は保持され、この操作は完了していません。"
  ],
  "花园存储返回了无法识别的数据，已停止写入。": [
    "Unrecognized storage response. Writing has stopped.",
    "ストレージの応答を認識できず、書き込みを停止しました。"
  ],
  "花园归档版本损坏，请保留数据并检查。": [
    "Damaged archive version. Preserve the data and inspect it.",
    "アーカイブのバージョンが破損しています。データを保持し確認してください。"
  ],
  "花园存储版本损坏，请保留数据并检查。": [
    "Damaged storage version. Preserve the data and inspect it.",
    "保存データのバージョンが破損しています。データを保持し確認してください。"
  ],
  "花园数据损坏，已停止写入以保留原数据。": [
    "Damaged garden data. Writing has stopped to preserve the original.",
    "庭データが破損しています。元のデータを保持するため書き込みを停止しました。"
  ],
  "花园归档状态不完整，请保留数据并检查。": [
    "Incomplete archive state. Preserve the data and inspect it.",
    "アーカイブ状態が不完全です。データを保持して確認してください。"
  ],
  "单条花园状态超出存储接口限制，已保留原数据。": [
    "Garden state exceeds the storage interface limit. Original data is preserved.",
    "庭の状態が保存インターフェースの制限を超えました。元のデータは保持しています。"
  ],
  "花园升级正遇到并发更新，请稍后重试。": [
    "Concurrent updates during upgrade. Please try again shortly.",
    "更新処理が競合しています。少し待って再試行してください。"
  ],
  "无法核验收藏成就，已保留原数据。": [
    "Unable to verify achievements. Original data is preserved.",
    "実績を確認できません。元のデータは保持しています。"
  ],
  "花园中有无法读取的收藏记录，请保留原数据。": [
    "An archived flower cannot be read. Preserve the original data.",
    "読み取れない花の記録があります。元のデータを保持してください。"
  ],
  "花园收藏数据损坏，已停止写入。": [
    "Damaged flower archive. Writing has stopped.",
    "花のアーカイブが破損しており、書き込みを停止しました。"
  ],
  "花园收藏标识不一致，请保留原数据。": [
    "Flower archive identifiers do not agree. Preserve the original data.",
    "花の記録のIDが一致しません。元のデータを保持してください。"
  ],
  "花园收藏标识重复。": [
    "Duplicate flower archive identifier.",
    "花の記録のIDが重複しています。"
  ],
  "花园收藏分页返回了重复记录。": [
    "Archive pagination returned duplicate records.",
    "アーカイブのページ取得で重複記録が返されました。"
  ],
  "花园收藏正在频繁变化，请稍后重试。": [
    "The collection is changing too frequently. Try again shortly.",
    "コレクションの更新が頻繁です。少し待って再試行してください。"
  ],
  "单株收藏记录超出存储接口限制，已保留原数据。": [
    "A flower record exceeds the storage interface limit. Original data is preserved.",
    "花1株の記録が保存インターフェースの制限を超えました。元のデータは保持しています。"
  ],
  "花园正被其他窗口更新，请稍后重试。": [
    "Another window is updating the garden. Try again shortly.",
    "別のウィンドウが庭を更新中です。少し待って再試行してください。"
  ],
  "开花通知请求超时，系统是否接收尚不确定。": [
    "Bloom notification timed out; system delivery is uncertain.",
    "開花通知がタイムアウトしました。システムへの到達は不明です。"
  ],
  "时光花园：": [
    "Time Garden: ",
    "時光花園："
  ],
  "时光花园存储：": [
    "Time Garden storage: ",
    "時光花園ストレージ："
  ],
  "时光花园": [
    "Time Garden",
    "時光の庭"
  ],
  "一小段时间，一点点生长": [
    "A little time, a little growth",
    "少しの時間、少しずつの成長"
  ],
  "当前盆栽": [
    "Current pot",
    "今の鉢"
  ],
  "我的花园": [
    "My garden",
    "私の庭"
  ],
  "正在打开你的小花园…": [
    "Opening your little garden…",
    "小さな庭を開いています…"
  ],
  "等待连接": [
    "Connecting",
    "接続待ち"
  ],
  "这盆花的约定": [
    "This flower's promise",
    "この鉢との約束"
  ],
  "修改规则": [
    "Edit rules",
    "ルールを変更"
  ],
  "当前生长状态": [
    "Growth status",
    "成長の状態"
  ],
  "满足以下任意一条规则时累计时间。修改规则会保留当前进度。": [
    "Any matching rule counts time. Editing rules preserves current progress.",
    "どれか1件のルールに合えば時間を集計します。変更しても進捗は保持します。"
  ],
  "移除盆栽": [
    "Remove pot",
    "鉢を削除"
  ],
  "留给这段时间的记忆": [
    "A memory for this time",
    "この時間に残す思い出"
  ],
  "修改生长规则": [
    "Edit growth rules",
    "成長ルールを変更"
  ],
  "取消": [
    "Cancel",
    "キャンセル"
  ],
  "只修改哪些活动可以生长，已有进度、开花目标和惩罚设置都会保留。": [
    "Change only which activities count. Progress, bloom target and penalty settings are preserved.",
    "成長する活動だけを変更します。進捗・開花目標・ペナルティ設定は保持します。"
  ],
  "刷新分类": [
    "Refresh categories",
    "分類を更新"
  ],
  "＋ 添加规则": [
    "＋ Add rule",
    "＋ ルールを追加"
  ],
  "保存生长规则": [
    "Save growth rules",
    "成長ルールを保存"
  ],
  "种下一点期待": [
    "Plant a little hope",
    "小さな期待を植えよう"
  ],
  "重置选择": [
    "Reset choices",
    "選択をリセット"
  ],
  "使用此方案": [
    "Use plan",
    "このプランを使う"
  ],
  "先载入设置，再确认播种": [
    "Load settings, then confirm planting",
    "設定を読み込み、確認してから種まき"
  ],
  "保存或管理方案": [
    "Save or manage plans",
    "プランの保存・管理"
  ],
  "方案内容": [
    "Plan content",
    "プランの内容"
  ],
  "保存为新方案": [
    "Save as new plan",
    "新しいプランとして保存"
  ],
  "用当前设置更新": [
    "Update with current settings",
    "現在の設定で更新"
  ],
  "删除方案": [
    "Delete plan",
    "プランを削除"
  ],
  "最多保存 20 个方案。只保存品种、目标时长、规则与中断设置，不复制花名或任务备注。": [
    "Save up to 20 plans. Only species, target time, rules and interruption settings are saved; flower names and task notes are not copied.",
    "プランは20件まで。品種・目標時間・ルール・中断設定のみ保存し、花の名前やメモはコピーしません。"
  ],
  "只删除方案，已种下的花会保留。": [
    "Only the plan is removed. Planted flowers remain.",
    "プランだけを削除します。植えた花は残ります。"
  ],
  "确认删除方案": [
    "Confirm plan deletion",
    "プランの削除を確認"
  ],
  "挑一株喜欢的植物": [
    "Choose a plant you like",
    "好きな植物を選ぶ"
  ],
  "给它取个名字": [
    "Give it a name",
    "名前をつける"
  ],
  "推荐": [
    "Suggest",
    "おすすめ"
  ],
  "给这朵花留一句任务记忆": [
    "Leave a task memory for this flower",
    "この花に作業の思い出を残す"
  ],
  "可选": [
    "Optional",
    "任意"
  ],
  "保存在本机，开花后也能回看和编辑。方案不会复制这句话。": [
    "Saved locally; revisit or edit after blooming. Plans never copy this note.",
    "本機に保存し、開花後も確認・編集できます。プランにはコピーしません。"
  ],
  "累计多少分钟开花": [
    "Minutes until bloom",
    "開花までの累計分数"
  ],
  "分钟": [
    "min",
    "分"
  ],
  "可以分多次、跨天完成，已有进度会保存。": [
    "Complete over multiple sessions or days. Progress is saved.",
    "何回かに分け、日をまたいで達成できます。進捗は保存されます。"
  ],
  "哪些活动可以让它生长": [
    "Which activities help it grow?",
    "成長する活動を選ぶ"
  ],
  "直接选择 Hindsight 已有的分类或大类，无需填写程序名。满足任意一条即可；也可以添加程序或网站规则。": [
    "Choose existing Hindsight categories or groups without entering app names. Any one matching rule is enough; app and website rules are also available.",
    "Hindsight の分類・大分類を直接選べます。1件一致すれば十分で、アプリやサイトのルールも追加できます。"
  ],
  "生长模式与中断设置": [
    "Growth mode and interruptions",
    "成長モードと中断設定"
  ],
  "开启中断惩罚": [
    "Enable interruption penalty",
    "中断ペナルティを有効にする"
  ],
  "默认关闭：切到其他活动只暂停，不扣进度。": [
    "Off by default: other activities pause growth without losing progress.",
    "初期設定は無効。別の活動では一時停止し、進捗は減りません。"
  ],
  "扣减方式": [
    "Deduction method",
    "差し引く方法"
  ],
  "扣除当前进度的百分比": [
    "Percentage of current progress",
    "現在の進捗に対する割合"
  ],
  "扣除固定分钟数": [
    "Fixed number of minutes",
    "固定の分数"
  ],
  "宽限时间（秒）": [
    "Grace period (seconds)",
    "猶予時間（秒）"
  ],
  "切到不匹配的活动，超过宽限后只扣一次；及时返回不扣。手动暂停、离开电脑和关闭 Hindsight 都不扣进度。进度最低为零。": [
    "A mismatch deducts only once after the grace period; returning in time avoids it. Manual pause, time away and closing Hindsight incur no penalty. Progress never falls below zero.",
    "不一致が猶予を超えた場合だけ1回差し引き、時間内に戻れば減りません。手動停止・離席・Hindsight 終了では減らず、進捗は0未満になりません。"
  ],
  "花开时告诉我": [
    "Tell me when it blooms",
    "咲いたら知らせる"
  ],
  "发送一条无声的系统通知。": [
    "Send one silent system notification.",
    "無音のシステム通知を1件送ります。"
  ],
  "种下这颗种子": [
    "Plant this seed",
    "この種をまく"
  ],
  "查看植物大图与介绍": [
    "Plant artwork and stories",
    "植物の大きな絵と紹介"
  ],
  "花园植物图鉴": [
    "Garden field guide",
    "庭の植物図鑑"
  ],
  "从哪里来": [
    "Where it comes from",
    "どこから来たの？"
  ],
  "一段小故事": [
    "A little story",
    "小さな物語"
  ],
  "花语与寓意": [
    "Flower language and meaning",
    "花言葉と意味"
  ],
  "花语随时代与文化而异；「本花园寓意」为本园创作。学名介绍采用常见代表种或属。": [
    "Flower meanings vary by time and culture. “Our garden's meaning” is original to this garden. Botanical notes use common representative species or genera.",
    "花言葉は時代や文化で異なります。「この庭での意味」は創作です。学名は代表的な種・属を用いています。"
  ],
  "在 Hindsight「设置 → 插件」中可选择独立窗口。紧凑模式会收起其他内容，留下一盆花。": [
    "Choose a separate window in Hindsight Settings → Plugins. Compact mode hides other content and leaves one pot.",
    "Hindsight の「設定 → プラグイン」で独立ウィンドウを選べます。コンパクト表示では一鉢だけを残します。"
  ],
  "你的时间，在这里留下花朵": [
    "Your time leaves flowers here",
    "あなたの時間が、ここに花を残す"
  ],
  "慢慢长成一座花园": [
    "Slowly becoming a garden",
    "少しずつ、一つの庭に"
  ],
  "0 株已开花": [
    "0 flowers bloomed",
    "0 株が開花"
  ],
  "轻柔动效": [
    "Gentle motion",
    "やさしい動き"
  ],
  "秋千微摆，偶尔有小鸟和蝴蝶来访": [
    "A gentle swing, occasional birds and butterflies",
    "揺れるブランコ、ときどき鳥や蝶"
  ],
  "去看看当前盆栽": [
    "View current pot",
    "今の鉢を見る"
  ],
  "上一座": [
    "Previous",
    "前の庭"
  ],
  "下一座": [
    "Next",
    "次の庭"
  ],
  "点击一朵花，看看它留下的时间。": [
    "Select a flower to revisit the time it holds.",
    "花を選んで、そこに残した時間を見る。"
  ],
  "花园相册": [
    "Garden album",
    "庭のアルバム"
  ],
  "按周": [
    "Weekly",
    "週ごと"
  ],
  "从早到晚 · 每页 5 周": [
    "Oldest to newest · 5 weeks per page",
    "古い順 · 1ページ5週"
  ],
  "回到本周": [
    "This week",
    "今週へ"
  ],
  "上一页": [
    "Previous page",
    "前のページ"
  ],
  "下一页": [
    "Next page",
    "次のページ"
  ],
  "日期直达": [
    "Jump to date",
    "日付へ移動"
  ],
  "查看": [
    "View",
    "表示"
  ],
  "前一组花园": [
    "Previous gardens",
    "前の庭グループ"
  ],
  "后一组花园": [
    "Next gardens",
    "次の庭グループ"
  ],
  "前往第": [
    "Go to garden",
    "移動先の庭"
  ],
  "座": [
    "garden",
    "番"
  ],
  "每座花园最多 25 株，种满后继续分园。按开花日期归入本地周一至周日；展示有花的周、本周和选中的空周。": [
    "Each garden holds up to 25 flowers, then another garden opens. Blooms belong to their local Monday–Sunday week. Weeks with flowers, this week and the selected empty week are shown.",
    "1庭25株までで、満開後は次の庭へ。開花日を現地の月曜〜日曜に分類し、花のある週・今週・選択した空の週を表示します。"
  ],
  "收藏成就与主题": [
    "Achievements and themes",
    "実績とテーマ"
  ],
  "有效生长记录": [
    "Effective growth records",
    "有効成長の記録"
  ],
  "分类比例包含未分类与其他；最多单列 24 个分类，其后新分类汇总为「其他」。连续段在暂停、离开、不匹配或花开时结束。": [
    "Shares include Unclassified and Other. Up to 24 categories are listed individually; later new categories join Other. Pause, time away, mismatch or bloom ends a stretch.",
    "割合には未分類とその他も含みます。個別に記録するのは24分類までで、以降の新分類はその他にまとめます。停止・離席・不一致・開花で連続記録は終了します。"
  ],
  "获得有效生长时间后，这里会显示分类比例。": [
    "Category shares appear after you gain effective growth time.",
    "有効成長時間を記録すると、分類の割合が表示されます。"
  ],
  "查看其余分类": [
    "More categories",
    "残りの分類を見る"
  ],
  "点击查看各级条件与日期。徽章有白、蓝、紫、金、彩五档颜色；整组全部达成后，卡片才会填上淡黄色。": [
    "Select a badge for each level's conditions and dates. Badges use white, blue, purple, gold and rainbow grades; a card turns pale yellow only when every level is earned.",
    "バッジを選ぶと各段階の条件と日付が見られます。白・青・紫・金・虹の5段階で、全段階を達成したカードだけ淡い黄色になります。"
  ],
  "花朵收藏成就按现存档案核验，已删除的旧花无法还原；有效生长成就只从上方统计起点开始。已获得等级永久保留，删除花朵不撤回。": [
    "Flower achievements are verified from existing records; previously deleted flowers cannot be restored. Time achievements begin at the statistics start above. Earned levels are permanent, even if flowers are removed.",
    "花の実績は現存する記録で確認し、削除済みの旧花は復元できません。時間の実績は上記の統計開始時点から。獲得済み段階は花を削除しても残ります。"
  ],
  "还没有符合筛选的成就，先从一朵花开始吧。": [
    "No achievements match this filter yet. Start with a flower.",
    "条件に合う実績はまだありません。まずは一輪から。"
  ],
  "给花园换个心情": [
    "Give your garden a new mood",
    "庭の気分を変える"
  ],
  "主题只改变颜色与装饰，不改变生长规则。新装饰由 AI 原创绘制。": [
    "Themes change colors and decorations, never growth rules. New decorations are original AI artwork.",
    "テーマは色と飾りのみを変え、成長ルールは変えません。新しい飾りはAIによるオリジナル作品です。"
  ],
  "花园成就": [
    "Garden achievement",
    "庭の実績"
  ],
  "关闭": [
    "Close",
    "閉じる"
  ],
  "花园里的这一朵": [
    "This flower in your garden",
    "庭に咲いたこの一輪"
  ],
  "给花留一句记忆": [
    "Leave a memory for this flower",
    "花に思い出を残す"
  ],
  "任务备注，可留空": [
    "Task note (may be empty)",
    "作業メモ（空欄可）"
  ],
  "最多 280 个字符。只保存你填写的内容，不记录活动标题或浏览历史。": [
    "Up to 280 characters. Only your text is saved; activity titles and browsing history are not recorded.",
    "280文字まで。入力した内容のみ保存し、活動タイトルや閲覧履歴は記録しません。"
  ],
  "保存备注": [
    "Save note",
    "メモを保存"
  ],
  "给这株植物换个名字": [
    "Rename this plant",
    "この植物の名前を変える"
  ],
  "植物名称": [
    "Plant name",
    "植物の名前"
  ],
  "保存名字": [
    "Save name",
    "名前を保存"
  ],
  "确认移除这株植物？": [
    "Remove this plant?",
    "この植物を削除しますか？"
  ],
  "确认移除": [
    "Confirm removal",
    "削除を確認"
  ],
  "保留它": [
    "Keep it",
    "残す"
  ],
  "正在连接后台…": [
    "Connecting to background…",
    "バックグラウンドに接続中…"
  ],
  "原创植物插画由 AI 生成 · 数据保存在本机": [
    "Original plant artwork generated by AI · data stays on your computer",
    "植物の絵はAIによるオリジナル作品 · データは本機に保存"
  ],
  "花园页面": [
    "Garden pages",
    "庭のページ"
  ],
  "植物生长进度": [
    "Plant growth progress",
    "植物の成長進捗"
  ],
  "当前任务记忆": [
    "Current task memory",
    "現在の作業メモ"
  ],
  "种植方案与花种": [
    "Plans and species",
    "プランと品種"
  ],
  "选择保存的种植方案": [
    "Choose a saved planting plan",
    "保存済み栽培プランを選ぶ"
  ],
  "例如：论文阅读，类别与时长会自动附加": [
    "Example: Paper reading; category and duration are appended",
    "例：論文読み。分類と時間は自動で追加します"
  ],
  "设置生长计划": [
    "Growth plan settings",
    "成長プランの設定"
  ],
  "优先使用已选分类；没有分类时，随机组合任务名称与当前花朵": [
    "Use the selected category, or combine a random task with the chosen flower",
    "選択した分類を優先し、未選択なら作業名と花をランダムに組み合わせます"
  ],
  "例如：论文阅读的绣球": [
    "Example: Paper reading · Hydrangea",
    "例：論文読みのアジサイ"
  ],
  "例如：读完第三章，记下两个新想法": [
    "Example: Finish chapter three and note two new ideas",
    "例：第3章を読み、気づいたことを2つメモする"
  ],
  "植物高清预览": [
    "High-resolution plant preview",
    "植物の高解像度プレビュー"
  ],
  "时光花园全景": [
    "Time Garden panorama",
    "時光の庭の全景"
  ],
  "已开花的植物，点击展开详情": [
    "Bloomed plants; select for details",
    "開花済みの植物、選択すると詳細を表示"
  ],
  "切换花园": [
    "Switch gardens",
    "庭の切り替え"
  ],
  "选择花园": [
    "Choose a garden",
    "庭を選ぶ"
  ],
  "相册展示范围": [
    "Album scope",
    "アルバムの表示範囲"
  ],
  "按周选择花园": [
    "Choose a weekly garden",
    "週ごとの庭を選ぶ"
  ],
  "每周相册，从早到晚": [
    "Weekly albums, oldest to newest",
    "週のアルバム、古い順"
  ],
  "更多周相册": [
    "More weekly albums",
    "ほかの週のアルバム"
  ],
  "选择日期定位到所在周": [
    "Choose a date to locate its week",
    "日付を選んでその週へ移動"
  ],
  "开花品种分布": [
    "Bloomed species distribution",
    "開花品種の分布"
  ],
  "不同花园，选择后查看全景": [
    "Select a garden for the full scene",
    "庭を選んで全景を表示"
  ],
  "更多花园": [
    "More gardens",
    "ほかの庭"
  ],
  "花园序号": [
    "Garden number",
    "庭の番号"
  ],
  "筛选成就": [
    "Filter achievements",
    "実績の絞り込み"
  ],
  "收藏成就": [
    "Collection achievements",
    "コレクションの実績"
  ],
  "选择花园主题": [
    "Choose a garden theme",
    "庭のテーマを選ぶ"
  ],
  "关闭花朵详情": [
    "Close flower details",
    "花の詳細を閉じる"
  ],
  "{0}初绽": [
    "First {0} bloom",
    "{0}の初咲き"
  ],
  "此版本的时光花园已过期，已阻止写入以保留种植方案、任务记忆和收藏成就。请关闭旧版本窗口并重新打开最新版。": [
    "This Time Garden version is outdated. Writing was blocked to preserve plans, memories and achievements. Close old windows and reopen the latest version.",
    "このバージョンは古いため、プラン・思い出・実績を守るため書き込みを阻止しました。古いウィンドウを閉じて最新版を開いてください。"
  ],
  "此版本的时光花园已过期，已阻止写入以保留有效生长统计。请关闭旧版本窗口并重新打开最新版。": [
    "This version is outdated. Writing was blocked to preserve effective-growth statistics. Close old windows and reopen the latest version.",
    "このバージョンは古いため、成長統計を守るため書き込みを阻止しました。古いウィンドウを閉じて最新版を開いてください。"
  ],
  "初见梦色": [
    "First hidden bloom",
    "初めての夢色"
  ],
  "{0} 朵梦色花": [
    "{0} hidden blooms",
    "夢色の花 {0} 株"
  ],
  "累计成功开出 {0} 朵隐藏配色花朵。每朵完成时独立有 5% 概率获得隐藏配色。": [
    "Grow {0} hidden-color flowers. Every completed flower has an independent 5% chance of a hidden palette.",
    "夢色の花を累計 {0} 株咲かせる。開花ごとに独立した5%の確率で特別な色になります。"
  ],
  "偶然遇到不同的颜色，也留住了同样认真积累的一段时间。删除花朵不撤回已获得的成就。": [
    "A surprise color keeps the same carefully grown time. Removing flowers never revokes earned achievements.",
    "偶然出会う特別な色にも、大切に育てた時間が宿ります。花を削除しても獲得した実績は残ります。"
  ],
  "{0} 种梦色收藏": [
    "{0} hidden species",
    "夢色コレクション {0} 種"
  ],
  "收集到 {0} 种曾经开花的隐藏配色植物。普通配色不计入隐藏品种数。": [
    "Collect {0} species in their hidden palette. Ordinary colors do not count toward hidden species.",
    "夢色の植物を {0} 種類集める。通常色は夢色の品種数に含みません。"
  ],
  "慢慢遇见不同品种的隐藏配色，不需要改变原本的种植节奏。": [
    "Discover hidden palettes at your own pace, without changing the way you grow.",
    "いつものペースで育てながら、さまざまな夢色に出会いましょう。"
  ],
  "梦色{0}初绽": [
    "First hidden {0}",
    "夢色{0}の初咲き"
  ],
  "至少让一株{0}开花，并获得它的隐藏配色。": [
    "Let at least one {0} bloom in its hidden palette.",
    "{0}を1株以上咲かせ、夢色を手に入れる。"
  ],
  "这株{0}留住了一次特别的相遇。旧版已开花的普通配色不会重新抽取。": [
    "This {0} marks a special encounter. Flowers that bloomed in older versions are not rerolled.",
    "この{0}は特別な出会いの記録です。旧版で開花した通常色の花は再抽選しません。"
  ],
  "隐藏配色随机签不正确，已停止操作以保留原数据。": [
    "Invalid hidden-color ticket. The operation stopped to preserve the original data.",
    "夢色の抽選値が不正です。元のデータを守るため操作を停止しました。"
  ],
  "已保存的植物配色不支持，请保留数据并使用最新版。": [
    "Unsupported saved plant palette. Preserve the data and use the latest version.",
    "保存済みの配色に対応していません。データを保持して最新版を使用してください。"
  ],
  "隐藏配色随机来源不正确。": [
    "Invalid hidden-color random source.",
    "夢色の乱数生成元が正しくありません。"
  ],
  "此版本的时光花园已过期或尝试修改已保存的隐藏配色随机签，已阻止写入以保留数据。请关闭旧版本窗口并重新打开最新版。": [
    "An outdated version or an attempt to change a saved color ticket was blocked to preserve data. Close old windows and reopen the latest version.",
    "古いバージョンまたは抽選値の変更による書き込みを、データ保護のため阻止しました。古いウィンドウを閉じて最新版を開いてください。"
  ],
  "晨粉向日葵": [
    "Dawn-pink sunflower",
    "朝桃のヒマワリ"
  ],
  "杏霞绣球": [
    "Apricot hydrangea",
    "杏色のアジサイ"
  ],
  "晴蓝郁金香": [
    "Sky-blue tulip",
    "空色のチューリップ"
  ],
  "浅紫雏菊": [
    "Lilac daisy",
    "薄紫のデージー"
  ],
  "月蓝玫瑰": [
    "Moon-blue rose",
    "月青のバラ"
  ],
  "薄荷薰衣草": [
    "Mint lavender",
    "ミント色のラベンダー"
  ],
  "蜜橙波斯菊": [
    "Honey-orange cosmos",
    "蜜橙のコスモス"
  ],
  "淡樱百合": [
    "Cherry-blush lily",
    "薄桜のユリ"
  ],
  "梦色花笺": [
    "Hidden bloom collection",
    "夢色の花便り"
  ],
  "梦色图鉴": [
    "Hidden species collection",
    "夢色の図鑑"
  ],
  "隐藏收藏": [
    "Hidden collection",
    "夢色コレクション"
  ],
  "隐藏配色": [
    "Hidden palette",
    "夢色"
  ],
  "普通配色": [
    "Original palette",
    "通常色"
  ],
  "配色": [
    "Palette",
    "配色"
  ],
  "✧ {0}": [
    "✧ {0}",
    "✧ {0}"
  ],
  "梦色收藏：{0} 株 · {1} / 8 种": [
    "Hidden collection: {0} flowers · {1} / 8 species",
    "夢色コレクション：{0} 株 · {1} / 8 種"
  ],
  "每次开花有 5% 概率遇见隐藏配色，花园与相册都会保留。旧花保持原色；隐藏结果不会因刷新或重启改变。": [
    "Every bloom has a 5% chance of a hidden palette, kept in the garden and album. Older blooms retain their original colors. Refreshing or restarting never rerolls the result.",
    "開花ごとに5%の確率で夢色になり、庭とアルバムに残ります。旧花は元の色のまま。更新や再起動で結果は変わりません。"
  ],
  "隐藏配色只在完成时揭晓，品种与目标时长不影响 5% 概率。一次结果会永久保存在花朵记录中；没有保底，也不需要重复抽取。": [
    "Hidden colors are revealed at bloom. Species and duration do not change the 5% chance. The result is saved with the flower; there is no guaranteed drop or reroll.",
    "夢色は開花時に分かります。品種や目標時間によらず確率は5%。結果は花とともに保存され、確定入手や再抽選はありません。"
  ],
  "细雨落向草地，叶伞轻动，水面泛起微波": [
    "A light rain lands on the lawn, the leaf canopy sways, and the pond ripples",
    "小雨が芝生に落ち、葉の傘が揺れ、池に波紋が広がります"
  ]
};
  function resolveLanguage(value) {
    const primary = String(value || "").trim().toLowerCase().replaceAll("_", "-").split("-")[0];
    return primary === "zh" ? "zh-CN" : primary === "ja" ? "ja" : "en";
  }
  const format = (value, values) => value.replace(/\{(\d+)\}/g, (match, index) =>
    Number(index) < values.length ? String(values[index]) : match);
  function create(language) {
    const locale = resolveLanguage(language);
    const column = locale === "ja" ? 1 : 0;
    const t = (key, ...values) => format(locale === "zh-CN" ? key : MESSAGES[key]?.[column] || MESSAGES[key]?.[0] || key, values);
    const patterns = Object.keys(MESSAGES).filter(key => /\{\d+\}/.test(key))
      .sort((a, b) => b.replace(/\{\d+\}/g, "").length - a.replace(/\{\d+\}/g, "").length).map(key => {
      const indexes = [];
      let source = "", position = 0;
      for (const match of key.matchAll(/\{(\d+)\}/g)) {
        source += escapeRegex(key.slice(position, match.index)) + "([\\s\\S]*?)";
        indexes.push(Number(match[1])); position = match.index + match[0].length;
      }
      return { key, indexes, regex: new RegExp("^" + source + escapeRegex(key.slice(position)) + "$") };
    });
    // Only call this for built-in core metadata/errors, never arbitrary user-authored display text.
    function message(value) {
      if (locale === "zh-CN" || typeof value !== "string") return value;
      if (Object.hasOwn(MESSAGES, value)) return t(value);
      for (const pattern of patterns) {
        const match = value.match(pattern.regex);
        if (!match) continue;
        const values = [];
        pattern.indexes.forEach((index, position) => values[index] = match[position + 1]);
        return t(pattern.key, ...values);
      }
      return value;
    }
    function achievement(item) {
      const result = { ...item, name: message(item.name), condition: message(item.condition), description: message(item.description) };
      if (item.metric === "speciesBloom" || item.metric === "hiddenSpeciesBloom") {
        const flower = root.GardenCore?.SPECIES.find(species => species.id === item.species);
        if (flower && item.metric === "hiddenSpeciesBloom") {
          result.name = t("梦色{0}初绽", t(flower.name));
          result.condition = t("至少让一株{0}开花，并获得它的隐藏配色。", t(flower.name));
          result.description = t("这株{0}留住了一次特别的相遇。旧版已开花的普通配色不会重新抽取。", t(flower.name));
        }
        if (flower && item.metric === "speciesBloom") {
          result.name = t("{0}初绽", t(flower.name));
          result.condition = t("至少让一株{0}开花。", t(flower.name));
        }
      }
      return result;
    }
    function localizeDocument(doc) {
      doc.documentElement.lang = locale;
      const walker = doc.createTreeWalker(doc.documentElement, 4);
      let node;
      while ((node = walker.nextNode())) {
        if (node.parentElement?.closest("script,style,svg")) continue;
        const key = node.nodeValue.trim().replace(/\s+/g, " ");
        if (Object.hasOwn(MESSAGES, key)) node.nodeValue = node.nodeValue.replace(/\S[\s\S]*\S|\S/, () => t(key));
      }
      for (const element of doc.querySelectorAll("[aria-label],[placeholder],[title]")) {
        for (const attribute of ["aria-label", "placeholder", "title"]) {
          const value = element.getAttribute(attribute);
          if (value && Object.hasOwn(MESSAGES, value)) element.setAttribute(attribute, t(value));
        }
      }
    }
    return { locale, t, message, achievement, localizeDocument };
  }
  function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  const api = create(root.navigator?.language || root.navigator?.languages?.[0] || "en");
  Object.assign(api, { create, resolveLanguage, MESSAGES });
  root.GardenI18n = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : self);
