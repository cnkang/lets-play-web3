// Diagram text-fit check: every <text> in every built SVG diagram (zh + en, plus
// the OG cards) must sit inside its containing shape (smallest rect/circle that
// holds the text's anchor point) with a safety padding, or inside the viewBox if
// it is free-standing. Also flags text that overlaps other text or an arrow line,
// and arrow tips that run into a box instead of stopping at its edge.
//
// Runs twice per file: with the SVG's own font stack, and in "stress" mode with
// wide fallback fonts (DejaVu Sans / DejaVu Sans Mono), so a diagram that fits
// here still fits on macOS / Windows / Android, whose fonts differ in width.
//
//   python3 -m http.server 4399 --directory dist   (any static server)
//   node diagram-overflow-check.mjs                 (exit 1 if any issue)
//   BASEURL=http://localhost:4399/ PAD=8 STRESS_PAD=6 node diagram-overflow-check.mjs
import puppeteer from 'puppeteer-core'
import { readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const BASEURL = (process.env.BASEURL || 'http://localhost:4399/').replace(/\/?$/, '/')
const DIST = process.env.DIST || join(process.cwd(), 'dist')
const PAD = Number(process.env.PAD ?? 8)
const STRESS_PAD = Number(process.env.STRESS_PAD ?? 6)

const files = []
for (const lang of ['zh', 'en']) {
  const dir = join(DIST, 'diagrams', lang)
  if (!existsSync(dir)) { console.error('missing', dir, '(build first, or set DIST)'); process.exit(2) }
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.svg')).sort()) files.push(`diagrams/${lang}/${f}`)
}
for (const f of ['og/zh.svg', 'og/en.svg']) if (existsSync(join(DIST, f))) files.push(f)

const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const page = await browser.newPage()
let total = 0
for (const f of files) {
  // OG cards are rendered once to PNG with the site's own fonts (render-og.mjs), so
  // they are checked with their own font stack only.
  for (const stress of f.startsWith('og/') ? [false] : [false, true]) {
    await page.goto(BASEURL + f, { waitUntil: 'load' })
    const issues = await page.evaluate(async (stress, pad, isOg) => {
      const svg = document.documentElement
      if (stress) {
        const st = document.createElementNS('http://www.w3.org/2000/svg', 'style')
        st.textContent = `text { font-family: 'DejaVu Sans', 'Noto Sans CJK SC', sans-serif !important }
          text[font-family*="monospace"] { font-family: 'DejaVu Sans Mono', 'Noto Sans Mono CJK SC', monospace !important }`
        svg.appendChild(st)
      }
      await document.fonts.ready
      const vb = svg.viewBox.baseVal
      const out = []
      const shapes = []
      for (const el of svg.querySelectorAll('rect, circle')) {
        const b = el.getBBox()
        if (b.width >= vb.width - 1 && b.height >= vb.height - 1) continue // page background
        if (el.getAttribute('transform')) continue // decorative rotated accents
        shapes.push({ el, b, area: b.width * b.height, circle: el.tagName === 'circle' })
      }
      const lines = [...svg.querySelectorAll('line')].map((l) => l.getBBox())
      const texts = [...svg.querySelectorAll('text')].filter((t) => t.textContent.trim())
      const boxes = texts.map((t) => t.getBBox())
      const label = (t) => JSON.stringify(t.textContent.trim().slice(0, 60))
      texts.forEach((t, i) => {
        const b = boxes[i]
        const fs = parseFloat(t.getAttribute('font-size') || '16')
        const ax = parseFloat(t.getAttribute('x')), ay = parseFloat(t.getAttribute('y')) - fs * 0.35
        const inside = shapes.filter((s) => ax >= s.b.x && ax <= s.b.x + s.b.width && ay >= s.b.y && ay <= s.b.y + s.b.height)
          .sort((a, b2) => a.area - b2.area)[0]
        const c = inside ? inside.b : vb
        const p = inside ? pad : Math.max(pad, 8)
        if (inside?.circle) {
          // text inside a circle: its box corners must stay inside the circle
          const r = c.width / 2, cx = c.x + r, cy = c.y + r
          for (const [x, y] of [[b.x, b.y + b.height * 0.2], [b.x + b.width, b.y + b.height * 0.2], [b.x, b.y + b.height * 0.85], [b.x + b.width, b.y + b.height * 0.85]])
            if (Math.hypot(x - cx, y - cy) > r - 2) { out.push(`text ${label(t)} spills out of its circle`); break }
          return
        }
        const over = {
          left: c.x + p - b.x, right: b.x + b.width - (c.x + c.width - p),
          top: c.y + p * 0.5 - b.y, bottom: b.y + b.height - (c.y + c.height - p * 0.5)
        }
        const bad = Object.entries(over).filter(([, v]) => v > 0.5).map(([k, v]) => `${k} +${v.toFixed(1)}px`)
        if (bad.length) out.push(`text ${label(t)} exceeds ${inside ? 'its box' : 'the viewBox'} (pad ${p}): ${bad.join(', ')}`)
      })
      // text vs text
      const hit = (a, b, m = 0) => a.x < b.x + b.width - m && b.x < a.x + a.width - m && a.y < b.y + b.height - m && b.y < a.y + a.height - m
      for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
        // glyph boxes include line-gap padding; shrink a little so stacked lines don't count
        const s = (b) => ({ x: b.x, y: b.y + b.height * 0.18, width: b.width, height: b.height * 0.64 })
        if (hit(s(boxes[i]), s(boxes[j]), 0.5)) out.push(`text ${label(texts[i])} overlaps ${label(texts[j])}`)
      }
      // text vs arrow lines (needs 3px clearance)
      texts.forEach((t, i) => {
        const b = boxes[i], g = { x: b.x - 3, y: b.y + b.height * 0.15 - 3, width: b.width + 6, height: b.height * 0.7 + 6 }
        for (const l of lines) {
          const lb = { x: l.x - 1, y: l.y - 1, width: l.width + 2, height: l.height + 2 }
          if (hit(g, lb)) { out.push(`text ${label(t)} touches an arrow line`); break }
        }
      })
      // boxes keep a margin from the canvas edge (≥ 16px, like the 40px page margins)
      for (const sh of isOg ? [] : shapes) { // OG cards bleed decorative shapes on purpose
        const b = sh.b
        if (b.x < vb.x + 16 || b.y < vb.y + 16 || b.x + b.width > vb.x + vb.width - 16 || b.y + b.height > vb.y + vb.height - 12)
          out.push(`box at (${b.x}, ${b.y}) ${b.width}×${b.height} touches the canvas edge`)
      }
      // arrow tips must stop at a box edge, not run into a box (needs a 1.5px tolerance)
      for (const l of svg.querySelectorAll('line')) {
        const pts = [[+l.getAttribute('x1'), +l.getAttribute('y1')], [+l.getAttribute('x2'), +l.getAttribute('y2')]]
        for (const [x, y] of pts) for (const s of shapes) {
          if (s.circle) continue
          const b = s.b, d = Math.min(x - b.x, b.x + b.width - x, y - b.y, b.y + b.height - y)
          if (d > 1.5) { out.push(`arrow end (${x}, ${y}) runs ${d.toFixed(1)}px into a box`); break }
        }
      }
      return out
    }, stress, stress ? STRESS_PAD : PAD, f.startsWith('og/'))
    total += issues.length
    console.log(`${issues.length ? '✗' : '✓'} ${f}${stress ? ' [stress fonts]' : ''}${issues.length ? '' : ' — ok'}`)
    for (const s of issues) console.log('   - ' + s)
  }
}
await browser.close()
console.log(total ? `\n${total} issue(s) in ${files.length} SVG files` : `\nAll ${files.length} SVG files fit (default + stress fonts).`)
process.exit(total ? 1 : 0)
