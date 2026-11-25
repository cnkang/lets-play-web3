/** Display helpers for the browser labs. Math stays in bigint; these functions only format. */

export function formatInt(value) {
  const negative = value < 0n
  const digits = (negative ? -value : value).toString()
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return negative ? `-${grouped}` : grouped
}

/** Basis points to a percent with two decimal places. 130n → "1.30%". */
export function formatBps(bps) {
  const negative = bps < 0n
  const value = negative ? -bps : bps
  const whole = value / 100n
  const fraction = (value % 100n).toString().padStart(2, '0')
  return `${negative ? '-' : ''}${whole.toString()}.${fraction}%`
}

/** Integer ratio with a fixed number of decimal places, rounded toward zero. */
export function formatRatio(numerator, denominator, digits = 6) {
  if (denominator === 0n) return '—'
  const scale = 10n ** BigInt(digits)
  const negative = (numerator < 0n) !== (denominator < 0n)
  const num = numerator < 0n ? -numerator : numerator
  const den = denominator < 0n ? -denominator : denominator
  const scaled = num * scale / den
  const whole = scaled / scale
  const fraction = (scaled % scale).toString().padStart(digits, '0')
  return `${negative ? '-' : ''}${whole.toString()}.${fraction}`
}
