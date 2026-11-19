#!/usr/bin/env node
// Fact & secret guard for the guide.
// 1. Every 0x address (40 hex) and 0x hash (64 hex) in the book content, data
//    and diagrams must appear verbatim (case-insensitive) in the lab sources.
//    Sources live outside this repo; point SOURCES_DIR at the sandbox repo and
//    P1_SOURCES_DIR at the Phase-1 swap/LP lab folder (Chapter 16).
//    If the sources are absent (e.g. in CI), the fact check is skipped.
// 2. A secret scan that always runs: no private-key blocks, no .env files,
//    no long hex strings outside the known set, no API-key-looking literals.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { execSync } from 'node:child_process'

const root = new URL('..', import.meta.url).pathname
const SOURCES_DIR = process.env.SOURCES_DIR || '/workspace/web3-sandbox'
const P1_SOURCES_DIR = process.env.P1_SOURCES_DIR || '/workspace/web3-p1a-swap'
const sourceFiles = [
  join(SOURCES_DIR, '实验记录.md'),
  join(SOURCES_DIR, 'docs/新手指南-账号凭证与API密钥.md'),
  ...(existsSync(join(SOURCES_DIR, 'reports/p0'))
    ? readdirSync(join(SOURCES_DIR, 'reports/p0')).map((f) => join(SOURCES_DIR, 'reports/p0', f))
    : []),
  process.env.WORD_TEXT || '/tmp/user-record-review.txt',
  // Phase-1 DeFi lab records (Chapter 16). Point P1_SOURCES_DIR at the swap/LP lab folder.
  join(P1_SOURCES_DIR, 'P1A-SWAP-REPORT.md'),
  join(P1_SOURCES_DIR, 'P19-ODD-POOL-ARBITRAGE.md'),
  ...(existsSync(join(P1_SOURCES_DIR, 'out'))
    ? readdirSync(join(P1_SOURCES_DIR, 'out')).filter((f) => f.endsWith('.json')).map((f) => join(P1_SOURCES_DIR, 'out', f))
    : [])
].filter((f) => existsSync(f) && statSync(f).isFile())

function walk(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    if (['node_modules', 'dist', '.git', '.astro'].includes(name)) continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, out)
    else if (/\.(mdx?|astro|ts|mjs|js|svg|py|json|toml|yml|yaml|txt|css|html)$/.test(name)) out.push(p)
  }
  return out
}

const files = walk(root).filter((f) => !f.endsWith('package-lock.json'))
let failures = 0
const fail = (msg) => { failures++; console.error('✗ ' + msg) }

// ---- 1. facts
const hexRe = /0x[0-9a-fA-F]{64}|0x[0-9a-fA-F]{40}/g
if (sourceFiles.length) {
  const corpus = sourceFiles.map((f) => readFileSync(f, 'utf8')).join('\n').toLowerCase()
  let checked = 0
  for (const f of files) {
    if (!/src\/|public\/diagrams|scripts\//.test(f)) continue
    const text = readFileSync(f, 'utf8')
    for (const m of text.matchAll(hexRe)) {
      // ignore longer runs (e.g. bytecode) that merely start with a match
      const after = text[m.index + m[0].length]
      if (after && /[0-9a-fA-F]/.test(after)) continue
      checked++
      if (!corpus.includes(m[0].toLowerCase())) fail(`${relative(root, f)}: ${m[0]} not found in sources`)
    }
  }
  console.log(`facts: ${checked} hex values checked against ${sourceFiles.length} source files`)
} else {
  console.log('facts: sources not found, skipping (set SOURCES_DIR to enable)')
}

// ---- 2. secrets
const secretPatterns = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'PEM private key'],
  [/\b(PRIVATE_KEY|MNEMONIC|SEED_PHRASE)\s*=\s*\S{8,}/i, 'private key / mnemonic assignment'],
  [/\bETHERSCAN_API_KEY\s*=\s*['"]?[A-Z0-9]{30,}/, 'Etherscan API key literal'],
  [/\b(gh[pousr]_[A-Za-z0-9]{30,})\b/, 'GitHub token'],
  [/\bsk-[A-Za-z0-9]{20,}\b/, 'API secret key']
]
for (const f of files) {
  const text = readFileSync(f, 'utf8')
  for (const [re, what] of secretPatterns) if (re.test(text)) fail(`${relative(root, f)}: looks like a ${what}`)
}
// .env files must never be tracked by Git (a local, ignored .env is fine)
try {
  const tracked = execSync('git ls-files', { cwd: root, encoding: 'utf8' }).split('\n')
  for (const t of tracked) if (/(^|\/)\.env(\..+)?$/.test(t) && !t.endsWith('.env.example')) fail(`${t}: .env file is tracked by Git`)
  for (const t of tracked) if (/(^|\/)\.secrets\/|\.(pem|key|p12)$/.test(t)) fail(`${t}: secret-looking file is tracked by Git`)
} catch { /* not a git checkout */ }

if (failures) { console.error(`\n${failures} problem(s) found`); process.exit(1) }
console.log('secrets: no secrets found\nOK')
