import { decorate, emptyGate, gateEvent, sanitizeEvent } from '../../src/lib/analytics.mjs'
import assert from 'node:assert/strict'
import { test } from 'node:test'

test('sanitize keeps bounded params and drops unknown events', () => {
  const event = sanitizeEvent('lab_complete', { lab_id: 'erc20-allowance', challenge_id: 'main', wallet: '0xabc', note: 'secret phrase' }, 'en')
  assert.deepEqual(event, { name: 'lab_complete', params: { locale: 'en', lab_id: 'erc20-allowance', challenge_id: 'main' } })
  assert.equal(JSON.stringify(event).includes('0xabc'), false)
  assert.equal(sanitizeEvent('page_view', {}, 'en'), null)
  assert.equal(sanitizeEvent('lab_start', { lab_id: 'not-a-lab' }, 'zh'), null)
  assert.equal(sanitizeEvent('prompt_copy', { challenge_id: 'prompt-a' }, 'zh').params.challenge_id, 'prompt-a')
  assert.equal(sanitizeEvent('curriculum_start', { lab_id: 'erc20-allowance' }, 'en').params.lab_id, undefined)
})

test('completion is once per attempt and reset arms it again', () => {
  let state = emptyGate()
  const complete = sanitizeEvent('lab_complete', { lab_id: 'hash-chain', challenge_id: 'main' }, 'zh')
  const first = gateEvent(complete, state, 1_000)
  assert.equal(first.emit, true)
  state = first.state
  assert.equal(gateEvent(complete, state, 1_100).emit, false)
  const reset = gateEvent(sanitizeEvent('lab_reset', { lab_id: 'hash-chain' }, 'zh'), state, 2_000)
  assert.equal(reset.emit, true)
  assert.equal(gateEvent(sanitizeEvent('lab_reset', { lab_id: 'hash-chain' }, 'zh'), reset.state, 2_200).emit, false)
  assert.equal(gateEvent(complete, reset.state, 3_000).emit, true)
})

test('prompt copies debounce and path starts once', () => {
  let state = emptyGate()
  const copy = sanitizeEvent('prompt_copy', { challenge_id: 'prompt-c' }, 'en')
  const first = gateEvent(copy, state, 0)
  assert.equal(first.emit, true)
  assert.equal(gateEvent(copy, first.state, 100).emit, false)
  assert.equal(gateEvent(copy, first.state, 800).emit, true)
  const path = sanitizeEvent('learning_path_start', { learning_path: 'play' }, 'zh')
  const started = gateEvent(path, state, 0)
  assert.equal(gateEvent(path, started.state, 50).emit, false)
  assert.equal(gateEvent(sanitizeEvent('learning_path_start', { learning_path: 'ai' }, 'zh'), started.state, 50).emit, true)
  assert.equal(sanitizeEvent('learning_path_start', { learning_path: 'track-5m' }, 'en').params.learning_path, 'track-5m')
  assert.equal(sanitizeEvent('learning_path_start', { learning_path: 'track-defi' }, 'zh').params.learning_path, 'track-defi')
  assert.equal(sanitizeEvent('learning_path_start', { learning_path: 'track-99m' }, 'en'), null)
})

test('decorate adds transport flags without changing the learning params', () => {
  const params = decorate({ locale: 'en', lab_id: 'constant-product-amm' }, { internal: true, debug: true })
  assert.equal(params.locale, 'en')
  assert.equal(params.traffic_type, 'internal')
  assert.equal(params.debug_mode, true)
  assert.deepEqual(decorate({ locale: 'zh' }, {}), { locale: 'zh' })
})
