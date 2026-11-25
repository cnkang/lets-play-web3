/**
 * Simplified ERC-20 allowance model for the browser lab.
 *
 * approve overwrites the allowance and does not move token balances.
 * transferFrom moves balances. A finite allowance decreases by the amount spent.
 * The exact uint256 maximum is treated as unlimited and does not decrease.
 * That matches OpenZeppelin's ERC-20 _spendAllowance, not every token.
 * Revoke is approve(0). It does not return tokens already transferred.
 */

export const UNLIMITED = (1n << 256n) - 1n
export const ACCOUNTS = ['holder', 'spender', 'other']
export const MAX_FINITE = 1_000_000_000n

export function initialState() {
  return {
    balances: { holder: 1000n, spender: 0n, other: 0n },
    allowance: 0n
  }
}

export function emptyProgress() {
  return {
    sawApproveWithoutBalanceChange: false,
    sawFiniteSpend: false,
    sawRevokeAfterSpend: false,
    sawUnlimitedPersists: false,
    complete: false
  }
}

export function cloneState(state) {
  return {
    balances: { holder: state.balances.holder, spender: state.balances.spender, other: state.balances.other },
    allowance: state.allowance
  }
}

export function isUnlimited(allowance) {
  return allowance === UNLIMITED
}

export function parseWhole(raw, { max = MAX_FINITE, allowZero = false } = {}) {
  const text = String(raw ?? '').trim()
  if (!/^[0-9]+$/.test(text)) return { ok: false, error: 'not-integer' }
  const value = BigInt(text)
  if (value === 0n && !allowZero) return { ok: false, error: 'zero' }
  if (value > max) return { ok: false, error: 'too-large' }
  return { ok: true, value }
}

function balancesEqual(left, right) {
  return ACCOUNTS.every((id) => left[id] === right[id])
}

export function approve(state, amount) {
  if (typeof amount !== 'bigint' || amount < 0n || amount > UNLIMITED) {
    return { ok: false, error: 'invalid-amount', state }
  }
  const next = cloneState(state)
  next.allowance = amount
  return {
    ok: true,
    error: '',
    state: next,
    amount,
    balancesUnchanged: balancesEqual(state.balances, next.balances)
  }
}

export function transferFrom(state, to, amount) {
  if (!ACCOUNTS.includes(to)) return { ok: false, error: 'bad-recipient', state }
  if (typeof amount !== 'bigint' || amount <= 0n) return { ok: false, error: 'invalid-amount', state }
  const unlimited = isUnlimited(state.allowance)
  if (!unlimited && state.allowance < amount) return { ok: false, error: 'insufficient-allowance', state }
  if (state.balances.holder < amount) return { ok: false, error: 'insufficient-balance', state }
  const next = cloneState(state)
  next.balances.holder -= amount
  next.balances[to] += amount
  if (!unlimited) next.allowance -= amount
  return {
    ok: true,
    error: '',
    state: next,
    amount,
    to,
    unlimited,
    allowanceDecreased: next.allowance < state.allowance,
    holderDecreased: next.balances.holder < state.balances.holder
  }
}

export function totalSupply(state) {
  return ACCOUNTS.reduce((sum, id) => sum + state.balances[id], 0n)
}

/** Fold one successful or rejected action into the guided-challenge flags. */
export function observe(progress, action) {
  const next = { ...progress }
  if (action.type === 'approve' && action.ok && action.balancesUnchanged && action.amount > 0n) {
    next.sawApproveWithoutBalanceChange = true
  }
  if (action.type === 'transferFrom' && action.ok && action.allowanceDecreased && action.holderDecreased) {
    next.sawFiniteSpend = true
  }
  if (action.type === 'approve' && action.ok && action.amount === 0n && progress.sawFiniteSpend) {
    next.sawRevokeAfterSpend = true
  }
  if (action.type === 'transferFrom' && action.ok && action.unlimited && !action.allowanceDecreased) {
    next.sawUnlimitedPersists = true
  }
  next.complete = Boolean(next.sawApproveWithoutBalanceChange && next.sawFiniteSpend && next.sawRevokeAfterSpend)
  return next
}
