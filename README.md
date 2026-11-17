# 一起玩 Web3 · Let’s Play Web3

「一起玩 Web3」（整理：Kang）是一本给区块链新手的**中英双语连续教材**：先用生活例子讲清原理，再用真实的 **Ethereum Sepolia 测试网**实验核对。用 [Astro](https://astro.build/) 生成纯静态网站，可部署到 GitHub Pages 或 Cloudflare Pages。

> ⚠️ 仅 Sepolia 测试网 · 预算 0 美元 · 测试币没有任何价值 · 不构成投资建议 · 永远不要导入真实助记词。
> 链上数字是 **2026-11-12 15:39:55（新加坡时间，UTC+8）、Sepolia 区块 12117419** 的历史快照，不是实时状态。
> 本站是个人学习笔记，与 Ethereum 基金会、Etherscan 或任何公司无关。

- 中文版（默认）：`/zh/`　English: `/en/`（两种语言的路径一一对应）
- 19 章：理论与实验交织；附录含全部地址与交易；最后一章为预留的「P1 DeFi（尚未开始）」
- 想加新章节或新实验？看 **[CONTRIBUTING.md](./CONTRIBUTING.md)**：加一章 = 加两个 MDX 文件，不用改代码。

## 本地开发

需要 Node.js ≥ 22.23.4（推荐 24，见 `.nvmrc`）。

```bash
npm ci            # 安装依赖
npm run dev       # 开发服务器 → http://localhost:4321/zh/
npm run build     # 生成 dist/（含 Pagefind 搜索索引）
npm run preview   # 预览 dist/ → http://localhost:4321/zh/
```

开发模式下搜索不可用（索引在 build 时生成）；用 `npm run build && npm run preview` 试搜索。

其他脚本：

| 命令 | 作用 |
| --- | --- |
| `npm run check:content` | 检查每章都有中英两个文件、frontmatter 完整（`npm run build` 会先自动运行） |
| `npm run new:chapter -- <slug> --part <id> --order <数字>` | 用 `templates/` 生成一对新章节草稿 |
| `npm run check:facts` | 检查书中每个地址 / 哈希都能在实验原始记录里找到，并扫描是否误含密钥（需本机有 `../web3-sandbox`，可用 `SOURCES_DIR` 指定；找不到时只做密钥扫描） |
| `npm run diagrams` | 重新生成 7 张中英文示意图 SVG（`public/diagrams/`） |
| `npm run appendix` | 从实验记录重新生成附录 A 的地址与交易表 |
| `npm run assets` | 把 `assets/og/*.png.b64` 解码成分享图 PNG（dev / build / preview 前会自动运行，见 CONTRIBUTING.md） |

## 网址配置：SITE_URL 与 BASE

所有绝对网址（canonical、hreflang、sitemap、robots.txt、Open Graph、JSON-LD、llms.txt）都只来自两个环境变量，见 `.env.example`（**只放公开网址，不是秘密**）：

| 变量 | 含义 | 例子 |
| --- | --- | --- |
| `SITE_URL` | 站点源（协议 + 域名，无结尾斜杠） | `https://<用户名>.github.io`、`https://lets-play-web3.pages.dev`、`https://guide.example.com` |
| `BASE` | 站点所在路径前缀 | GitHub 项目页：`/lets-play-web3/`；Cloudflare 或自定义域名：`/` |
| `REPO_URL`（可选） | 公开源码仓库，页脚显示「报告问题」；默认 `https://github.com/cnkang/lets-play-web3` | `https://github.com/cnkang/lets-play-web3` |
| `AUTHOR_NAME`（可选） | 页面署名（JSON-LD 中为 Person）；默认 `Kang` | |

本地覆盖：复制 `.env.example` 为 `.env`（`.env` 已被 Git 忽略）。站内链接全部由 `BASE` 拼出，内容里**没有**写死 `github.io` 或 `pages.dev`。

> ⚠️ **`BASE` 写错或 canonical 过期，会导致样式 / 图片 / 搜索全部 404，搜索引擎也会把流量指向旧地址。** 每次换域名或换托管，都要按下面的「迁移清单」重新构建。

## 部署方式一：GitHub Pages

1. 源码仓库：**https://github.com/cnkang/lets-play-web3**（公开仓库；免费账户使用 GitHub Pages 需要公开仓库）。
2. 本地克隆：
   ```bash
   git clone https://github.com/cnkang/lets-play-web3.git
   ```
3. 仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**。
4. 推送到 `main` 后，`.github/workflows/deploy.yml` 会自动：安装依赖 → 密钥扫描 → 构建 → 发布。它自动设置
   `SITE_URL=https://<所有者>.github.io`、`BASE=/<仓库名>/`、`REPO_URL=<仓库地址>`。
5. 网址：**https://letsplayweb3.liukang.com/**（自定义域名，见 `public/CNAME`）（中文版 `/zh/`，英文版 `/en/`）

使用自定义域名时：在 Pages 设置里填域名，并把工作流里的 `SITE_URL` 改成该域名、`BASE` 改成 `/`。
注意：GitHub **项目页**的 `robots.txt` 位于子路径下，搜索引擎只读取域名根目录的 robots.txt；sitemap 仍可在 Search Console 手动提交。用自定义域名或 Cloudflare 可避免这个限制。

## 部署方式二：Cloudflare Pages

不需要 Cloudflare 适配器，`dist/` 就是普通静态文件。本地开发和预览**不需要** Wrangler。

**Git 集成（推荐）**：Cloudflare 控制台 → Workers & Pages → 创建 → Pages → 连接 Git 仓库，然后设置：

| 设置 | 值 |
| --- | --- |
| Build command | `npm run build` |
| Build output directory | `dist` |
| 环境变量 `NODE_VERSION` | `24` |
| 环境变量 `SITE_URL` | `https://<项目名>.pages.dev`（或自定义域名） |
| 环境变量 `BASE` | `/` |
| 环境变量 `REPO_URL`（可选） | 公开仓库地址 |

**直接上传**：`npm run build` 后执行 `npx wrangler pages deploy dist --project-name lets-play-web3`（`wrangler.toml` 已写好 `pages_build_output_dir = "dist"`）。

Cloudflare Pages 会自动使用 `dist/404.html` 作为真正的 404 页面（不是单页应用回退）。

## 迁移清单（换域名 / 换托管）

1. 修改 `SITE_URL` 和 `BASE`（GitHub 工作流里的 env，或 Cloudflare 的环境变量）。
2. 重新构建并发布（`npm run build`）。
3. 如用自定义域名：配置 DNS（GitHub Pages 用 CNAME 指向 `<用户名>.github.io`；Cloudflare 在 Pages 的 Custom domains 里添加）。
4. 打开任意页面，查看源代码核对：
   - `<link rel="canonical">` 和三条 `hreflang` 指向新地址；
   - `/sitemap.xml` 里的 `<loc>` 是新地址；
   - `/robots.txt` 的 `Sitemap:` 行是新地址；
   - `og:image` 能打开；样式、示意图、搜索正常（没有 404）。
5. 在搜索引擎后台提交新的 sitemap；旧地址如可能，设置 301 跳转到新地址。

## 安全：仓库里不能有秘密

- **不要提交**私钥、助记词、API 密钥、`.env` 文件。`.gitignore` 已忽略 `.env*`（除 `.env.example`）、`.secrets/`、`*.key`、`*.pem`。
- 书中只出现公开的测试网地址和交易哈希；`npm run check:facts` 会扫描疑似密钥，CI 每次构建也会运行。
- 本仓库与实验用的合约仓库 `web3-sandbox` 是分开的；本仓库不包含任何合约密钥或账户私钥。

## 搜索引擎与 AI（SEO / GEO）

每页有独立的标题与描述、canonical、`zh-CN` / `en` / `x-default` hreflang、Open Graph 与 Twitter 卡片（1200×630 图片）、JSON-LD（WebSite、Book、TechArticle + LearningResource、BreadcrumbList，自测题页另有 FAQPage）。另有 `sitemap.xml`、`robots.txt`、`llms.txt` 与 `llms-full.txt`（带快照日期和「仅测试网」说明）。

## 视觉与品牌

- 站名：中文「一起玩 Web3」，英文 Let’s Play Web3；未来公开仓库名建议 `lets-play-web3`。
- 配色：浅色为淡紫白底 + 深靛蓝文字 + 电光紫主色 + 少量珊瑚色点缀；深色为靛黑底 + 同一组强调色。所有颜色在 `src/styles/global.css` 顶部的设计变量里，并标注了对比度。
- 字体：英文与界面用 Plus Jakarta Sans，中文用 Noto Sans SC（均为自托管的 @fontsource 可变字体）。
- 标志：圆角方块里的「播放」三角 + 珊瑚色圆点（`public/favicon.svg`，页眉同款内联 SVG）。
- 分享图：`public/og/{zh,en}.png`（1200×630），源文件由 `npm run diagrams` 生成为 SVG，再用 `scripts/qa/render-og.mjs` 渲染成 PNG。

## 无障碍

目标 **WCAG 2.2 AA**（自评，未经认证）。详见站内「无障碍声明」页和 `BUILD-NOTES.md` 的检查表。

---

## English summary

**Let’s Play Web3** (「一起玩 Web3」) is a bilingual (Simplified Chinese default + English) beginner textbook that explains blockchains with everyday examples and checks every claim against real **Ethereum Sepolia testnet** experiments. Static site built with Astro.

- **Testnet only · $0 budget · test ETH has no value · not financial advice · never import a real seed phrase.** On-chain figures are a snapshot as of 2026-11-12 15:39:55 Singapore time (UTC+8), Sepolia block 12117419. Unofficial personal study notes.
- **Develop:** `npm ci`, `npm run dev` (http://localhost:4321/zh/), `npm run build` → `dist/`, `npm run preview`.
- **URLs:** every absolute URL comes from `SITE_URL` + `BASE` (see `.env.example`; public values only). A wrong `BASE` or stale canonical breaks assets and SEO.
- **Source:** https://github.com/cnkang/lets-play-web3 · **Site:** https://letsplayweb3.liukang.com/ · Compiled by Kang.
- **GitHub Pages:** in the repo, set Settings → Pages → Source to "GitHub Actions", then re-run the workflow. The workflow sets `SITE_URL`/`BASE`/`REPO_URL` automatically.
- **Cloudflare Pages:** build `npm run build`, output `dist`, `NODE_VERSION=24`, `SITE_URL=https://<project>.pages.dev`, `BASE=/`. No adapter; Wrangler is optional (`wrangler.toml` for direct upload).
- **Migration checklist:** change `SITE_URL`/`BASE` → rebuild → point DNS → verify canonical, hreflang, sitemap, robots and assets.
- **Adding content:** a chapter is two MDX files (`src/content/chapters/{zh,en}/<slug>.mdx`) with `part`/`order`/`status` frontmatter; nav, prev/next, sitemap, hreflang, llms.txt, search and JSON-LD update automatically. See CONTRIBUTING.md (Chinese) and `templates/`.
- **No secrets** in this repository: no private keys, seed phrases, API keys or `.env` files.
