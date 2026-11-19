# 怎样给「一起玩 Web3」加章节和实验

[English](CONTRIBUTING.md) · **简体中文**

源码仓库：https://github.com/cnkang/lets-play-web3 · 整理：Kang（署名可用环境变量 `AUTHOR_NAME` 覆盖）

这本书设计成「往里加内容不用改代码」：**加一章 = 加两个 MDX 文件**（中文一个、英文一个，文件名相同）。目录、上一章 / 下一章、站点地图（sitemap）、hreflang、`llms.txt`、站内搜索、JSON-LD 都会在构建时自动更新。

> 先读一遍安全底线：只用 Sepolia 测试网；不要把私钥、助记词、API 密钥、`.env` 写进仓库；书里每个 `0x` 地址 / 哈希都必须能在实验记录里找到。

## 一、加一章（最常用）

**方法 A：用脚本生成（推荐）**

```bash
npm run new:chapter -- 20-p1-dex-amm --part p1-defi --order 200
```

会生成两个草稿文件：

```
src/content/chapters/zh/20-p1-dex-amm.mdx
src/content/chapters/en/20-p1-dex-amm.mdx
```

**方法 B：手动复制模板**：把 `templates/chapter.zh.mdx` 和 `templates/chapter.en.mdx` 复制到上面两个位置，删掉开头的 `#` 注释行。

然后：

1. 填写两份文件的 frontmatter（见下表）和正文。
2. `npm run dev`，分别打开 http://localhost:4321/zh/ 和 http://localhost:4321/en/ 预览（草稿只在开发模式可见；搜索要先 build 再 preview）。按 `.nvmrc` 使用 Node 24，首次运行先 `nvm use`、`npm ci`。
3. 写好后把**两份文件**的 `status` 都改成 `published`。
4. 运行 `npm run check:content`、`npm run check:facts`、`npm run build`，都通过再提交。

**slug（文件名）规则**：小写字母、数字和连字符，例如 `20-p1-dex-amm`。中英文必须完全相同，因为右上角的语言切换就是靠同名文件对应的。slug 一旦发布就不要再改（会改变网址）。

## 二、frontmatter 字段

```yaml
---
title: "授权不是付款"              # 页面标题（<h1>、浏览器标题、分享卡片）
description: "一两句话的摘要"       # 搜索结果、社交卡片、llms.txt 用
navTitle: "10　授权不是付款"        # 可选：目录和翻页里显示的短标题（默认用 title）
part: tokens                        # 属于哪个「部分」，取 src/content/parts.json 里的 id
order: 100                          # 排序数字；建议用 10 的倍数，以后好在中间插章
status: published                   # published / upcoming / draft
updated: "2026-12-01"               # 可选：内容更新日期，会显示在页面并写进 sitemap 和 JSON-LD
# snapshot:                         # 可选：本章自己的链上快照（如第 19 章），页头和 JSON-LD 会用它代替全书快照
#   at: "2026-11-19T11:58:12+08:00"
#   block: 12165973
---
```

`title`、`description` 必填，`navTitle` 可选，分别用对应语言表达同一主题。`part`、`order`、`status` **中英两份必须一致**，否则构建会报错并告诉你哪里不一致。`updated` 填该语言正文实际更新日期。

### status 三种状态

| 状态 | 目录里 | 有没有页面 | sitemap / 搜索 / llms.txt |
| --- | --- | --- | --- |
| `published` | 正常链接 | 有 | 收录 |
| `upcoming` | 显示「即将推出 / Coming soon」，不可点击 | 没有 | 不收录（llms.txt 的 Coming soon 列表里会写标题） |
| `draft` | 只在 `npm run dev` 里出现（带「草稿」标记） | 只在开发模式 | 正式构建完全排除 |

提示：`upcoming` 也需要中英两份文件，但正文可以先空着，只写好 frontmatter。

## 三、部分（part）与阶段（phase）

- **阶段**写在 `src/content/phases.json`，例如 `p0`（基础与第一批实验）、`p1`（DeFi）。以后开 P2，就加一行：
  ```json
  { "id": "p2", "order": 2, "zh": "P2 · 新阶段名", "en": "P2 · New phase" }
  ```
- **部分**写在 `src/content/parts.json`，每个部分属于一个阶段：
  ```json
  { "id": "p1-dex", "order": 70, "phase": "p1", "zh": "第六部分 · 去中心化交易", "en": "Part VI · Decentralised exchanges" }
  ```
