# Contributing to Let’s Play Web3

**English** · [简体中文](CONTRIBUTING.zh-CN.md)

Write for someone who can use a computer and browse the web but has never used a blockchain. Explain what a concept helps them understand, use everyday examples, and let them inspect the evidence. Readers must be able to learn without connecting a wallet. Source: [cnkang/lets-play-web3](https://github.com/cnkang/lets-play-web3); compiled by Kang (`AUTHOR_NAME` can override attribution).

Use Sepolia only. Never commit private keys, seed phrases, API keys, `.env` files or private lab logs. Published addresses and hashes need a source in the lab records.

## Add a bilingual chapter

Use Node 24 (`nvm use`), then `npm ci`. Scaffold a draft pair:

```bash
npm run new:chapter -- 20-p1-dex-amm --part p1-defi --order 200
```

This creates `src/content/chapters/zh/20-p1-dex-amm.mdx` and the matching file under `en/`. Alternatively copy `templates/chapter.{zh,en}.mdx` to those paths and remove the introductory comment lines. Slugs use lowercase letters, numbers and hyphens. Keep the same filename in both languages; do not change a published slug, because it changes the URL.

```yaml
---
title: "Approval is not payment"
description: "What an allowance permits, and what it does not do."
navTitle: "10 · Approval is not payment"
part: tokens
order: 100
status: published
updated: "2026-12-01"
---
```

| Field | Rule |
| --- | --- |
| `title`, `description` | Required, meaningful text in each language; used in page headings, search and metadata |
| `navTitle` | Optional short navigation label; otherwise `title` is used |
| `part` | Required ID from `src/content/parts.json`; identical in both files |
| `order` | Required number; identical in both files; multiples of 10 leave room for additions |
| `status` | Keep identical: `published`, `upcoming` or `draft` (omitted means `published`) |
| `updated` | Optional content date used on-page, in sitemap and JSON-LD; use the actual date of the change |
| `snapshot` | Optional chapter-specific chain snapshot, `{ at: "YYYY-MM-DDTHH:MM:SS+08:00", block: N }`; shown in the page header and JSON-LD instead of the book snapshot (Chapter 19 uses it) |

`draft` appears only in development with a noindex banner. `upcoming` needs both files but may have an empty body: it appears without a link in the contents and in the “Coming soon” list in `llms.txt`; it has no page, search entry or sitemap URL. `published` is built and indexed. Chapter 19 records the completed Phase-1 DeFi labs (2026-11-19) with its own snapshot, block 12165973.

Run `npm run dev` and preview **both** `http://localhost:4321/en/` and `http://localhost:4321/zh/`. Change both statuses to `published` only when ready. Search requires `npm run build` followed by `npm run preview`.

The content check and Astro both enforce pairing and shared fields. `ALLOW_UNPAIRED=1` warns and skips unpaired chapters; do not use it for a release. Contents, pagination, routes, sitemap, hreflang, search, `llms.txt` and JSON-LD follow the content automatically.

## Parts and phases

Phases live in `src/content/phases.json`; parts in `src/content/parts.json`. A phase has `id`, `order`, `zh`, `en`; a part also has `phase`, pointing to a phase ID. Contents sort by phase, part and chapter order; empty parts stay hidden. Add both language labels when adding either. Use **Phase-0** for the completed basics, experiments and review, and **Phase-1** for the DeFi labs in Chapter 19.

## Write and illustrate

- Start with the reader’s question, explain the idea, then point to relevant evidence. General principles do not all have an on-chain proof.
- Write natural English and Chinese with the same meaning; do not copy sentence structure mechanically. Explain a new term briefly or mark its first use with `<Term>`.
- Start headings at `##`; the page supplies the H1. Use descriptive link text.
- Give every figure useful `alt` text and a caption that explains the takeaway and key numbers.
- Keep navigation labels like `11 · Title`, `11　标题`, `Appendix A · Title` or `附录 A　标题` so the number column aligns.

### Editing prose (advisory)

Write English prose in short, active sentences. Use the imperative for steps. Put a condition or a warning before the action it applies to. Keep one action in each procedural sentence (20 words or fewer) and one idea in each descriptive sentence (25 words or fewer). Keep approval (the action) separate from allowance (the remaining amount), signing separate from broadcasting, and local tests separate from on-chain results. Use the terms in `src/content/glossary.json` consistently. Rewrite the Chinese edition in natural Chinese, not as a word-for-word copy.

These are editing habits, not a release gate. Never claim ASD-STE100 compliance from word counts or word lists alone. Skip code, addresses, hashes, links and quoted text when you revise prose. A style script, if you use one, is advisory only: it must never block a build or a release.

Example (before → after):

- Before: "Balances do not change; the allowance is only a standing permission, so check it before you approve again and revoke it when you no longer need it."
- After: "Approving does not change any balance. The allowance is only a standing permission. Check the allowance before you approve again. Revoke it when you no longer need it."

Components are available in MDX without imports:

| Component | Use |
| --- | --- |
| `<Lab title="…" goal="…">` | Lab card; optional `network="Sepolia"`, `status="planned"` (default `done`) |
| `<Addr a="…" />`, `<Tx h="…" />` | Public Sepolia address/hash, explorer link and copy button; `short` abbreviates the display |
| `<Callout type="warn" title="…">` | `note`, `warn` or `danger` notice |
| `<Figure name="approve" n="4" alt="…">` | Localised diagram in `public/diagrams/{zh,en}/`, plus caption |
| `<T label="…">` | Accessible scrolling table; leave blank lines around the Markdown table |
| `<SafetyNotice lang="en" />`, `<Snapshot lang="en" />` | Shared safety and historical snapshot text |
| `<Term id="gas">gas</Term>`, `<Glossary lang="en" />` | Term explanation and full glossary |

UI labels follow the page language. Add glossary entries in `src/content/glossary.json` with both `zh` and `en`, each containing `term` and `def`. IDs use lowercase letters, digits and hyphens. An optional `chapter` links to an existing chapter slug. Definitions should be 1–3 plain sentences of general knowledge, without lab-specific hashes or balances.

Mark an ID once per MDX file, preferably its first use. Do not put `<Term>` in headings, links or code. Keep the two editions’ coverage aligned without filling every sentence with `?` buttons. Check Tab → Enter/Space → Esc; native popovers also work without JavaScript in supported browsers. Popover text is excluded from search; Appendix C carries the searchable glossary.

Wrapping is automatic: `src/lib/rehype-no-orphans.mjs` keeps short paragraph endings together and short table cells on one line. Do not insert manual spaces or line breaks. Astro templates can use `<Nw text={...} />`; long addresses can still wrap. See the orphan check in [QA instructions](scripts/qa/README.md).

Diagrams come from `scripts/build_diagrams.py`. Add a function and register it at the end, then run `npm run diagrams`. Check both languages with `diagram-overflow-check.mjs`, including its wide-font pass: aim for zero overlaps/overflow. Split text, enlarge boxes or shorten labels before reducing type below 14px. If OG artwork changes, render with `scripts/qa/render-og.mjs` and run `node scripts/binary-assets.mjs encode`. Committed `assets/og/*.png.b64` are the PNG sources; decoded `public/og/*.png` are ignored and restored automatically before dev/build/preview. This preserves the original text-only publishing workflow.

## Keep evidence and history distinct

Preserve **2026-11-12 15:39:55 UTC+8 / Sepolia block 12117419**. Add later evidence with its own date, network, block, source and scope. Do not replace the global snapshot constants or overwrite a later review with early notes.

- **Principles and analogies** explain ideas; they are not experimental results.
- **On-chain results** identify the network, transaction and target block. A current explorer read may differ from the snapshot. MBox-Burn’s leftover allowance was revoked by D-01.
- **Local tests and simulations** need their own label. UBOX V4 was never deployed to Sepolia and has no broadcast transaction hash.
- **Plans** stay explicit, and Phase-1 results keep their own date and block (Chapter 19: 2026-11-19, block 12165973). Sourcify matched 8/8 addresses, but only 5 were exact; Etherscan was queued at the snapshot. PASS WITH FINDINGS does not mean no vulnerabilities. Use Chapter 15 and the corresponding original evidence.

Appendix A is generated; edit its generator rather than the two MDX tables. When a separately authorised experiment is complete:

1. Append the transaction to §5.2 of the external `实验记录.md`, retaining the existing nonce / account / purpose / status / fee / transaction-link format.
2. Add its block to `blocks` (key: first 10 hash characters), its English purpose to `en_purpose` (optional Chinese wording in `zh_purpose`), and new addresses to `contracts` / `accounts` in `scripts/gen_appendix.py`.
3. Run `P1_SOURCES_DIR=/absolute/path/to/web3-p1a-swap python3 scripts/gen_appendix.py /absolute/path/to/实验记录.md` (without arguments it uses `/workspace/web3-sandbox/实验记录.md` and `/workspace/web3-p1a-swap`), then `SOURCES_DIR=/absolute/path/to/web3-sandbox P1_SOURCES_DIR=/absolute/path/to/web3-p1a-swap npm run check:facts` and `npm run build`. Missing blocks, English labels or the Phase-1 transaction file stop generation with a message that says which folder to set.
4. Add subsequent evidence as dated additions; retain the historical snapshot. Check the generator’s output diff before committing.

Phase-1 (Chapter 19) rows come from `$P1_SOURCES_DIR/out/p19-appendix-txs.json` (account A's transactions from nonce 20 onwards and the faucet transfers, with zh/en labels); Chapter 19 contracts live in `p1_contracts` in the generator. Extend that file and list for later Phase-1 experiments; nonces must start at 20 and have no gaps, and `total_fee_wei` must equal the sum of the rows.

`check:facts` always scans for suspected secrets. Without external source files it skips address/hash provenance; report that skip. Its default source directory is `/workspace/web3-sandbox`. It verifies literal presence, not the semantics of a claim; see [deployment docs](docs/DEPLOYMENT.md).

## Checks before submitting

```bash
npm run check:content
SOURCES_DIR=/absolute/path/to/web3-sandbox P1_SOURCES_DIR=/absolute/path/to/web3-p1a-swap npm run check:facts
SITE_URL=https://letsplayweb3.liukang.com BASE=/ npm run build
SITE_URL=https://letsplayweb3.liukang.com BASE=/ npm run check:build
SITE_URL=https://example.github.io BASE=/lets-play-web3/ npm run build
SITE_URL=https://example.github.io BASE=/lets-play-web3/ npm run check:build
```

Use plain `npm run check:facts` if sources are unavailable, and say that provenance was skipped. Preview both editions and inspect the relevant glossary popovers. For component/style changes run axe, keyboard and orphan checks; diagram changes need diagram-overflow; language changes need lang-check; navigation/navTitle changes need toc-indent. Header, pagination, popovers or shortcut changes also need keyboard-check. Commands and scratch dependencies are in [scripts/qa/README.md](scripts/qa/README.md); do not add those dependencies to the site. The accessibility target is WCAG 2.2 AA, self-assessed.
