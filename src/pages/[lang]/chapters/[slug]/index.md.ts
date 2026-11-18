import type { APIRoute, GetStaticPaths } from 'astro'
import { langs } from '../../../../data/book'
import { getPublishedChapters } from '../../../../data/chapters'
import { llmsChapter } from '../../../../data/llms'

export const getStaticPaths = (async () => {
  const chapters = await getPublishedChapters()
  return chapters.flatMap((chapter) => langs.map((lang) => ({
    params: { lang, slug: chapter.slug },
    props: { chapter, lang }
  })))
}) satisfies GetStaticPaths

export const GET: APIRoute = ({ props }) => new Response(llmsChapter(props.chapter, props.lang), {
  headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
})
