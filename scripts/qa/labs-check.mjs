#!/usr/bin/env node
// Browser checks for the three labs. Not a CI gate (needs Chrome).
// Serves nothing: pass BASE, default http://127.0.0.1:4399
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const base = process.env.BASE_URL || 'http://127.0.0.1:4399'
const chrome = process.env.CHROME || '/usr/local/bin/google-chrome'
const shots = process.env.SHOTS || '/tmp/lab-shots'
mkdirSync(shots, { recursive: true })
const failures = []
const fail = (message) => failures.push(message)

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage']
})

async function pageOf(width) {
  const page = await browser.newPage()
  await page.setViewport({ width, height: width < 500 ? 844 : 900 })
  await page.evaluateOnNewDocument(() => {
    window.__gtagCalls = 0
    window.gtag = () => { window.__gtagCalls += 1 }
  })
  page.on('pageerror', (error) => fail(`pageerror ${error.message}`))
  return page
}

async function open(page, path) {
  const response = await page.goto(base + path, { waitUntil: 'networkidle0' })
  if (!response || response.status() >= 400) fail(`${path} status ${response && response.status()}`)
}

function text(page, selector) {
  return page.$eval(selector, (node) => node.textContent.trim())
}

for (const width of [1280, 390]) {
  const page = await pageOf(width)
  await open(page, '/en/')
  const paths = await page.$$eval('a[data-path]', (nodes) => nodes.map((node) => node.dataset.path))
  if (paths.filter((item) => item === 'start').length < 1) fail('missing start path')
  if (!paths.includes('play') || !paths.includes('ai')) fail(`paths ${paths.join(',')}`)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (overflow > 1) fail(`home overflow ${overflow} at ${width}`)
  await page.screenshot({ path: `${shots}/home-en-${width}.png`, fullPage: false })
  await page.close()
}

{
  const page = await pageOf(1280)
  await open(page, '/en/labs/erc20-allowance/?events=local')
  const canonical = await page.$eval('link[rel="canonical"]', (node) => node.href)
  if (!canonical.endsWith('/en/labs/erc20-allowance/')) fail(`canonical ${canonical}`)
  const langs = await page.$$eval('link[hreflang]', (nodes) => nodes.map((node) => node.hreflang).sort())
  if (langs.join(',') !== 'en,x-default,zh-CN') fail(`hreflang ${langs.join(',')}`)
  await page.focus('#amount')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => document.querySelector('#feedback').textContent.includes('Balances did not change'))
  const holder = await text(page, '[data-balance="holder"]')
  if (holder !== '1,000') fail(`approve changed balance ${holder}`)
  await page.click('[data-action="spend"]')
  await page.waitForFunction(() => document.querySelector('[data-balance="holder"]').textContent === '600')
  if (await text(page, '#allowance') !== '0') fail('allowance after full spend')
  await page.click('[data-action="revoke"]')
  await page.waitForFunction(() => document.querySelector('#feedback').textContent.includes('still in the recipient'))
  if (await text(page, '[data-balance="spender"]') !== '400') fail('revoke returned tokens')
  await page.$eval('#amount', (node) => { node.value = '1.5' })
  await page.click('[data-action="approve"]')
  const errorHidden = await page.$eval('#error', (node) => node.hidden)
  if (errorHidden) fail('decimal input produced no error')
  const log = await page.evaluate(() => sessionStorage.getItem('lpw3_event_log') || '')
  if (!log.includes('lab_start') || !log.includes('lab_complete')) fail(`event log ${log}`)
  if (log.includes('1.5') || log.includes('400')) fail(`event log leaked input ${log}`)
  const gtagCalls = await page.evaluate(() => window.__gtagCalls)
  if (gtagCalls !== 0) fail(`gtag called ${gtagCalls} times in local mode`)
  await page.screenshot({ path: `${shots}/erc20-en-1280.png` })
  await page.setViewport({ width: 390, height: 844 })
  const narrow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (narrow > 1) fail(`erc20 mobile overflow ${narrow}`)
  await page.screenshot({ path: `${shots}/erc20-en-390.png` })
  await page.close()
}

{
  const page = await pageOf(390)
  await open(page, '/zh/labs/erc20-allowance/')
  const title = await text(page, 'h1')
  if (!title.includes('授权')) fail(`zh title ${title}`)
  await page.click('[data-action="unlimited"]')
  await page.waitForFunction(() => document.querySelector('#allowance').textContent.includes('无限'))
  const before = await text(page, '[data-balance="holder"]')
  await page.click('[data-action="spend"]')
  await page.waitForFunction(() => document.querySelector('#feedback').textContent.includes('无限'))
  if (await text(page, '#allowance') !== await text(page, '#allowance')) fail('allowance read')
  if (!(await text(page, '#allowance')).includes('无限')) fail('unlimited allowance shrank')
  if (before === await text(page, '[data-balance="holder"]')) fail('unlimited spend did not move a token')
  await page.screenshot({ path: `${shots}/erc20-zh-390.png` })
  await page.close()
}

