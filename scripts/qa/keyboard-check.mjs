// Keyboard smoke test: skip link first, mobile menu traps focus, Esc returns focus,
// copy buttons >= 24px (44px on coarse pointers is enforced by CSS media query).
import puppeteer from 'puppeteer-core'
const B = 'http://localhost:4399'
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const res = {}
for (const lang of ['zh', 'en']) {
  const p = await browser.newPage()
  await p.setViewport({ width: 375, height: 800 })
  await p.goto(`${B}/${lang}/chapters/16-appendix-addresses-txs/`, { waitUntil: 'networkidle0' })
  await p.keyboard.press('Tab')
  res[`${lang} first Tab`] = await p.evaluate(() => document.activeElement.className + ' / ' + document.activeElement.textContent.trim())
  await p.focus('.menu-btn'); await p.keyboard.press('Enter')
  await new Promise((r) => setTimeout(r, 200))
  let escaped = 0
  for (let i = 0; i < 80; i++) {
    await p.keyboard.press('Tab')
    if (!(await p.evaluate(() => !!document.activeElement.closest('.menu-sheet')))) escaped++
  }
  for (let i = 0; i < 10; i++) { await p.keyboard.down('Shift'); await p.keyboard.press('Tab'); await p.keyboard.up('Shift'); if (!(await p.evaluate(() => !!document.activeElement.closest('.menu-sheet')))) escaped++ }
  res[`${lang} menu focus escaped`] = escaped
  await p.keyboard.press('Escape')
  res[`${lang} Esc returns to`] = await p.evaluate(() => document.activeElement.className + ' expanded=' + document.activeElement.getAttribute('aria-expanded'))
  res[`${lang} min copy btn (fine pointer)`] = await p.evaluate(() => Math.min(...[...document.querySelectorAll('.copy-btn')].map((b) => Math.min(b.getBoundingClientRect().height, b.getBoundingClientRect().width))))
  await p.close()
}
const p = await browser.newPage()
const cdp = await p.createCDPSession()
await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }) // => (pointer: coarse)
await p.setViewport({ width: 375, height: 800, hasTouch: true, isMobile: true })
await p.goto(`${B}/zh/chapters/16-appendix-addresses-txs/`, { waitUntil: 'networkidle0' })
res['coarse pointer min copy btn'] = await p.evaluate(() => (matchMedia('(pointer: coarse)').matches ? 'coarse ' : 'fine?! ') + Math.min(...[...document.querySelectorAll('.copy-btn')].map((b) => Math.min(b.getBoundingClientRect().height, b.getBoundingClientRect().width))))
console.log(res)
await browser.close()
