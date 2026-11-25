#!/usr/bin/env node
// Two checks, reported separately:
// 1. Bundled subset in docs/evidence/p2/. Always runs. A pass here is not a pass of the raw archive.
// 2. External teaching-evidence tree, only when P2_EVIDENCE_DIR points at that directory.
//    Unset => SKIPPED (not a pass). Set but incomplete => BLOCKED (not a pass).
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const bundledDir = join(root, 'docs/evidence/p2')
let failures = 0
const fail = (msg) => { failures++; console.error('✗ ' + msg) }

function percentMul(value, percentage) {
  return (value * BigInt(percentage) + 5000n) / 10000n
}
const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const rawInt = (text, key) => {
  const match = text.match(new RegExp(`"${key}"\\s*:\\s*"?(\\d+)"?`))
  if (!match) fail(`raw field ${key} not found`)
  return match?.[1]
}

function checkBundled() {
  const manifestPath = join(bundledDir, 'manifest.sha256')
  if (!existsSync(manifestPath)) fail('docs/evidence/p2/manifest.sha256 is missing')
  const lines = read(manifestPath).trim().split('\n').filter(Boolean)
  if (!lines.length) fail('manifest is empty')
  for (const line of lines) {
    const match = line.match(/^([a-f0-9]{64})  ([^/]+)$/)
    if (!match) { fail(`bad manifest line: ${line}`); continue }
    const file = join(bundledDir, match[2])
    if (!existsSync(file)) { fail(`manifest names missing ${match[2]}`); continue }
    const hash = createHash('sha256').update(readFileSync(file)).digest('hex')
    if (hash !== match[1]) fail(`${match[2]} sha256 ${hash} != manifest ${match[1]}`)
  }
  const classification = json(join(bundledDir, 'classification.json'))
  if (classification.anvilStateDump !== 'absent') fail('classification must say the Anvil state dump is absent')
  if (classification.archiveSha256 !== 'd5e801918f6333ecd4c80d192af6939d0601bdcbeea581b406ecc2897ebaf6e3') {
    fail('classification archive hash changed')
  }

  const p2a = json(join(bundledDir, 'p2a-readings.json'))
  const expectHf = {
    OPEN: '1319999677920078588',
    A_AFTER_DROP_BEFORE_LIQ: '923999549827419324',
    B_AFTER_DROP: '1319998301350757347',
    A2_AFTER_DROP: '973499525711031074'
  }
  for (const [state, value] of Object.entries(expectHf)) {
    if (p2a.states[state].healthFactor !== value) fail(`bundled P2A ${state} healthFactor`)
  }
  if (p2a.chainId !== 31337 || p2a.restoresChainState !== false) fail('bundled P2A is not marked as a non-restoring chainId 31337 excerpt')
  const full = p2a.transactions.find((tx) => tx.hash === '0x73f963d97d0fe20b67c859a76f0cd4cb766d08c7ce687a38a211bbd242e92cca')
  const cover = full?.events?.find((event) => event.args?.debtToCover === '2500002436')
  if (!cover) fail('bundled P2A full liquidation debtToCover is not 2500002436')

  const p2b = json(join(bundledDir, 'p2b-readings.json'))
  if (p2b.open.debt !== '2499999999') fail('bundled P2B opening debt changed')
  if (p2b.beforeRealV2.healthFactor !== '923999775283254651') fail('bundled P2B HF at 2800 changed')
  if (p2b.beforeRealV2.debt !== '2500000608' || p2b.beforeRealV2.aWETH !== '1000000000000000000') fail('bundled P2B pre-liquidation balances changed')
  const e1 = p2b.transactions.find((tx) => tx.hash === '0xa0db889ce08a99745b93b3904f6da2c2a48e12140bc805df7b2ee4670ca7e414')
  const flash = e1?.events?.find((event) => event.event === 'FlashLoan' && event.args?.premium === '500000' && event.args?.amount === '1000000000')
  if (!flash) fail('bundled E1 FlashLoan premium/amount does not match 1000 and 0.500000')
  if (e1.chainId !== 31337 && e1.chainId !== '31337') fail('bundled E1 chainId is not 31337')
  const rounded = p2b.rounding.find((row) => row.aWETHRoundingWei === '1' && row.kind === 'OBSERVED_SUCCESS')
  if (!rounded || rounded.grossSeizedWei !== '937500456375000000' || rounded.actualAWETHlossWei !== '937500456375000001') {
    fail('bundled P2B 1 wei rounding row does not match')
  }
  const premium = percentMul(1000000000n, Number(p2b.premiumBps))
  const protocol = percentMul(premium, Number(p2b.premiumProtocolBps))
  if (premium !== 500000n || protocol !== 200n || premium - protocol !== 499800n) {
    fail('bundled premium constants do not yield 0.000200 protocol and 0.499800 LP on a 1000 USDC loan')
  }

  const oracleText = read(join(bundledDir, 'oracle-readings.json'))
  const oracle = json(join(bundledDir, 'oracle-readings.json'))
  const oracleExpect = {
    debt: '8000000000000000000000',
    anchorShortfall: '5000000000000000000000',
    exitQuoteShortfall: '3714031198495643589346',
    profitAfterFeesBeforeGas: '3678345270534929823185',
    peakPrice: '3604869999999999999',
    endPrice: '2045236389923581453',
    initialPrice: '1000000000000000000'
  }
  for (const [key, value] of Object.entries(oracleExpect)) {
    if (oracle.integers[key] !== value || rawInt(oracleText, key) !== value) fail(`bundled oracle ${key}`)
  }
  if (oracle.assertions.noFork !== true || oracle.assertions.controlFailureExact !== 'BorrowLimit(8000e18,2250e18,1e18)') {
    fail('bundled oracle assertions no longer match the no-fork BorrowLimit control')
  }
  if (oracle.fork !== false || oracle.anvilStateDump !== 'absent') fail('bundled oracle must stay a no-fork excerpt with no state dump')

  for (const rel of [
    'src/content/chapters/zh/18-flash-loans.mdx',
    'src/content/chapters/en/18-flash-loans.mdx'
  ]) {
    const text = read(join(root, rel))
    for (const bit of ['0.000200', '0.499800', 'totalPremium.percentMul(4)']) {
      if (!text.includes(bit)) fail(`${rel} missing fee explanation ${bit}`)
    }
    if (text.includes('4 of those basis points') || text.includes('5 里面拿走 4')) {
      fail(`${rel} still describes the protocol share as four fifths of the 5 bps`)
    }
  }
  const linked = [
    ...readdirSync(join(root, 'src/content/chapters/zh')).filter((name) => /^(17|18|19|appendix-a)/.test(name)),
    ...readdirSync(join(root, 'src/content/chapters/en')).filter((name) => /^(17|18|19|appendix-a)/.test(name))
  ]
  for (const name of linked) {
    for (const lang of ['zh', 'en']) {
      const path = join(root, 'src/content/chapters', lang, name)
      if (!existsSync(path)) continue
      const text = read(path)
      if (/sepolia\.etherscan\.io\/tx\/0x[0-9a-fA-F]{64}/.test(text)) fail(`${lang}/${name} links a transaction hash to Sepolia Etherscan`)
    }
  }
  const digest = json(join(root, 'docs/evidence/p2-public-digest.json'))
  const fromRaw = {
    p2aOpenHealthFactor: '1.319999677920078588',
    p2aHealthFactorAt2800BeforeLiquidation: '0.923999549827419324',
    p2bOpenDebt: '2499999999',
    p2bDisplayedCollateralLossWei: '937500456375000001',
    oracleExitQuoteShortfall: '3714031198495643589346'
  }
  for (const [key, value] of Object.entries(fromRaw)) {
    if (digest.figures[key] !== value) fail(`public digest ${key} drifted from the raw reading`)
  }
  if (digest.verification?.notIncluded?.some((item) => /toy-contract source are not in this repository/i.test(item))) {
    fail('public digest still says the toy source is absent')
  }
}

