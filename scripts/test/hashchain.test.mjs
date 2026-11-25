import { assess, buildChain, canonical, createGeneration, emptyProgress, expectedHashes, GENESIS, headOf, observe, recalculateFrom, replaceData, SAMPLE, sha256Hex, TAMPER } from '../../src/lib/labs/hashchain.mjs'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'

function nodeSha(text) {
  return createHash('sha256').update(text).digest('hex')
}

test('Web Crypto SHA-256 matches the known abc vector and Node crypto', async () => {
  const abc = await sha256Hex('abc')
  assert.equal(abc, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  assert.equal(abc, nodeSha('abc'))
  const payload = canonical(2, GENESIS, '分')
  assert.match(payload, /\n3\n分$/)
  assert.equal(await sha256Hex(payload), nodeSha(payload))
})

test('editing one block breaks that hash and leaves later blocks on the old link', async () => {
  const original = await buildChain(SAMPLE.en)
  const originalHead = headOf(original)
  const valid = assess(original, (await expectedHashes(original)).hashes)
  assert.ok(valid.every((row) => row.valid))
  const edited = replaceData(original, 1, TAMPER.en)
  const hashes = (await expectedHashes(edited)).hashes
  const rows = assess(edited, hashes)
  assert.equal(rows[0].valid, true)
  assert.equal(rows[1].contentOk, false)
  assert.equal(rows[1].linkOk, true)
  assert.equal(rows[2].valid, true)
  assert.equal(headOf(edited), originalHead)
  assert.notEqual(hashes[1], original[1].storedHash)
})

test('recalculating forward makes a new valid head and is not the original chain', async () => {
  const original = await buildChain(SAMPLE.zh)
  const originalHead = headOf(original)
  const edited = replaceData(original, 1, TAMPER.zh)
  const rewritten = await recalculateFrom(edited, 1)
  const rows = assess(rewritten, (await expectedHashes(rewritten)).hashes)
  assert.ok(rows.every((row) => row.valid))
  assert.notEqual(headOf(rewritten), originalHead)
  assert.equal(rewritten[0].storedHash, original[0].storedHash)
})

test('a stale hash pass cannot overwrite a newer pass', async () => {
  let releaseFirst
  const gate = new Promise((resolve) => { releaseFirst = resolve })
  let calls = 0
  const slow = async (text) => {
    calls += 1
    if (calls === 1) await gate
    return nodeSha(text)
  }
  const blocks = await buildChain(SAMPLE.en, nodeSha)
  const session = createGeneration()
  const firstTicket = session.bump()
  const first = expectedHashes(blocks, slow, () => session.isCurrent(firstTicket))
  const secondTicket = session.bump()
  const second = expectedHashes(replaceData(blocks, 0, 'changed'), slow, () => session.isCurrent(secondTicket))
  releaseFirst()
  const [stale, current] = await Promise.all([first, second])
  assert.equal(stale.stale, true)
  assert.equal(current.stale, false)
  assert.equal(current.hashes.length, 3)
})

test('challenge progress requires both the break and the rewritten head', () => {
  let progress = emptyProgress()
  progress = observe(progress, { type: 'break' })
  assert.equal(progress.complete, false)
  progress = observe(progress, { type: 'rewrite' })
  assert.equal(progress.complete, true)
})
