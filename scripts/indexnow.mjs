import { createHash } from 'node:crypto'
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const currentFile = '.indexnow/current.json'
const previousFile = '.indexnow/submitted.json'
const digest = (value) => createHash('sha256').update(value).digest('hex')

async function run() {
  const key = process.env.INDEXNOW_KEY?.trim()
  if (!key) {
    console.log('IndexNow skipped: INDEXNOW_KEY is unset.')
    return
  }
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(key)) throw new Error('Invalid INDEXNOW_KEY format.')

  const site = new URL(process.env.SITE_URL)
  if (site.protocol !== 'https:') throw new Error('IndexNow requires the HTTPS deployment URL.')
  const segment = (process.env.BASE || '/').replace(/^\/+|\/+$/g, '')
  const base = segment ? `/${segment}/` : '/'
  const keyName = `${key}.txt`
  const keyLocation = new URL(`${base}${keyName}`, site.origin).href

  if (process.argv[2] === 'prepare') {
    const sitemap = readFileSync('dist/sitemap.xml', 'utf8')
    const entries = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => {
      const url = new URL(loc.replace(/&amp;/g, '&'))
      if (url.origin !== site.origin || !url.pathname.startsWith(base)) throw new Error('Sitemap URL is outside the deployment scope.')
      const path = decodeURIComponent(url.pathname.slice(base.length))
      const html = readFileSync(join('dist', path, 'index.html'), 'utf8')
      const main = html.match(/<main\b[^>]*>[\s\S]*?<\/main>/)?.[0]
      if (!main) throw new Error(`Missing main content for ${url.pathname}.`)
      const title = html.match(/<title>[\s\S]*?<\/title>/)?.[0]
      const description = html.match(/<meta\s+name="description"[^>]*>/)?.[0]
      return [url.href, digest(JSON.stringify([title, description, main]))]
    })
    if (!entries.length) throw new Error('No indexable URLs found in the built sitemap.')

    mkdirSync('.indexnow', { recursive: true })
    writeFileSync(currentFile, JSON.stringify(Object.fromEntries(entries)))
    writeFileSync(join('dist', keyName), key)
    appendFileSync(process.env.GITHUB_OUTPUT, `scope=${digest(site.origin + base)}\n`)
    return
  }

  if (process.argv[2] !== 'notify') throw new Error('Expected IndexNow command: prepare or notify.')
  const current = JSON.parse(readFileSync(currentFile, 'utf8'))
  const previous = existsSync(previousFile) ? JSON.parse(readFileSync(previousFile, 'utf8')) : {}
  const urls = [...new Set([...Object.keys(current), ...Object.keys(previous)])]
  const changed = urls.filter((url) => current[url] !== previous[url])
  if (!changed.length) {
    console.log('IndexNow skipped: no indexable content changes.')
    return
  }

  // Pages may take a few seconds to serve a newly deployed key file.
  let keyReady = false
  for (let attempt = 0; attempt < 6 && !keyReady; attempt++) {
    if (attempt) await delay(5000)
    try {
      const response = await fetch(keyLocation, { redirect: 'error', signal: AbortSignal.timeout(5000) })
      keyReady = response.ok && (await response.text()).trim() === key
    } catch {
      // Retry transient network failures while the new deployment propagates.
    }
  }
  if (!keyReady) throw new Error('The IndexNow verification file is not reachable on the deployed site.')

  for (let offset = 0; offset < changed.length; offset += 10_000) {
    const urlList = changed.slice(offset, offset + 10_000)
    let response
    try {
      response = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ host: site.hostname, key, keyLocation, urlList }),
        redirect: 'error',
        signal: AbortSignal.timeout(15_000)
      })
    } catch {
      throw new Error('IndexNow request failed before receiving a response.')
    }
    if (response.status !== 200 && response.status !== 202) throw new Error(`IndexNow returned HTTP ${response.status}.`)
    console.log(`IndexNow accepted ${urlList.length} URL(s), HTTP ${response.status}.`)
  }

  writeFileSync(previousFile, JSON.stringify(current))
  appendFileSync(process.env.GITHUB_OUTPUT, 'submitted=true\n')
}

await run()
