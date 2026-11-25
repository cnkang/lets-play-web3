/**
 * SHA-256 hash chain. Integrity checks are local. A consistent recalculation
 * is a different chain unless its head still matches the head other people stored.
 * Hashing is not consensus.
 *
 * Canonical form is length-prefixed so the data cannot change the field boundaries:
 *   lpw3-block-v1\n{id}\n{previousHash}\n{utf8ByteLength}\n{data}
 */

export const GENESIS = '0'.repeat(64)
export const MAX_DATA_LENGTH = 500

export const SAMPLE = {
  en: ['Day 1: 10 points for the shop', 'Day 2: 25 points for the cafe', 'Day 3: 4 points returned'],
  zh: ['第 1 天：商店 10 分', '第 2 天：咖啡馆 25 分', '第 3 天：退回 4 分']
}

export const TAMPER = {
  en: 'Day 2: 250 points for the cafe',
  zh: '第 2 天：咖啡馆 250 分'
}

export function canonical(id, previousHash, data) {
  const bytes = new TextEncoder().encode(data).length
  return `lpw3-block-v1\n${id}\n${previousHash}\n${bytes}\n${data}`
}

export async function sha256Hex(text) {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) throw new Error('SHA-256 is not available')
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function createGeneration() {
  let current = 0
  return {
    bump() {
      current += 1
      return current
    },
    isCurrent(ticket) {
      return ticket === current
    }
  }
}

export async function buildChain(pages, hashFn = sha256Hex) {
  const blocks = []
  let previous = GENESIS
  for (let index = 0; index < pages.length; index++) {
    const id = index + 1
    const data = pages[index]
    const storedHash = await hashFn(canonical(id, previous, data))
    blocks.push({ id, data, storedPrev: previous, storedHash })
    previous = storedHash
  }
  return blocks
}

export function cloneBlocks(blocks) {
  return blocks.map((block) => ({ ...block }))
}

export function replaceData(blocks, index, data) {
  const next = cloneBlocks(blocks)
  next[index] = { ...next[index], data }
  return next
}

export async function expectedHashes(blocks, hashFn = sha256Hex, isCurrent = () => true) {
  const hashes = []
  for (const block of blocks) {
    const digest = await hashFn(canonical(block.id, block.storedPrev, block.data))
    if (!isCurrent()) return { stale: true, hashes: [] }
    hashes.push(digest)
  }
  if (!isCurrent()) return { stale: true, hashes: [] }
  return { stale: false, hashes }
}

export function assess(blocks, hashes) {
  return blocks.map((block, index) => {
    const previous = index === 0 ? GENESIS : blocks[index - 1].storedHash
    const linkOk = block.storedPrev === previous
    const contentOk = block.storedHash === hashes[index]
    return { index, id: block.id, linkOk, contentOk, valid: linkOk && contentOk }
  })
}

export function headOf(blocks) {
  return blocks.length ? blocks[blocks.length - 1].storedHash : GENESIS
}

export async function recalculateFrom(blocks, index, hashFn = sha256Hex) {
  const next = cloneBlocks(blocks)
  for (let cursor = index; cursor < next.length; cursor++) {
    const previous = cursor === 0 ? GENESIS : next[cursor - 1].storedHash
    next[cursor].storedPrev = previous
    next[cursor].storedHash = await hashFn(canonical(next[cursor].id, previous, next[cursor].data))
  }
  return next
}

export function emptyProgress() {
  return { sawBreak: false, sawRewrite: false, complete: false }
}

/**
 * sawBreak: an edited block no longer matches its hash, while a later block
 * still links to the old hash.
 * sawRewrite: the chain is internally valid again and its head differs from
 * the head saved at the start.
 */
export function observe(progress, event) {
  const next = { ...progress }
  if (event.type === 'break') next.sawBreak = true
  if (event.type === 'rewrite') next.sawRewrite = true
  next.complete = Boolean(next.sawBreak && next.sawRewrite)
  return next
}
