# QA scripts (not part of the build)

Optional accessibility / layout checks used before release. They are **not**
dependencies of the site; install the tools in a scratch folder:

```bash
mkdir -p /tmp/qa && cd /tmp/qa && npm init -y && npm i puppeteer-core axe-core
cp /path/to/lets-play-web3/scripts/qa/*.mjs .
# serve the built site on port 4399 (any static server), e.g.
python3 -m http.server 4399 --directory /path/to/lets-play-web3/dist
node axe-check.mjs                     # axe-core: WCAG 2.0/2.1/2.2 A+AA + best-practice, light/dark, 1280/375
W=320 node overflow-check.mjs /zh/ /en/chapters/16-appendix-addresses-txs/   # body horizontal overflow
W=1024 node focus-not-obscured.mjs /zh/chapters/16-appendix-addresses-txs/  # WCAG 2.4.11
node keyboard-check.mjs                # skip link, mobile-menu focus trap + Esc, copy-button sizes (fine/coarse)
node render-og.mjs /path/to/lets-play-web3   # re-render public/og/{zh,en}.png from the SVG sources
```

They expect Google Chrome at `/usr/bin/google-chrome`.
