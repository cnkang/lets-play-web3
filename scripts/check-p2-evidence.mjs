#!/usr/bin/env node
// Optional check against the owner's unpacked teaching-evidence directory.
// Set P2_EVIDENCE_DIR to that directory (the folder that contains web3-p2a-lending/).
// If the directory is missing, this prints SKIPPED and exits 0. That is not a pass.
// It does not run a chain, and it does not accept private-key files.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const dir = process.env.P2_EVIDENCE_DIR
const need = [
  'web3-p2a-lending/evidence/run.json',
  'web3-p2b-flashloan/evidence/run.json',
  'web3-p2b-flashloan/evidence/reconcile.json',
  'web3-local-oracle-lab/evidence/reconciliation.json',
  'web3-local-oracle-lab/evidence/assertions.json',
  'web3-p2a-lending/sources/pool/@aave/core-v3/contracts/protocol/libraries/logic/FlashLoanLogic.sol',
  'web3-p2a-lending/sources/pool/@aave/core-v3/contracts/protocol/libraries/math/PercentageMath.sol'
]

if (!dir || need.some((rel) => !existsSync(join(dir, rel)))) {
  console.log('evidence: SKIPPED (set P2_EVIDENCE_DIR to the unpacked teaching-evidence directory). This is not a pass.')
  process.exit(0)
}

const read = (rel) => readFileSync(join(dir, rel), 'utf8')
const json = (rel) => JSON.parse(read(rel))
const rawInt = (text, key) => {
  const m = text.match(new RegExp(`"${key}"\\s*:\\s*(\\d+)`))
  if (!m) fail(`raw field ${key} not found`)
  return m?.[1]
}
let failures = 0
const fail = (msg) => { failures++; console.error('✗ ' + msg) }

// Aave PercentageMath.percentMul: (value * percentage + 5000) / 10000
function percentMul(value, percentage) {
  return (value * BigInt(percentage) + 5000n) / 10000n
}

const flash = read(need[5])
const percent = read(need[6])
if (!flash.includes('params.totalPremium.percentMul(params.flashLoanPremiumToProtocol)')) {
  fail('FlashLoanLogic does not apply the protocol share to totalPremium')
}
if (!percent.includes('PERCENTAGE_FACTOR = 1e4')) fail('PercentageMath factor is not 1e4')

const premium = percentMul(1000000000n, 5)
const protocol = percentMul(premium, 4)
const lp = premium - protocol
if (premium !== 500000n) fail(`1000 USDC total premium is ${premium}, expected 500000`)
if (protocol !== 200n) fail(`protocol share is ${protocol}, expected 200 (0.000200 USDC)`)
if (lp !== 499800n) fail(`LP share is ${lp}, expected 499800 (0.499800 USDC)`)

const p2a = json(need[0])
const hf = (state) => p2a.states[state].A.uad.healthFactor
const expectHf = {
  OPEN: '1319999677920078588',
  A_AFTER_DROP_BEFORE_LIQ: '923999549827419324',
  B_AFTER_DROP: '1319998301350757347',
  A2_AFTER_DROP: '973499525711031074'
}
for (const [state, value] of Object.entries(expectHf)) {
  if (hf(state) !== value) fail(`P2A ${state} healthFactor ${hf(state)} != ${value}`)
}

const p2b = json(need[1])
const before = p2b.states['E3-REAL-UNISWAP-V2-2800-before']
if (p2b.states.OPEN.debt !== '2499999999') fail('P2B opening debt changed')
if (before.uad[5] !== '923999775283254651') fail('P2B HF at 2800 changed')
if (before.debt !== '2500000608') fail('P2B debt at 2800 changed')
if (before.aWETH !== '1000000000000000000') fail('P2B collateral changed before liquidation')
const e1 = p2b.txs.find((tx) => tx.hash === '0xa0db889ce08a99745b93b3904f6da2c2a48e12140bc805df7b2ee4670ca7e414')
const flashEvent = e1?.events?.find((event) => event.event === 'FlashLoan' && event.args?.premium === '500000' && event.args?.amount === '1000000000')
if (!flashEvent) fail('E1 FlashLoan event premium/amount does not match 1000 and 0.500000')

const reconcile = json(need[2])
const rounded = reconcile.find((row) => row.aWETHRoundingWei === '1' && row.kind === 'OBSERVED_SUCCESS')
if (!rounded || rounded.grossSeizedWei !== '937500456375000000' || rounded.actualAWETHlossWei !== '937500456375000001') {
  fail('P2B 1 wei rounding row does not match')
}

const oracleText = read(need[3])
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
  if (rawInt(oracleText, key) !== value) fail(`oracle ${key} is ${rawInt(oracleText, key)}, expected ${value}`)
}
const assertions = json(need[4])
if (assertions.noFork !== true || assertions.controlFailureExact !== 'BorrowLimit(8000e18,2250e18,1e18)') {
  fail('oracle assertions no longer match the no-fork BorrowLimit control')
}

const chapters = [
  'src/content/chapters/zh/18-flash-loans.mdx',
  'src/content/chapters/en/18-flash-loans.mdx'
]
for (const rel of chapters) {
  const text = readFileSync(join(root, rel), 'utf8')
  for (const bit of ['0.000200', '0.499800', 'totalPremium.percentMul(4)']) {
    if (!text.includes(bit)) fail(`${rel} missing fee explanation ${bit}`)
  }
  if (text.includes('4 of those basis points') || text.includes('5 里面拿走 4')) {
    fail(`${rel} still describes the protocol share as four fifths of the 5 bps`)
  }
}
for (const rel of [
  'src/content/chapters/zh/17-lending-liquidation.mdx',
  'src/content/chapters/en/17-lending-liquidation.mdx',
  'src/content/chapters/zh/18-flash-loans.mdx',
  'src/content/chapters/en/18-flash-loans.mdx',
  'src/content/chapters/zh/19-oracle-safety.mdx',
  'src/content/chapters/en/19-oracle-safety.mdx'
]) {
  const text = readFileSync(join(root, rel), 'utf8')
  if (/sepolia\.etherscan\.io\/tx\/0x[0-9a-fA-F]{64}/.test(text)) {
    fail(`${rel} links a transaction hash to Sepolia Etherscan`)
  }
}

const digest = JSON.parse(readFileSync(join(root, 'docs/evidence/p2-public-digest.json'), 'utf8'))
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

if (failures) {
  console.error(`\nevidence: ${failures} mismatch(es) against ${dir}`)
  process.exit(1)
}
console.log(`evidence: checked flash-loan rounding, P2A/P2B JSON, oracle reconciliation and chapter wording against ${dir}`)
