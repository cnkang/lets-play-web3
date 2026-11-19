// Keyboard QA (exit 1 on failure). Needs a static server with dist on :4399.
//  1. ← → chapter paging, incl. every case where it must NOT fire
//  2. ? help dialog, / search, the on/off switch (WCAG 2.1.4)
//  3. skip link, mobile menu trap + Esc, Term popover Esc, focus return
//  4. every Tab stop on sample pages: visible ring, not under the sticky header (2.4.11), on screen
//  5. copy buttons >= 24px (44px on coarse pointers)
//   node keyboard-check.mjs            SHOTS=/workspace/site-previews node keyboard-check.mjs
import puppeteer from 'puppeteer-core'
const B = (process.env.B || 'http://localhost:4399').replace(/\/$/, '')
const SHOTS = process.env.SHOTS
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] })
let fail = 0
const ok = (c, m) => { console.log(`${c ? '✓' : '✗'} ${m}`); if (!c) fail++ }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const CH = '/en/chapters/08-lab-counter/'
const NEXT = '/en/chapters/09-lab-mbox-erc20/'
const PREV = '/en/chapters/07-smart-contracts-evm/'

async function open(path, { width = 1280, theme = 'light', kbd = null, lang = null } = {}) {
  const ctx = await browser.createBrowserContext()
  const p = await ctx.newPage()
  await p.setViewport({ width, height: 800 })
  await p.evaluateOnNewDocument((t, k, l) => {
    localStorage.setItem('theme', t)
    localStorage.setItem('lang', l || location.pathname.slice(1, 3))
    if (k) localStorage.setItem('kbdShortcuts', k)
  }, theme, kbd, lang)
  await p.goto(B + path, { waitUntil: 'networkidle0' })
  return { p, ctx }
}
const path = (p) => new URL(p.url()).pathname
async function pressNav(p, key, mods = []) {
  for (const m of mods) await p.keyboard.down(m)
  await p.keyboard.press(key)
  for (const m of mods.reverse()) await p.keyboard.up(m)
  await sleep(700)
  return path(p)
}

