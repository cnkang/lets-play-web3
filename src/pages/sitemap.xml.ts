import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { langs } from '../data/book'
import { getPublishedChapters } from '../data/chapters'
import { absolute, htmlLang } from '../data/site'

const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

// Every page that exists in both languages, with hreflang alternates.
// Chapters come from the content files; drafts and "upcoming" chapters are excluded.
export const GET: APIRoute = async () => {
  const [chapters, pages] = await Promise.all([getPublishedChapters(), getCollection('pages')])
  const paths = [
    { path: '' },
    ...chapters.map(({ slug, entries }) => ({ path: `chapters/${slug}/`, updated: { zh: entries.zh.data.updated, en: entries.en.data.updated } })),
    { path: 'accessibility/', updated: {
      zh: pages.find((page) => page.id === 'zh/accessibility')?.data.updated,
      en: pages.find((page) => page.id === 'en/accessibility')?.data.updated
    } }
  ]
  const urls = paths.flatMap(({ path, updated }) => {
    const loc = { zh: escapeXml(absolute(`zh/${path}`)), en: escapeXml(absolute(`en/${path}`)) }
    const alternates = [
      ...langs.map((lang) => `    <xhtml:link rel="alternate" hreflang="${htmlLang[lang]}" href="${loc[lang]}"/>`),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${loc.zh}"/>`
    ]
    return langs.map((lang) => [
      '  <url>',
      `    <loc>${loc[lang]}</loc>`,
      ...(updated?.[lang] ? [`    <lastmod>${updated[lang]}</lastmod>`] : []),
      ...alternates,
      '  </url>'
    ].join('\n'))
  })
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
