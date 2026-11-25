import { guides } from '../../src/data/guides.mjs'
import { labs } from '../../src/data/labs-copy.mjs'
import { prompts, promptText } from '../../src/data/prompts.mjs'
import assert from 'node:assert/strict'
import { test } from 'node:test'

function sameKeys(left, right, label) {
  assert.deepEqual(Object.keys(left).sort(), Object.keys(right).sort(), label)
  for (const key of Object.keys(left)) {
    const a = left[key]
    const b = right[key]
    if (Array.isArray(a) || Array.isArray(b)) {
      assert.equal(Array.isArray(a) && Array.isArray(b) && a.length === b.length, true, `${label}.${key}`)
      continue
    }
    if (a && b && typeof a === 'object') sameKeys(a, b, `${label}.${key}`)
  }
}

test('lab copy has the same keys in English and Chinese', () => {
  for (const [id, lab] of Object.entries(labs)) {
    sameKeys(lab.en, lab.zh, id)
    assert.match(lab.zh.title, /\p{Script=Han}/u)
    assert.doesNotMatch(lab.en.title, /\p{Script=Han}/u)
  }
})

test('guides and prompts stay paired and the copied prompt keeps its boundaries', () => {
  assert.equal(guides.length, 5)
  assert.equal(prompts.length, 5)
  for (const guide of guides) {
    sameKeys(guide.en, guide.zh, guide.slug)
    assert.ok(guide.en.answer[0].length > 40)
    assert.match(guide.zh.title, /\p{Script=Han}/u)
  }
  for (const prompt of prompts) {
    sameKeys(prompt.en, prompt.zh, prompt.id)
    const text = promptText(prompt, 'en')
    assert.match(text, /seed phrase/i)
    assert.match(text, /mainnet/i)
    assert.match(text, /real money/i)
    assert.doesNotMatch(text, /0x[a-fA-F0-9]{40}/)
    assert.match(promptText(prompt, 'zh'), /助记词/)
  }
})
