import { decorate, emptyGate, gateEvent, sanitizeEvent } from '../lib/analytics.mjs'

function locale() {
  const lang = document.documentElement.lang || ''
  return lang.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

function loadState() {
  const memory = new Set()
  try {
    for (const key of JSON.parse(sessionStorage.getItem('lpw3_gate') || '[]')) {
      if (key === 'curriculum' || key.startsWith('path:')) memory.add(key)
    }
  } catch { /* storage unavailable */ }
  return { ...emptyGate(), memory }
}

let state = typeof document === 'undefined' ? emptyGate() : loadState()

function persist() {
  try {
    const keep = [...state.memory].filter((key) => key === 'curriculum' || key.startsWith('path:'))
    sessionStorage.setItem('lpw3_gate', JSON.stringify(keep))
  } catch { /* ignore */ }
}

function settings() {
  const query = new URLSearchParams(location.search)
  let internal = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || query.get('internal') === '1'
  try { if (localStorage.getItem('lpw3_internal') === '1') internal = true } catch { /* ignore */ }
  return { internal, debug: query.get('ga_debug') === '1', localOnly: query.get('events') === 'local' }
}

function deliver(event) {
  const env = settings()
  const payload = { name: event.name, params: decorate(event.params, env) }
  try { document.dispatchEvent(new CustomEvent('lpw3-analytics', { detail: payload })) } catch { /* ignore */ }
  try {
    const log = JSON.parse(sessionStorage.getItem('lpw3_event_log') || '[]')
    log.push({ name: payload.name, params: payload.params })
    const recent = log.slice(-20)
    sessionStorage.setItem('lpw3_event_log', JSON.stringify(recent))
    document.querySelectorAll('[data-event-log]').forEach((node) => {
      node.textContent = recent.map((item) => `${item.name} ${JSON.stringify(item.params)}`).join('\n')
    })
  } catch { /* ignore */ }
  try {
    if (typeof window.__LPW3_ANALYTICS_SINK === 'function') window.__LPW3_ANALYTICS_SINK(payload)
  } catch { /* ignore */ }
  if (env.localOnly) return
  try {
    if (typeof window.gtag === 'function') window.gtag('event', payload.name, payload.params)
  } catch { /* analytics must not break the page */ }
}

export function emit(name, raw) {
  try {
    const event = sanitizeEvent(name, raw, locale())
    if (!event) return null
    const decision = gateEvent(event, state, Date.now())
    state = decision.state
    if (!decision.emit) return null
    persist()
    deliver(event)
    return event
  } catch {
    return null
  }
}

export function bindTracking() {
  if (window.__LPW3_BOUND) return
  window.__LPW3_BOUND = true
  const query = new URLSearchParams(location.search)
  if (query.get('events') === 'local' || query.get('ga_debug') === '1') {
    document.querySelectorAll('[data-event-panel]').forEach((node) => { node.hidden = false })
  }
  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[data-track]') : null
    if (!link) return
    emit(link.dataset.track, {
      lab_id: link.dataset.labId,
      guide_id: link.dataset.guideId,
      learning_path: link.dataset.path,
      challenge_id: link.dataset.challengeId
    })
  })
  document.addEventListener('lpw3-track', (event) => {
    const detail = event.detail || {}
    emit(detail.name, {
      lab_id: detail.labId,
      guide_id: detail.guideId,
      learning_path: detail.path,
      challenge_id: detail.challengeId
    })
  })
}

if (typeof document !== 'undefined') bindTracking()
