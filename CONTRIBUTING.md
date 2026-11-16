# 怎样给「一起玩 Web3」加章节和实验

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
2. `npm run dev`，打开 http://localhost:4321/zh/ 预览（草稿只在开发模式可见）。
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
---
```

`part`、`order`、`status` **中英两份必须一致**，否则构建会报错并告诉你哪里不一致。

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

组件里的文字会按页面语言自动切换（「实验 / Lab」「复制 / Copy」等）。

**写作小规范**

- 每章先用生活类比讲直觉，再讲术语，最后用链上证据核对。
- 图片必须写 `alt`（给读屏软件）；图注里重复关键数字。
- 标题层级从 `##` 开始（`#` 由页面自动生成），不要跳级。
- 链接文字要说清去哪里，不要写「点这里」。

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
   npm run appendix        # 默认读取 /workspace/web3-sandbox/实验记录.md，也可以传路径
   npm run check:facts     # 确认每个地址 / 哈希都能在实验记录里找到
   npm run build
   ```
   如果缺区块号或英文说明，脚本会停下并逐条列出缺什么。
4. 如果快照时间 / 区块变了，同时更新 `src/data/site.ts` 的 `SNAPSHOT_ISO`、`SNAPSHOT_BLOCK`，以及 `src/data/book.ts` 里的 `snapshot` 文案和 `Snapshot.astro`。

## 七、新示意图

示意图由 `scripts/build_diagrams.py` 生成（中英文各一份，配色与网站一致）。新增图时仿照已有函数写一个，加进文件末尾的列表，运行 `npm run diagrams`，然后在章节里用 `<Figure name="…">`。图中所有数字都要来自实验记录。

分享图（Open Graph）改了文字或配色后，按 `scripts/qa/README.md` 运行 `render-og.mjs` 重新生成 PNG，再运行 `node scripts/binary-assets.mjs encode` 更新 `.b64` 文件。

### 为什么分享图是 `.png.b64`？

这个仓库是通过只接受文本文件的 API 发布到 GitHub 的，所以两张二进制分享图以 base64 文本保存为 `assets/og/zh.png.b64`、`assets/og/en.png.b64`（这是唯一的「源文件」）。`scripts/binary-assets.mjs`（无依赖）会在 `npm run dev` / `build` / `preview` 以及 CI 构建前自动把它们解码成 `public/og/*.png`；PNG 缺失或内容不一致时才重写，解码后的字节与原图完全相同（已用 sha256 核对）。`public/og/*.png` 已加入 `.gitignore`，不要直接提交 PNG。

## 八、提交前检查清单

- [ ] 中英两份文件都在，`part` / `order` / `status` 一致（`npm run check:content`）
- [ ] `npm run check:facts` 通过（地址 / 哈希都有出处，没有密钥）
- [ ] `npm run build` 通过
- [ ] 改了样式或组件时：按 `scripts/qa/README.md` 跑 axe 和键盘检查（目标 WCAG 2.2 AA，0 违规）
- [ ] 没有提交 `.env`、私钥、助记词、API 密钥
