/**
 * Simplified constant-product pool: x * y = k, with a fee in basis points.
 *
 * Default fee is 30 bps (0.30%), the same rate as Uniswap v2's 0.3% pool.
 * For that rate the integer formula matches Uniswap v2:
 *   amountOut = floor( amountIn * 997 * reserveOut / (reserveIn * 1000 + amountIn * 997) )
 * Generalized to feeBps:
 *   kept = 10000 - feeBps
 *   amountOut = floor( amountIn * kept * reserveOut / (reserveIn * 10000 + amountIn * kept) )
 * The full amountIn is added to the input reserve. The fee stays in the pool, so k grows.
 *
 * Price impact is the gap between the pre-trade spot price and this order's
 * average execution price. It is inside the quote. Slippage tolerance is not
 * an input to the quote. It only sets minimum received, checked at execution.
 * This is not Uniswap v3, not an order book, and not every AMM.
 */

export const FEE_SCALE = 10_000n
export const DEFAULT_FEE_BPS = 30n
export const DEFAULT_RESERVE = 1_000_000n
export const SMALL_TRADE = 1_000n
export const LARGE_TRADE = 200_000n
export const PRIOR_TRADE = 50_000n
export const TIGHT_SLIPPAGE_BPS = 10n
export const MAX_RESERVE = 1_000_000_000_000n

export function emptyPool() {
  return { reserveIn: DEFAULT_RESERVE, reserveOut: DEFAULT_RESERVE }
}

export function quote({ reserveIn, reserveOut, amountIn, feeBps }) {
  if ([reserveIn, reserveOut, amountIn, feeBps].some((value) => typeof value !== 'bigint')) {
    return { ok: false, error: 'invalid-type' }
  }
  if (reserveIn <= 0n || reserveOut <= 0n) return { ok: false, error: 'empty-pool' }
  if (amountIn <= 0n) return { ok: false, error: 'not-positive' }
  if (feeBps < 0n || feeBps >= FEE_SCALE) return { ok: false, error: 'bad-fee' }
  const kept = FEE_SCALE - feeBps
  const amountInScaled = amountIn * kept
  const numerator = amountInScaled * reserveOut
  const denominator = reserveIn * FEE_SCALE + amountInScaled
  if (denominator <= 0n) return { ok: false, error: 'divide-by-zero' }
  const amountOut = numerator / denominator
  if (amountOut <= 0n) return { ok: false, error: 'too-small' }
  if (amountOut >= reserveOut) return { ok: false, error: 'drains-pool' }
  const nextIn = reserveIn + amountIn
  const nextOut = reserveOut - amountOut
  const impactNumerator = amountIn * reserveOut - amountOut * reserveIn
  const impactDenominator = amountIn * reserveOut
  return {
    ok: true,
    error: '',
    amountOut,
    amountIn,
    feeBps,
    reserveIn,
    reserveOut,
    next: { reserveIn: nextIn, reserveOut: nextOut },
    kBefore: reserveIn * reserveOut,
    kAfter: nextIn * nextOut,
    impactBps: impactNumerator * FEE_SCALE / impactDenominator,
    spotNumerator: reserveOut,
    spotDenominator: reserveIn,
    executionNumerator: amountOut,
    executionDenominator: amountIn
  }
}

/** Floor of quoted output times (1 - slippage). Does not reprice the quote. */
export function minimumReceived(amountOut, slippageBps) {
  if (typeof amountOut !== 'bigint' || typeof slippageBps !== 'bigint') return { ok: false, error: 'invalid-type' }
  if (amountOut < 0n) return { ok: false, error: 'not-positive' }
  if (slippageBps < 0n || slippageBps > FEE_SCALE) return { ok: false, error: 'bad-slippage' }
  return { ok: true, amount: amountOut * (FEE_SCALE - slippageBps) / FEE_SCALE }
}

/**
 * Execute a stored quote. An optional prior trade is applied first and is not
 * part of the quote. The user swap lands only when actual output is at least
 * minimumOut. A miss leaves the user swap unapplied.
 */
export function executeQuoted({ reserveIn, reserveOut, amountIn, feeBps, minimumOut, priorAmountIn = 0n }) {
  if (typeof minimumOut !== 'bigint' || minimumOut < 0n) return { ok: false, error: 'bad-minimum', stage: 'check' }
  let pool = { reserveIn, reserveOut }
  if (priorAmountIn > 0n) {
    const prior = quote({ reserveIn, reserveOut, amountIn: priorAmountIn, feeBps })
    if (!prior.ok) return { ok: false, error: prior.error, stage: 'prior' }
    pool = prior.next
  }
  const actual = quote({ reserveIn: pool.reserveIn, reserveOut: pool.reserveOut, amountIn, feeBps })
  if (!actual.ok) return { ok: false, error: actual.error, stage: 'swap', poolAfterPrior: pool, priorApplied: priorAmountIn > 0n }
  if (actual.amountOut < minimumOut) {
    return {
      ok: false,
      error: 'below-minimum',
      stage: 'slippage',
      amountOut: actual.amountOut,
      minimumOut,
      poolAfterPrior: pool,
      priorApplied: priorAmountIn > 0n
    }
  }
  return {
    ok: true,
    error: '',
    amountOut: actual.amountOut,
    reserves: actual.next,
    minimumOut,
    priorApplied: priorAmountIn > 0n,
    poolAfterPrior: pool
  }
}

/** Points on x * y = k, from reserveIn/5 to reserveIn*4, for the curve drawing. */
export function curvePoints(reserveIn, reserveOut, samples = 40) {
  if (reserveIn <= 0n || reserveOut <= 0n) return []
  const k = reserveIn * reserveOut
  const xMin = reserveIn / 5n
  const xMax = reserveIn * 4n
  if (xMin <= 0n || xMax <= xMin) return []
  const count = BigInt(samples)
  const points = []
  for (let i = 0n; i <= count; i++) {
    const x = xMin + (xMax - xMin) * i / count
    if (x <= 0n) continue
    points.push({ x, y: k / x })
  }
  return points
}

export function emptyProgress() {
  return { sawSmall: false, sawLarge: false, sawExecute: false, sawReject: false, complete: false }
}

export function observe(progress, event) {
  const next = { ...progress }
  if (event.type === 'quote' && event.size === 'small') next.sawSmall = true
  if (event.type === 'quote' && event.size === 'large') next.sawLarge = true
  if (event.type === 'execute' && event.ok) next.sawExecute = true
  if (event.type === 'execute' && event.error === 'below-minimum') next.sawReject = true
  next.complete = Boolean(next.sawSmall && next.sawLarge && next.sawExecute && next.sawReject)
  return next
}
