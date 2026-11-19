# BUILD-NOTES

Build log and acceptance notes for **「一起玩 Web3」 / Let’s Play Web3** (Astro static site; working title until 2026-11-16: “Web3 Sandbox Guide”). Times are Asia/Singapore (UTC+8). Public repository: `cnkang/lets-play-web3`.

This file preserves dated engineering history, including old terminology and test results. Current instructions: [README](README.md), [中文 README](README.zh-CN.md), [deployment](docs/DEPLOYMENT.md) / [中文部署](docs/DEPLOYMENT.zh-CN.md), and [contributing](CONTRIBUTING.md) / [中文贡献](CONTRIBUTING.zh-CN.md). Reader-facing phase names are now **Phase-0** (basics, labs and review) and **Phase-1** (DeFi, not started).

## Commands

Current source directory default: `/workspace/web3-sandbox`. Use `SOURCES_DIR=/absolute/path/to/web3-sandbox npm run check:facts` for another location. The deployment workflow defaults to the custom domain and `BASE=/`; the project-path command below is an additional compatibility check.

```bash
npm ci
npm run dev            # http://localhost:4321/zh/   (search needs a build)
npm run build          # check-content → astro build → pagefind  → dist/ (46 HTML pages)
npm run check:content  # every chapter has zh + en with the same slug; frontmatter valid
npm run new:chapter -- <slug> --part <id> --order <n>   # scaffold a draft pair from templates/
npm run preview        # http://localhost:4321/zh/
npm run check:facts    # secret scan always; provenance skipped without external lab sources
npm run assets         # decode assets/og/*.png.b64 → *.png (automatic before dev/build/preview)
npm run diagrams       # regenerate public/diagrams/{zh,en}/*.svg and public/og/*.svg (PNG: scripts/qa/render-og.mjs)
npm run appendix       # regenerate Appendix A tables from 实验记录.md

# Project-Pages-style build check
BASE=/lets-play-web3/ SITE_URL=https://example.github.io npm run build
```

