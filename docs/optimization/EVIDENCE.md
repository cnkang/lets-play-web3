# Evidence from the 2026-11-25 implementation run

Commands were run on the feature branch in this workspace. A skip is not a pass.

## Unit tests

`node --test scripts/test/*.test.mjs` (also `npm test`): 24 tests, 24 passed, 0 failed.

Pinned results include:

- Uniswap v2 integer example: reserves 100,000 / 100,000, input 1,000, fee 30 bps, output 987.
- The 30 bps formula matches `amountIn * 997` for the inputs covered by the test.
- SHA-256("abc") is `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`, matching Node’s crypto and Web Crypto.
- A stale hash pass does not replace a newer pass.
- Learning events reject unknown ids and do not keep a wallet string that was passed beside the allowed fields.

## Build and static checks

- `npm run build` then `npm run check:build` with the default local origin: 82 HTML pages, 6,998 local references, canonical, hreflang, JSON-LD, sitemap, robots, and llms links OK. `BASE=/`.
- The same pair with `SITE_URL=https://example.github.io` and `BASE=/lets-play-web3/`: the same page and reference counts, `BASE=/lets-play-web3/`.
- `npm run check:content`: 19 chapters + 3 appendices × 2 languages OK.
- `npm run check:facts`: secret scan found none. Historical provenance was **skipped** because `SOURCES_DIR` / `P1_SOURCES_DIR` are not in this workspace. Not a pass for Phase-0 or Phase-1 claims. The committed P2 digest was checked as a fixture only.
- `npm run check:evidence`: **skipped** because `P2_EVIDENCE_DIR` is unset. Not a pass.
- No ESLint, Prettier, or `astro check` script exists. Those commands were not run.

## Browser

`scripts/qa/labs-check.mjs` with Chrome and puppeteer-core, against `http://127.0.0.1:4399` serving `dist/`:

- Homepage paths `start`, `play`, and `ai` at 1280 and 390.
- English allowance lab: keyboard approve leaves the holder at 1,000; spend then revoke leaves 400 with the spender; `1.5` shows an error; `?events=local` records `lab_start` and `lab_complete` and does not call `gtag`; the log does not contain the typed amount.
- Chinese allowance lab: unlimited approval stays unlimited after a spend, and the balance does move.
- Pool lab: large-trade price impact differs from the small trade; changing slippage does not change the estimated output; a prior trade with a 10 bps tolerance refuses execution and leaves the quoted estimate in place; reset clears the quote.
- Hash lab: tamper breaks the check; recalculating forward changes the head and the status text says this is not consensus. Chinese page reaches a chain-head status.
- AI page: five prompts; a successful copy records `prompt_copy` without the prompt body.
- No horizontal overflow on the checked pages at 390 CSS pixels after the event-log wrap fix.

Screenshots from that run: `home-en-1280.png`, `home-en-390.png`, `erc20-en-1280.png`, `erc20-en-390.png`, `erc20-zh-390.png`, `amm-en-1280.png`, `hash-en-1280.png`, `hash-en-390.png`. The AMM shot is after Reset, so the quote table is empty; the assertions above ran before Reset.

## Lighthouse lab data

These are lab runs, not field data. PageSpeed Insights returned HTTP 429, so CrUX field data was not read.

| Page | Environment | Performance | Accessibility | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Current production `/en/` | GitHub Pages, mobile, Lighthouse 12.6.1 | 0.95 | 1 | 1 | 2.7 s | 0.001 | 100 ms |
| This branch `/en/` | local `python http.server`, mobile | 0.84 | 1 | 1 | 3.5 s | 0.007 | 0 ms |
| This branch allowance lab | local `python http.server`, desktop | 1 | 1 | not requested | 0.7 s | 0 | 0 ms |

Do not treat the local homepage as a regression against production. The servers, caches, and page weight differ, and this branch is not deployed. A production after-score needs the owner’s deploy.

## Deployment

Feature-branch push and a pull request do not match `.github/workflows/deploy.yml`, which deploys only on a push to `main` or a manual run. This run did not push `main`.
