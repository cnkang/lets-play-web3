import puppeteer from 'puppeteer-core'
import { readFileSync } from 'node:fs'
const axeSrc = readFileSync('node_modules/axe-core/axe.min.js', 'utf8')
const B = 'http://localhost:4399'
const pages = ['', 'chapters/01-how-to-read/', 'chapters/08-lab-counter/', 'chapters/10-approve-vs-payment/', 'chapters/12-atomicity-batch/', 'chapters/16-appendix-addresses-txs/', 'chapters/17-credentials-api-keys/', 'chapters/18-glossary-quiz/', 'chapters/19-next-p1-defi/', 'search/', 'accessibility/']
const urls = []
for (const l of ['zh', 'en']) for (const p of pages) urls.push(`${B}/${l}/${p}`)
urls.push(`${B}/404.html`, `${B}/`)
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const summary = {}
for (const theme of ['light', 'dark']) for (const width of [1280, 375]) {
  for (const u of urls) {
    const page = await browser.newPage()
    await page.setViewport({ width, height: 900 })
    await page.evaluateOnNewDocument((t) => localStorage.setItem('theme', t), theme)
    await page.goto(u, { waitUntil: 'networkidle0' })
    await page.evaluate(axeSrc)
    const r = await page.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, resultTypes: ['violations', 'incomplete'] }))
    const hs = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    for (const v of r.violations) {
      const k = `${v.impact} ${v.id}`
      summary[k] ??= []
      summary[k].push(`${theme}/${width} ${u.replace(B, '')} ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`)
    }
    for (const v of r.incomplete) if (v.id === 'color-contrast') { summary['incomplete color-contrast'] ??= []; summary['incomplete color-contrast'].push(`${theme}/${width} ${u.replace(B,'')} ${v.nodes.length}`) }
    if (hs) { summary['HSCROLL'] ??= []; summary['HSCROLL'].push(`${theme}/${width} ${u}`) }
    await page.close()
  }
}
await browser.close()
console.log(`pages: ${urls.length} × 2 themes × 2 widths = ${urls.length * 4} runs`)
for (const [k, v] of Object.entries(summary)) { console.log(`\n## ${k} (${v.length})`); for (const x of v.slice(0, 6)) console.log('  ' + x) }
