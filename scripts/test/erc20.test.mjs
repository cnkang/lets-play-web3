import { approve, emptyProgress, initialState, isUnlimited, observe, parseWhole, totalSupply, transferFrom, UNLIMITED } from '../../src/lib/labs/erc20.mjs'
import assert from 'node:assert/strict'
import { test } from 'node:test'

function frozen(state) {
  return JSON.stringify({
    holder: state.balances.holder.toString(),
    spender: state.balances.spender.toString(),
    other: state.balances.other.toString(),
    allowance: state.allowance.toString()
  })
}

test('approve overwrites the allowance and does not move balances', () => {
  const start = initialState()
  const before = frozen(start)
  const first = approve(start, 500n)
  assert.equal(first.ok, true)
  assert.equal(first.balancesUnchanged, true)
  assert.equal(first.state.allowance, 500n)
  assert.deepEqual(first.state.balances, start.balances)
  assert.equal(frozen(start), before)
  const second = approve(first.state, 80n)
  assert.equal(second.state.allowance, 80n)
})

test('transferFrom spends a finite allowance and revoke does not return tokens', () => {
  let state = approve(initialState(), 500n).state
  const spent = transferFrom(state, 'spender', 100n)
  assert.equal(spent.ok, true)
  assert.equal(spent.state.balances.holder, 900n)
  assert.equal(spent.state.balances.spender, 100n)
  assert.equal(spent.state.allowance, 400n)
  assert.equal(totalSupply(spent.state), 1000n)
  const revoked = approve(spent.state, 0n)
  assert.equal(revoked.state.allowance, 0n)
  assert.equal(revoked.state.balances.spender, 100n)
  assert.equal(revoked.balancesUnchanged, true)
})

test('insufficient allowance or balance leaves the state unchanged', () => {
  const approved = approve(initialState(), 50n).state
  const before = frozen(approved)
  const lowAllowance = transferFrom(approved, 'other', 51n)
  assert.equal(lowAllowance.ok, false)
  assert.equal(lowAllowance.error, 'insufficient-allowance')
  assert.equal(lowAllowance.state, approved)
  const rich = approve(initialState(), 5000n).state
  const lowBalance = transferFrom(rich, 'other', 1001n)
  assert.equal(lowBalance.error, 'insufficient-balance')
  assert.equal(frozen(approved), before)
})

test('paying yourself still spends a finite allowance', () => {
  const state = approve(initialState(), 200n).state
  const self = transferFrom(state, 'holder', 40n)
  assert.equal(self.ok, true)
  assert.equal(self.state.balances.holder, 1000n)
  assert.equal(self.holderDecreased, false)
  assert.equal(self.state.allowance, 160n)
})

test('unlimited approval does not decrease and can still be overwritten', () => {
  assert.equal(isUnlimited(UNLIMITED), true)
  let state = approve(initialState(), UNLIMITED).state
  const spent = transferFrom(state, 'spender', 25n)
  assert.equal(spent.ok, true)
  assert.equal(spent.unlimited, true)
  assert.equal(spent.allowanceDecreased, false)
  assert.equal(spent.state.allowance, UNLIMITED)
  assert.equal(spent.state.balances.holder, 975n)
  const blocked = transferFrom(spent.state, 'spender', 976n)
  assert.equal(blocked.error, 'insufficient-balance')
  state = approve(spent.state, 0n).state
  assert.equal(state.allowance, 0n)
})

test('parseWhole rejects blank, decimal, signed, and huge values', () => {
  for (const raw of ['', '  ', '1.5', '-1', '1e2', '0x10', '１', '10 points']) {
    assert.equal(parseWhole(raw).ok, false, raw)
  }
  assert.equal(parseWhole('0').error, 'zero')
  assert.equal(parseWhole('0', { allowZero: true }).value, 0n)
  assert.equal(parseWhole('00040').value, 40n)
  assert.equal(parseWhole('1000000001').error, 'too-large')
})

test('the guided challenge completes only after approve, spend, and revoke', () => {
  let progress = emptyProgress()
  let state = initialState()
  const approved = approve(state, 400n)
  progress = observe(progress, { type: 'approve', ...approved })
  assert.equal(progress.complete, false)
  state = approved.state
  const spent = transferFrom(state, 'spender', 150n)
  progress = observe(progress, { type: 'transferFrom', ...spent })
  assert.equal(progress.complete, false)
  const tooSoon = approve(initialState(), 0n)
  assert.equal(observe(emptyProgress(), { type: 'approve', ...tooSoon }).sawRevokeAfterSpend, false)
  const revoked = approve(spent.state, 0n)
  progress = observe(progress, { type: 'approve', ...revoked })
  assert.equal(progress.complete, true)
  assert.equal(revoked.state.balances.spender, 150n)
})
