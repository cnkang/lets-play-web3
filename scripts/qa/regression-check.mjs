// Small regression checks for the three reading-flow fixes:
//   1. Chapter 8 on-page TOC (published anchor, order, no-JS disclosure, anchor offset)
//   2. Search query competition (newest query wins, clear, language isolation)
//   3. Copy rapid clicks and retry after failure (label preserved)
// Run against a built site on :4399 with puppeteer-core available in a scratch folder.
// CHROME selects the browser; BASE_URL overrides the origin. Never deploys anything.
import puppeteer from 'puppeteer-core'

const B = process.env.BASE_URL ?? 'http://localhost:4399'
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME || '/usr/bin/google-chrome',
  args: ['--no-sandbox']
})
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let fails = 0
let checks = 0
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log('✗ ' + msg) } }

// ---- 1. Chapter 8 TOC, both editions ----
for (const lang of ['en', 'zh']) {
  const p = await browser.newPage()
  await p.setViewport({ width: 1280, height: 900 })
  await p.goto(`${B}/${lang}/chapters/08-lab-counter/`, { waitUntil: 'networkidle0' })
  const wide = await p.evaluate(() => {
    const d = document.querySelector('details.onpage')
    const links = [...d.querySelectorAll('a')]
    return {
      inspect: links.findIndex((a) => a.getAttribute('href') === '#inspect-a-transaction'),
      terminal: links.findIndex((a) => /终端|terminal/i.test(a.textContent || '')),
      first: links[0]?.getAttribute('href'),
      visible: d.querySelector('.onpage-nav').checkVisibility?.() ?? true
    }
  })
  ok(wide.inspect === 0 && wide.first === '#inspect-a-transaction', `${lang}: chapter TOC starts at #inspect-a-transaction`)
  ok(wide.terminal > wide.inspect, `${lang}: terminal subsection follows the shared anchor`)
  ok(wide.visible, `${lang}: TOC list visible at 1280px`)

  await p.setViewport({ width: 390, height: 760 })
  await sleep(120)
  const narrow = await p.evaluate(() => {
    const d = document.querySelector('details.onpage')
    return {
      open: d.open,
      summaryH: Math.round(d.querySelector('summary').getBoundingClientRect().height),
      hidden: !(d.querySelector('.onpage-nav').checkVisibility?.() ?? true)
    }
  })
  ok(!narrow.open && narrow.hidden, `${lang}: TOC collapsed by default at 390px`)
  ok(narrow.summaryH >= 44, `${lang}: disclosure target at least 44px`)
  await p.evaluate(() => document.querySelector('details.onpage summary').click())
  await sleep(80)
  ok(await p.evaluate(() => document.querySelector('details.onpage').open), `${lang}: summary opens without JavaScript`)

  await p.evaluate(() => document.querySelector('details.onpage a[href="#inspect-a-transaction"]').click())
  await sleep(350)
  const top = await p.evaluate(() => document.getElementById('inspect-a-transaction').getBoundingClientRect().top)
  ok(top >= 40 && top < 200, `${lang}: anchored heading clears the sticky header (top ${Math.round(top)})`)

  const switched = await p.evaluate(() => {
    const a = document.querySelector('.lang-switch')
    let captured = ''
    const handler = (e) => { e.preventDefault(); captured = a.getAttribute('href') }
    document.addEventListener('click', handler)
    a.click()
    document.removeEventListener('click', handler)
    return captured
  })
  ok(switched.endsWith('#inspect-a-transaction'), `${lang}: language switch carries the shared anchor`)
  await p.close()
}

