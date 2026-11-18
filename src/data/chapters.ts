// Single source of truth for the book's structure, derived from content files.
// Everything that lists chapters (contents, prev/next, sitemap, hreflang,
// llms.txt, JSON-LD, search) goes through getBook(), so adding a chapter is
// just adding src/content/chapters/{zh,en}/<slug>.mdx.
import { getCollection, type CollectionEntry } from 'astro:content'
import { langs, type Lang } from './book'

export type Status = 'published' | 'upcoming' | 'draft'
export interface BookChapter {
  slug: string
  order: number
  status: Status
  partId: string
  /** Contents label per language */
  nav: Record<Lang, string>
  title: Record<Lang, string>
  entries: Record<Lang, CollectionEntry<'chapters'>>
}
export interface BookPart {
  id: string
  order: number
  zh: string
  en: string
  phase: { id: string; zh: string; en: string }
  chapters: BookChapter[]
}
export interface Book {
  parts: BookPart[]
  /** Chapters that get a page, in reading order (prev/next, sitemap, llms). */
  pages: BookChapter[]
  /** Everything listed in the contents (published + upcoming), in order. */
  listed: BookChapter[]
}

// Drafts are visible in `astro dev` only.
const SHOW_DRAFTS = import.meta.env.DEV
// Set ALLOW_UNPAIRED=1 to turn a missing translation into a warning (the
// unpaired chapter is then left out of the build) instead of a build error.
const ALLOW_UNPAIRED = process.env.ALLOW_UNPAIRED === '1'

let cached: Promise<Book> | undefined
export function getBook(): Promise<Book> {
  cached ??= load()
  return cached
}

export async function getPublishedChapters(): Promise<BookChapter[]> {
  return (await getBook()).pages.filter((chapter) => chapter.status === 'published')
}

async function load(): Promise<Book> {
  const [phaseEntries, partEntries, all] = await Promise.all([
    getCollection('phases'),
    getCollection('parts'),
    getCollection('chapters')
  ])
  const problems: string[] = []
  const bySlug = new Map<string, Partial<Record<Lang, CollectionEntry<'chapters'>>>>()
  for (const e of all) {
    const [lang, ...rest] = e.id.split('/')
    const slug = rest.join('/')
    if (!langs.includes(lang as Lang) || !slug || slug.includes('/')) {
      problems.push(`"${e.id}": chapter files must live at src/content/chapters/<zh|en>/<slug>.mdx`)
      continue
    }
    const rec = bySlug.get(slug) ?? {}
    rec[lang as Lang] = e
    bySlug.set(slug, rec)
  }

  const partIds = new Set(partEntries.map((p) => p.id))
  const chapters: BookChapter[] = []
  const unpaired: string[] = []
  for (const [slug, rec] of bySlug) {
    const missing = langs.filter((l) => !rec[l])
    if (missing.length) {
      const have = langs.filter((l) => rec[l]).map((l) => `src/content/chapters/${l}/${slug}.mdx`)
      const need = missing.map((l) => `src/content/chapters/${l}/${slug}.mdx`)
      unpaired.push(`  - ${have.join(', ')} exists, but ${need.join(', ')} is missing`)
      continue
    }
    const zh = rec.zh!, en = rec.en!
    for (const key of ['order', 'part', 'status'] as const) {
      if (zh.data[key] !== en.data[key]) {
        problems.push(`"${slug}": frontmatter "${key}" differs between zh (${zh.data[key]}) and en (${en.data[key]}); it must be identical`)
      }
    }
    if (!partIds.has(zh.data.part)) {
      problems.push(`"${slug}": part "${zh.data.part}" is not defined in src/content/parts.json (known: ${[...partIds].join(', ')})`)
    }
    if (zh.data.status === 'draft' && !SHOW_DRAFTS) continue
    chapters.push({
      slug,
      order: zh.data.order,
      status: zh.data.status,
      partId: zh.data.part,
      nav: { zh: zh.data.navTitle ?? zh.data.title, en: en.data.navTitle ?? en.data.title },
      title: { zh: zh.data.title, en: en.data.title },
      entries: { zh, en }
    })
  }
  if (unpaired.length) {
    const msg = `[content] ${unpaired.length} chapter(s) have no translation:\n${unpaired.join('\n')}\n` +
      `Every chapter needs a zh AND an en file with the same slug. Add the missing file (copy templates/chapter.*.mdx), ` +
      `(an "upcoming" chapter needs both files too; a stub with a title is enough). Set ALLOW_UNPAIRED=1 to build anyway without these chapters.`
    if (ALLOW_UNPAIRED) console.warn('\n⚠ ' + msg + '\n')
    else problems.push(msg)
  }
  if (problems.length) {
    throw new Error(`\n✖ Book content check failed:\n- ${problems.join('\n- ')}\n`)
  }

  const phase = new Map(phaseEntries.map((p) => [p.id, { id: p.id, order: p.data.order, zh: p.data.zh, en: p.data.en }]))
  const parts: BookPart[] = partEntries
    .map((p) => {
      const ph = phase.get(p.data.phase.id)!
      return {
        id: p.id,
        order: ph.order * 10000 + p.data.order,
        zh: p.data.zh,
        en: p.data.en,
        phase: { id: ph.id, zh: ph.zh, en: ph.en },
        chapters: chapters.filter((c) => c.partId === p.id).sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug))
      }
    })
    .filter((p) => p.chapters.length > 0)
    .sort((a, b) => a.order - b.order)
  const listed = parts.flatMap((p) => p.chapters)
  const pages = listed.filter((c) => c.status !== 'upcoming')
  return { parts, pages, listed }
}

export function partOf(book: Book, slug: string) {
  return book.parts.find((p) => p.chapters.some((c) => c.slug === slug))
}

/** "11　实验：…" / "11 · Lab: …" / "附录 A　…" / "Appendix A · …" → { num: "11", text: "实验：…" }.
 *  Labels without a leading number ("下一站：…", "Next stop: …") come back with num = "". */
export function splitNumLabel(label: string): { num: string; text: string } {
  const m = /^((?:附录\s*|Appendix\s+)?(?:\d+|[A-Z]))(?:\s*·\s*|\u3000+|\s+)(\S.*)$/u.exec(label.trim())
  return m ? { num: m[1], text: m[2] } : { num: '', text: label.trim() }
}
