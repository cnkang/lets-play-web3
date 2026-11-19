import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const p2 = await browser.newPage()
await p2.setViewport({ width: Number(process.env.W||1024), height: 700 })
await p2.goto('http://localhost:4399' + (process.argv[2]||'/zh/chapters/appendix-a-addresses-txs/'), { waitUntil: 'networkidle0' })
for (let i = 0; i < 400; i++) {
  await p2.keyboard.press('Tab')
  const r = await p2.evaluate(() => { const e = document.activeElement; if (!e || e === document.body || e.closest('.site-header') || e.classList.contains('skip-link')) return null; const b = e.getBoundingClientRect(); const h = document.querySelector('.site-header').getBoundingClientRect().bottom; return b.bottom <= h + 1 || b.top < h ? `${e.tagName} ${e.className} "${e.textContent.trim().slice(0,30)}" top=${Math.round(b.top)} bottom=${Math.round(b.bottom)} hdr=${h} parent=${e.closest('aside,nav,table,figure,.table-wrap')?.className}` : null })
  if (r) console.log(r)
}
await browser.close()