- Preview URL (local): **http://localhost:4321/zh/** (English: http://localhost:4321/en/)
- Toolchain used: Node 24.22.1, Astro 7.4.11, @astrojs/mdx 8.1.5, Pagefind 1.6.0, @fontsource-variable/plus-jakarta-sans 5.3, @fontsource-variable/noto-sans-sc 5.3. `engines.node >= 22.23.4` (Astro 7's minimum).
- Build result (2026-11-13): **pass**. 46 pages; Pagefind indexed 38 chapter pages in 2 languages. Also passes with `BASE=/lets-play-web3/`: all asset, link, canonical, hreflang, OG, sitemap and robots URLs carry the base.
- `npm run check:facts`: 211 hex values checked against 20 source files — all found; no secrets.
- Re-run 2026-11-16 after the rebrand: build pass (46 pages, 38 indexed); also with `BASE=/lets-play-web3/ SITE_URL=https://example.github.io` (canonical, 3 hreflang, OG, JSON-LD, 42 sitemap URLs, robots `Sitemap:`, CSS/font/diagram URLs all carry the base). `check:facts`: 211 hex values against 19 source files (the optional Word-review text in /tmp was not present) — all found; no secrets.

## Rebrand and visual refresh (2026-11-16)

- **Name**: 「一起玩 Web3」 (zh) / **Let’s Play Web3** (en), chosen by the owner (「一起学」 was felt too serious). Applied to header wordmark, footer/byline (default author “Kang” since 2026-11-17, a schema.org Person; `AUTHOR_NAME` overrides), `<title>`, OG/Twitter, JSON-LD WebSite/Book/`workTranslation`/BreadcrumbList, root page, 404, search description, llms.txt/llms-full.txt, README, package.json (`lets-play-web3`), OG images. Chapter facts and experiment data unchanged.
- **Palette** (tokens at the top of `src/styles/global.css`, ratios vs paper): light — paper `#f6f5fe`, ink `#1a1540` (15.8:1), ink-2 `#3b3666` (10.2), ink-3 `#55507e` (6.9), brand violet `#5a2be0` (6.8; white on brand 7.4), brand-strong `#4218c2`, coral text `#b13d1c` (5.5), decorative coral `#ff7a59` (never text), mint-teal `#0d6656`, focus ring magenta `#c0266d`. Dark — paper `#100d22`, ink `#eeedff`, brand `#ab9bff` (8.0; dark text on brand 8.0), coral `#ff9f80`, teal `#6fdcc0`, focus `#ffb3d0`. All text tokens ≥ 4.5:1 on every surface tint in both themes; UI boundaries ≥ 3:1.
- **Type**: Plus Jakarta Sans (Latin/UI/headings) + Noto Sans SC (Chinese), self-hosted variable fonts with unicode-range subsets; serif fonts removed. Prose 17 px / line-height 1.9 (zh), 17.4 px / 1.75 (en), 70ch measure.
- **Shape**: 16/24 px radii, pill buttons and nav, soft violet-tinted shadows, gradient h2 accent bar, product-style wordmark (“一起玩 **Web3**”) with a 32 px rounded-square “play” mark + coral dot (also `favicon.svg`), stays crisp at 16 px.
- **Home hero**: flat tinted band (so text contrast is measurable — axe reports 0 incomplete items); soft glows and abstract shapes only appear ≥ 1200 px and only in the margins / behind the diagram, never behind text. Motion (hover lift) is disabled under `prefers-reduced-motion`.
- **Diagrams** retinted to the new palette (colour values only; a script diff confirmed that only `#rrggbb` values changed in all 14 SVGs). OG PNGs (1200×630, zh/en) redrawn with the new name and colours.
- Fixed in passing: `.prose p/ul/ol { margin:0 }` was overriding paragraph spacing (now `:where()`); the coarse-pointer 44 px rule for copy buttons was losing to `.chip .copy-btn` (now 44 px on touch, verified with touch emulation).

## Content model: adding chapters without code changes (2026-11-16)

- Chapters are content-collection files `src/content/chapters/{zh,en}/<slug>.mdx` (same slug in both). Frontmatter: `title`, `description`, `navTitle?`, `part`, `order`, `status` (`published` | `upcoming` | `draft`), `updated?`.
- Parts: `src/content/parts.json` (id, order, phase, zh, en). Phases: `src/content/phases.json` (P0 basics, P1 DeFi; add P2 … as needed). Contents show a phase tag when there is more than one phase.
- `src/data/chapters.ts#getBook()` is the single source for contents, prev/next, chapter routes, sitemap (with `updated` → `lastmod`), hreflang, llms.txt/llms-full.txt, JSON-LD (`dateModified`). Pagefind indexes whatever pages are built.
- `upcoming`: listed in the contents as “即将推出 / Coming soon” (not a link), no page, not in sitemap/search; listed under “Coming soon” in llms.txt. `draft`: only in `astro dev` (noindex + banner); excluded from production builds.
- Pairing check: `scripts/check-content.mjs` runs first in `npm run build` (and in CI) and fails with the exact missing file; the same rules are enforced again inside Astro. `ALLOW_UNPAIRED=1` downgrades to a warning and skips the unpaired chapter. Tested: zh-only file → clear failure; upcoming pair → “coming soon”, no page/sitemap entry; draft pair → absent from build.
- Components available in every chapter without imports: `Lab` (new experiment box), `Addr`, `Tx`, `Callout`, `Figure`, `T`, `SafetyNotice`, `Snapshot`, `Quiz`.
- Templates: `templates/chapter.{zh,en}.mdx`; scaffold with `npm run new:chapter`. English guide: `CONTRIBUTING.md`; Chinese guide: `CONTRIBUTING.zh-CN.md` (adding chapters, parts/phases, statuses, components, appending experiments to Appendix A, diagrams, pre-commit checklist).
- `scripts/gen_appendix.py` now writes the new frontmatter, documents how to append experiments, and stops with a list of missing block numbers / English labels instead of a bare assert (output verified byte-identical to the committed appendix).

## Glossary popovers for beginners (2026-11-17)

Goal: a reader who can use a computer but has never touched a blockchain can read every chapter. Two layers:

1. **In-line plain words** for the hardest sentences (safety notice, home hero, Chapter 1, testnet in Chapter 2, overflow/sentinel in 14, severity levels / metadata / Handler / Slither in 15, calldata in 13). A beginner gets the gist without opening anything. No fact, number, hash or address changed.
2. **`<Term id="…">word</Term>`** marks the first use of a jargon term per page; it renders the word plus a small「?」button that opens a plain-language explanation.

**Single source**: `src/content/glossary.json` — 90 terms, each `{ chapter?, zh: { term, def }, en: { term, def } }`. `src/components/Term.astro` reads it; `src/components/Glossary.astro` renders the full list in Appendix C (chapter 18, "完整术语表 / Full glossary", `id="g-<term>"` anchors). `scripts/check-content.mjs` (run by `npm run build`) fails if a term lacks a language, a `chapter` slug does not exist, a used id is unknown, an id is marked twice in one MDX file, or a `<Term>` sits in a heading, link text or code fence. `Term.astro` also throws at build time for an unknown id.

**Usage**: 512 `<Term>` uses across the chapters (zh + en; every chapter except Appendix C, which carries the full list instead) plus 18 in `SafetyNotice` (shown on the home page and in Chapter 1); zh and en mark the same ids per chapter except Chapter 14 (zh "无限授权" → `approve`, en "infinite allowance" → `allowance`). Appendix A's marks are emitted by `scripts/gen_appendix.py` (the generator was updated, then re-run; only the `<Term>` lines changed).

**Mechanism — native HTML popover, progressively enhanced**

```html
<span class="term"><span class="term-text">Sepolia</span>&#8288;<button class="term-btn" popovertarget="term-sepolia-1" aria-controls="term-sepolia-1" aria-label="什么是Sepolia？">?</button><span id="term-sepolia-1" popover="auto" class="term-pop" tabindex="-1" data-pagefind-ignore>…title, × close (popovertargetaction="hide"), explanation, optional chapter link…</span></span>
```

- **No JS needed** for open (click / tap / Enter / Space), close on **Esc**, close on **outside click** (light dismiss), and only one open at a time (`popover="auto"`). Verified with JavaScript disabled in Chrome.
- The popover is the button's **next DOM sibling**, so reading order and Tab order go「?」→ × → chapter link → rest of the page. No focus trap, focus does not jump.
- **BaseLayout script adds**: `aria-expanded` kept in sync via the `toggle` event (without JS, Chrome/Safari expose the expanded state of popover invokers natively); placement next to the button on screens ≥ 40rem (flips above if there is no room, clamped 12px inside the viewport, follows scroll); **close when keyboard focus moves elsewhere** (`focusout` with a `relatedTarget` outside the term — window blur is ignored); on narrow screens the page scrolls so the「?」button stays visible above the sheet (2.4.11).
- **Layout**: ≥ 40rem a 24rem card (`--card`, `--rule-strong` border, `--radius-lg`, shadow); < 40rem a full-width **bottom sheet** (max 60vh, safe-area padding). Without JS the card is centred in the viewport.
- **Old browsers without the popover API**: with JS, a class-based fallback (`.is-open`, same keys and outside click); without JS, `@supports not selector(:popover-open)` shows the explanation inline as a small tinted note, so it is never unreachable.
- **Target size**: the button box is 24×24 CSS px (2.5.8) with negative block margins so the line box does not grow; the visible dot is 18px; `(pointer: coarse)` adds a transparent `::before` that extends the hit area to 44×44. Close button 36×36.
- **Focus** uses the global `--focus` ring (3px, magenta light / pink dark). **Contrast** (computed): popover title 9.8:1 light / 10.8:1 dark, body 11.0 / 11.3, link 7.4 / 7.7, "?" glyph on its tint 8.1 / 8.5, dot border vs page 6.8 / 8.0 (6.6 on the amber safety box), popover border 3.9 / 4.6. `forced-colors` keeps borders visible.
- **Motion**: 160ms fade/slide via `@starting-style`; off under `prefers-reduced-motion` (plus the global reduced-motion rule).
- **Search**: the「?」button and popover carry `data-pagefind-ignore`, so explanations do not pollute every page's search result; the full glossary in Appendix C is indexed (searching a term lands there). `llms-full.txt` strips the tag and keeps the word.
- Accessible names: zh「什么是X？」, en "What is “X”?"; close button「关闭「X」的解释」/ "Close the explanation of “X”".

**QA (2026-11-17, Chrome 156 headless)**: `scripts/qa/axe-check.mjs` 96 runs → 0 violations, 0 incomplete contrast; `scripts/qa/term-check.mjs` → keyboard (Tab to「?」, Enter/Space open + `aria-expanded=true`, Tab into × and link, Tab out closes, Esc closes and keeps focus on「?」), outside click closes, min target 24px, popover inside the viewport at 1280, bottom sheet inside 320/390 px with the button visible and no horizontal scroll, no-JS open/Esc works, axe with a popover **open** in light/dark × 1280/375 → 0 violations (contrast "incomplete" items there are axe's `bgOverlap` on top-layer text; ratios computed above).

## How SITE_URL and BASE work

- `astro.config.mjs` reads `SITE_URL` → Astro `site` and `BASE` → Astro `base` (normalised to `/x/` or `/`), after loading an optional local `.env` (git-ignored). Defaults: `http://localhost:4321` and `/`.
- `src/data/site.ts`: `href(path)` = BASE + path (for in-site links and assets); `absolute(path)` = SITE_URL + BASE + path (canonical, hreflang, OG, JSON-LD, sitemap, robots, llms.txt).
- `trailingSlash: 'always'`, `build.format: 'directory'`: every page URL ends with `/`.
- The GitHub workflow sets `SITE_URL=https://<owner>.github.io`, `BASE=/<repo>/`, `REPO_URL`. Cloudflare Pages: set `SITE_URL=https://<project>.pages.dev`, `BASE=/` in project env vars.
- No `github.io` / `pages.dev` host is hard-coded in content (only in docs/examples).

## SEO / GEO artifacts

| Artifact | Where |
| --- | --- |
| Unique `<title>` + meta description per page, in the page's language | chapter frontmatter / page props |
| `<html lang="zh-CN|en" dir="ltr">`, one `<h1>` per page | BaseLayout |
| canonical; hreflang `zh-CN`, `en`, `x-default`(→ zh) on every paired page | BaseLayout (omitted on noindex pages) |
| Open Graph + Twitter card, `og:locale` + `og:locale:alternate`, 1200×630 PNG | `public/og/{zh,en}.png` |
| JSON-LD: WebSite (+SearchAction) and Book on home; TechArticle+LearningResource and BreadcrumbList on chapters; FAQPage on Appendix C (quiz); all with `inLanguage` | pages |
| `sitemap.xml` with `xhtml:link` alternates (home, 19 chapters, accessibility × 2 langs = 42 URLs) | `src/pages/sitemap.xml.ts` |
| `robots.txt` with `Sitemap:` from SITE_URL | `src/pages/robots.txt.ts` |
| `llms.txt` (index) and `llms-full.txt` (plain text of every chapter), with snapshot date, testnet-only caveat, Etherscan "Pending", Sourcify 5+3, V4 local-only | `src/data/llms.ts` |
| Real `404.html` (bilingual, noindex), not an SPA fallback | `src/pages/404.astro` |
| Search page is `noindex` and excluded from the sitemap | `search.astro` |
| Visible attribution, publish date and snapshot on every chapter; FAQ in real HTML (`<details>`); no ratings; "not affiliated" footer | layout / chapter page |
| Root `/` picks an edition by saved choice / browser language (see below); no JS → `/zh/` via `<noscript>` meta refresh; visible links to both + canonical | `src/pages/index.astro` |
| Minimal JS: one small inline module (theme, menu, copy) + Pagefind only on the search page; fonts are self-hosted variable fonts with `unicode-range` subsets and `font-display: swap` | |

## Language by browser preference (2026-11-17)

Static hosting only; no server-side `Accept-Language`.

- **Root `/`** (the only language-neutral entry) runs a tiny inline script before paint: (1) a saved choice `localStorage.lang` (`zh`/`en`) wins; (2) else the first tag in `navigator.languages` that is `zh*` → `/zh/`, `en*` → `/en/` (other tags are skipped, so `ja, zh-CN` → zh); (3) else `/en/` (a reader whose browser is neither Chinese nor English is likelier to read English). `location.replace` keeps `?query#hash` and adds no history entry. Without JS a `<noscript>` meta refresh goes to `/zh/` (the x-default edition), and the page always shows links to both editions. canonical / hreflang / x-default (→ `/zh/`) unchanged. All URLs come from `href()`, so BASE is respected.
- **Language pages never redirect** (deep links, shared links and crawlers get exactly the URL they asked for). If no choice is saved and the browser prefers the *other* edition, a small hint bar under the header says so in that language (「本页也有中文版。阅读中文版」 / "This page is also available in English. Read in English") with a dismiss button. Not sticky, not a live region, `lang` set, 32 px (44 px on touch) close button, focus moves to `<main>` on dismiss.
- **Saved choice**: clicking the top-right switcher, a root link or the hint link saves the target edition; dismissing the hint saves the current one. Either way the hint stops appearing.
- **QA**: `scripts/qa/lang-check.mjs` — 8 root cases (zh-CN, zh-TW, en-GB first, ja→zh, fr/de, empty list, saved en vs zh browser, saved zh vs en browser), query/hash kept, no-JS fallback, hreflang, hint shown/hidden matrix, keyboard dismiss + focus, switcher saves choice, axe on the hint light/dark × 1280/390.

## Numbered labels: hanging indent (2026-11-17)

- `navTitle` ("11　实验：…", "11 · Lab: …", "附录 A　…", "Appendix A · …") is split by `splitNumLabel()` (src/data/chapters.ts) and rendered by `NumLabel.astro` as `<span class="num">11</span> <span class="num-text">…</span>` inside a `.num-item` grid: number column `minmax(2ch, max-content)` with right-aligned tabular digits (1- and 2-digit numbers end at the same x), title column `minmax(0, 1fr)`, so a wrapped title continues under its own first line. Used in the book contents (sidebar, mobile menu, home cards) and the prev/next pager (pager: no shared column, "Next" right-pushed when short). The plain space between the spans keeps the accessible name "11 实验…".
- Appendix labels ("附录 A" / "Appendix A") are a small line above the title, in the title column, so appendix titles line up with chapter titles instead of opening a 5-em number column.
- Hyphenated Latin tokens (MBox-Burn, ERC-20, self-check) are `white-space: nowrap`; zh titles that contain such a token get `word-break: keep-all` (others keep normal CJK breaking so `text-wrap: balance` still works) so the break moves to the space or punctuation (「实验：MBox-Burn｜销毁与撤销授权」, not「MBox-Burn 销｜毁」); `overflow-wrap: anywhere` is the safety net.
- Glossary list, on-this-page TOC and Term "more" links have no number column (unchanged). QA: `scripts/qa/toc-indent-check.mjs`.

## Keyboard: shortcuts and audit (2026-11-17)

- **Shortcuts** (`BaseLayout.astro`, one listener on `document`, bubble phase): on chapter pages `←` / `→` follow the pager's `rel="prev"` / `rel="next"` links (so BASE is respected); `/` opens search (`/…/search/#q` focuses the box; on the search page it focuses it directly); `?` opens the help dialog. Arrows carry `aria-keyshortcuts` while enabled. Nothing fires when: Ctrl / Alt / ⌘ is held (and Shift, for arrows); the event is `defaultPrevented`, `isComposing` / keyCode 229 (IME) or `repeat`; focus is in an input / textarea / select / contenteditable / ARIA text, list, grid or menu widget; a dialog, popover (`:popover-open` or the JS fallback) or the mobile menu is open; text is selected; for arrows, focus (or the last click, when nothing is focused) is inside an element that actually scrolls sideways (tables, code, diagrams: the arrow scrolls it), or the page itself scrolls sideways (zoomed in). Only chapter pages have a pager, so arrows do nothing on the home, search and accessibility pages.
- **Off switch (WCAG 2.1.4)**: the help dialog has an "enable single-key shortcuts" checkbox, saved as `localStorage.kbdShortcuts = 'off'`; the dialog stays reachable from the footer button and the hint under the pager even when shortcuts are off. Documented on the accessibility page (zh + en).
- **Help dialog**: native `<dialog>` opened with `showModal()`, `aria-labelledby`, `closedby="any"` (+ a backdrop-click fallback), `autofocus` on the switch, close button in a `<form method="dialog">`; no manual focus trap, `role`, `aria-modal` or Esc handler (the browser provides focus containment, Esc and focus return).
- **Audit fixes**: with `scroll-behavior: smooth`, a fast Tab could leave the focused element below the fold mid-animation; `html:has(:focus-visible) { scroll-behavior: auto }` makes keyboard-driven scrolls instant (mouse clicks on in-page links stay smooth). Already fine and now scripted: skip link → `<main>`; ring 3 px `--focus` on every stop; `scroll-padding-top` keeps focus clear of the sticky header (2.4.11); mobile menu trap + Esc + focus return; Term popover Esc + focus return; quiz `<details>` by Enter/Space; tables (`role=region` + label + `tabindex=0`), code blocks (`tabindex=0`) and wide diagrams (`role=group` + label + `tabindex=0`) are focusable and scroll with arrows; no positive tabindex; no traps.
- **QA**: `scripts/qa/keyboard-check.mjs` (exit 1 on failure): 85 checks — paging, every no-fire case above, dialog/switch/persistence, `/` search, skip link, menu, popover, quiz, and every Tab stop on 7 pages × light/dark × 1280/390 (ring present, not under the header, on screen).

## Diagram text fit (2026-11-17)

Diagram SVGs are shown as `<img>`, so their text uses the *visitor's* system fonts (SF Pro, Segoe UI, Roboto, Noto…), whose widths differ. `scripts/qa/diagram-overflow-check.mjs` loads every built SVG (7 × zh/en + 2 OG cards) and, with `getBBox()`, requires each `<text>` to stay inside the smallest rect/circle that contains its anchor (8 px padding) or inside the viewBox; it also flags text overlapping text or an arrow line. It runs a second **stress pass with wide fonts** (DejaVu Sans / DejaVu Sans Mono, 6 px padding) so a diagram that passes also fits on wider platform fonts. The OG cards are rendered once to PNG with the site's own fonts, so they get the normal pass only.
It also flags arrow tips that run into a box and boxes closer than 16 px to the canvas edge.
Fixed 2026-11-17 (before: 10 text issues, mostly English, + 4 arrow / 1 edge issue): **proxy** (zh + en layout: wider proxy column, longer delegatecall arrow; en: short title + subtitle, title 17 px, shorter V4 note, two-line bottom note in a taller box), **approve** (en title + subtitle, shorter line 2; both: 160 px cards so arrows stop at the next card and the row ends at 920 like the note), **blocks** (en line 2), **redenomination** (en line 3; both: rows and red note spaced to fill their boxes), **wallet-flow** (both: 156 px cards so the row ends at 920 instead of touching the edge; zh card 2 on three lines). Checked, unchanged: counter, test-layers, OG cards (zh/en). After: 0 issues in both passes.

## Alignment pass (2026-11-17)

- Glossary「?」: Chinese text sat ~2.5 px above the dot centre → `:lang(zh) .term-btn { top: -2px }` (now 0.4–0.9 px); `margin-inline-end: -2px` removes the gap before「, . ）」 while the target stays 24×24 (`term-check` minTarget 24).
- Figure captions: MDX wrapped the caption text in `<p>`, which pushed「图 5｜」/ "Figure 5 ·" onto a line of its own; the `<p>` is now inline and the "open full size" link is its own block.
- Measured and fine: header icon + label (≤ 1 px), callout titles, table cells (left/top; numeric columns right/top), cards.
- Not changed: in the English home h1 the comma after "life" looks spaced; that is Plus Jakarta Sans' own comma side-bearing at weight 800 with tight tracking (verified via CDP: glyph is from the web font), not an extra space.

## Modern Web Guidance (Chrome team) used 2026-11-17

`npx modern-web-guidance` (`--skill-version 2026_05_16-c5e7870`): *improve-text-layout-and-legibility* (confirms our `balance` on short headings only and `pretty` on running text; no change), *precise-text-alignment* (`text-box` is Limited availability, not needed: measured offsets ≤ 1 px after the fixes above), *position-aware-tooltips* / *viewport-aware-dropdowns* (anchor positioning is not Baseline Widely available; the JS placement + bottom sheet stays), *dark-mode* (MANDATORY: JS reading `prefers-color-scheme` must handle `change` → the theme now follows later OS changes until the reader uses the toggle), *language-detection* (per its catalog entry it detects the language of page or user text, not the reader's preference, so not applicable; we use `navigator.languages`).

## No orphan last lines (2026-11-17)

Goal: no line that holds only 1–3 CJK characters or a single short word at the end of a text block.

- **CSS** (`global.css`, end): `text-wrap: pretty` on running text (p, li, td/th, dd, captions, callouts, popover body, cards, safety notice, footer); `text-wrap: balance` on headings, card titles, callout titles, sidebar/TOC/nav links, pager titles, part titles, glossary links. `html:lang(zh) { line-break: strict }` keeps CJK closing punctuation off the start of a line.
- **Build-time fallback** for browsers where `pretty` is missing or weaker (Safari/Firefox): `src/lib/rehype-no-orphans.mjs`, registered as a Sätteri hast plugin in `astro.config.mjs` (Astro 7's default Markdown/MDX processor, so Markdown rendering is unchanged). For each leaf block it wraps the tail (last 4 CJK chars + trailing punctuation, or the last two Latin words, max 18 chars) in `<span class="nw">` (`white-space: nowrap`). It splits `<strong>/<em>` when needed, moves a short link / inline code / `<Term>` whole, never splits a link. A span adds no characters, so copy-paste, Pagefind and screen readers get the original text (no U+00A0 / U+2060). Also: table columns whose cells are all short get `c-short` (one line); short inline code (≤22 chars) is `nw`; longer code with spaces glues its last words; long URL link text gets `<wbr>` after `/`.
- **Templates**: `src/components/Nw.astro` applies the same rule to plain strings (home cards, footer, quiz, glossary list, accessibility page); safety notice and snapshot have hand-placed `<span class="nw">`; chapter meta line glues「区块 12117419」.
- **`<Term>`**: the last 1–2 CJK chars or last 1–2 words of the term sit in `.term-nw` together with the「?」button, so the button never starts a line alone; `.term-pop { white-space: normal }` keeps the popover text wrapping.
- **QA**: `scripts/qa/orphan-check.mjs` measures the last line of every leaf text block with `Range.getClientRects()` on all 44 zh/en pages at 1280/1024/768/390/320. Before → after (Chrome): 423/383/215/506/588 → 0/0/0/2/6; with `pretty` disabled (`--no-pretty`, the Safari/Firefox case): 0/0/0/2/7. The few left are narrow-phone cases that cannot be avoided without breaking words (a two-word English h1, a word after a 20-digit number or a long code span, text after a hash chip).

## Chapters (zh / en) — same slug in both languages (order/part now come from each file's frontmatter)

| Slug | 中文 | English |
| --- | --- | --- |
| 01-how-to-read | 这本书怎么读 | How to read this book |
| 02-who-needs-blockchain | 生活中谁需要区块链？ | Who actually needs a blockchain? |
| 03-blocks-hashes-consensus | 区块、哈希与共识 | Blocks, hashes and consensus |
| 04-nodes-trust | 节点与信任边界 | Nodes and trust boundaries |
| 05-wallets-keys-signatures | 钱包、私钥与签名 | Wallets, keys and signatures |
| 06-gas-nonce-explorer | Gas、nonce 与区块浏览器 | Gas, nonce and block explorers |
| 07-smart-contracts-evm | 智能合约与 EVM | Smart contracts and the EVM |
| 08-lab-counter | 实验：Counter 计数器 | Lab: the Counter contract |
| 09-lab-mbox-erc20 | 实验：MBox 与 ERC-20 | Lab: MBox and ERC-20 |
| 10-approve-vs-payment | 授权不是付款 | Approval is not payment |
| 11-lab-mbox-burn | 实验：MBox-Burn 销毁与撤销授权 | Lab: MBox-Burn, burning and revoking |
| 12-atomicity-batch | 两笔交易不等于一笔：原子性 | Two calls are not one transaction: atomicity |
| 13-upgradeable-ubox | 可升级的 UBOX：代理、V1 与 V2 | Upgradeable UBOX: proxy, V1 and V2 |
| 14-ubox-v3-redenomination | UBOX V3：面额重标 | UBOX V3: redenomination |
| 15-evidence-p0 | 证据、源码匹配与 P0 收尾 | Evidence, source matching and the P0 wrap-up |
| 16-appendix-addresses-txs | 附录 A　地址与交易总表 | Appendix A · Addresses and transactions |
| 17-credentials-api-keys | 附录 B　账号、凭证与 API 密钥 | Appendix B · Accounts, credentials and API keys |
| 18-glossary-quiz | 附录 C　术语速查与自测 | Appendix C · Glossary and self-check |
| 19-next-p1-defi | 下一站：P1 DeFi（尚未开始） | Next stop: P1 DeFi (not started yet) |

Plus: home, search, accessibility statement (both languages), root redirect, 404.

Diagrams (original SVG, zh/en, `role="img"` + `<title>`/`<desc>` + figcaption): Fig. 1 blocks (ch3), 2 wallet flow (ch5), 3 Counter (ch8), 4 approve/transferFrom/revoke (ch10), 5 proxy (ch13), 6 redenomination (ch14), 7 test layers (ch15).

## Facts policy and omissions

- Sources only: `web3-sandbox/实验记录.md`, `web3-sandbox/docs/新手指南-账号凭证与API密钥.md`, `web3-sandbox/reports/p0/*`, and the extracted text of the user's Word review. Appendix A tables are generated from the notebook by `scripts/gen_appendix.py`.
- Snapshot: 2026-11-12 15:39:55 (UTC+8), Sepolia block 12117419 — stated on home, chapters, footer, llms.txt. No live-state claims.
- Etherscan verification: described as submitted and **"Pending in queue"**; never as verified. Sourcify: 8/8, 5 `exact_match` + 3 `match` (ProxyAdmin, V1, V2).
- Deliberately **omitted** (not verifiable from the sources or excluded by the brief): faucet brand name (only "0.05 SepETH from 0x52f1…EedD"); any Sepolia end-of-life / deprecation timeline; the hash of the replaced (never-mined) nonce-4 transaction — the book only says the mined nonce-4 transaction matches the replacement script's design (gas limit 140000, tip 2 wei); a wall-clock time for D-01 (only block 12117312 is given); Handler fuzz reverts are described as "suspected residual oracle edge in the test scaffolding", not as a contract bug.

## WCAG 2.2 AA checklist (self-assessment, not a certification)

Tools: axe-core 4.14.0 via puppeteer-core in Google Chrome 156 (headless), tags `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice`. Pages: home, ch1, ch8, ch10, ch12, Appendix A (16), Appendix B (17), quiz (18), ch19, search, accessibility — **both locales** — plus `404.html` and root; each in **light and dark** at **1280 and 375 px** = 96 runs. Scripts in `scripts/qa/`.

**axe result (re-run 2026-11-16 after the rebrand, same 96 runs): 0 violations, 0 incomplete colour-contrast items, no page-level horizontal scroll.** (First 2026-11-16 run had 0 violations but “incomplete” items caused by gradient/pseudo-element backgrounds behind hero text; the hero was rebuilt on a flat tint.) Previous final run (2026-11-13): 0 / 0. Earlier runs found and fixed: Shiki `github-light` token contrast (switched to GitHub high-contrast light/dark themes), an empty table header cell, a heading before the `<h1>` (contents label is now a `<p>`), hidden-but-unnamed mobile labels, body horizontal overflow at ≤375 px (grid item min-content, header width, sr-only text escaping scroll containers).

| SC | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| 1.1.1 | Non-text content | Pass | SVGs `role="img"` + `<title>`/`<desc>`; `<img alt>`; decorative icons `aria-hidden` |
| 1.2.x | Time-based media | N/A | No audio/video |
| 1.3.1 | Info and relationships | Pass | Landmarks, headings h1→h2→h3 without skips, `<th>` tables, labelled lists/regions |
| 1.3.2 | Meaningful sequence | Pass | DOM order = visual order |
| 1.3.3 | Sensory characteristics | Pass | No shape/colour-only instructions |
| 1.3.4 | Orientation | Pass | No orientation lock |
| 1.3.5 | Identify input purpose | N/A | Only a search field (no personal data) |
| 1.4.1 | Use of colour | Pass | Links underlined in prose; status uses text ("reverted") |
| 1.4.2 | Audio control | N/A | |
| 1.4.3 | Contrast (minimum) | Pass | axe 0 issues light+dark; ink on paper ≥ 4.5:1 by design tokens |
| 1.4.4 | Resize text | Pass | rem-based; 200% zoom ≈ 640 px layout, covered by 320 px check |
| 1.4.5 | Images of text | Pass | Text in SVG diagrams duplicated in captions/body |
| 1.4.10 | Reflow | Pass | No body horizontal scroll at 320/360/375/414/768/1024/1440 (scripted check); tables/code/diagrams scroll in their own focusable region with a hint |
| 1.4.11 | Non-text contrast | Pass | Borders/focus ring/controls ≥ 3:1 |
| 1.4.12 | Text spacing | Pass | No fixed-height text boxes |
| 1.4.13 | Content on hover/focus | N/A | No tooltips/popovers |
| 2.1.1 | Keyboard | Pass | Manual + scripted Tab pass; menu, theme, language, copy, quiz `<details>`, search |
| 2.1.2 | No keyboard trap | Pass | Menu traps focus only while open; Esc releases (scripted) |
| 2.1.4 | Character key shortcuts | N/A | None |
| 2.2.1 / 2.2.2 | Timing / pause | N/A | Root redirect is immediate (0 s); no moving content |
| 2.3.1 | Three flashes | Pass | None |
| 2.4.1 | Bypass blocks | Pass | Skip link is first focusable (scripted: first Tab = "Skip to content") |
| 2.4.2 | Page titled | Pass | Unique localized titles |
| 2.4.3 | Focus order | Pass | Logical; menu focus returns to button |
| 2.4.4 | Link purpose | Pass | Explorer links have hidden "(opens in new tab)" text; prev/next labelled |
| 2.4.5 | Multiple ways | Pass | Sidebar contents, home contents, prev/next, search, sitemap |
| 2.4.6 | Headings and labels | Pass | |
| 2.4.7 | Focus visible | Pass | 3 px outline + offset in both themes |
| 2.4.11 | Focus not obscured (min) | Pass | `scroll-padding-top` = header height; scripted Tab (400 stops) through Appendix A (zh) and ch10 (en) at 375/1024/1440 px on 2026-11-16: 0 focused elements hidden under the sticky header; skip link is `position: fixed` above the header (z-index 100 > 50) |
| 2.5.1 / 2.5.2 | Pointer gestures / cancellation | Pass | Single-tap controls; activation on up-event (native) |
| 2.5.3 | Label in name | Pass | Language switch visible "EN"/"中"/"English"/"中文" is in the accessible name |
| 2.5.4 | Motion actuation | N/A | |
| 2.5.7 | Dragging movements | Pass / N/A | No drag interactions; scroll regions also scroll by keyboard |
| 2.5.8 | Target size (min) | Pass | Header controls, menu, TOC (≤1023 px), quiz summaries 44 px; copy buttons 28 px on fine pointers and 44 px on coarse pointers (verified via touch emulation, `scripts/qa/keyboard-check.mjs`); desktop sidebar links 40 px |
| 3.1.1 / 3.1.2 | Language of page / parts | Pass | `lang` per locale; English section of the 404 has `lang="en"`; language-switch label carries `lang`/`hreflang` |
| 3.2.1 / 3.2.2 | On focus / on input | Pass | No context change on focus/input; search runs on submit/typing without navigation |
| 3.2.3 / 3.2.4 | Consistent navigation / identification | Pass | Same header, footer and controls on all pages |
| 3.2.6 | Consistent help | Pass | "Accessibility statement & feedback" link in the same footer position on every page |
| 3.3.1–3.3.4 | Input errors / labels | Pass / N/A | Search has a visible label; no forms that submit data |
| 3.3.7 | Redundant entry | N/A | No multi-step processes |
| 3.3.8 | Accessible authentication (min) | N/A | No login |
| 4.1.2 | Name, role, value | Pass | Menu button `aria-expanded`+`aria-controls`; theme toggle `aria-pressed`; `aria-current` on the current nav item and chapter. The language switch is a single link to the counterpart page (so `aria-current` does not apply); the current language is exposed via `<html lang>` and the link names the target language |
| 4.1.3 | Status messages | Pass | Copy result and search result count via `aria-live`/`role="status"` |

### Viewport checks

320, 360, 375, 414, 768, 1024, 1440 px (scripted `scrollWidth === innerWidth` on 16 representative pages incl. home ×2, Appendix A ×2, search ×2, accessibility ×2, 404 and root; re-run 2026-11-16) — no body horizontal scroll. Keyboard (2026-11-16, both languages): first Tab = skip link; mobile menu traps focus for 80 Tab + 10 Shift+Tab presses; Esc closes and returns focus to the menu button (`aria-expanded=false`). Screenshots reviewed at 320 (home), 375 (Appendix A table, open mobile menu), 768 (quiz, dark), 1440 (home contents, Appendix A). Body text 18 px (prose) / ≥16 px (UI); `viewport-fit=cover` + safe-area insets; no `user-scalable=no`.

### Known gaps

- Lighthouse was not run (axe-core only). Screen-reader testing with NVDA/VoiceOver was not performed — only the accessibility tree via axe and scripted keyboard checks.
- Hex addresses/hashes are read character by character by screen readers (mitigated by copy buttons and explorer links).
- Copy buttons are 28 px on fine pointers (meets 2.5.8's 24 px, below the 44 px preference); 44 px on touch.
- The OG PNGs are rendered with headless Chrome (`scripts/qa/render-og.mjs`); they are not regenerated by `npm run build`.
- Pagefind's index is client-side; search needs JavaScript (contents/prev-next work without it).
- On GitHub *project* Pages, `robots.txt` lives under the base path, which crawlers don't read; use a custom domain or Cloudflare for a root robots.txt.

## Open decisions

1. **Author attribution** — decided 2026-11-17: “Kang” (Person) by default; `AUTHOR_NAME` overrides.
2. **Repository** — https://github.com/cnkang/lets-play-web3 (public). `REPO_URL` defaults to it; the workflow also sets it. Expected site: https://cnkang.github.io/lets-play-web3/ once Pages (Source: GitHub Actions) is enabled.
3. **Hosting**: GitHub Pages (project path `/lets-play-web3/`) is the chosen first host; Cloudflare Pages / a custom domain remain possible later (pick one canonical host to avoid duplicate content).
4. **Publishing (2026-11-17)**: the tree was published to `cnkang/lets-play-web3` through the GitHub connector's text-only file API (no git credentials on the build box). Binary OG images are therefore stored as `assets/og/*.png.b64` and decoded by `scripts/binary-assets.mjs` before dev/build/preview (byte-identical, sha256-checked); `public/og/*.png` is git-ignored.

## File tree (excluding node_modules, dist, .git)

```
.
├── .env.example            # public URLs only
├── .github/workflows/deploy.yml
├── .gitignore  .nvmrc
├── BUILD-NOTES.md  README.md  CONTRIBUTING.md (中文：怎样加章节 / 实验)
├── templates/chapter.{zh,en}.mdx
├── assets/og/{zh,en}.png.b64   # base64 source of the OG PNGs (decoded before dev/build)
├── astro.config.mjs        # static output, SITE_URL/BASE, trailing slash, Shiki themes
├── package.json  package-lock.json
├── wrangler.toml           # optional, Cloudflare Pages direct upload
├── public/
│   ├── favicon.svg
│   ├── diagrams/{zh,en}/{blocks,wallet-flow,counter,approve,proxy,redenomination,test-layers}.svg
│   └── og/{zh,en}.svg sources (PNG decoded from assets/og/*.png.b64)
├── scripts/
│   ├── build_diagrams.py   gen_appendix.py   check-facts.mjs   check-content.mjs   new-chapter.mjs
│   └── qa/ (axe-check, overflow-check, focus-not-obscured, keyboard-check, term-check, render-og, README)
└── src/
    ├── components/ Addr Tx CopyChip Figure Callout Lab T Term Glossary SafetyNotice Snapshot BookToc Quiz (.astro)
    ├── content.config.ts
    ├── content/parts.json  content/phases.json  content/glossary.json (term explanations, zh + en)
    ├── content/chapters/{zh,en}/01…19-*.mdx
    ├── content/pages/{zh,en}/accessibility.mdx
    ├── data/ book.ts (UI strings) chapters.ts (getBook) site.ts quiz.ts llms.ts
    ├── layouts/BaseLayout.astro
    ├── pages/ index.astro 404.astro sitemap.xml.ts robots.txt.ts llms.txt.ts llms-full.txt.ts
    │   └── [lang]/ index.astro search.astro accessibility.astro chapters/[slug].astro
    └── styles/global.css
```

## Bilingual entry, evidence and copy controls (2026-11-17)

- English-first README and CONTRIBUTING with Chinese counterparts; paired deployment guides retain URL configuration and migration instructions. GitHub metadata commands are delivered separately in `docs/GITHUB-METADATA.md`; remote settings were read, not changed.
- Reviewed all 19 chapter pairs. Reader-facing stage names use **Phase-0 / Phase-1**, keeping slugs and IDs stable. Home and Chapter 1 lead to a wallet-free Counter transaction inspection. Code blocks now offer localised copy controls, keyboard activation, truthful failure feedback and a readable no-JavaScript fallback. Optional receipt commands are read-only; copied commands never execute automatically.
- Original evidence: owner-supplied `web3-sandbox-repo.zip`; `docs/evidence/` includes notebook excerpts with original line ranges and checksum. No wallets, credentials, raw logs or executable lab scripts were added. Later D-01–D-05 outcomes take precedence over early plans. No on-chain experiments were rerun.
- Node **24.22.1** (`.nvmrc`: 24): `npm ci` passed, lockfile unchanged. `npm run check:content`: **19 × 2**, 90 glossary terms. `SOURCES_DIR=/tmp/lets-play-web3-lab-sources npm run check:facts`: **213** hex occurrences against **16** reviewed source documents; suspected-secret scan passed. This checks literal provenance, not the semantics of every claim.
- Both `BASE=/ SITE_URL=https://letsplayweb3.liukang.com` and `BASE=/lets-play-web3/ SITE_URL=https://example.github.io` passed `npm run build` and `npm run check:build`: **46 HTML pages, 38 search pages, 4,194 local references** per configuration. Deliberately using a wrong BASE failed as expected. Final `dist/` is the custom-domain root build.
- Browser plugin was not available; used Playwright plus local Chrome and the existing Puppeteer QA scripts with scratch-only dependencies. Local preview: `http://localhost:4399`. Target flow: each language home → inspect transaction → copy receipt command / Solidity. **197 checks passed**, including axe, overflow at **1280/390/320**, light/dark, exact plain-text copy by keyboard, clipboard denial and no-JavaScript reading; no page script errors. Language checks, **128** contents-alignment cases, full keyboard checks and **16** SVG files (normal + wide-font stress) passed. Bash and zsh hidden-input examples were checked with dummy input only.
- Root language routing, `x-default`, snapshot constants, dependency lockfile and chapter URLs were preserved. `git diff --check` passed. These are local browser/build checks, not a fresh chain review or a complete accessibility certification.

## 2026-11-19 · Chapter 19 completed (Phase-1 DeFi labs)

- Rewrote `19-next-p1-defi` (zh + en) from a plan into the completed Phase-1 chapter: swaps, exact approvals, an odd-priced pool and arbitrage, plans X/Y, impermanent loss on paper, v2 and v3 liquidity, the 1 wei `refundETH` story and a mainnet safety warning. The slug is unchanged so links keep working; title and navTitle changed.
- Chapter 19 uses its own snapshot (2026-11-19 11:58:12 UTC+8, Sepolia block 12165973); the 2026-11-12 / block 12117419 snapshot is untouched.
- Part `p1-defi` relabelled "第六部分 · DeFi 实验 / Part VI · DeFi labs". 21 new glossary terms (swap, slippage, impermanent loss, …), all pointing to Chapter 19.
- `scripts/check-facts.mjs` also reads the Phase-1 lab records from `P1_SOURCES_DIR` (default `/workspace/web3-p1a-swap`: `P1A-SWAP-REPORT.md`, `P19-ODD-POOL-ARBITRAGE.md`, `out/*.json`).
- The older row above that calls Chapter 19 "not started yet" is kept as dated history.

- `Lab.astro` now keeps the last 4 CJK characters of a `goal` together (`<span class="nw">`), because `rehype-no-orphans` cannot see component props. Chapter 19's transaction tables are wrapped in `<T>` (fixes a 320/375px horizontal scroll), and its table headers and checklist no longer trigger axe `empty-table-header` / `label`.
- SepETH source: Kang confirmed (2026-11-19) that both 0.05 SepETH transfers came from Google Cloud's Sepolia faucet; chapter 19 and Appendix A now say so.
- Appendix A gains a generated "Chapter 19" section (10 contracts, 5 faucet transfers, A's nonces 20–42; fees total 6,936,564,251,954 wei) from `$P1_SOURCES_DIR/out/p19-appendix-txs.json`. Appendix C gains 7 DeFi self-check questions (19 in total) and 6 quick-reference rows.
