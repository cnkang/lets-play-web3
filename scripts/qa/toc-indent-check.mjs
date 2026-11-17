// Numbered lists (book contents in the sidebar, mobile menu and home page; prev/next pager):
// a wrapped title's continuation lines must start where the first line's title text starts
// (hanging indent), the number column must line up for 1- and 2-digit numbers, and
// hyphenated tokens such as "MBox-Burn" must not break at the hyphen.
// Usage (from /tmp/qa, dist served on :4399): node toc-indent-check.mjs   [SHOTS=dir PREFIX=after]
import puppeteer from 'puppeteer-core'
const B = process.env.BASE_URL ?? 'http://localhost:4399'
const SHOTS = process.env.SHOTS, PREFIX = process.env.PREFIX ?? 'after'
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let fails = 0, checks = 0
const ok = (c, m) => { checks++; if (!c) { fails++; console.log('✗ ' + m) } }

// Runs in the page: for every numbered item inside `root`, return problems.
function audit(rootSel) {
  const out = []
  const roots = [...document.querySelectorAll(rootSel)].filter((r) => r.getClientRects().length)
  for (const root of roots) {
    const items = [...root.querySelectorAll('.num-item')].filter((e) => e.getClientRects().length)
    if (!items.length) out.push('no numbered items (.num-item) found in ' + rootSel)
    const numRights = {}, textLefts = {}
    for (const it of items) {
      const num = it.querySelector('.num'), txt = it.querySelector('.num-text')
      if (!txt) { out.push('no .num-text: ' + it.textContent.trim()); continue }
      const range = document.createRange(); range.selectNodeContents(txt)
      const lines = [...range.getClientRects()].filter((r) => r.width > 0.5)
      const lefts = [...new Set(lines.map((r) => Math.round(r.left)))]
      // first line may start later only if it is not the first fragment; all line starts must be ≥ the text box start
      const tb = txt.getBoundingClientRect()
      const lineStarts = []
      for (const r of lines) { const y = Math.round(r.top); if (!lineStarts.some((l) => Math.abs(l.y - y) < 4)) lineStarts.push({ y, x: r.left }); else { const l = lineStarts.find((l) => Math.abs(l.y - y) < 4); l.x = Math.min(l.x, r.left) } }
      const rtl = getComputedStyle(txt).textAlign === 'right' || getComputedStyle(txt).textAlign === 'end'
      if (!rtl && lineStarts.some((l) => Math.abs(l.x - tb.left) > 1.5)) out.push(`continuation not aligned: "${txt.textContent.trim()}" starts ${lineStarts.map((l) => Math.round(l.x)).join('/')} vs ${Math.round(tb.left)}`)
      if (num) {
        const nb = num.getBoundingClientRect()
        if (num.classList.contains('num-word') ? nb.bottom > tb.top + 1 || Math.abs(nb.left - tb.left) > 1.5 : nb.right > tb.left + 0.5) out.push('number overlaps / misplaced: ' + it.textContent.trim())
        const list = it.closest('ol, .pager') ?? root
        const key = list.dataset.k ??= Math.random().toString(36).slice(2)
        if (/^\d+$/.test(num.textContent.trim())) (numRights[key] ??= []).push(nb.right)
        ;(textLefts[key] ??= []).push(tb.left - it.getBoundingClientRect().left)
      }
      // hyphenated token broken across lines?
      for (const nw of txt.querySelectorAll('.nw-hy')) if (nw.getClientRects().length > 1) out.push('hyphen token broken: ' + nw.textContent)
      if (it.scrollWidth > it.clientWidth + 1) out.push('overflow: ' + it.textContent.trim())
    }
    for (const [k, s] of Object.entries(numRights)) if (Math.max(...s) - Math.min(...s) > 1.5 && root.matches('.book-toc')) out.push(`number column not aligned in a list: rights ${s.map(Math.round).join(',')}`)
    for (const [k, s] of Object.entries(textLefts)) if (Math.max(...s) - Math.min(...s) > 1.5 && root.matches('.book-toc')) out.push(`title column not aligned in a list: ${s.map(Math.round).join(',')}`)
  }
  return { n: roots.length, out }
}

