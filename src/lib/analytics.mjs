/** Bounded learning events. Free text, addresses, and prompt bodies are never accepted. */

export const EVENT_NAMES = [
  'learning_path_start',
  'lab_start',
  'lab_complete',
  'lab_reset',
  'prompt_copy',
  'related_chapter_click',
  'guide_to_lab_click',
  'curriculum_start'
]

export const LAB_IDS = ['erc20-allowance', 'constant-product-amm', 'hash-chain']
export const GUIDE_IDS = [
  'why-wallets-ask-approval',
  'how-pools-set-a-price',
  'upgrades-and-immutable-history',
  'why-loans-can-be-liquidated',
  'learn-without-real-money'
]
export const PATHS = ['start', 'play', 'ai', 'track-5m', 'track-30m', 'track-60m', 'track-defi']
export const CHALLENGE_IDS = [
  'main',
  'unlimited',
  'small-large',
  'execute',
  'slippage-reject',
  'tamper',
  'recalc',
  'prompt-a',
  'prompt-b',
  'prompt-c',
  'prompt-d',
  'prompt-e',
  '01-how-to-read',
  '03-blocks-hashes-consensus',
  '05-wallets-keys-signatures',
  '08-lab-counter',
  '10-approve-vs-payment',
  '11-lab-mbox-burn',
  '13-upgradeable-ubox',
  '16-defi-labs',
  '17-lending-liquidation'
]

const ALLOWED = {
  learning_path_start: ['learning_path'],
  lab_start: ['lab_id'],
  lab_complete: ['lab_id', 'challenge_id'],
  lab_reset: ['lab_id'],
  prompt_copy: ['challenge_id'],
  related_chapter_click: ['challenge_id', 'guide_id'],
  guide_to_lab_click: ['guide_id', 'lab_id'],
  curriculum_start: []
}
const REQUIRED = {
  learning_path_start: ['learning_path'],
  lab_start: ['lab_id'],
  lab_complete: ['lab_id', 'challenge_id'],
  lab_reset: ['lab_id'],
  prompt_copy: ['challenge_id'],
  related_chapter_click: ['challenge_id'],
  guide_to_lab_click: ['guide_id', 'lab_id'],
  curriculum_start: []
}

const ENUMS = {
  lab_id: LAB_IDS,
  guide_id: GUIDE_IDS,
  learning_path: PATHS,
  challenge_id: CHALLENGE_IDS
}

export function sanitizeEvent(name, raw, locale) {
  if (!EVENT_NAMES.includes(name)) return null
  if (locale !== 'zh' && locale !== 'en') return null
  const source = raw && typeof raw === 'object' ? raw : {}
  const params = { locale }
  for (const key of ALLOWED[name]) {
    const value = source[key]
    if (value == null || value === '') continue
    if (typeof value !== 'string' || !ENUMS[key].includes(value)) return null
    params[key] = value
  }
  for (const key of REQUIRED[name]) if (!params[key]) return null
  return { name, params }
}

export function emptyGate() {
  return { memory: new Set(), lastResetAt: 0, stamps: {} }
}

function keyFor(event) {
  const params = event.params
  switch (event.name) {
    case 'learning_path_start': return `path:${params.learning_path}`
    case 'curriculum_start': return 'curriculum'
    case 'lab_start': return `lab_start:${params.lab_id}`
    case 'lab_complete': return `lab_complete:${params.lab_id}:${params.challenge_id}`
    case 'related_chapter_click': return `chapter:${params.guide_id || '-'}:${params.challenge_id}`
    case 'guide_to_lab_click': return `guide-lab:${params.guide_id}:${params.lab_id}`
    default: return ''
  }
}

/** Pure dedup. lab_reset re-arms lab_complete for that lab. Prompt copies debounce by 800 ms. */
export function gateEvent(event, state, now) {
  if (event.name === 'lab_reset') {
    if (now - state.lastResetAt < 500) return { emit: false, state }
    const memory = new Set(state.memory)
    for (const key of memory) {
      if (key.startsWith(`lab_complete:${event.params.lab_id}:`)) memory.delete(key)
    }
    return { emit: true, state: { memory, lastResetAt: now, stamps: { ...state.stamps } } }
  }
  if (event.name === 'prompt_copy') {
    const stampKey = event.params.challenge_id
    const previous = state.stamps[stampKey]
    if (previous != null && now - previous < 800) return { emit: false, state }
    return {
      emit: true,
      state: { memory: new Set(state.memory), lastResetAt: state.lastResetAt, stamps: { ...state.stamps, [stampKey]: now } }
    }
  }
  const key = keyFor(event)
  if (key && state.memory.has(key)) return { emit: false, state }
  const memory = new Set(state.memory)
  if (key) memory.add(key)
  return { emit: true, state: { memory, lastResetAt: state.lastResetAt, stamps: { ...state.stamps } } }
}

/** GA4 transport flags. These are not learning parameters and are not persisted as custom facts. */
export function decorate(params, env) {
  const next = { ...params }
  if (env.internal) next.traffic_type = 'internal'
  if (env.debug) next.debug_mode = true
  return next
}
