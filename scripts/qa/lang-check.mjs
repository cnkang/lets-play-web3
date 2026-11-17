// Language-preference behaviour (root redirect, saved choice, hint banner) + axe on the hint.
//   node lang-check.mjs            (static server with dist on :4399; exit 1 on failure)
//   SHOTS=/workspace/site-previews node lang-check.mjs   (also saves screenshots)
import puppeteer from 'puppeteer-core'
import { readFileSync } from 'node:fs'
const B = (process.env.B || 'http://localhost:4399').replace(/\/$/, '')
const SHOTS = process.env.SHOTS
const axeSrc = readFileSync('node_modules/axe-core/axe.min.js', 'utf8')
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] })
let fail = 0
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) fail++ }

async function visit({ langs, saved, path, js = true, width = 1280 }) {
  const ctx = await browser.createBrowserContext()
  const p = await ctx.newPage()
  await p.setViewport({ width, height: 800 })
  await p.setJavaScriptEnabled(js)
  await p.evaluateOnNewDocument((ls, s) => {
    Object.defineProperty(navigator, 'languages', { get: () => ls })
    Object.defineProperty(navigator, 'language', { get: () => ls[0] || '' })
    if (s) localStorage.setItem('lang', s)
  }, langs, saved || null)
  await p.goto(B + path, { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, js ? 150 : 1200))
  return { p, ctx, url: new URL(p.url()).pathname + new URL(p.url()).search + new URL(p.url()).hash }
}

// Root redirect matrix
const cases = [
  [['zh-CN', 'en-US'], null, '/zh/', 'zh-CN browser → /zh/'],
  [['zh-TW'], null, '/zh/', 'zh-TW (any zh*) → /zh/'],
  [['en-GB', 'zh-CN'], null, '/en/', 'en first → /en/'],
  [['ja-JP', 'zh-CN'], null, '/zh/', 'ja, then zh → /zh/ (first zh*/en* tag wins)'],
  [['fr-FR', 'de'], null, '/en/', 'neither zh nor en → /en/'],
  [[], null, '/en/', 'no languages reported → /en/'],
  [['zh-CN'], 'en', '/en/', 'saved choice en beats zh browser'],
  [['en-US'], 'zh', '/zh/', 'saved choice zh beats en browser']
]
for (const [langs, saved, want, label] of cases) {
  const { url, ctx } = await visit({ langs, saved, path: '/' })
  ok(url === want, `root: ${label} (got ${url})`)
  await ctx.close()
}
{
  const { url, ctx } = await visit({ langs: ['en-US'], path: '/?utm=x#top' })
  ok(url === '/en/?utm=x#top', `root keeps ?query and #hash (got ${url})`); await ctx.close()
}
{
  const { url, ctx } = await visit({ langs: ['en-US'], path: '/', js: false })
  ok(url === '/zh/', `no JS: <noscript> refresh → /zh/ (got ${url})`); await ctx.close()
}
// Root HTML is crawlable: links to both editions + hreflang/x-default
{
  const html = await (await fetch(B + '/')).text()
  ok(/hreflang="x-default"/.test(html) && /hreflang="en"/.test(html) && /hreflang="zh-CN"/.test(html), 'root has hreflang zh-CN / en / x-default')
  ok(/<noscript><meta http-equiv="refresh"/.test(html) && !/^\s*<meta http-equiv="refresh"/m.test(html.replace(/<noscript>.*?<\/noscript>/gs, '')), 'meta refresh only inside <noscript>')
  ok(/href="\/zh\/"/.test(html) && /href="\/en\/"/.test(html), 'root has visible links to both editions')
}

