#!/usr/bin/env node
// Dependency-free checks of static output. Run after build with the SAME public
// SITE_URL / BASE. No server, wallet, RPC or external network requests are used.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
try { process.loadEnvFile?.(join(root, '.env')) } catch {}
const dist = process.env.DIST || join(root, 'dist')
const origin = new URL(process.env.SITE_URL || 'http://localhost:4321').origin
const segment = (process.env.BASE || '/').replace(/^\/+|\/+$/g, '')
const base = segment ? `/${segment}/` : '/'
const absolute = (path = '') => origin + base + path
const errors = new Set()
const fail = (where, message) => errors.add(`${where}: ${message}`)
const read = (file) => readFileSync(file, 'utf8')
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
const cache = new Map()
let references = 0

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name)
    return e.isDirectory() ? walk(path) : [path]
  })
}
function attrs(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)].map((m) => [m[1], decode(m[3])]))
}
function checkRef(value, from, where) {
  if (!value || /^(data:|mailto:|tel:|javascript:)/i.test(value)) return
  let url
  try { url = new URL(value, from) } catch { fail(where, `invalid URL ${value}`); return }
  if (url.origin !== origin) return
  references++
  if (!url.pathname.startsWith(base)) { fail(where, `URL escapes BASE=${base}: ${value}`); return }
  let path
  try { path = decodeURIComponent(url.pathname.slice(base.length)) } catch { fail(where, `invalid path ${value}`); return }
  let file = join(dist, path)
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!existsSync(file)) { fail(where, `missing local target ${value}`); return }
  if (url.hash && url.hash !== '#' && file.endsWith('.html')) {
    let id
    try { id = decodeURIComponent(url.hash.slice(1)).split(':~:text=')[0] } catch { fail(where, `invalid fragment ${value}`); return }
    if (!id) return
    if (!cache.has(file)) cache.set(file, new Set([...read(file).matchAll(/\bid\s*=\s*(["'])(.*?)\1/gs)].map((m) => decode(m[2]))))
    if (!cache.get(file).has(id)) fail(where, `missing fragment ${value}`)
  }
}

if (!existsSync(join(dist, 'index.html'))) {
  console.error(`✗ No build at ${dist}; run npm run build first`)
  process.exit(1)
}
const files = walk(dist)
const html = files.filter((f) => f.endsWith('.html'))
for (const file of html) {
  const rel = relative(dist, file).split('\\').join('/')
  const path = rel.replace(/index\.html$/, '')
  const page = absolute(path)
  const source = read(file)
  const tags = [...source.matchAll(/<(a|link|img|script|source|meta)\b[^>]*>/gs)].map((m) => ({ tag: m[1], a: attrs(m[0]) }))
  for (const { a } of tags) {
    for (const key of ['href', 'src']) if (a[key]) checkRef(a[key], page, rel)
    if (['og:url', 'og:image', 'twitter:image'].includes(a.property || a.name)) checkRef(a.content, page, rel)
  }
  // Keep the existing Chinese x-default and root canonical policy unchanged.
  if (rel !== '404.html') {
    const route = path.replace(/^(zh|en)\//, '')
    const wantCanonical = path ? page : absolute('zh/')
    const canonical = tags.filter(({ a }) => a.rel === 'canonical')
    if (canonical.length !== 1 || canonical[0].a.href !== wantCanonical) fail(rel, `canonical must be ${wantCanonical}`)
    const noindex = tags.some(({ a }) => a.name === 'robots' && a.content?.includes('noindex'))
    for (const [lang, target] of [['zh-CN', 'zh/'], ['en', 'en/'], ['x-default', 'zh/']]) {
      const links = tags.filter(({ tag, a }) => tag === 'link' && a.rel === 'alternate' && a.hreflang === lang)
      if (noindex ? links.length !== 0 : links.length !== 1 || links[0].a.href !== absolute(target + route)) fail(rel, `incorrect ${lang} alternate`)
    }
  }
  for (const m of source.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const visit = (v) => {
        if (typeof v === 'string' && /^https?:/.test(v)) checkRef(v, page, `${rel} JSON-LD`)
        else if (v && typeof v === 'object') Object.values(v).forEach(visit)
      }
      visit(JSON.parse(m[1]))
    } catch { fail(rel, 'invalid JSON-LD') }
  }
}
for (const file of files.filter((f) => f.endsWith('.css'))) {
  const from = absolute(relative(dist, file).split('\\').join('/'))
  for (const m of read(file).matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)) checkRef(m[1], from, relative(dist, file))
}
for (const name of ['sitemap.xml', 'robots.txt', 'llms.txt', 'llms-full.txt']) {
  const file = join(dist, name)
  if (!existsSync(file)) { fail(name, 'missing generated file'); continue }
  const source = read(file)
  if (name === 'sitemap.xml') for (const m of source.matchAll(/<loc>(.*?)<\/loc>/g)) checkRef(decode(m[1]), absolute(name), name)
  if (name === 'robots.txt' && !source.split(/\r?\n/).includes(`Sitemap: ${absolute('sitemap.xml')}`)) fail(name, 'incorrect Sitemap URL')
  if (name.startsWith('llms')) for (const m of source.matchAll(/https?:\/\/[^\s)<>"`]+/g)) checkRef(m[0], absolute(name), name)
}
if (errors.size) {
  console.error(`✗ build check failed (${errors.size}):\n- ${[...errors].join('\n- ')}`)
  process.exit(1)
}
console.log(`build: ${html.length} HTML pages, ${references} local references OK; BASE=${base}; canonical, hreflang, JSON-LD, sitemap, robots and llms links OK`)