function checkExternal(dir) {
  const need = [
    'web3-p2a-lending/evidence/run.json',
    'web3-p2b-flashloan/evidence/run.json',
    'web3-p2b-flashloan/evidence/reconcile.json',
    'web3-local-oracle-lab/evidence/reconciliation.json',
    'web3-local-oracle-lab/evidence/assertions.json',
    'web3-p2a-lending/sources/pool/@aave/core-v3/contracts/protocol/libraries/logic/FlashLoanLogic.sol',
    'web3-p2a-lending/sources/pool/@aave/core-v3/contracts/protocol/libraries/math/PercentageMath.sol'
  ]
  const file = (rel) => read(join(dir, rel))
  const data = (rel) => JSON.parse(file(rel))
  const flash = file(need[5])
  const percent = file(need[6])
  if (!flash.includes('params.totalPremium.percentMul(params.flashLoanPremiumToProtocol)')) {
    fail('FlashLoanLogic does not apply the protocol share to totalPremium')
  }
  if (!percent.includes('PERCENTAGE_FACTOR = 1e4')) fail('PercentageMath factor is not 1e4')
  const p2a = data(need[0])
  const bundledA = json(join(bundledDir, 'p2a-readings.json'))
  for (const state of Object.keys(bundledA.states).filter((name) => bundledA.states[name].healthFactor)) {
    if (p2a.states[state].A.uad.healthFactor !== bundledA.states[state].healthFactor) {
      fail(`external P2A ${state} does not match the bundled excerpt`)
    }
  }
  const p2b = data(need[1])
  const bundledB = json(join(bundledDir, 'p2b-readings.json'))
  if (p2b.states.OPEN.debt !== bundledB.open.debt) fail('external P2B opening debt does not match the bundled excerpt')
  const before = p2b.states['E3-REAL-UNISWAP-V2-2800-before']
  if (before.uad[5] !== bundledB.beforeRealV2.healthFactor || before.debt !== bundledB.beforeRealV2.debt) {
    fail('external P2B pre-liquidation state does not match the bundled excerpt')
  }
  const reconcile = data(need[2])
  const rounded = reconcile.find((row) => row.aWETHRoundingWei === '1' && row.kind === 'OBSERVED_SUCCESS')
  if (!rounded || rounded.grossSeizedWei !== '937500456375000000') fail('external P2B 1 wei rounding row does not match')
  const oracleText = file(need[3])
  const bundledOracle = read(join(bundledDir, 'oracle-readings.json'))
  for (const key of ['debt', 'anchorShortfall', 'exitQuoteShortfall', 'profitAfterFeesBeforeGas']) {
    if (rawInt(oracleText, key) !== rawInt(bundledOracle, key)) fail(`external oracle ${key} does not match the bundled excerpt`)
  }
  const assertions = data(need[4])
  if (assertions.noFork !== true || assertions.controlFailureExact !== 'BorrowLimit(8000e18,2250e18,1e18)') {
    fail('external oracle assertions no longer match the no-fork BorrowLimit control')
  }
}