- 目录按「阶段 → 部分 → 章节 order」排序；有多个阶段时，目录里会显示阶段小标签。没有任何章节的部分不会显示。

## 四、中英配对检查

每一章都必须有中文和英文两份。缺一份时：

- `npm run check:content`（`npm run build` 会先自动跑它）直接失败，并告诉你缺的是哪个文件；
- Astro 构建里还有第二道同样的检查（`src/data/chapters.ts`）。

如果临时只想先发布别的内容，可以 `ALLOW_UNPAIRED=1 npm run build`：缺翻译的章节会被跳过，并打印警告。**正式发布不要用这个开关。**

## 五、可以直接用的组件（不用 import）

| 组件 | 用途 | 例子 |
| --- | --- | --- |
| `<Lab>` | 实验卡片：标题、目标、网络、完成状态 | `<Lab title="部署 Counter" goal="看懂一次链上状态变化">…步骤…</Lab>`；可加 `network="Sepolia"`、`status="planned"` |
| `<Addr>` | 地址：等宽显示 + Sepolia Etherscan 链接 + 复制按钮 | `<Addr a="0x…40 位…" />`，加 `short` 缩略显示 |
| `<Tx>` | 交易哈希：同上 | `<Tx h="0x…64 位…" />` |
| `<Callout>` | 提示框，`note` / `warn` / `danger` | `<Callout type="warn" title="注意">…</Callout>` |
| `<Figure>` | 示意图 + 图注 + 替代文字 | `<Figure name="approve" n="4" alt="图里画了什么">图注</Figure>`，图片放在 `public/diagrams/{zh,en}/<name>.svg` |
| `<T>` | 宽表格：手机上可在表格内横向滑动，键盘可聚焦 | `<T label="表格用途">`（空一行）Markdown 表格（空一行）`</T>` |
| `<SafetyNotice>` / `<Snapshot>` | 安全须知 / 链上快照说明 | `<SafetyNotice lang="zh" />` |
| `<Term>` | 术语：文字后面带一个「?」按钮，点开是一段大白话解释（见下文） | `<Term id="gas">手续费（gas）</Term>` |
| `<Glossary>` | 自动生成的完整术语表（附录 C 在用） | `<Glossary lang="zh" />` |

组件里的文字会按页面语言自动切换（「实验 / Lab」「复制 / Copy」等）。

**写作小规范**

- 每章先用生活类比讲直觉，再讲术语，最后用链上证据核对。
- 图片必须写 `alt`（给读屏软件）；图注里重复关键数字。
- 标题层级从 `##` 开始（`#` 由页面自动生成），不要跳级。
- 链接文字要说清去哪里，不要写「点这里」。
- 写给「会用电脑、会上网，但没碰过区块链」的读者：第一次出现的专有名词要么在句子里顺手解释（例如「测试网，也就是专门用来练习的区块链」），要么加 `<Term>`。

### 正文编辑规范（建议）

英文正文用短句、主动语态。写操作步骤时用祈使句，把条件和警告放在对应动作之前。每个步骤句只写一个动作（不超过 20 个英文单词），每个说明句只讲一件事（不超过 25 个英文单词）。授权（approve 这个动作）要区别于额度（allowance，剩余可动用的数量），签名要区别于广播，本地测试要区别于链上结果。术语统一按 `src/content/glossary.json` 来写；中文版要用自然的中文重写，不要逐字照搬英文句子结构。

这些是编辑习惯，不是发布门槛。不要只凭单词数或词表就宣称符合 ASD-STE100。改正文时跳过代码、地址、哈希、链接和引文。如果写检查脚本，它只能是提示性的，绝不能卡住构建或发布。

示例（改前 → 改后）：

- 改前："Balances do not change; the allowance is only a standing permission, so check it before you approve again and revoke it when you no longer need it."
- 改后："Approving does not change any balance. The allowance is only a standing permission. Check the allowance before you approve again. Revoke it when you no longer need it."

### 术语「?」小窗（`<Term>`）

全书的术语解释只写在**一个文件**里：`src/content/glossary.json`。章节里的 `<Term>`、附录 C 的完整术语表都从这里读，所以改一处，全书同步。

**1. 加一个新术语**：在 `glossary.json` 里加一项（键就是术语 id，只用小写字母、数字和连字符）：

```json
"slippage": {
  "chapter": "20-p1-dex-amm",
  "zh": { "term": "滑点", "def": "下单时看到的价格和最终成交价之间的差。就像排队买菜，轮到你时菜价可能已经变了。" },
  "en": { "term": "slippage", "def": "The gap between the price you saw and the price you finally got, like a market stall changing its price while you queue." }
}
```

