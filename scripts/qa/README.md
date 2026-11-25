# QA scripts (not part of the build)

Optional accessibility / layout checks used before release. They are **not**
dependencies of the site; install the tools in a scratch folder:

```bash
mkdir -p /tmp/qa && cd /tmp/qa && npm init -y && npm i puppeteer-core axe-core
cp /path/to/lets-play-web3/scripts/qa/*.mjs .
export DIST=/path/to/lets-play-web3/dist/   # orphan-check.mjs reads the page list from here
# serve the built site on port 4399 (any static server), e.g.
python3 -m http.server 4399 --directory /path/to/lets-play-web3/dist
node axe-check.mjs                     # axe-core: WCAG 2.0/2.1/2.2 A+AA + best-practice, light/dark, 1280/375
W=320 node overflow-check.mjs /zh/ /en/chapters/appendix-a-addresses-txs/   # body horizontal overflow
W=1024 node focus-not-obscured.mjs /zh/chapters/appendix-a-addresses-txs/  # WCAG 2.4.11
node keyboard-check.mjs                # ← → paging + every no-fire case, ? dialog, / search, off switch, skip link, menu trap + Esc, popover Esc, quiz, every Tab stop visible & not under the header (7 pages × light/dark × 1280/390), target sizes; exit 1 on failure
node toc-indent-check.mjs              # numbered labels (book contents in sidebar / mobile menu / home, prev-next pager): wrapped titles hang under their first line, number column aligned, MBox-Burn not split; zh+en × 1280/1024/390/320 × light/dark; SHOTS=dir PREFIX=after for screenshots; exit 1 on failure
node term-check.mjs                    # glossary「?」popovers: keyboard, Esc, outside click, 320px sheet, no-JS, axe with a popover open
node regression-check.mjs              # ch8 TOC (both editions, 1280/390, no-JS, anchor), search query race + clear + isolation, copy rapid-click + retry; CHROME env required on macOS
node orphan-check.mjs                  # orphan last lines (≤3 CJK chars / one short word) on every page at 1280/1024/768/390/320
node orphan-check.mjs --no-pretty      # same, simulating browsers without text-wrap: pretty (Safari/Firefox)
node diagram-overflow-check.mjs        # every diagram <text> inside its box / the viewBox, no text-text or text-arrow overlap; default + wide-font stress pass (exit 1 on issues)
node lang-check.mjs                    # root redirect by saved choice / navigator.languages, no-JS fallback, hint bar on language pages, axe on the hint (exit 1 on failure)
node labs-check.mjs                   # three browser labs: keyboard, invalid input, zh/en, 1280/390 overflow, local analytics log; BASE_URL and CHROME; needs puppeteer-core in the scratch folder
node render-og.mjs /path/to/lets-play-web3   # re-render public/og/{zh,en}.png from the SVG sources
```

Every QA script reads `CHROME` for the browser executable and falls back to `/usr/bin/google-chrome`. On macOS set `CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'` (or another installed Chrome path) before running them; scratch dependencies and screenshots stay outside this repository.

The dependency-free `npm run check:build` runs against `dist/` without a browser. Use the same `SITE_URL` and `BASE` as the build; it checks local links/fragments, assets, canonical/hreflang URLs, JSON-LD, sitemap, robots and llms links. It does not replace browser interaction or accessibility checks.

Code blocks have progressive copy buttons in both languages. After editing them, verify a multiline shell block and Solidity block copy exactly as plain text, keyboard activation, manual-copy fallback when the clipboard is unavailable, and no-JavaScript text selection. A copied command never runs automatically.
