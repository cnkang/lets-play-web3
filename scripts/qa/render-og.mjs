// Render public/og/{zh,en}.svg to 1200×630 PNG with the site's self-hosted fonts.
// Usage (from the QA scratch folder with puppeteer-core installed):
//   node render-og.mjs /path/to/repo
import puppeteer from 'puppeteer-core'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
const repo = process.argv[2] || '/workspace/web3-sandbox-guide'
const fsrc = (pkg) => `file://${join(repo, 'node_modules/@fontsource-variable', pkg, 'wght.css')}`
const head = `<link rel="stylesheet" href="${fsrc('plus-jakarta-sans')}"><link rel="stylesheet" href="${fsrc('noto-sans-sc')}">
<style>html,body{margin:0;padding:0}svg{display:block}</style>`
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox', '--allow-file-access-from-files'] })
for (const lang of ['zh', 'en']) {
  const svg = readFileSync(join(repo, 'public/og', `${lang}.svg`), 'utf8')
  const page = await browser.newPage()
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 })
  const tmp = `/tmp/og-render-${lang}.html`
  writeFileSync(tmp, `<!doctype html><html lang="${lang === 'zh' ? 'zh-CN' : 'en'}"><head><meta charset="utf-8">${head}</head><body>${svg}</body></html>`)
  await page.goto(`file://${tmp}`, { waitUntil: 'networkidle0' })
  await page.evaluate(async () => { await document.fonts.load("800 96px 'Plus Jakarta Sans Variable'"); await document.fonts.load("800 96px 'Noto Sans SC Variable'", document.body.innerText); await document.fonts.ready })
  await page.screenshot({ path: join(repo, 'public/og', `${lang}.png`), clip: { x: 0, y: 0, width: 1200, height: 630 } })
  await page.close()
}
await browser.close()
console.log('og PNGs written — now run: node scripts/binary-assets.mjs encode  (updates assets/og/*.png.b64)')