const pages = [['home', ''], ['ch10', 'chapters/10-approve-vs-payment/'], ['ch12', 'chapters/12-atomicity-batch/'], ['app-a', 'chapters/16-appendix-addresses-txs/']]
for (const theme of ['light', 'dark']) for (const width of [1280, 1024, 390, 320]) for (const lang of ['zh', 'en']) for (const [name, path] of pages) {
  const p = await browser.newPage()
  await p.setViewport({ width, height: 900 })
  await p.evaluateOnNewDocument((t, l) => { localStorage.setItem('theme', t); localStorage.setItem('lang', l) }, theme, lang)
  await p.goto(`${B}/${lang}/${path}`, { waitUntil: 'networkidle0' })
  await p.evaluate(() => document.fonts.ready)
  const tag = `${theme}/${width}/${lang}/${name}`
  const r1 = await p.evaluate(audit, '.sidebar .book-toc, .home-toc-wrap .book-toc')
  for (const m of r1.out) ok(false, `${tag}: ${m}`); if (!r1.out.length) ok(true)
  const r2 = await p.evaluate(audit, '.pager')
  for (const m of r2.out) ok(false, `${tag} pager: ${m}`); if (!r2.out.length) ok(true)
  const shoot = SHOTS && ((theme === 'light' && lang === 'zh') || (theme === 'dark' && lang === 'en'))
  if (shoot && name === 'ch12' && width >= 1024) {
    await p.evaluate(() => { const s = document.querySelector('.sidebar'); const a = s.querySelector('a[href*="11-"]'); a.scrollIntoView({ block: 'center', behavior: 'instant' }) })
    await p.evaluate(() => window.scrollTo(0, 0)); await sleep(150)
    const el = await p.$('.sidebar'); await el.screenshot({ path: `${SHOTS}/toc-indent-${PREFIX}-sidebar-${lang}-${width}-${theme}.png` })
  }
  if (shoot && name === 'ch12' && width < 1024) {
    await p.click('.menu-btn'); await sleep(250)
    const r3 = await p.evaluate(audit, '#menu-panel .book-toc')
    for (const m of r3.out) ok(false, `${tag} menu: ${m}`); if (!r3.out.length) ok(true)
    await p.evaluate(() => document.querySelector('#menu-panel a[href*="11-"]').scrollIntoView({ block: 'center', behavior: 'instant' })); await sleep(150)
    await p.screenshot({ path: `${SHOTS}/toc-indent-${PREFIX}-menu-${lang}-${width}-${theme}.png` })
    await p.keyboard.press('Escape'); await sleep(250)
  }
  if (shoot && name === 'home') {
    const part = await p.evaluateHandle(() => document.querySelector('.home-toc-wrap a[href*="11-"]').closest('.part'))
    await part.evaluate((e) => e.scrollIntoView({ block: 'center', behavior: 'instant' })); await sleep(150)
    await part.screenshot({ path: `${SHOTS}/toc-indent-${PREFIX}-home-${lang}-${width}-${theme}.png` })
    const app = await p.evaluateHandle(() => document.querySelector('.home-toc-wrap a[href*="16-"]').closest('.part'))
    if (width <= 390) await app.screenshot({ path: `${SHOTS}/toc-indent-${PREFIX}-home-appendix-${lang}-${width}-${theme}.png` })
  }
  if (shoot && name === 'ch12' && width <= 390) {
    const pg = await p.$('.pager'); await pg.evaluate((e) => e.scrollIntoView({ block: 'center', behavior: 'instant' })); await sleep(150)
    await pg.screenshot({ path: `${SHOTS}/toc-indent-${PREFIX}-pager-${lang}-${width}-${theme}.png` })
  }
  await p.close()
}
await browser.close()
console.log(fails ? `\n${fails} of ${checks} toc-indent check(s) failed` : `All ${checks} toc-indent checks passed.`)
process.exit(fails ? 1 : 0)
