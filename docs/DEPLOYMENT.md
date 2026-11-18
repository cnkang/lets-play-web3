# Deployment and configuration

**English** · [简体中文](DEPLOYMENT.zh-CN.md) · [README](../README.md)

The site is static Astro output in `dist/`; no server adapter or wallet service is needed. Use Node 24 (`.nvmrc`) and `npm ci`.

## Public settings

| Variable | Meaning / current default |
| --- | --- |
| `SITE_URL` | Origin without trailing slash. The deployment workflow defaults to `https://letsplayweb3.liukang.com` |
| `BASE` | Leading/trailing-slash path prefix. Current workflow: `/`; GitHub project path example: `/lets-play-web3/` |
| `REPO_URL` | Footer issue link; defaults to `https://github.com/cnkang/lets-play-web3` |
| `AUTHOR_NAME` | Attribution / JSON-LD Person; defaults to `Kang` |

See `.env.example`; local public overrides can go in an ignored `.env`. Absolute metadata URLs use `SITE_URL` + `BASE`: canonical, hreflang, sitemap, robots, OG, JSON-LD and llms links. Internal links/assets use `BASE`. Build again after changing these settings.

Every `npm run build` regenerates `sitemap.xml`, `robots.txt`, `llms.txt`, `llms-full.txt`, and each published chapter's `index.md` from the current content. Adding or editing published chapters requires no manual index update. Set `updated: "YYYY-MM-DD"` in the frontmatter of each translation you materially edit to publish its sitemap `lastmod`. Omit it if the date is unknown. `npm run check:build` verifies that the generated indexes match the built pages.

## GitHub Pages

In Settings → Pages → Build and deployment, choose **GitHub Actions**. Pushes to `main` or manual runs of `.github/workflows/deploy.yml` install dependencies, scan for secrets, check content, build and deploy. External lab provenance is normally skipped in CI because the lab sources are not in this repository.

The workflow uses repository variables `SITE_URL` and `BASE` when set, otherwise **the custom domain and `/`**, not a `github.io` subpath. `public/CNAME` records `letsplayweb3.liukang.com`. Configure the Pages custom domain and its DNS CNAME to the owner’s `github.io` hostname. For project-path hosting, set both variables appropriately and remove/update `public/CNAME` as part of the migration.

### Optional Google Analytics 4

Go to **Settings → Secrets and variables → Actions → Secrets → New repository secret**. Name it `GA4_MEASUREMENT_ID` and enter the `G-…` Measurement ID from your GA4 web stream. Then run **Deploy to GitHub Pages** from the Actions tab or push to `main` to rebuild and publish the site.

The tag records page views on the Chinese and English content pages. The Measurement ID appears in the generated HTML when analytics is enabled. An unset, blank, or invalid value omits the tag. To disable analytics, delete the secret and run the deployment again.

### Optional IndexNow notifications

Generate a random verification key with `openssl rand -hex 16` and save it as the `INDEXNOW_KEY` repository secret under **Settings → Secrets and variables → Actions → Secrets**. The build publishes the verification file at `BASE/<key>.txt` for participating search engines to read. Keep the key value out of Git and Actions logs. Delete the secret and redeploy to disable IndexNow and remove the key file.

After deployment succeeds, the workflow compares sitemap page URLs and their main-content fingerprints with the last successful submission. It sends new, modified and removed URLs in a batch and skips submissions when there are no changes. With no cached submission history, it sends the current sitemap URLs to establish a baseline.

## Cloudflare Pages

Connect the Git repository under Workers & Pages → Pages. Set build command `npm run build`, output directory `dist`, `NODE_VERSION=24`, `SITE_URL=https://<project>.pages.dev` (or the custom domain), `BASE=/`, and optionally `REPO_URL`. Add custom domains in Pages settings.

Wrangler is optional; development and preview do not need it. Direct upload after building: `npx wrangler pages deploy dist --project-name lets-play-web3`. `wrangler.toml` sets `pages_build_output_dir = "dist"`. `dist/404.html` is the real 404 page, not an SPA fallback.

## Migration and build checks

1. Update `SITE_URL` and `BASE` in repository variables / hosting settings; align `public/CNAME` and DNS for a domain change.
2. Build and check with identical settings:
   ```bash
   SITE_URL=https://letsplayweb3.liukang.com BASE=/ npm run build
   SITE_URL=https://letsplayweb3.liukang.com BASE=/ npm run check:build
   SITE_URL=https://example.github.io BASE=/lets-play-web3/ npm run build
   SITE_URL=https://example.github.io BASE=/lets-play-web3/ npm run check:build
   ```
3. Deploy the build for the intended destination. Inspect canonical and all three hreflang links, sitemap `<loc>`, robots `Sitemap:`, OG images, CSS, fonts, diagrams and search. Preview both languages on desktop and mobile.
4. Submit the new sitemap and, where possible, redirect old URLs with HTTP 301. Search engines read robots only at the origin root; a GitHub project-path `robots.txt` cannot control the whole domain. A custom domain avoids that limitation.

The English README does not change `/` language routing or `x-default`. See the README for saved-choice, browser-preference and no-JavaScript behaviour.

## External lab sources

`scripts/check-facts.mjs` defaults to `/workspace/web3-sandbox`. Set `SOURCES_DIR` explicitly for another location. It reads `实验记录.md`, `docs/新手指南-账号凭证与API密钥.md`, and regular files directly in `reports/p0/`. It also reads `WORD_TEXT` if present, otherwise `/tmp/user-record-review.txt`, if that file exists. Do not copy private logs or credentials into this repository.

```bash
SOURCES_DIR=/absolute/path/to/web3-sandbox npm run check:facts
```

If no source files exist, literal address/hash provenance is skipped; suspected-secret scanning still runs. The script does not verify balances, test counts or the meaning of source-verification results. Appendix generation separately takes a notebook path: `python3 scripts/gen_appendix.py /absolute/path/to/实验记录.md`.

`.gitignore` excludes `.env*` except `.env.example`, `.secrets/`, `*.key` and `*.pem`. These exclusions and automated scans are safeguards, not permission to place secrets in public content.
