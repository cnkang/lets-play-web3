// Orphan / widow detector. Serves nothing itself: point it at a running static server.
// Usage: node orphan-check.mjs [baseUrl] [--json out.json] [--widths 1280,390] [--no-pretty]
// Flags text blocks with >=2 lines whose LAST line holds <=3 CJK chars (punctuation included)
// or a single short Latin word (<=10 chars), or only the glossary "?" button.
import puppeteer from 'puppeteer-core'
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const args = process.argv.slice(2)
const B = (args.find((a) => a.startsWith('http')) || 'http://localhost:4399').replace(/\/$/, '')
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null
const widths = args.includes('--widths') ? args[args.indexOf('--widths') + 1].split(',').map(Number) : [1280, 1024, 768, 390, 320]
const noPretty = args.includes('--no-pretty') // simulate browsers without text-wrap: pretty (Safari/Firefox today)
const DIST = process.env.DIST || new URL('../../dist/', import.meta.url).pathname

const pages = []
;(function walk(d, rel) {
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    if (statSync(p).isDirectory()) { if (!['_astro', 'pagefind', 'og', 'assets'].includes(f)) walk(p, rel + f + '/') }
    else if (f === 'index.html' && /^(zh|en)\//.test(rel)) pages.push('/' + rel)
  }
})(DIST, '')
pages.sort()

const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const results = {}
const all = []
for (const width of widths) {
  results[width] = 0
  for (const path of pages) {
    const page = await browser.newPage()
    await page.setViewport({ width, height: 900 })
    await page.goto(B + path, { waitUntil: 'networkidle0' })
    await page.evaluate(() => document.fonts.ready)
    if (noPretty) await page.evaluate(() => { for (const el of document.querySelectorAll('*')) if (getComputedStyle(el).textWrapStyle === 'pretty') el.style.textWrapStyle = 'auto' })
    const found = await page.evaluate(() => {
      // Leaf text blocks: any element laid out as a block (block, list-item, table-cell,
      // caption, flex/grid item…) that has visible text and no block-level descendant with text.
      const BLOCKY = new Set(['block', 'list-item', 'table-cell', 'table-caption', 'flow-root', 'flex', 'grid'])
      const skip = (el) => el.closest('pre, script, style, svg, .sr-only, .visually-hidden, [hidden], [aria-hidden="true"], [popover]:not(:popover-open), .chip, button:not(.term-btn)')
      const isBlock = (el) => BLOCKY.has(getComputedStyle(el).display)
      const blocks = [...document.body.querySelectorAll('*')].filter((el) => {
        if (!isBlock(el) || skip(el)) return false
        if (!el.innerText || !el.innerText.trim()) return false
        if (el.getClientRects().length === 0) return false
        for (const d of el.querySelectorAll('*')) if (isBlock(d) && !skip(d) && d.innerText && d.innerText.trim()) return false
        return true
      })
      const CJK = /[\u3000-\u303f\u3400-\u9fff\uff00-\uffef\u2e80-\u2fff]/
      const out = []
      const seen = new Set()
      for (const el of blocks) {
        if (seen.has(el)) continue
        seen.add(el)
        // collect visible text nodes (skip code chips? no — they are real text on the line)
        const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
          acceptNode: (n) => {
            const p = n.parentElement
            if (!n.data.trim()) return NodeFilter.FILTER_REJECT
            if (p.closest('.sr-only, .visually-hidden, [popover]:not(:popover-open), button:not(.term-btn), .chip, [aria-hidden="true"]:not(.term-q)')) return NodeFilter.FILTER_REJECT
            return NodeFilter.FILTER_ACCEPT
          }
        })
        const nodes = []
        while (tw.nextNode()) nodes.push(tw.currentNode)
        if (!nodes.length) continue
        const r = document.createRange()
        r.setStart(nodes[0], 0)
        r.setEnd(nodes[nodes.length - 1], nodes[nodes.length - 1].length)
        const rects = [...r.getClientRects()].filter((x) => x.width > 1 && x.height > 4)
        if (!rects.length) continue
        // line grouping by vertical centre
        const lines = []
        for (const x of rects) {
          const c = (x.top + x.bottom) / 2
          if (!lines.some((l) => Math.abs(l - c) < x.height * 0.45)) lines.push(c)
        }
        if (lines.length < 2) continue
        const lastC = Math.max(...lines)
        // walk backwards char-by-char collecting chars on the last line
        let txt = ''
        outer: for (let i = nodes.length - 1; i >= 0; i--) {
          const n = nodes[i]
          for (let j = n.length - 1; j >= 0; j--) {
            const ch = n.data[j]
            if (/\s|\u2060|\u200b/.test(ch)) { txt = ch === '\u2060' || ch === '\u200b' ? txt : ' ' + txt; continue }
            r.setStart(n, j); r.setEnd(n, j + 1)
            const cr = [...r.getClientRects()].filter((x) => x.width > 0)
            if (!cr.length) continue
            const c = (cr[0].top + cr[0].bottom) / 2
            if (Math.abs(c - lastC) > cr[0].height * 0.45) break outer
            txt = ch + txt
            if (txt.replace(/\s/g, '').length > 14) break outer
          }
        }
        const t = txt.trim()
        const compact = t.replace(/\s/g, '')
        let bad = false
        if (!compact) continue
        if (CJK.test(t)) bad = compact.length <= 3
        else bad = (!/\s/.test(t) && compact.length <= 10) || compact === '?'
        if (bad) {
          const cls = el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''
          const tag = (el.parentElement?.className && typeof el.parentElement.className === 'string' ? el.parentElement.className.split(' ')[0] + '>' : '') + el.tagName.toLowerCase() + cls
          out.push({ tag, last: t, lines: lines.length, text: el.textContent.replace(/\s+/g, ' ').trim().slice(-40) })
        }
      }
      return out
    })
    results[width] += found.length
    for (const f of found) all.push({ width, path, ...f })
    await page.close()
  }
}
await browser.close()
console.log(`pages: ${pages.length}`)
for (const w of widths) console.log(`width ${w}: ${results[w]} orphan lines`)
if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ results, all }, null, 1))