- `zh` 和 `en` **都必须有**，每种语言都要有 `term`（小窗标题）和 `def`（解释）。
- `def` 写 1–3 句大白话，能用生活类比就用；只写通用知识，不要放具体地址、哈希或实验数字。
- `chapter` 可选：填详细讲这个概念的章节 slug，小窗底部会出现「详细讲解：第 X 章」链接（在那一章本身里不显示）。

**2. 在正文里用**：把第一次出现的那个词包起来，显示的文字可以和 `term` 不同（比如带复数或加括号）：

```mdx
后面的实验都在 <Term id="sepolia">Sepolia</Term> 测试网上做。
Every fee is paid in <Term id="eth">ETH</Term>.
```

规则（`npm run check:content` 会自动检查）：

- 用到的 id 必须在 `glossary.json` 里；每个术语都要中英两种语言。
- **每个文件里同一个 id 只标一次**——只标这一页第一次出现的地方，别处照常写字。
- 不要放进标题（`##`）、链接文字、代码块或 `` `代码` `` 里；表格单元格里可以用，但优先标在正文段落里。
- 中英两份章节尽量标同一批术语。
- 不要一句话里堆三四个「?」：能在句子里用几个字解释清楚的，就直接写在句子里。

**3. 自查**：`npm run dev` 打开页面，点「?」看小窗；键盘按 Tab 移到「?」，Enter / 空格打开，Esc 关闭。

小窗用的是浏览器原生的 popover：不开 JavaScript 也能点开、按 Esc 或点空白处关闭；小窗里的文字不会进站内搜索（`data-pagefind-ignore`），完整解释在附录 C 可以被搜到。技术细节见 `BUILD-NOTES.md`「Glossary popovers」。

### 折行：不要让最后一行只剩一两个字

网站会自动避免「最后一行只剩 1–3 个字（或一个英文单词）」的难看折行，写作时**不用手动加空格或换行**：

- 正文、列表、表格、标题会在构建时自动处理（`src/lib/rehype-no-orphans.mjs`）：把段落最后约 4 个汉字（或最后两个英文单词）包进 `<span class="nw">` 不让它们分开；表格里每格都很短的列（≤ 约 11 个汉字，例如「自动履约的数字凭证」）会保持一行。复制、搜索、读屏软件看到的文字不变。
- `.astro` 模板里的长句用 `<Nw text={...} />` 组件；短标题、按钮、目录靠 CSS `text-wrap: balance` 自动平衡。
- 「?」按钮总是和术语最后一两个字黏在一起，不会单独跑到下一行开头。
- 长链接会在「/」后断行；长哈希 / 地址照常可以在任意位置断开，不会撑出页面。
- 检查：`scripts/qa/orphan-check.mjs`（见 `scripts/qa/README.md`）。

## 六、追加实验到附录 A

附录 A（`16-appendix-addresses-txs.mdx`，中英两份）是由脚本从实验记录**自动生成**的，不要手改。新做了实验时：

1. 在实验仓库的 `实验记录.md` §5.2 交易表末尾按原格式追加新交易行：
   `| nonce | A/B | 用途 | success/**reverted** | 手续费 | [交易](https://sepolia.etherscan.io/tx/0x…) |`
2. 打开 `scripts/gen_appendix.py`：
   - 在 `blocks` 里加上新交易的区块号（键是哈希前 10 个字符）；
   - 在 `en_purpose` 里给每个新「用途」加英文说明（`zh_purpose` 可选，用来美化中文写法）；
   - 新合约 / 新账户地址加到 `contracts` / `accounts`。
3. 运行：
   ```bash
   python3 scripts/gen_appendix.py /absolute/path/to/实验记录.md
   SOURCES_DIR=/absolute/path/to/web3-sandbox P1_SOURCES_DIR=/absolute/path/to/web3-p1a-swap npm run check:facts
   npm run build
   ```
   如果缺区块号或英文说明，脚本会停下并逐条列出缺什么。

Phase-1（第 19 章）的交易来自 `$P1_SOURCES_DIR/out/p19-appendix-txs.json`（账户 A nonce 20–42 以及水龙头转入，附中英文说明）；第 19 章的合约地址写在生成脚本的 `p1_contracts` 里。以后追加 Phase-1 实验时，扩充这两处即可。
4. 保留 `2026-11-12 15:39:55 UTC+8 / Sepolia block 12117419` 历史快照。后续证据另加日期、网络、区块、来源和适用范围，不直接改全书的快照常量，也不要用早期笔记覆盖较晚的复核。

