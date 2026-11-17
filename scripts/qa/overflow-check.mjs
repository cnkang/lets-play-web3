import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] })
for (const u of process.argv.slice(2)) {
  const page = await browser.newPage()
  await page.setViewport({ width: Number(process.env.W || 375), height: 800 })
  await page.goto('http://localhost:4399' + u, { waitUntil: 'networkidle0' })
  const r = await page.evaluate(() => {
    const W = window.innerWidth, out = []
    for (const el of document.querySelectorAll('body *')) {
      const b = el.getBoundingClientRect()
      if (b.right > W + 1 && b.width > 0) {
        let p = el.parentElement, clipped = false
        while (p) { const s = getComputedStyle(p); if (/(auto|scroll|hidden|clip)/.test(s.overflowX) && p !== document.body && p !== document.documentElement) { clipped = true; break } p = p.parentElement }
        if (!clipped) out.push(`${el.tagName}.${el.className} right=${Math.round(b.right)} pos=${getComputedStyle(el).position}`)
      }
    }
    return { sw: document.documentElement.scrollWidth, W, out: out.slice(0, 8) }
  })
  console.log(u, JSON.stringify(r, null, 1))
  await page.close()
}
await browser.close()