// ---------- 1. arrow paging
{
  let { p, ctx } = await open(CH)
  ok(await p.$eval('.pager a[rel=next]', (a) => a.getAttribute('aria-keyshortcuts')) === 'ArrowRight', 'next link has aria-keyshortcuts="ArrowRight"')
  ok(await p.$eval('.pager a[rel=prev]', (a) => a.getAttribute('aria-keyshortcuts')) === 'ArrowLeft', 'prev link has aria-keyshortcuts="ArrowLeft"')
  ok(await p.$eval('.kbd-hint', (e) => !e.hidden && getComputedStyle(e.querySelector('.kbd-on')).display !== 'none'), 'shortcut hint visible under the pager')
  ok((await pressNav(p, 'ArrowRight')) === NEXT, '→ goes to the next chapter')
  ok((await pressNav(p, 'ArrowLeft')) === CH, '← on the next chapter comes back')
  ok((await pressNav(p, 'ArrowLeft')) === PREV, '← goes to the previous chapter')
  await ctx.close()
}
for (const [mods, label] of [[['Alt'], 'Alt'], [['Control'], 'Ctrl'], [['Meta'], 'Meta/⌘'], [['Shift'], 'Shift']]) {
  const { p, ctx } = await open(CH)
  ok((await pressNav(p, 'ArrowRight', mods)) === CH, `${label}+→ does not page`)
  await ctx.close()
}
{
  const { p, ctx } = await open('/en/chapters/01-how-to-read/')
  ok((await pressNav(p, 'ArrowLeft')) === '/en/chapters/01-how-to-read/', 'first chapter: ← does nothing')
  await ctx.close()
}
{
  const { p, ctx } = await open('/en/chapters/appendix-c-glossary-quiz/')
  ok((await pressNav(p, 'ArrowRight')) === '/en/chapters/appendix-c-glossary-quiz/', 'last entry: → does nothing')
  await ctx.close()
}
{
  const { p, ctx } = await open('/en/')
  ok((await pressNav(p, 'ArrowRight')) === '/en/', 'home page: arrows do nothing')
  await ctx.close()
}
for (const [html, label] of [['<input id="t-in" type="text">', 'text input'], ['<textarea id="t-in"></textarea>', 'textarea'], ['<div id="t-in" contenteditable="true">x</div>', 'contenteditable'], ['<input id="t-in" type="search">', 'search field'], ['<select id="t-in"><option>a</option><option>b</option></select>', 'select']]) {
  const { p, ctx } = await open(CH)
  await p.evaluate((h) => document.querySelector('.prose').insertAdjacentHTML('afterbegin', h), html)
  await p.focus('#t-in')
  ok((await pressNav(p, 'ArrowRight')) === CH, `focus in a ${label}: → does not page`)
  await ctx.close()
}
{
  const { p, ctx } = await open(CH)
  await p.evaluate(() => document.querySelector('.term-pop').showPopover())
  ok((await pressNav(p, 'ArrowRight')) === CH, 'Term popover open: → does not page')
  await ctx.close()
}
{
  const { p, ctx } = await open(CH, { width: 390 })
  await p.click('.menu-btn'); await sleep(200)
  ok((await pressNav(p, 'ArrowRight')) === CH, 'mobile menu open: → does not page')
  await ctx.close()
}
{
  const { p, ctx } = await open(CH)
  await p.evaluate(() => document.getElementById('kbd-help').showModal())
  ok((await pressNav(p, 'ArrowRight')) === CH, 'help dialog open: → does not page')
  await ctx.close()
}
for (const [sel, label] of [['.table-wrap', 'wide table'], ['.prose pre', 'code block'], ['.figure-frame', 'wide diagram']]) {
  const { p, ctx } = await open(CH, { width: 390 })
  const scrollable = await p.$eval(sel, (e) => e.scrollWidth > e.clientWidth + 1)
  await p.focus(sel)
  const before = await p.$eval(sel, (e) => e.scrollLeft)
  const u = await pressNav(p, 'ArrowRight')
  const after = await p.$eval(sel, (e) => e.scrollLeft)
  ok(scrollable && u === CH && after > before, `focus in a sideways-scrolling ${label} (390px): → scrolls it (${before}→${after}) and does not page`)
  await ctx.close()
}
{
  const { p, ctx } = await open(CH, { width: 390 })
  // pick a header cell (not a link) in a table that really scrolls sideways; instant scroll so the click lands on it
  const th = await p.evaluateHandle(() => [...document.querySelectorAll('.table-wrap')].find((w) => w.scrollWidth > w.clientWidth + 1)?.querySelector('th'))
  await th.evaluate((e) => e.scrollIntoView({ block: 'center', behavior: 'instant' })); await sleep(150)
  const box = await th.boundingBox()
  await p.mouse.click(box.x + 10, box.y + box.height / 2)
  ok((await pressNav(p, 'ArrowRight')) === CH, 'after clicking inside a wide table (no focus): → does not page')
  await ctx.close()
}
{
  const { p, ctx } = await open(CH)
  await p.evaluate(() => { const r = document.createRange(); r.selectNodeContents(document.querySelector('.prose p')); getSelection().addRange(r) })
  ok((await pressNav(p, 'ArrowRight')) === CH, 'text selected: → does not page')
  await ctx.close()
}
for (const [init, label] of [[{ isComposing: true }, 'IME composing (isComposing)'], [{ repeat: true }, 'auto-repeat (held key)']]) {
  const { p, ctx } = await open(CH)
  await p.evaluate((i) => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true, ...i })), init)
  await sleep(700)
  ok(path(p) === CH, `${label}: → does not page`)
  await ctx.close()
}
{
  const { p, ctx } = await open(CH)
  await p.evaluate(() => document.addEventListener('keydown', (e) => e.preventDefault(), { capture: true }))
  ok((await pressNav(p, 'ArrowRight')) === CH, 'event already defaultPrevented by another handler: → does not page')
  await ctx.close()
}
{
  const { p, ctx } = await open(CH)
  await p.evaluate(() => { document.body.style.minWidth = '3000px' })
  ok((await pressNav(p, 'ArrowRight')) === CH, 'page itself scrolls sideways (zoomed in): → does not page')
  await ctx.close()
}