// ---- 2. Search race and state ----
{
  const p = await browser.newPage()
  await p.setViewport({ width: 1280, height: 900 })
  await p.setRequestInterception(true)
  let slowed = 0
  p.on('request', (r) => {
    if (slowed < 3 && r.url().includes('/pagefind/')) { slowed++; setTimeout(() => r.continue().catch(() => {}), 250) }
    else r.continue().catch(() => {})
  })
  await p.goto(`${B}/en/search/`, { waitUntil: 'domcontentloaded' })
  await p.type('#q', 'counter')
  await sleep(260)
  await p.evaluate(() => {
    const i = document.getElementById('q')
    i.value = 'nonce'
    i.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await sleep(3000)
  const r = await p.evaluate(() => {
    const list = document.getElementById('search-results')
    return {
      status: document.getElementById('search-status').textContent,
      query: list.getAttribute('aria-label') || '',
      titles: [...list.querySelectorAll('a')].map((a) => a.textContent || ''),
      urls: [...list.querySelectorAll('a')].map((a) => a.getAttribute('href') || ''),
      fallback: document.querySelector('.search-fallback a')?.getAttribute('href')
    }
  })
  ok(r.titles.length > 0, 'search: results render')
  ok(/nonce/i.test(r.query) && !/counter/i.test(r.query), 'search: newest query wins the race')
  ok(!r.urls.length || r.urls.every((u) => u.includes('/en/')), 'search: results isolated to English')
  ok(!!r.fallback && r.fallback.includes('/en/'), 'search: clickable contents link is present')
  await p.evaluate(() => {
    const i = document.getElementById('q')
    i.value = ''
    i.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await sleep(500)
  ok(await p.evaluate(() => document.querySelectorAll('#search-results li').length === 0), 'search: clearing removes old results')
  await p.close()
}

// ---- 3. Copy rapid clicks and failure retry ----
{
  const p = await browser.newPage()
  await p.evaluateOnNewDocument(() => {
    window.__copied = []
    window.__rejectFirst = false
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (v) => {
          window.__copied.push(v)
          if (window.__rejectFirst) { window.__rejectFirst = false; return Promise.reject(new Error('denied')) }
          return new Promise((res) => { window.__resolveCopy = () => res() })
        }
      }
    })
    const realExec = document.execCommand.bind(document)
    document.execCommand = (cmd) => (window.__denyExec ? false : realExec(cmd))
  })
  await p.setViewport({ width: 1280, height: 900 })
  await p.goto(`${B}/en/chapters/08-lab-counter/`, { waitUntil: 'networkidle0' })
  const exact = await p.evaluate(() => [...document.querySelectorAll('.prose pre')].map((pre) => {
    const code = pre.querySelector('code')
    const btn = pre.previousElementSibling?.querySelector('.code-copy')
    return { solidity: /pragma solidity/.test(code?.textContent || ''), equal: btn?.dataset.copy === code?.textContent }
  }))
  ok(exact.some((x) => x.solidity && x.equal), 'copy: Solidity block copies exact text')
  ok(exact.some((x) => !x.solidity && x.equal), 'copy: Shell block copies exact text')

  await p.evaluate(() => {
    const b = document.querySelector('.code-copy')
    window.__labelBefore = b.textContent
    b.click(); b.click()
  })
  await sleep(60)
  await p.evaluate(() => { if (window.__resolveCopy) window.__resolveCopy() })
  await sleep(100)
  const after = await p.evaluate(() => {
    const b = document.querySelector('.code-copy')
    const live = [...document.querySelectorAll('[aria-live="polite"]')].map((x) => x.textContent || '').join(' ')
    return { label: b.textContent, before: window.__labelBefore, copied: b.classList.contains('is-copied'), live }
  })
  ok(after.label === after.before && after.label === 'Copy code', 'copy: rapid clicks keep the original label')
  ok(after.copied, 'copy: success mark appears')
  ok(after.live.length < 140, 'copy: announcement is short and does not read the code')
  await sleep(1700)
  ok(await p.evaluate(() => !document.querySelector('.code-copy').classList.contains('is-copied')), 'copy: success mark clears')

  await p.evaluate(() => { window.__rejectFirst = true; window.__denyExec = true; document.querySelector('.code-copy').click() })
  await sleep(120)
  const failed = await p.evaluate(() => {
    const b = document.querySelector('.code-copy')
    return { failed: b.classList.contains('is-failed'), label: b.textContent }
  })
  ok(failed.failed && failed.label === 'Copy code', 'copy: failure feedback keeps the original label')
  await p.evaluate(() => { window.__denyExec = false; document.querySelector('.code-copy').click(); if (window.__resolveCopy) window.__resolveCopy() })
  await sleep(120)
  ok(await p.evaluate(() => {
    const b = document.querySelector('.code-copy')
    return !b.classList.contains('is-failed') && b.classList.contains('is-copied')
  }), 'copy: retry after failure succeeds')
  await p.close()
}

console.log(`\n${checks} checks, ${fails} failed`)
await browser.close()
process.exit(fails ? 1 : 0)
