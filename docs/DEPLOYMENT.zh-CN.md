# 部署与配置

[English](DEPLOYMENT.md) · **简体中文** · [README](../README.zh-CN.md)

Astro 构建结果是 `dist/` 中的静态文件，不需要服务端适配器或钱包服务。按 `.nvmrc` 使用 Node 24，运行 `npm ci`。

## 公开配置

| 变量 | 含义 / 当前默认值 |
| --- | --- |
| `SITE_URL` | 协议和域名，不带结尾斜杠；部署工作流默认 `https://letsplayweb3.liukang.com` |
| `BASE` | 带前后斜杠的路径前缀；当前工作流默认 `/`，GitHub 项目页示例为 `/lets-play-web3/` |
| `REPO_URL` | 页脚报告问题链接；默认 `https://github.com/cnkang/lets-play-web3` |
| `AUTHOR_NAME` | 页面署名及 JSON-LD Person；默认 `Kang` |

见 `.env.example`；本地公开配置可以放在被忽略的 `.env`。canonical、hreflang、sitemap、robots、OG、JSON-LD 和 llms 绝对网址由 `SITE_URL` + `BASE` 生成；站内链接与资源使用 `BASE`。配置变动后必须重新构建。

## GitHub Pages

Settings → Pages → Build and deployment 选 **GitHub Actions**。推送 `main` 或手动运行 `.github/workflows/deploy.yml`，会安装依赖、扫描疑似密钥、检查内容、构建并部署。CI 没有外部实验来源，通常会跳过地址/哈希出处核对。

工作流优先使用仓库变量 `SITE_URL`、`BASE`，否则使用**自定义域名和 `/`**，并非一律使用 `github.io` 子路径。`public/CNAME` 记录 `letsplayweb3.liukang.com`。在 Pages 配置自定义域名，DNS CNAME 指向所有者的 `github.io` 域名。改为项目子路径时，设置相应的两个变量，同时移除或调整 `public/CNAME`。

### 可选的 Google Analytics 4

打开 **Settings → Secrets and variables → Actions → Secrets → New repository secret**，名称填写 `GA4_MEASUREMENT_ID`，值填写 GA4 网站数据流的 `G-…` 衡量 ID。保存后，在 Actions 中运行 **Deploy to GitHub Pages**，或推送到 `main` 重新构建并发布。

启用后，标签会统计中英文内容页的浏览量，衡量 ID 会出现在生成的 HTML 中。未设置、留空或格式有误时，页面不会包含 GA4 标签。要关闭统计，删除该 secret 并重新部署。

## Cloudflare Pages

在 Workers & Pages → Pages 连接 Git 仓库。构建命令 `npm run build`，输出目录 `dist`，`NODE_VERSION=24`，`SITE_URL=https://<项目名>.pages.dev`（或自定义域名），`BASE=/`，可选 `REPO_URL`。自定义域名在 Pages 设置中添加。

本地开发和预览不需要 Wrangler。直接上传可在构建后运行 `npx wrangler pages deploy dist --project-name lets-play-web3`；`wrangler.toml` 已设置 `pages_build_output_dir = "dist"`。`dist/404.html` 是真正的 404 页面，不是单页应用回退。

## 迁移与检查

1. 在仓库变量或托管平台修改 `SITE_URL`、`BASE`；换域名时同步调整 `public/CNAME` 和 DNS。
2. 用一致的配置构建并检查：
   ```bash
   SITE_URL=https://letsplayweb3.liukang.com BASE=/ npm run build
   SITE_URL=https://letsplayweb3.liukang.com BASE=/ npm run check:build
   SITE_URL=https://example.github.io BASE=/lets-play-web3/ npm run build
   SITE_URL=https://example.github.io BASE=/lets-play-web3/ npm run check:build
   ```
3. 发布目标地址对应的构建。查看 canonical、三条 hreflang、sitemap `<loc>`、robots `Sitemap:`、OG 图片、CSS、字体、示意图和搜索；在桌面和手机预览两种语言。
4. 向搜索引擎提交新 sitemap；条件允许时让旧网址 301 跳转。搜索引擎只读取域名根目录的 robots；GitHub 项目子路径里的文件无法控制整个域名，自定义域名可避免此限制。

英文 README 不会改变 `/` 的语言分流和 `x-default`。保存偏好、浏览器偏好、无 JavaScript 回退的顺序见 README。

## 外部实验来源

`scripts/check-facts.mjs` 默认使用 `/workspace/web3-sandbox`，本机其他位置请显式设置 `SOURCES_DIR`。脚本读取 `实验记录.md`、`docs/新手指南-账号凭证与API密钥.md`、`reports/p0/` 直接包含的普通文件；还会在文件存在时读取 `WORD_TEXT` 指定的文件，未设置时尝试 `/tmp/user-record-review.txt`。不要把私有日志或凭证复制进本站仓库。

```bash
SOURCES_DIR=/absolute/path/to/web3-sandbox npm run check:facts
```

没有来源文件时跳过地址/哈希字面出处检查，但始终扫描疑似密钥。脚本不会核实余额、测试次数或源码验证结论的含义。附录生成器另行接受记录路径：`python3 scripts/gen_appendix.py /absolute/path/to/实验记录.md`。

`.gitignore` 忽略 `.env*`（除 `.env.example`）、`.secrets/`、`*.key`、`*.pem`。这些规则和自动扫描只是防护，不能替代提交前检查。
