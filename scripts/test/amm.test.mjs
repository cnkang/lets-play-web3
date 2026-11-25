import { curvePoints, DEFAULT_FEE_BPS, emptyProgress, executeQuoted, LARGE_TRADE, minimumReceived, observe, PRIOR_TRADE, quote, SMALL_TRADE, TIGHT_SLIPPAGE_BPS } from '../../src/lib/labs/amm.mjs'
import assert from 'node:assert/strict'
import { test } from 'node:test'

function uniswapV2(reserveIn, reserveOut, amountIn) {
  const amountInWithFee = amountIn * 997n
  return amountInWithFee * reserveOut / (reserveIn * 1000n + amountInWithFee)
}

test('30 bps matches Uniswap v2 integer math, including a pinned example', () => {
  const pinned = quote({ reserveIn: 100_000n, reserveOut: 100_000n, amountIn: 1_000n, feeBps: 30n })
  assert.equal(pinned.amountOut, 987n)
  assert.equal(pinned.amountOut, uniswapV2(100_000n, 100_000n, 1_000n))
  for (const amountIn of [1n, 3n, 10n, 999n, 1_000n, 50_000n]) {
    for (const reserve of [10_000n, 1_000_000n]) {
      const got = quote({ reserveIn: reserve, reserveOut: reserve, amountIn, feeBps: DEFAULT_FEE_BPS })
      if (!got.ok) continue
      assert.equal(got.amountOut, uniswapV2(reserve, reserve, amountIn))
    }
  }
})

test('the fee stays in the pool and a zero fee does not shrink k', () => {
  const withFee = quote({ reserveIn: 1_000_000n, reserveOut: 1_000_000n, amountIn: SMALL_TRADE, feeBps: 30n })
  const noFee = quote({ reserveIn: 1_000_000n, reserveOut: 1_000_000n, amountIn: SMALL_TRADE, feeBps: 0n })
  assert.equal(withFee.ok, true)
  assert.ok(withFee.kAfter > withFee.kBefore)
  assert.ok(withFee.amountOut < noFee.amountOut)
  assert.ok(noFee.kAfter >= noFee.kBefore)
  assert.equal(withFee.next.reserveIn, 1_001_000n)
})

test('price impact grows with trade size and ignores slippage tolerance', () => {
  const reserves = { reserveIn: 1_000_000n, reserveOut: 1_000_000n, feeBps: 30n }
  const small = quote({ ...reserves, amountIn: SMALL_TRADE })
  const large = quote({ ...reserves, amountIn: LARGE_TRADE })
  assert.ok(large.impactBps > small.impactBps)
  assert.ok(small.impactBps > 0n)
  const again = quote({ ...reserves, amountIn: SMALL_TRADE })
  assert.equal(again.amountOut, small.amountOut)
  assert.equal(again.impactBps, small.impactBps)
  const tight = minimumReceived(small.amountOut, TIGHT_SLIPPAGE_BPS)
  const loose = minimumReceived(small.amountOut, 500n)
  assert.ok(tight.amount < small.amountOut)
  assert.ok(loose.amount < tight.amount)
  assert.equal(minimumReceived(small.amountOut, 0n).amount, small.amountOut)
  assert.equal(minimumReceived(small.amountOut, 10_000n).amount, 0n)
})

test('a prior trade can miss the stored minimum without changing the original quote', () => {
  const quoted = quote({ reserveIn: 1_000_000n, reserveOut: 1_000_000n, amountIn: SMALL_TRADE, feeBps: 30n })
  const minimum = minimumReceived(quoted.amountOut, TIGHT_SLIPPAGE_BPS).amount
  const samePool = executeQuoted({
    reserveIn: 1_000_000n,
    reserveOut: 1_000_000n,
    amountIn: SMALL_TRADE,
    feeBps: 30n,
    minimumOut: minimum
  })
  assert.equal(samePool.ok, true)
  assert.equal(samePool.amountOut, quoted.amountOut)
  const moved = executeQuoted({
    reserveIn: 1_000_000n,
    reserveOut: 1_000_000n,
    amountIn: SMALL_TRADE,
    feeBps: 30n,
    minimumOut: minimum,
    priorAmountIn: PRIOR_TRADE
  })
  assert.equal(moved.ok, false)
  assert.equal(moved.error, 'below-minimum')
  assert.ok(moved.amountOut < minimum)
  assert.equal(moved.poolAfterPrior.reserveIn, 1_000_000n + PRIOR_TRADE)
  assert.equal(quoted.amountOut, quote({ reserveIn: 1_000_000n, reserveOut: 1_000_000n, amountIn: SMALL_TRADE, feeBps: 30n }).amountOut)
})

test('invalid pool inputs fail closed', () => {
  assert.equal(quote({ reserveIn: 0n, reserveOut: 10n, amountIn: 1n, feeBps: 30n }).error, 'empty-pool')
  assert.equal(quote({ reserveIn: 10n, reserveOut: 10n, amountIn: 0n, feeBps: 30n }).error, 'not-positive')
  assert.equal(quote({ reserveIn: 10n, reserveOut: 10n, amountIn: 1n, feeBps: 10_000n }).error, 'bad-fee')
  assert.equal(quote({ reserveIn: 10n, reserveOut: 5n, amountIn: 1n, feeBps: 30n }).error, 'too-small')
  assert.equal(minimumReceived(10n, -1n).ok, false)
  assert.equal(curvePoints(0n, 10n).length, 0)
  assert.ok(curvePoints(1_000_000n, 1_000_000n).length > 2)
})

test('challenge flags need both sizes, one fill, and one refusal', () => {
  let progress = emptyProgress()
  progress = observe(progress, { type: 'quote', size: 'small' })
  progress = observe(progress, { type: 'quote', size: 'large' })
  progress = observe(progress, { type: 'execute', ok: true })
  assert.equal(progress.complete, false)
  progress = observe(progress, { type: 'execute', ok: false, error: 'below-minimum' })
  assert.equal(progress.complete, true)
})
