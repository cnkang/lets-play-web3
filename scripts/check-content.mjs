#!/usr/bin/env node
// Fast content check (no Astro needed), run before every build:
//  - every chapter exists in BOTH src/content/chapters/zh and /en with the same slug
//  - required frontmatter is present: title, description, part, order
//  - part / order / status are identical across the pair, part exists in parts.json
//  - status is one of published | upcoming | draft
// The same rules are enforced again inside the Astro build (src/data/chapters.ts).
// ALLOW_UNPAIRED=1 turns a missing translation into a warning.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const dir = join(root, 'src/content/chapters')
const langs = ['zh', 'en']
const parts = new Set(JSON.parse(readFileSync(join(root, 'src/content/parts.json'), 'utf8')).map((p) => p.id))
const allowUnpaired = process.env.ALLOW_UNPAIRED === '1'

function frontmatter(file) {
  const src = readFileSync(file, 'utf8')
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return null
  const data = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z]+):\s*(.*)$/)
    if (!kv) continue
    const v = kv[2].trim()
    const q = v.match(/^(["'])(.*?)\1/)
    data[kv[1]] = q ? q[2] : v.replace(/\s+#.*$/, '').trim()
  }
  return data
}

const errors = []
const warnings = []
const files = {}
for (const l of langs) {
  const d = join(dir, l)
  files[l] = existsSync(d) ? readdirSync(d).filter((f) => f.endsWith('.mdx')) : []
}
const slugs = new Set(langs.flatMap((l) => files[l].map((f) => f.replace(/\.mdx$/, ''))))
const orders = new Map()
for (const slug of [...slugs].sort()) {
  const have = langs.filter((l) => files[l].includes(`${slug}.mdx`))
  if (have.length !== langs.length) {
    const missing = langs.filter((l) => !have.includes(l)).map((l) => `src/content/chapters/${l}/${slug}.mdx`)
    ;(allowUnpaired ? warnings : errors).push(`"${slug}" has no translation: create ${missing.join(', ')} (copy templates/chapter.${missing[0].includes('/zh/') ? 'zh' : 'en'}.mdx)`)
    continue
  }
  const fm = Object.fromEntries(langs.map((l) => [l, frontmatter(join(dir, l, `${slug}.mdx`))]))
  for (const l of langs) {
    if (!fm[l]) { errors.push(`${l}/${slug}.mdx: missing frontmatter block`); continue }
    for (const k of ['title', 'description', 'part', 'order']) if (!fm[l][k]) errors.push(`${l}/${slug}.mdx: frontmatter "${k}" is required`)
    if (fm[l].status && !['published', 'upcoming', 'draft'].includes(fm[l].status)) errors.push(`${l}/${slug}.mdx: status must be published | upcoming | draft (got "${fm[l].status}")`)
    if (fm[l].part && !parts.has(fm[l].part)) errors.push(`${l}/${slug}.mdx: part "${fm[l].part}" is not in src/content/parts.json (known: ${[...parts].join(', ')})`)
  }
  if (fm.zh && fm.en) {
    for (const k of ['part', 'order', 'status']) {
      if ((fm.zh[k] ?? 'published') !== (fm.en[k] ?? 'published')) errors.push(`"${slug}": "${k}" differs (zh: ${fm.zh[k]}, en: ${fm.en[k]}); keep it identical in both languages`)
    }
    const key = `${fm.zh.part}:${fm.zh.order}`
    if (orders.has(key)) warnings.push(`"${slug}" and "${orders.get(key)}" share part+order ${key}; sorted by slug`)
    orders.set(key, slug)
  }
}
for (const w of warnings) console.warn(`⚠ ${w}`)
if (errors.length) {
  console.error(`✖ content check failed (${errors.length}):\n- ${errors.join('\n- ')}`)
  process.exit(1)
}
console.log(`content: ${slugs.size} chapters × ${langs.length} languages OK`)