// Language pages never redirect; hint appears only when the browser prefers the other edition
for (const [langs, saved, path, wantHint, label] of [
  [['en-US'], null, '/zh/chapters/03-blocks-hashes-consensus/', true, 'en browser on a zh page: stays, hint shown'],
  [['zh-CN'], null, '/en/chapters/03-blocks-hashes-consensus/', true, 'zh browser on an en page: stays, hint shown'],
  [['zh-CN'], null, '/zh/chapters/03-blocks-hashes-consensus/', false, 'zh browser on a zh page: no hint'],
  [['fr-FR'], null, '/zh/', false, 'fr browser on a zh page: no hint (no edition preferred)'],
  [['en-US'], 'zh', '/zh/', false, 'saved choice zh: no hint for an en browser']
]) {
  const { p, url, ctx } = await visit({ langs, saved, path })
  const shown = await p.$eval('#lang-hint', (e) => !e.hidden)
  ok(url === path && shown === wantHint, `${label} (url ${url}, hint ${shown})`)
  await ctx.close()
}

// Hint: switch link saves the choice; dismiss saves the current edition and moves focus to main
{
  const { p, ctx } = await visit({ langs: ['en-US'], path: '/zh/chapters/03-blocks-hashes-consensus/' })
  const lang = await p.$eval('#lang-hint', (e) => e.getAttribute('lang'))
  const go = await p.$eval('.lang-hint-go', (e) => e.getAttribute('href'))
  ok(lang === 'en' && go === '/en/chapters/03-blocks-hashes-consensus/', `hint is in English (lang=${lang}) and links to the same page in English`)
  await p.focus('.lang-hint-close'); await p.keyboard.press('Enter'); await new Promise((r) => setTimeout(r, 100))
  const st = await p.evaluate(() => ({ hidden: document.getElementById('lang-hint').hidden, saved: localStorage.getItem('lang'), focus: document.activeElement?.id }))
  ok(st.hidden && st.saved === 'zh' && st.focus === 'main', `keyboard dismiss hides the hint, saves 'zh', focus → #main (${JSON.stringify(st)})`)
  await p.goto(B + '/', { waitUntil: 'networkidle0' })
  ok(new URL(p.url()).pathname === '/zh/', 'after dismissing, root sends this en browser to /zh/')
  await ctx.close()
}
{
  const { p, ctx } = await visit({ langs: ['zh-CN'], path: '/zh/chapters/03-blocks-hashes-consensus/' })
  await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle0' }), p.click('.lang-switch')])
  const saved = await p.evaluate(() => localStorage.getItem('lang'))
  ok(new URL(p.url()).pathname === '/en/chapters/03-blocks-hashes-consensus/' && saved === 'en', `top-right switcher keeps the page and saves 'en' (saved=${saved})`)
  ok(await p.$eval('#lang-hint', (e) => e.hidden), 'no hint after an explicit switch, even though the browser is zh')
  await p.goto(B + '/', { waitUntil: 'networkidle0' })
  ok(new URL(p.url()).pathname === '/en/', 'root now honours the saved en choice over the zh browser')
  await ctx.close()
}

// axe + screenshots of the hint, light/dark, desktop/mobile
for (const theme of ['light', 'dark']) for (const width of [1280, 390]) for (const [langs, path] of [[['en-US'], '/zh/'], [['zh-CN'], '/en/']]) {
  const ctx = await browser.createBrowserContext()
  const p = await ctx.newPage()
  await p.setViewport({ width, height: 800, deviceScaleFactor: width < 500 ? 2 : 1 })
  await p.evaluateOnNewDocument((ls, t) => { Object.defineProperty(navigator, 'languages', { get: () => ls }); localStorage.setItem('theme', t) }, langs, theme)
  await p.goto(B + path, { waitUntil: 'networkidle0' })
  await p.evaluate(axeSrc)
  const r = await p.evaluate(() => axe.run('#lang-hint', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] } }))
  const v = r.violations.filter((x) => x.id !== 'region').map((x) => x.id)
  ok(v.length === 0, `axe on hint ${theme}/${width} ${path}: ${v.join(', ') || 'no violations'}`)
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/lang-hint-${path.slice(1, 3)}-page-${langs[0]}-browser-${width}-${theme}.png`, clip: { x: 0, y: 0, width, height: width < 500 ? 260 : 200 } })
  await ctx.close()
}
await browser.close()
console.log(fail ? `\n${fail} check(s) failed` : '\nAll language checks passed.')
process.exit(fail ? 1 : 0)