{
  const page = await pageOf(1280)
  await open(page, '/en/labs/constant-product-amm/')
  await page.click('[data-action="small"]')
  await page.waitForFunction(() => document.querySelector('#impact').textContent.includes('%'))
  const smallImpact = await text(page, '#impact')
  await page.click('[data-action="large"]')
  await page.waitForFunction((previous) => document.querySelector('#impact').textContent !== previous, {}, smallImpact)
  const largeImpact = await text(page, '#impact')
  if (smallImpact === largeImpact) fail('price impact did not change with size')
  const estimated = await text(page, '#estimated')
  await page.$eval('#slippage', (node) => {
    node.value = '500'
    node.dispatchEvent(new Event('input', { bubbles: true }))
  })
  if (await text(page, '#estimated') !== estimated) fail('slippage changed the quote')
  await page.$eval('#slippage', (node) => { node.value = '10' })
  await page.click('[data-action="small"]')
  await page.waitForFunction(() => document.querySelector('#estimated').textContent !== '—')
  const quoted = await text(page, '#estimated')
  await page.click('#prior')
  await page.click('[data-action="execute"]')
  await page.waitForFunction(() => /did not run|没有执行/.test(document.querySelector('#feedback').textContent))
  if (await text(page, '#estimated') !== quoted) fail('rejection rewrote the quote')
  await page.click('[data-action="reset"]')
  await page.waitForFunction(() => document.querySelector('#estimated').textContent === '—')
  await page.screenshot({ path: `${shots}/amm-en-1280.png` })
  await page.setViewport({ width: 390, height: 844 })
  const narrow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (narrow > 1) fail(`amm mobile overflow ${narrow}`)
  await page.close()
}

{
  const page = await pageOf(1280)
  await open(page, '/en/labs/hash-chain/')
  await page.waitForFunction(() => !document.querySelector('#head').textContent.includes('…'))
  const original = await text(page, '#original-head')
  if (!/^[0-9a-f]{64}$/.test(original)) fail(`head ${original}`)
  await page.click('[data-action="tamper"]')
  await page.waitForFunction(() => document.querySelector('#feedback').textContent.includes('no longer matches'))
  const buttons = await page.$$('button')
  let clicked = false
  for (const button of buttons) {
    const label = await button.evaluate((node) => node.textContent)
    if (label.includes('every later block')) { await button.click(); clicked = true; break }
  }
  if (!clicked) fail('missing recalculate-forward button')
  await page.waitForFunction(() => document.querySelector('#feedback').textContent.includes('not consensus'))
  const head = await text(page, '#head')
  if (head === original) fail('rewrite kept the original head')
  await page.keyboard.press('Tab')
  const visible = await page.evaluate(() => {
    const active = document.activeElement
    if (!active) return false
    const style = getComputedStyle(active)
    return style.outlineStyle !== 'none' || active.matches('a, button, input, textarea, select')
  })
  if (!visible) fail('tab focus missing')
  await page.screenshot({ path: `${shots}/hash-en-1280.png` })
  await page.setViewport({ width: 390, height: 844 })
  const narrow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (narrow > 1) fail(`hash mobile overflow ${narrow}`)
  await page.screenshot({ path: `${shots}/hash-en-390.png` })
  await page.close()
}

{
  const page = await pageOf(1280)
  await open(page, '/zh/labs/hash-chain/')
  await page.waitForFunction(() => document.querySelector('#feedback').textContent.includes('链头'))
  await page.close()
}

{
  const page = await pageOf(1280)
  await open(page, '/en/learn-with-ai/?events=local')
  const prompts = await page.$$eval('pre[id$="-text"]', (nodes) => nodes.length)
  if (prompts !== 5) fail(`prompt count ${prompts}`)
  await page.click('button[data-track="prompt_copy"]')
  await page.waitForFunction(() => (sessionStorage.getItem('lpw3_event_log') || '').includes('prompt_copy'))
  const log = await page.evaluate(() => sessionStorage.getItem('lpw3_event_log'))
  if (log.includes('seed phrase') || log.includes('Learning objective')) fail('prompt body leaked into analytics')
  await page.close()
}

await browser.close()
if (failures.length) {
  console.error(failures.map((item) => `✗ ${item}`).join('\n'))
  process.exit(1)
}
console.log(`labs-check: desktop and mobile interactions OK; shots in ${shots}`)
