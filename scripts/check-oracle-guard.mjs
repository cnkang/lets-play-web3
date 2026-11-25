#!/usr/bin/env node
// Fail-closed checks for the published local oracle toy.
// No wallet and no public-chain write. An optional local Anvil proves a wrong chain is refused.
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { assertChainId, assertGenesis, assertLoopbackUrl, assertNoFork, preflight } from '../labs/local-oracle/guard.mjs'

const root = new URL('..', import.meta.url).pathname
let failures = 0
const fail = (msg) => { failures++; console.error('✗ ' + msg) }
const refuses = (fn) => {
  try { fn(); return false } catch (error) { return String(error.message).startsWith('REFUSED:') }
}

if (!refuses(() => assertLoopbackUrl('https://sepolia.gateway.tenderly.co'))) fail('public https endpoint was accepted')
if (!refuses(() => assertLoopbackUrl('http://127.0.0.1:8545'))) fail('wrong loopback port was accepted')
if (!refuses(() => assertLoopbackUrl('http://localhost:18549'))) fail('localhost was accepted')
if (!refuses(() => assertLoopbackUrl('http://0.0.0.0:18549'))) fail('0.0.0.0 was accepted')
if (!refuses(() => assertChainId(1))) fail('chainId 1 was accepted')
if (!refuses(() => assertChainId('0x1'))) fail('hex chainId 1 was accepted')
if (!refuses(() => assertNoFork({ forkConfig: { forkUrl: 'https://sepolia.gateway.tenderly.co', forkBlockNumber: 12165973 } }))) {
  fail('fork node was accepted')
}
if (!refuses(() => assertGenesis(1n))) fail('non-genesis block was accepted')
try {
  assertLoopbackUrl('http://127.0.0.1:18549')
  assertChainId(31337)
  assertNoFork({})
  assertGenesis(0n)
} catch (error) {
  fail(`valid local node was refused: ${error.message}`)
}

let fetched = false
try {
  await preflight('https://example.invalid', () => { fetched = true; throw new Error('network') })
  fail('bad URL reached preflight')
} catch (error) {
  if (!String(error.message).startsWith('REFUSED:')) fail(`bad URL error was ${error.message}`)
}
if (fetched) fail('a non-loopback URL performed a network read')

const lab = join(root, 'labs/local-oracle')
const guardText = readFileSync(join(lab, 'guard.mjs'), 'utf8')
const runText = readFileSync(join(lab, 'run-lab.mjs'), 'utf8')
const shellText = readFileSync(join(lab, 'run.sh'), 'utf8')
const solText = readFileSync(join(lab, 'src/LocalOracleLab.sol'), 'utf8')
if (guardText.includes('eth_sendTransaction') || guardText.includes('eth_sendRawTransaction')) fail('guard source contains a send method')
if (!runText.includes('generatePrivateKey()')) fail('temporary in-memory account is missing')
if (/privateKey\s*[:=]\s*['"]0x[0-9a-fA-F]{64}/.test(runText + shellText + solText)) fail('a private key literal is present')
if (!shellText.includes('--accounts 0') || !shellText.includes('--silent') || !shellText.includes('--chain-id 31337')) {
  fail('Anvil is not started with --accounts 0 --silent --chain-id 31337')
}
if (!shellText.includes('127.0.0.1') || !shellText.includes('preflight')) fail('run.sh does not preflight the loopback endpoint')
if (!solText.includes('block.chainid == 31337')) fail('toy contracts do not require chainId 31337')

if (process.env.ORACLE_GUARD_INTEGRATION === '1') {
  const port = '18549'
  const anvil = spawn('anvil', ['--host', '127.0.0.1', '--port', port, '--chain-id', '1', '--accounts', '0', '--silent'], { stdio: 'ignore' })
  const stop = () => { anvil.kill('SIGTERM') }
  try {
    let ready = false
    for (let i = 0; i < 40; i++) {
      try {
        const response = await fetch(`http://127.0.0.1:${port}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] })
        })
        const body = await response.json()
        if (body.result === '0x1') { ready = true; break }
      } catch { /* node still starting */ }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    if (!ready) fail('wrong-chain Anvil did not start')
    else {
      let calls = []
      const spy = async (url, options) => {
        calls.push(JSON.parse(options.body).method)
        return fetch(url, options)
      }
      let refused = false
      try { await preflight(`http://127.0.0.1:${port}`, spy) } catch (error) {
        refused = String(error.message).startsWith('REFUSED:')
      }
      if (!refused) fail('wrong-chain loopback node was not refused')
      if (calls.some((method) => method.startsWith('eth_send'))) fail(`a write was sent to the wrong chain: ${calls.join(',')}`)
    }
  } finally {
    stop()
  }
}

if (failures) {
  console.error(`\noracle guard: ${failures} failure(s)`)
  process.exit(1)
}
console.log('oracle guard: loopback, chainId 31337 and no-fork checks refuse before any write. No wallet is required.')