// ---------- 2. ? dialog, / search, off switch
{
  const { p, ctx } = await open(CH)
  await p.focus('.pager a[rel=next]')
  await p.keyboard.press('?'); await sleep(200)
  const st = await p.evaluate(() => ({ open: document.getElementById('kbd-help').open, modal: document.getElementById('kbd-help').matches(':modal'), focus: document.activeElement.id, name: document.getElementById('kbd-help').getAttribute('aria-labelledby') }))
  ok(st.open && st.modal && st.focus === 'kbd-enabled' && st.name === 'kbd-help-title', `? opens the modal help dialog, focus on the on/off switch (${JSON.stringify(st)})`)
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/keyboard-help-dialog-en-1280-light.png` })
  let escaped = 0
  // native modal: the page behind is inert; Tab may pass through the browser's own UI (activeElement = body), never the page
  for (let i = 0; i < 8; i++) { await p.keyboard.press('Tab'); if (await p.evaluate(() => document.activeElement !== document.body && !document.activeElement.closest('#kbd-help'))) escaped++ }
  ok(escaped === 0, `Tab never reaches the page behind the dialog (escaped ${escaped})`)
  await p.keyboard.press('Escape'); await sleep(150)
  ok(await p.evaluate(() => !document.getElementById('kbd-help').open && document.activeElement.matches('.pager a[rel=next]')), 'Esc closes it and focus returns to where it was')
  // turn off via the dialog
  await p.click('.kbd-hint [data-kbd-help]'); await sleep(150)
  await p.keyboard.press('Space'); await sleep(100)
  const off = await p.evaluate(() => ({ saved: localStorage.getItem('kbdShortcuts'), aks: document.querySelector('.pager a[rel=next]').getAttribute('aria-keyshortcuts') }))
  await p.keyboard.press('Escape'); await sleep(150)
  ok(off.saved === 'off' && off.aks === null, `switch off: saved 'off', aria-keyshortcuts removed (${JSON.stringify(off)})`)
  ok(await p.$eval('.kbd-hint .kbd-off', (e) => getComputedStyle(e).display !== 'none'), 'hint now says shortcuts are off')
  if (SHOTS) { await p.$eval('.kbd-hint', (e) => e.scrollIntoView({ block: 'center' })); await sleep(200); await p.screenshot({ path: `${SHOTS}/keyboard-hint-off-en-1280.png` }) }
  ok((await pressNav(p, 'ArrowRight')) === CH, 'switched off: → does not page')
  await p.keyboard.press('?'); await sleep(150)
  ok(!(await p.evaluate(() => document.getElementById('kbd-help').open)), 'switched off: ? does nothing')
  await ctx.close()
}
{
  const { p, ctx } = await open(CH, { kbd: 'off' })
  await p.reload({ waitUntil: 'networkidle0' })
  ok((await pressNav(p, 'ArrowRight')) === CH, 'off setting persists across pages')
  await p.focus('.site-footer [data-kbd-help]'); await p.keyboard.press('Enter'); await sleep(150)
  ok(await p.evaluate(() => document.getElementById('kbd-help').open), 'footer "Keyboard shortcuts" button opens the dialog by keyboard (works even when off)')
  await ctx.close()
}
{
  const { p, ctx } = await open(CH)
  await p.keyboard.press('/'); await sleep(900)
  ok(path(p) === '/en/search/' && (await p.evaluate(() => document.activeElement.id)) === 'q', `/ opens search with the box focused (${path(p)})`)
  await p.keyboard.type('a/b')
  ok((await p.$eval('#q', (e) => e.value)) === 'a/b' && path(p) === '/en/search/', 'typing "/" inside the search box just types it')
  await ctx.close()
}
{
  const { p, ctx } = await open('/zh/search/')
  await p.focus('.site-footer a'); await p.keyboard.press('/'); await sleep(200)
  ok((await p.evaluate(() => document.activeElement.id)) === 'q', '/ on the search page focuses the box')
  await ctx.close()
}

// ---------- 3. skip link, menu, popover
for (const lang of ['zh', 'en']) {
  const { p, ctx } = await open(`/${lang}/chapters/appendix-a-addresses-txs/`, { width: 375 })
  await p.keyboard.press('Tab')
  ok(await p.evaluate(() => document.activeElement.classList.contains('skip-link')), `${lang}: first Tab = skip link`)
  await p.keyboard.press('Enter'); await sleep(150)
  ok(await p.evaluate(() => document.activeElement.id === 'main'), `${lang}: skip link lands on <main>`)
  await p.keyboard.press('Tab')
  ok(await p.evaluate(() => !!document.activeElement.closest('main')), `${lang}: next Tab continues inside main`)
  await p.focus('.menu-btn'); await p.keyboard.press('Enter'); await sleep(200)
  let escaped = 0
  for (let i = 0; i < 60; i++) { await p.keyboard.press('Tab'); if (!(await p.evaluate(() => !!document.activeElement.closest('.menu-sheet')))) escaped++ }
  for (let i = 0; i < 10; i++) { await p.keyboard.down('Shift'); await p.keyboard.press('Tab'); await p.keyboard.up('Shift'); if (!(await p.evaluate(() => !!document.activeElement.closest('.menu-sheet')))) escaped++ }
  ok(escaped === 0, `${lang}: mobile menu keeps focus inside (escaped ${escaped})`)
  await p.keyboard.press('Escape'); await sleep(150)
  ok(await p.evaluate(() => document.activeElement.classList.contains('menu-btn') && document.activeElement.getAttribute('aria-expanded') === 'false'), `${lang}: Esc closes the menu, focus back on the menu button`)
  const minCopy = await p.evaluate(() => Math.min(...[...document.querySelectorAll('.copy-btn')].map((b) => Math.min(b.getBoundingClientRect().height, b.getBoundingClientRect().width))))
  ok(minCopy >= 24, `${lang}: copy buttons ≥ 24px (fine pointer: ${minCopy})`)
  await ctx.close()
}
{
  const { p, ctx } = await open(CH)
  await p.focus('.prose .term-btn'); await p.keyboard.press('Enter'); await sleep(150)
  const opened = await p.evaluate(() => !!document.querySelector(':popover-open'))
  await p.keyboard.press('Escape'); await sleep(150)
  ok(opened && (await p.evaluate(() => !document.querySelector(':popover-open') && document.activeElement.classList.contains('term-btn'))), 'Term popover: Enter opens, Esc closes, focus back on ?')
  await ctx.close()
}
{
  const { p, ctx } = await open('/en/chapters/appendix-c-glossary-quiz/')
  await p.focus('.quiz summary'); await p.keyboard.press('Enter'); await sleep(100)
  const o1 = await p.evaluate(() => document.querySelector('.quiz details').open)
  await p.keyboard.press('Space'); await sleep(100)
  const o2 = await p.evaluate(() => document.querySelector('.quiz details').open)
  ok(o1 && !o2, 'quiz answers open with Enter and close with Space')
  await ctx.close()
}

// ---------- 4. Tab stops: ring, not obscured, on screen
const pages = ['/zh/', '/en/', CH, '/zh/chapters/appendix-a-addresses-txs/', '/en/chapters/appendix-c-glossary-quiz/', '/zh/search/', '/en/accessibility/']
for (const theme of ['light', 'dark']) for (const width of [1280, 390]) for (const u of pages) {
  const { p, ctx } = await open(u, { width, theme })
  const bad = []; let n = 0; const seen = new Set()
  for (let i = 0; i < 400; i++) {
    await p.keyboard.press('Tab')
    await p.evaluate(() => new Promise((res) => { let last = -1, same = 0; const f = () => { if (scrollY === last) { if (++same > 2) return res() } else { same = 0; last = scrollY } requestAnimationFrame(f) }; f() }))
    const r = await p.evaluate(() => {
      const el = document.activeElement
      if (!el || el === document.body) return null
      el.dataset.kq ??= String((window.__kq = (window.__kq || 0) + 1))
      const s = getComputedStyle(el), b = el.getBoundingClientRect()
      const ring = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2
      const hdr = document.querySelector('.site-header').getBoundingClientRect()
      const free = !!el.closest('.site-header, .menu-panel, .skip-link, [popover], dialog')
      return { id: el.dataset.kq, what: `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${(el.getAttribute('href') || el.textContent.trim()).slice(0, 40)}`, ring, obscured: !free && b.top < hdr.bottom - 1, off: b.bottom < 0 || b.top > innerHeight || b.width === 0 }
    })
    if (!r || seen.has(r.id)) break
    seen.add(r.id); n++
    if (!r.ring || r.obscured || r.off) bad.push(`${r.what}${r.ring ? '' : ' [no ring]'}${r.obscured ? ' [under header]' : ''}${r.off ? ' [off screen]' : ''}`)
  }
  ok(bad.length === 0 && n > 5, `${theme}/${width} ${u}: ${n} Tab stops, focus visible & unobscured${bad.length ? ' — ' + bad.slice(0, 4).join('; ') : ''}`)
  await ctx.close()
}

// ---------- 5. coarse pointer target sizes
{
  const ctx = await browser.createBrowserContext()
  const p = await ctx.newPage()
  const cdp = await p.createCDPSession()
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
  await p.setViewport({ width: 375, height: 800, hasTouch: true, isMobile: true })
  await p.goto(`${B}/zh/chapters/appendix-a-addresses-txs/`, { waitUntil: 'networkidle0' })
  const m = await p.evaluate(() => Math.min(...[...document.querySelectorAll('.copy-btn, .site-footer .link-btn')].map((b) => Math.min(b.getBoundingClientRect().height, b.getBoundingClientRect().width))))
  ok(m >= 44, `coarse pointer: copy / footer buttons ≥ 44px (${m})`)
  await ctx.close()
}

// screenshots of focus states
if (SHOTS) {
  for (const [lang, theme, width] of [['zh', 'light', 1280], ['en', 'dark', 1280], ['zh', 'dark', 390], ['en', 'light', 390]]) {
    const { p, ctx } = await open(`/${lang}/chapters/08-lab-counter/`, { width, theme })
    await p.focus('.pager a[rel=next]'); await p.keyboard.press('Shift'); // focus-visible via keyboard modality
    await p.keyboard.down('Shift'); await p.keyboard.press('Tab'); await p.keyboard.up('Shift'); await p.keyboard.press('Tab'); await sleep(200)
    await p.$eval('.pager', (e) => e.scrollIntoView({ block: 'center' })); await sleep(200)
    await p.screenshot({ path: `${SHOTS}/keyboard-pager-focus-${lang}-${width}-${theme}.png` })
    await ctx.close()
  }
  for (const [lang, theme] of [['zh', 'light'], ['en', 'dark']]) {
    const { p, ctx } = await open(`/${lang}/chapters/08-lab-counter/`, { theme })
    await p.keyboard.press('Tab'); await sleep(100)
    await p.screenshot({ path: `${SHOTS}/keyboard-skip-link-${lang}-${theme}.png`, clip: { x: 0, y: 0, width: 1280, height: 140 } })
    await p.keyboard.press('?'); await sleep(200)
    await p.screenshot({ path: `${SHOTS}/keyboard-help-dialog-${lang}-1280-${theme}.png` })
    await ctx.close()
  }
  { const { p, ctx } = await open('/zh/chapters/08-lab-counter/', { width: 390, theme: 'dark' }); await p.keyboard.press('?'); await sleep(200); await p.screenshot({ path: `${SHOTS}/keyboard-help-dialog-zh-390-dark.png` }); await ctx.close() }
  { const { p, ctx } = await open('/en/chapters/08-lab-counter/', { width: 390 }); await p.focus('.table-wrap'); await p.keyboard.press('ArrowRight'); await sleep(200); await p.screenshot({ path: `${SHOTS}/keyboard-table-scroll-focus-en-390.png` }); await ctx.close() }
}
await browser.close()
console.log(fail ? `\n${fail} keyboard check(s) failed` : '\nAll keyboard checks passed.')
process.exit(fail ? 1 : 0)
