// rehype plugin: avoid tiny orphan last lines (1–3 CJK characters or one short word alone
// on the last line of a paragraph, list item, table cell, heading, caption…).
//
// CSS `text-wrap: pretty` already does this in Chromium, but Safari/Firefox handle it
// differently, so as a robust fallback we glue the tail of each text block together:
// the last ~4 CJK characters (plus any trailing punctuation) or the last two short Latin
// words are wrapped in <span class="nw"> (white-space: nowrap; see global.css).
//
// Why a span and not U+2060 / U+00A0: a plain span adds no characters, so copy-paste,
// Pagefind search and screen readers see exactly the original text.
//
// It also marks short table columns (every cell ≤ ~11 CJK chars / ~22 Latin chars) with
// class "c-short" so labels like「自动履约的数字凭证」stay on one line on wide screens.
//
// Never touches code, links (a link is moved whole or not at all), MDX components
// other than inline formatting (<Term> glues its own tail to its「?」button).

const BLOCKS = new Set(['p', 'li', 'td', 'th', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figcaption', 'caption', 'dt', 'dd', 'blockquote'])
const SPLITTABLE = new Set(['strong', 'em', 'b', 'i', 'del', 's', 'mark', 'span', 'sup', 'sub'])
const CJK = /[\u2e80-\u2fff\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/
const PUNCT = /[\s\u3000-\u303f\uff00-\uff0f\uff1a-\uff20\uff3b-\uff40\uff5b-\uff65.,;:!?'"’”)\]}»…—–-]/
const NEED = 4 // CJK chars to keep together on the last line (orphan = ≤3)
const MAX_LATIN = 18 // max length of the glued Latin tail

const isEl = (n) => n && (n.type === 'element' || n.type === 'mdxJsxTextElement' || n.type === 'mdxJsxFlowElement')
const tagOf = (n) => (n.type === 'element' ? n.tagName : n.name)
export function textOf(n) {
  if (n.type === 'text') return n.value
  if (n.children) return n.children.map(textOf).join('')
  return ''
}
const cls = (n) => {
  if (n.type === 'element') return [].concat(n.properties?.className || [])
  const a = (n.attributes || []).find((x) => x.name === 'className' || x.name === 'class')
  return typeof a?.value === 'string' ? a.value.split(/\s+/) : []
}
// Latin "units": a 1–2 char word counts 1, longer words count 2 (a CJK char counts 1)
const wordUnits = (w) => (w.length <= 2 ? 1 : 2)

// The tail is "done" once it holds NEED units and, for Latin-only tails, at least two words.
const done = (st) => st.got >= NEED && (st.cjk || st.words >= 2)

// Take the tail off a string, updating the shared state. Returns [head, tail, stop].
export function splitText(s, st) {
  let i = s.length
  while (i > 0 && /\s/.test(s[i - 1])) i--
  while (i > 0 && !done(st)) {
    const ch = s[i - 1]
    if (/\s/.test(ch)) {
      if (st.len + 1 > MAX_LATIN) return [s.slice(0, i), s.slice(i), true]
      i--; st.len++
      continue
    }
    if (CJK.test(ch)) { st.got++; st.cjk = true; st.len += 2; i--; continue }
    if (PUNCT.test(ch)) { i--; st.len++; continue }
    let j = i
    while (j > 0 && !/\s/.test(s[j - 1]) && !CJK.test(s[j - 1])) j--
    const word = s.slice(j, i).replace(new RegExp(PUNCT.source, 'g'), '')
    const wl = i - j
    if (st.len + wl > MAX_LATIN && (st.got > 0 || wl > MAX_LATIN)) return [s.slice(0, i), s.slice(i), true]
    st.len += wl
    st.got += wordUnits(word || 'x')
    st.words++
    i = j
  }
  return [s.slice(0, i), s.slice(i), false]
}

// Mutates `children` so it keeps only the head; returns the tail nodes.
export function takeTail(children, st) {
  const tail = []
  let i = children.length - 1
  while (i >= 0 && children[i].type === 'text' && !children[i].value.trim()) i--
  const trailing = children.splice(i + 1)
  let stop = false
  while (i >= 0 && !done(st) && !stop) {
    const k = children[i]
    if (k.type === 'text') {
      const [head, t, s2] = splitText(k.value, st)
      if (t) tail.unshift({ type: 'text', value: t })
      if (head) { children[i] = { type: 'text', value: head }; break }
      children.splice(i, 1)
      stop = s2
      i--
      continue
    }
    if (!isEl(k)) break
    const tag = tagOf(k)
    const txt = textOf(k)
    const atomic = tag === 'a' || tag === 'code' || tag === 'Term'
    if (atomic) {
      // move a short link / inline code / glossary term whole; never split it
      const t = tag === 'Term' ? textOf({ children: k.children }) : txt
      if (t.length && st.len + t.length <= MAX_LATIN) {
        tail.unshift(k); children.splice(i, 1)
        st.len += t.length
        for (const ch of t) if (CJK.test(ch)) { st.got++; st.cjk = true }
        if (!/[\u2e80-\u9fff]/.test(t)) { st.got += 2; st.words++ }
        i--
        continue
      }
      break
    }
    if (tag === 'br') break
    if (SPLITTABLE.has(tag) && k.children && !cls(k).some((c) => c.startsWith('term'))) {
      const inner = takeTail(k.children, st)
      if (!inner.tail.length) break
      if (k.children.length && textOf(k).trim()) {
        tail.unshift({ ...k, children: inner.tail }) // element keeps its head; a clone carries the tail
        break
      }
      k.children = inner.tail
      tail.unshift(k)
      children.splice(i, 1)
      stop = inner.stop
      i--
      continue
    }
    break
  }
  return { tail, trailing, stop }
}

function glue(block) {
  if (!block.children?.length) return
  const st = { got: 0, len: 0, words: 0, cjk: false }
  const { tail, trailing } = takeTail(block.children, st)
  const txt = tail.map(textOf).join('')
  if (!tail.length || !txt.trim() || st.got < 1) { block.children.push(...tail, ...trailing); return }
  block.children.push({ type: 'element', tagName: 'span', properties: { className: ['nw'] }, children: tail }, ...trailing)
}

// Long URLs shown as text: allow breaks after「/」(a <wbr> adds no characters).
function breakUrls(node) {
  if (!node.children) return
  if (isEl(node) && tagOf(node) === 'a') {
    node.children = node.children.flatMap((c) => {
      if (c.type !== 'text' || c.value.length < 20 || /\s/.test(c.value) || !c.value.includes('/')) return [c]
      const parts = c.value.split(/(?<=\/)/)
      // keep a short last segment (e.g.「eip-20」) attached to the one before it
      if (parts.length > 1 && parts[parts.length - 1].length < 8) parts.splice(-2, 2, parts.at(-2) + parts.at(-1))
      return parts.flatMap((p, idx) => (idx ? [{ type: 'element', tagName: 'wbr', properties: {}, children: [] }, { type: 'text', value: p }] : [{ type: 'text', value: p }]))
    })
    return
  }
  node.children.forEach(breakUrls)
}
// Short inline code (an identifier or a call like approve(S, 100)) never breaks inside.
function shortCode(node) {
  if (!node.children) return
  if (node.type === 'element' && node.tagName === 'code') {
    const t = textOf(node)
    if (t.length <= 22) node.properties = { ...node.properties, className: [...[].concat(node.properties?.className || []), 'nw'] }
    else if (/\s/.test(t)) glue(node) // longer code with spaces: keep its last words together
    return
  }
  if (isEl(node) && tagOf(node) === 'pre') return
  node.children.forEach(shortCode)
}

function visit(node, fn, parent) {
  if (node.children) for (const c of [...node.children]) visit(c, fn, node)
  fn(node, parent)
}

function cellLen(cell) {
  let n = 0
  for (const ch of textOf(cell).trim()) n += CJK.test(ch) ? 1 : 0.5
  return n
}

export function transformTree(tree) { return rehypeNoOrphans()(tree) }

// Sätteri (Astro 7's default Markdown/MDX processor) hast plugin wrapper.
// Each matched block is copied to a plain hast object, transformed, and swapped back in
// only when something changed. Tables are handled whole (column sizing + every cell).
export const satteriNoOrphans = () => ({
  name: 'no-orphans',
  element: {
    filter: ['table', 'p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figcaption', 'dt', 'dd'],
    visit(node, ctx) {
      if (node.tagName !== 'table') {
        // cells are done with their table; skip blocks inside a table cell
        for (let p = ctx.parent(node); p; p = p.type === 'root' ? undefined : ctx.parent(p)) if (p.type === 'element' && (p.tagName === 'td' || p.tagName === 'th')) return
      }
      const plain = JSON.parse(JSON.stringify(node))
      const before = JSON.stringify(plain)
      const root = { type: 'root', children: [plain] }
      rehypeNoOrphans()(root)
      if (JSON.stringify(root.children[0]) !== before) return root.children[0]
    }
  }
})

export default function rehypeNoOrphans() {
  return (tree) => {
    // 1) short table columns → c-short (nowrap on wide screens)
    visit(tree, (node) => {
      if (!isEl(node) || tagOf(node) !== 'table') return
      const rows = []
      visit(node, (n) => { if (isEl(n) && tagOf(n) === 'tr') rows.push(n.children.filter((c) => isEl(c) && ['td', 'th'].includes(tagOf(c)))) })
      const cols = Math.max(0, ...rows.map((r) => r.length))
      for (let c = 0; c < cols; c++) {
        const cells = rows.map((r) => r[c]).filter(Boolean)
        const bodyCells = cells.filter((x) => tagOf(x) === 'td')
        if (!bodyCells.length) continue
        if (cells.some((x) => { let comp = false; visit(x, (n) => { if (n.type?.startsWith('mdxJsx') && tagOf(n) !== 'strong' && tagOf(n) !== 'Term') comp = true; if (isEl(n) && tagOf(n) === 'code') comp = comp || textOf(n).length > 20 }); return comp })) continue
        if (Math.max(...bodyCells.map(cellLen)) <= 11 && Math.max(...cells.map(cellLen)) <= 12) {
          for (const x of cells) {
            x.properties ??= {}
            if (x.type === 'element') x.properties.className = [...(x.properties.className || []), 'c-short']
            else x.attributes.push({ type: 'mdxJsxAttribute', name: 'className', value: 'c-short' })
          }
        }
      }
    })
    breakUrls(tree)
    shortCode(tree)
    // 2) glue block tails (leaf-most blocks only: a <li> holding a <p> is handled via the <p>)
    visit(tree, (node) => {
      if (!isEl(node) || node.type !== 'element' || !BLOCKS.has(node.tagName)) return
      if (node.children.some((c) => isEl(c) && (BLOCKS.has(tagOf(c)) || ['ul', 'ol', 'table', 'pre', 'div'].includes(tagOf(c)) || c.type === 'mdxJsxFlowElement'))) {
        // mixed li: glue only the inline run before the first nested block? keep simple: skip
        return
      }
      glue(node)
    })
  }
}
