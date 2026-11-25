#!/usr/bin/env node
// Fast content check (no Astro needed), run before every build:
//  - every chapter exists in BOTH src/content/chapters/zh and /en with the same slug
//  - required frontmatter is present: title, description, part, order
//  - part / order / status are identical across the pair, part exists in parts.json
//  - status is one of published | upcoming | draft
// The same rules are enforced again inside the Astro build (src/data/chapters.ts).
//  - glossary (src/content/glossary.json): every term has zh + en { term, def },
//    an optional `chapter` that exists; every <Term id="…"> used in chapters,
//    pages and components exists; a term id is marked at most once per MDX file;
//    <Term> is never inside a heading, link text or code fence
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

// `snapshot:` is a nested block, so the flat parser above sees only an empty string.
// Both languages must carry the same snapshot: the values are facts, not translation.
function snapshotBlock(file) {
  const src = readFileSync(file, 'utf8')
  const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!fm) return ''
  const m = fm[1].match(/^snapshot:[ \t]*\r?\n((?:[ \t]+\S.*(?:\r?\n|$))+)/m)
  return m ? m[1].replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim().replace(/\s*\n\s*/g, ' ') : ''
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
    const snaps = Object.fromEntries(langs.map((l) => [l, snapshotBlock(join(dir, l, `${slug}.mdx`))]))
    if (snaps.zh !== snaps.en) errors.push(`"${slug}": "snapshot" differs (zh: ${snaps.zh || 'none'}, en: ${snaps.en || 'none'}); keep it identical in both languages`)
    for (const k of ['part', 'order', 'status', 'lab']) {
      if ((fm.zh[k] ?? (k === 'status' ? 'published' : '')) !== (fm.en[k] ?? (k === 'status' ? 'published' : ''))) errors.push(`"${slug}": "${k}" differs (zh: ${fm.zh[k]}, en: ${fm.en[k]}); keep it identical in both languages`)
    }
    const lab = fm.zh.lab || ''
    if (lab && !['sepolia', 'anvil-fork', 'anvil-local'].includes(lab)) errors.push(`"${slug}": lab must be sepolia, anvil-fork or anvil-local`)
    if (lab === 'anvil-fork' && !snaps.zh) errors.push(`"${slug}": lab anvil-fork needs a snapshot block (the fork source, not a public broadcast)`)
    if (lab === 'anvil-local' && snaps.zh) errors.push(`"${slug}": lab anvil-local must not set a chain snapshot`)
    const key = `${fm.zh.part}:${fm.zh.order}`
    if (orders.has(key)) warnings.push(`"${slug}" and "${orders.get(key)}" share part+order ${key}; sorted by slug`)
    orders.set(key, slug)
  }
}
// ---- Glossary terms (<Term id="…">) ----
const glossaryPath = join(root, 'src/content/glossary.json')
let glossary = {}
try {
  glossary = JSON.parse(readFileSync(glossaryPath, 'utf8'))
} catch (e) {
  errors.push(`src/content/glossary.json: cannot parse (${e.message})`)
}
for (const [id, e] of Object.entries(glossary)) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) errors.push(`glossary "${id}": ids are lowercase letters, digits and hyphens`)
  for (const l of langs) {
    if (!e[l] || typeof e[l].term !== 'string' || !e[l].term.trim() || typeof e[l].def !== 'string' || !e[l].def.trim())
      errors.push(`glossary "${id}": missing ${l}.term or ${l}.def (every term needs both languages)`)
  }
  if (e.chapter !== undefined && !slugs.has(e.chapter)) errors.push(`glossary "${id}": chapter "${e.chapter}" does not exist in src/content/chapters`)
}
function walkFiles(d, ext, out = []) {
  if (!existsSync(d)) return out
  for (const name of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, name.name)
    if (name.isDirectory()) walkFiles(p, ext, out)
    else if (ext.some((x) => name.name.endsWith(x))) out.push(p)
  }
  return out
}
const termFiles = [...walkFiles(join(root, 'src/content'), ['.mdx']), ...walkFiles(join(root, 'src/components'), ['.astro']), ...walkFiles(join(root, 'src/pages'), ['.astro']), ...walkFiles(join(root, 'templates'), ['.mdx'])]
let termUses = 0
const usedIds = new Set()
for (const f of termFiles) {
  const rel = f.slice(root.length)
  // Blank out MDX / JS comments (keeping line numbers) so examples in comments are ignored.
  const src = readFileSync(f, 'utf8').replace(/\{\/\*[\s\S]*?\*\/\}|\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, (c) => c.replace(/[^\n]/g, ' '))
  const seen = new Set()
  let inFence = false
  src.split(/\r?\n/).forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return }
    const re = /<Term\s+id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/Term>/g
    let m
    while ((m = re.exec(line))) {
      termUses++
      const id = m[1]
      usedIds.add(id)
      const where = `${rel}:${i + 1}`
      if (!glossary[id]) errors.push(`${where}: <Term id="${id}"> is not in src/content/glossary.json`)
      if (inFence) errors.push(`${where}: <Term> inside a code block`)
      if (/^\s*#{1,6}\s/.test(line)) errors.push(`${where}: <Term> inside a heading (headings feed the contents list)`)
      const before = line.slice(0, m.index)
      if (/\[[^\]]*$/.test(before) && /^[^\[]*\]\(/.test(line.slice(m.index + m[0].length))) errors.push(`${where}: <Term> inside link text`)
      if (/<a\s[^>]*>(?![\s\S]*<\/a>)/.test(before)) errors.push(`${where}: <Term> inside a link`)
      if (f.endsWith('.mdx')) {
        if (seen.has(id)) errors.push(`${where}: <Term id="${id}"> appears more than once in this file; mark only the first occurrence`)
        seen.add(id)
      }
    }
  })
}
const unused = Object.keys(glossary).filter((id) => !usedIds.has(id))
for (const w of warnings) console.warn(`⚠ ${w}`)
if (errors.length) {
  console.error(`✖ content check failed (${errors.length}):\n- ${errors.join('\n- ')}`)
  process.exit(1)
}
const appendixCount = [...slugs].filter((slug) => slug.startsWith('appendix-')).length
const chapterCount = slugs.size - appendixCount
console.log(`content: ${chapterCount} chapters + ${appendixCount} appendices × ${langs.length} languages OK; glossary: ${Object.keys(glossary).length} terms, ${termUses} <Term> uses${unused.length ? ` (listed in Appendix C only: ${unused.join(', ')})` : ''}`)
