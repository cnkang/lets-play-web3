#!/usr/bin/env node
// Scaffold a bilingual chapter from templates/ as a draft.
// Usage: npm run new:chapter -- 20-p1-dex-amm --part p1-defi --order 200
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
const root = new URL('..', import.meta.url).pathname
const args = process.argv.slice(2)
const slug = args.find((a) => !a.startsWith('--') && !/^\d+$/.test(a) || /^\d+-/.test(a))
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d }
if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  console.error('Usage: npm run new:chapter -- <slug> [--part <part-id>] [--order <number>]\n  slug: lowercase letters, digits and dashes, e.g. 20-p1-dex-amm')
  process.exit(1)
}
const parts = JSON.parse(readFileSync(join(root, 'src/content/parts.json'), 'utf8')).map((p) => p.id)
const part = opt('part', parts[parts.length - 1])
if (!parts.includes(part)) { console.error(`Unknown part "${part}". Known: ${parts.join(', ')} (add new ones to src/content/parts.json)`); process.exit(1) }
const order = opt('order', '999')
for (const lang of ['zh', 'en']) {
  const out = join(root, 'src/content/chapters', lang, `${slug}.mdx`)
  if (existsSync(out)) { console.error(`exists, not overwritten: ${out}`); continue }
  const tpl = readFileSync(join(root, 'templates', `chapter.${lang}.mdx`), 'utf8')
    .replace(/^part: .*$/m, `part: ${part}`)
    .replace(/^order: .*$/m, `order: ${order}`)
    .replace(/^# (Copy|复制|\(or|（或).*\n/gm, '')
  writeFileSync(out, tpl)
  console.log(`created ${out}`)
}
console.log('Status is "draft": preview with `npm run dev`; set status: published in BOTH files when ready.')
