import type { APIRoute } from 'astro'
import { getBook } from '../data/chapters'
import { absolute, PUBLISHED } from '../data/site'

// Every page that exists in both languages, with hreflang alternates.
// Chapters come from the content files; drafts and "upcoming" chapters are excluded.
export const GET: APIRoute = async () => {
  const book = await getBook()
  const pages = book.pages.filter((c) => c.status === 'published')
  const lastmod = (c?: (typeof pages)[number]) => {
    const d = [c?.entries.zh.data.updated, c?.entries.en.data.updated, PUBLISHED].filter(Boolean).sort().pop()
    return d as string
  }
  const paths: [string, string][] = [['', PUBLISHED], ...pages.map((c) => [`chapters/${c.slug}/`, lastmod(c)] as [string, string]), ['accessibility/', PUBLISHED]]
  const urls = paths.flatMap(([p, mod]) =>
    (['zh', 'en'] as const).map((lang) => {
      const alt = `    <xhtml:link rel="alternate" hreflang="zh-CN" href="${absolute(`zh/${p}`)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${absolute(`en/${p}`)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${absolute(`zh/${p}`)}"/>`
      return `  <url>
    <loc>${absolute(`${lang}/${p}`)}</loc>
    <lastmod>${mod}</lastmod>
${alt}
  </url>`
    })
  )
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
