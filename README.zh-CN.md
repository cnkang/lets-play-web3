# 一起玩 Web3 / Let’s Play Web3

[English](README.md) · **简体中文**

这是一本免费的中英双语区块链入门指南。只要会用电脑、会上网，就可以开始，不需要先懂区块链。

几家店共用积分，为什么有时需要区块链，有时普通数据库就够了？先从这些日常问题出发，再看真实的 Ethereum Sepolia 测试网实验，理解交易、智能合约、代币、授权和升级。打开交易记录，看看实验里实际发生了什么。

**[阅读中文版](https://letsplayweb3.liukang.com/zh/)** · **[从第 1 章开始](https://letsplayweb3.liukang.com/zh/chapters/01-how-to-read/)** · [English site](https://letsplayweb3.liukang.com/en/)

想先看一眼？[到第 8 章看一笔测试网交易](https://letsplayweb3.liukang.com/zh/chapters/08-lab-counter/#inspect-a-transaction)：先看是否成功、有没有代币转账、留下了什么事件。阅读和查询都不需要连接钱包、领币或注册账号。

## 目前能读到什么

- 19 对中英文章，从生活类比讲到 Counter、ERC-20、授权、原子性和可升级合约；附录集中列出地址与交易、凭证说明、术语与自测题。
- **Phase-0 基础实验与复核已结束，Phase-1 DeFi 尚未开始。** 第 19 章是计划说明，没有已完成的 DeFi 实验。
- 链上数字保留 **2026-11-12 15:39:55 UTC+8 / Sepolia 区块 12117419** 的历史快照，不是实时余额。MBox-Burn 剩余授权已在 Phase-0 收尾时撤销；Sourcify 为 8/8 匹配（5 个 `exact_match`、3 个 `match`）；Etherscan 在快照时仍排队。UBOX V4 只做了本地测试与模拟，从未上链。[第 15 章](https://letsplayweb3.liukang.com/zh/chapters/15-evidence-p0/)解释这些证据各能说明什么。
- Phase-0 结论是 **PASS WITH FINDINGS（通过，但有发现）**，不等于「没有漏洞」。这是 Kang 整理的个人学习资料，不是正式审计，也不属于 Ethereum 或 Etherscan 官方出版物。

**仅 Sepolia 测试网 · Phase-0 预算 $0 · 测试币没有市场价值 · 不讨论投资收益。** 永远不要把真实钱包的助记词或私钥导入实验。

GitHub 英文入口不决定网站语言。访问 `/` 时，有 JavaScript 会先用已保存的语言选择，再用浏览器偏好中第一个支持的 `zh` / `en`，都没有则选英文；无 JavaScript 时回退到中文，同时保留两版链接。`/zh/`、`/en/` 本身不会自动跳转。

## 教材授权

《一起玩 Web3》的原创中英文教材、术语解释、自测题与原创教学图示采用 CC BY-NC 4.0；该许可不适用于整个仓库。完整范围、署名方式和商用联系入口见 [LICENSING.md](LICENSING.md)。

## 本地开发

按 [`.nvmrc`](.nvmrc) 使用 Node 24 和仓库内的 npm lockfile（最低支持 Node 22.23.4）。

```bash
git clone https://github.com/cnkang/lets-play-web3.git
cd lets-play-web3
nvm use
npm ci
npm run dev       # http://localhost:4321/zh/
npm run build     # 生成 dist/ 和 Pagefind 搜索索引
npm run preview   # 预览构建结果
```

开发服务器没有搜索索引；试搜索请先 build 再 preview。网站由 Astro 生成静态文件，阅读不需要连接钱包。

| 命令 | 用途 |
| --- | --- |
| `npm run check:content` | 检查中英章节配对、frontmatter 和术语；构建前也会自动运行 |
| `npm run check:facts` | 在可用实验记录里查找地址与哈希；始终扫描疑似密钥 |
| `npm run check:build` | 用与构建相同的 `SITE_URL`、`BASE` 检查站内链接、资源和语言/SEO 网址 |
| `npm run new:chapter -- <slug> --part <id> --order <数字>` | 生成一对 MDX 草稿 |
| `npm run diagrams` | 重生成 7 张双语 SVG 示意图和 OG SVG 源文件 |
| `npm run appendix` | 从外部实验记录重生成附录 A，详见贡献指南 |
| `npm run assets` | 解码 OG `.png.b64`；dev / build / preview 前自动运行 |

`check:facts` 默认读取 **`/workspace/web3-sandbox`**，不会默认找相邻目录。请显式指定本机来源：

```bash
SOURCES_DIR=/absolute/path/to/web3-sandbox npm run check:facts
```

找不到来源时，地址/哈希检查会**跳过**；密钥扫描通过不代表实验结论已核实。脚本只核对字面出处，不会判断余额、测试结论和验证状态的含义。读取哪些文件、如何配置环境变量，见[部署文档](docs/DEPLOYMENT.zh-CN.md)。

## 贡献与部署

先看 **[中文贡献指南](CONTRIBUTING.zh-CN.md)**（[English](CONTRIBUTING.md)）：添加一对 MDX、预览两种语言、保留历史证据，再运行检查。不要提交私钥、助记词、API 密钥或 `.env`。

- **[部署文档](docs/DEPLOYMENT.zh-CN.md)**（[English](docs/DEPLOYMENT.md)）：GitHub Pages、Cloudflare Pages、网址变量和迁移清单。现有工作流默认使用 `https://letsplayweb3.liukang.com`、`BASE=/`。
- **[GitHub About / Website / Topics 命令](docs/GITHUB-METADATA.md)**：独立于 Git diff，不涉及 Git tag 或 Release。
- **[BUILD-NOTES.md](BUILD-NOTES.md)**：有日期的工程历史与旧检查结果；[QA 脚本说明](scripts/qa/README.md)涵盖无障碍、键盘、语言分流和布局。
- **[原始实验证据](docs/evidence/README.zh-CN.md)**（[English](docs/evidence/README.md)）：保留源文件行号和校验值的实验记录节选，已与所有者提供的压缩包核对。

网站以 WCAG 2.2 AA 为目标（自评，未经认证），提供双语元数据、canonical/hreflang、sitemap、robots、`llms.txt` 和 `llms-full.txt`。视觉系统使用自托管 Plus Jakarta Sans / Noto Sans SC、播放按钮标志和明暗主题；设计变量在 `src/styles/global.css`，分享图 PNG 的文本源文件在 `assets/og/`。
