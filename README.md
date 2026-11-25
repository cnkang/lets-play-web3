# Let’s Play Web3 / 一起玩 Web3

**English** · [简体中文](README.zh-CN.md)

A free, bilingual guide to blockchains for beginners, with hands-on labs on Ethereum’s Sepolia testnet. If you can use a computer and browse the web, you have enough background to start.

Learn when a shared blockchain helps and when an ordinary database is enough. Then follow real experiments to understand transactions, smart contracts, tokens, approvals and upgrades. Open the transaction records to see what actually happened.

**[Read the English guide](https://letsplayweb3.liukang.com/en/)** · **[Start with Chapter 1](https://letsplayweb3.liukang.com/en/chapters/01-how-to-read/)** · [中文站](https://letsplayweb3.liukang.com/zh/)

Don’t just read about Web3. Play with it. Three browser labs need no wallet and no real money: [allowances](https://letsplayweb3.liukang.com/en/labs/erc20-allowance/), [a constant-product pool](https://letsplayweb3.liukang.com/en/labs/constant-product-amm/), and a [SHA-256 hash chain](https://letsplayweb3.liukang.com/en/labs/hash-chain/). They are simulations. The recorded experiments in the chapters stay the evidence. [Question guides](https://letsplayweb3.liukang.com/en/guides/) and [prompts for an AI agent](https://letsplayweb3.liukang.com/en/learn-with-ai/) start from those same boundaries.

Prefer to look first? [Inspect a testnet transaction in Chapter 8](https://letsplayweb3.liukang.com/en/chapters/08-lab-counter/#inspect-a-transaction). Check its status, whether tokens moved, and the event it recorded. Reading needs no wallet connection, faucet or account.

## What is ready

- 19 numbered chapters in English and Simplified Chinese, followed by 3 unnumbered appendices covering addresses, transactions, credentials guidance, the glossary and a self-check.
- **Phase-0 basics, experiments and review are complete. The Phase-1 DeFi labs ran on Sepolia on 2026-11-19.** Chapter 16 records them (swaps, arbitrage, v2 and v3 liquidity) with its own snapshot, block 12165973. Test tokens have no real value.
- **Chapters 17–19 are later local labs, not new Sepolia broadcasts.** Chapters 17 and 18 write on a local Anvil fork of block 12165973 (lending, liquidation, flash loans). Chapter 19 is a fully local price-source comparison with no fork. Local hashes are not Sepolia transactions. Test-token marks are not income.
- On-chain figures preserve the historical snapshot **2026-11-12 15:39:55 UTC+8 / Sepolia block 12117419**, except Chapter 16, which states its own (2026-11-19 / block 12165973). MBox-Burn’s leftover allowance was revoked during the Phase-0 wrap-up. Sourcify matched 8/8 addresses (5 `exact_match`, 3 `match`); Etherscan was still queued at the snapshot. UBOX V4 was tested and simulated locally, never deployed on-chain. [Chapter 15](https://letsplayweb3.liukang.com/en/chapters/15-evidence-p0/) explains the evidence and limits.
- The Phase-0 review concluded **PASS WITH FINDINGS**, not “no vulnerabilities”. This is personal learning material compiled by Kang, not a professional audit or an official Ethereum/Etherscan publication.

**Sepolia only · Phase-0 budget $0 · test coins have no market value · no investment guidance.** Never import a real wallet’s seed phrase or private key into a lab.

GitHub’s English entry does not set the website language. At `/`, JavaScript uses a saved language choice first, then the first supported `zh`/`en` browser preference, then English. Without JavaScript it falls back to Chinese, with links to both editions. `/zh/` and `/en/` never redirect automatically.

## Licensing / 教材授权

The original bilingual teaching material, term explanations, self-check questions and original teaching diagrams are licensed under CC BY-NC 4.0; this does not license the repository as a whole. See [LICENSING.md](LICENSING.md) for the scope, attribution and commercial contact.

## Local development

Use Node 24 from [`.nvmrc`](.nvmrc) and the committed npm lockfile (minimum supported Node: 22.23.4).

```bash
git clone https://github.com/cnkang/lets-play-web3.git
cd lets-play-web3
nvm use
npm ci
npm run dev       # http://localhost:4321/en/
npm run build     # dist/ + Pagefind search index
npm run preview   # preview the built site
```

Search needs a build; it is unavailable in the development server. The site is static Astro, with no wallet connection required.

| Command | Purpose |
| --- | --- |
| `npm test` | Run the dependency-free unit tests for the browser labs and learning events |
| `npm run check:content` | Check bilingual chapter pairs, frontmatter and glossary usage; also runs before builds |
| `npm run check:facts` | Look for addresses/hashes in available lab sources; always run the secret scan |
| `npm run check:build` | Check built internal links, assets and language/SEO URLs with the same `SITE_URL` and `BASE` as the build |
| `npm run new:chapter -- <slug> --part <id> --order <n>` | Scaffold a draft MDX pair |
| `npm run diagrams` | Regenerate the seven bilingual SVG diagrams and OG SVG sources |
| `npm run appendix` | Regenerate Appendix A from the external lab notebook; see the contribution guide |
| `npm run assets` | Decode the committed OG `.png.b64` sources; automatic before dev/build/preview |

`check:facts` defaults to **`/workspace/web3-sandbox`**, not a sibling directory. Point it explicitly at your own lab sources:

```bash
SOURCES_DIR=/absolute/path/to/web3-sandbox P1_SOURCES_DIR=/absolute/path/to/web3-p1a-swap npm run check:facts
```

If no sources are available, the address/hash check is **skipped**; a passing secret scan does not validate experimental claims. The script checks literal provenance, not the meaning of a balance, test result or verification status. See [deployment and configuration](docs/DEPLOYMENT.md) for source-file selection and environment variables.

## Contribute and deploy

Start with **[CONTRIBUTING.md](CONTRIBUTING.md)** ([中文](CONTRIBUTING.zh-CN.md)): add a pair of MDX files, preview both languages, preserve historical evidence, and run checks. Keep private keys, seed phrases, API keys and `.env` files out of this repository.

- **[Deployment guide](docs/DEPLOYMENT.md)** ([中文](docs/DEPLOYMENT.zh-CN.md)): GitHub Pages, Cloudflare Pages, URL settings and migration checklist. The current workflow defaults to `https://letsplayweb3.liukang.com` and `BASE=/`.
- **[GitHub About / Website / Topics commands](docs/GITHUB-METADATA.md)**: separate from Git changes; no Git tags or Releases.
- **[BUILD-NOTES.md](BUILD-NOTES.md)**: dated engineering history and previous checks. [QA scripts](scripts/qa/README.md) cover accessibility, keyboard use, language routing and layout.
- **[Original lab evidence](docs/evidence/README.md)** ([中文](docs/evidence/README.zh-CN.md)): selected notebook sections with source ranges and checksum, checked against the owner-supplied archive.

The site aims for WCAG 2.2 AA (self-assessed, not certified). It includes bilingual metadata, canonical/hreflang links, sitemap, robots, `llms.txt` and `llms-full.txt`. The visual system uses self-hosted Plus Jakarta Sans and Noto Sans SC, a play-button mark, and light/dark themes; design tokens live in `src/styles/global.css`. OG PNG sources are stored as text in `assets/og/`.