### 区分原理、链上结果、本地测试和计划

- 通用原理和生活类比用于解释概念，不声称每句话都有链上证明。
- 链上结果写清网络、交易、目标区块和当时状态；浏览器当前读数可能已经变化。MBox-Burn 剩余授权已由 D-01 撤销。
- 单元测试、Fuzz、Invariant 和 fork 模拟单列为本地证据。UBOX V4 从未部署到 Sepolia，不能给它编交易哈希。
- Phase-0 指基础实验与复核，已经收尾；Phase-1 指第 19 章的 DeFi 实验（2026-11-19 完成，使用自己的快照：区块 12165973）。Sourcify 8/8 匹配中只有 5 个 exact；Etherscan 快照时仍排队；PASS WITH FINDINGS 不等于没有漏洞。以第 15 章和相应原始证据为准。

## 七、新示意图

示意图由 `scripts/build_diagrams.py` 生成（中英文各一份，配色与网站一致）。新增图时仿照已有函数写一个，加进文件末尾的列表，运行 `npm run diagrams`，然后在章节里用 `<Figure name="…">`。图中所有数字都要来自实验记录。

英文通常比中文长，而且图里的字用的是读者电脑自带的字体（宽窄不一）。改完图请跑 `scripts/qa/diagram-overflow-check.mjs`（见 `scripts/qa/README.md`）：它会检查每段文字有没有超出所在方框或画布、有没有和别的文字或箭头重叠，并用一套偏宽的字体再测一遍，必须 0 问题。放不下时优先拆成两行（`lines()`）、加大方框或缩短文案，不要把字号缩到 14px 以下。

分享图（Open Graph）改了文字或配色后，按 `scripts/qa/README.md` 运行 `render-og.mjs` 重新生成 PNG，再运行 `node scripts/binary-assets.mjs encode` 更新 `.b64` 文件。

### 为什么分享图是 `.png.b64`？

这个仓库是通过只接受文本文件的 API 发布到 GitHub 的，所以两张二进制分享图以 base64 文本保存为 `assets/og/zh.png.b64`、`assets/og/en.png.b64`（这是唯一的「源文件」）。`scripts/binary-assets.mjs`（无依赖）会在 `npm run dev` / `build` / `preview` 以及 CI 构建前自动把它们解码成 `public/og/*.png`；PNG 缺失或内容不一致时才重写，解码后的字节与原图完全相同（已用 sha256 核对）。`public/og/*.png` 已加入 `.gitignore`，不要直接提交 PNG。

## 八、提交前检查清单

- [ ] 中英两份文件都在，`part` / `order` / `status` 一致（`npm run check:content`）
- [ ] 新术语在 `src/content/glossary.json` 里有中英两种解释；每章同一术语只标一次 `<Term>`（`npm run check:content`）
- [ ] 显式指定 `SOURCES_DIR` 运行 `npm run check:facts`；无外部来源时注明出处检查已跳过，密钥扫描仍会运行。脚本只检查字面出处，不证明实验结论
- [ ] `npm run build` 通过
- [ ] 分别用 `BASE=/ SITE_URL=https://letsplayweb3.liukang.com` 和 `BASE=/lets-play-web3/ SITE_URL=https://example.github.io` 运行 build，再用同一配置运行 `npm run check:build`，检查站内链接、资源和语言/SEO 网址
- [ ] 改了样式或组件时：按 `scripts/qa/README.md` 跑 axe 和键盘检查（目标 WCAG 2.2 AA，0 违规），以及折行检查 `orphan-check.mjs`（1280 / 1024 / 768 应为 0）
- [ ] 改了示意图时：`diagram-overflow-check.mjs` 为 0 问题（中英文、默认字体和宽字体两轮）
- [ ] 改了语言切换 / 首页跳转时：`lang-check.mjs` 全部通过
- [ ] 改了目录、翻页卡片或章节 `navTitle` 时：`toc-indent-check.mjs` 全部通过（`navTitle` 写成「11　标题」/「11 · Title」/「附录 A　标题」/「Appendix A · Title」，编号会自动拆成编号列）
- [ ] 改了页眉、翻页、弹窗或快捷键时：`keyboard-check.mjs` 全部通过（← → 翻章在输入、选字、小窗打开、横向滚动区域等情况下不能触发）
- [ ] 没有提交 `.env`、私钥、助记词、API 密钥
