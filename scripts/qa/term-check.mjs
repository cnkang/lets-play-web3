// Glossary popover (<Term>) checks: keyboard (Tab / Enter / Space / Esc / focus
// leaving), outside click, aria-expanded, target size, viewport fit at 320 px,
// no-JS behaviour, and axe-core on an OPEN popover in light + dark themes.
import puppeteer from 'puppeteer-core'
import { readFileSync } from 'node:fs'
const axeSrc = readFileSync('node_modules/axe-core/axe.min.js', 'utf8')
const B = 'http://localhost:4399'
const PAGES = ['/zh/chapters/06-gas-nonce-explorer/', '/en/chapters/13-upgradeable-ubox/', '/zh/']
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const res = {}
const state = (p) => p.evaluate(() => {
  const a = document.activeElement
  const open = document.querySelector('.term-pop:popover-open')
  return { active: a.className || a.tagName, open: open?.id ?? null, expanded: document.querySelector('.term-btn[aria-expanded="true"]')?.getAttribute('aria-controls') ?? null }
})
for (const path of PAGES) {
  const p = await browser.newPage()
  await p.setViewport({ width: 1280, height: 900 })
  await p.goto(B + path, { waitUntil: 'networkidle0' })
  const r = {}
  // Tab until the first「?」button is focused
  for (let i = 0; i < 200; i++) { await p.keyboard.press('Tab'); if (await p.evaluate(() => document.activeElement.classList.contains('term-btn'))) break }
  r.focusedFirst = (await state(p)).active
  r.name = await p.evaluate(() => document.activeElement.getAttribute('aria-label'))
  r.ring = await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle + ' ' + getComputedStyle(document.activeElement).outlineWidth)
  await p.keyboard.press('Enter'); await sleep(250)
  r.afterEnter = await state(p)
  await p.keyboard.press('Tab'); r.tab1 = (await state(p)).active
  await p.keyboard.press('Tab'); r.tab2 = (await state(p)).active
  await p.keyboard.press('Tab'); await sleep(100); r.tab3LeavesAndCloses = await state(p)
  // Space opens, Esc closes and returns focus
  await p.keyboard.down('Shift'); for (let i = 0; i < 1; i++) await p.keyboard.press('Tab'); await p.keyboard.up('Shift')
  for (let i = 0; i < 6 && !(await p.evaluate(() => document.activeElement.classList.contains('term-btn'))); i++) { await p.keyboard.down('Shift'); await p.keyboard.press('Tab'); await p.keyboard.up('Shift') }
  await p.keyboard.press('Space'); await sleep(250); r.afterSpace = await state(p)
  await p.keyboard.press('Escape'); await sleep(150); r.afterEsc = await state(p)
  // Click opens, outside click closes
  const btn = await p.$('.term-btn')
  await btn.click(); await sleep(250); r.afterClick = (await state(p)).open
  r.popInViewport = await p.evaluate(() => { const o = document.querySelector('.term-pop:popover-open').getBoundingClientRect(); return o.left >= 0 && o.right <= innerWidth && o.top >= 0 && o.bottom <= innerHeight })
  await p.mouse.click(5, 450); await sleep(200); r.afterOutsideClick = (await state(p)).open
  r.minTarget = await p.evaluate(() => Math.min(...[...document.querySelectorAll('.term-btn')].map((b) => Math.min(b.getBoundingClientRect().width, b.getBoundingClientRect().height))))
  res[path] = r
  await p.close()
}
// Narrow screen: bottom sheet stays in viewport, button not hidden under it
for (const w of [320, 390]) {
  const p = await browser.newPage()
  await p.setViewport({ width: w, height: 700, isMobile: true, hasTouch: true })
  await p.goto(B + '/zh/chapters/06-gas-nonce-explorer/', { waitUntil: 'networkidle0' })
  const out = []
  for (const i of [0, 5, 12]) {
    const b = (await p.$$('.term-btn'))[i]
    await b.evaluate((el) => el.scrollIntoView({ block: 'end' }))
    await b.tap(); await sleep(300)
    out.push(await p.evaluate((i) => {
      const o = document.querySelector('.term-pop:popover-open'); if (!o) return `#${i} not open`
      const r = o.getBoundingClientRect(), br = document.querySelectorAll('.term-btn')[i].getBoundingClientRect()
      return `#${i} sheet ${Math.round(r.left)}..${Math.round(r.right)} top ${Math.round(r.top)} bottom ${Math.round(r.bottom)}/${innerHeight}; btn bottom ${Math.round(br.bottom)} visible=${br.bottom <= r.top}; hscroll=${document.documentElement.scrollWidth > innerWidth}`
    }, i))
    await p.keyboard.press('Escape'); await sleep(150)
  }
  res[`mobile ${w}`] = out
  await p.close()
}
// No JavaScript: native popover still opens / closes
{
  const p = await browser.newPage()
  await p.setJavaScriptEnabled(false)
  await p.setViewport({ width: 1280, height: 900 })
  await p.goto(B + '/zh/chapters/06-gas-nonce-explorer/', { waitUntil: 'networkidle0' })
  await (await p.$('.term-btn')).click(); await sleep(200)
  const opened = await p.evaluate(() => document.querySelector('.term-pop:popover-open')?.id ?? null)
  await p.keyboard.press('Escape'); await sleep(150)
  const closed = await p.evaluate(() => document.querySelector('.term-pop:popover-open')?.id ?? null)
  res['no-JS'] = { opened, afterEsc: closed }
  await p.close()
}
// axe on open popovers, light + dark, desktop + mobile
const axeSummary = {}
for (const theme of ['light', 'dark']) for (const width of [1280, 375]) for (const path of ['/zh/chapters/06-gas-nonce-explorer/', '/en/chapters/09-lab-mbox-erc20/', '/zh/']) {
  const p = await browser.newPage()
  await p.setViewport({ width, height: 900 })
  await p.evaluateOnNewDocument((t) => localStorage.setItem('theme', t), theme)
  await p.goto(B + path, { waitUntil: 'networkidle0' })
  await p.evaluate(() => { document.querySelectorAll('.term-pop')[2].showPopover() })
  await sleep(300)
  await p.evaluate(axeSrc)
  const r = await p.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, resultTypes: ['violations', 'incomplete'] }))
  const k = `${theme}/${width} ${path}`
  axeSummary[k] = { violations: r.violations.map((v) => `${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`), contrastIncomplete: r.incomplete.filter((v) => v.id === 'color-contrast').reduce((a, v) => a + v.nodes.length, 0) }
  await p.close()
}
res.axeOpenPopover = axeSummary
console.log(JSON.stringify(res, null, 1))
await browser.close()