checkBundled()
const dir = process.env.P2_EVIDENCE_DIR
const externalNeed = [
  'web3-p2a-lending/evidence/run.json',
  'web3-p2b-flashloan/evidence/run.json',
  'web3-p2b-flashloan/evidence/reconcile.json',
  'web3-local-oracle-lab/evidence/reconciliation.json',
  'web3-local-oracle-lab/evidence/assertions.json',
  'web3-p2a-lending/sources/pool/@aave/core-v3/contracts/protocol/libraries/logic/FlashLoanLogic.sol',
  'web3-p2a-lending/sources/pool/@aave/core-v3/contracts/protocol/libraries/math/PercentageMath.sol'
]
if (!dir) {
  if (!failures) {
    console.log('evidence: bundled subset PASSED. This checks the committed excerpts and manifest only.')
    console.log('evidence: external archive SKIPPED (set P2_EVIDENCE_DIR to the unpacked teaching-evidence directory). This is not a pass.')
  }
} else if (externalNeed.some((rel) => !existsSync(join(dir, rel)))) {
  fail(`external archive BLOCKED. P2_EVIDENCE_DIR=${dir} is missing required files. This is not a pass.`)
  console.log('evidence: external archive BLOCKED. Not a pass.')
} else {
  checkExternal(dir)
  if (!failures) console.log(`evidence: bundled subset PASSED, and external archive checked against ${dir}`)
}

if (failures) {
  console.error(`\nevidence: ${failures} mismatch(es)`)
  process.exit(1)
}
