import { defineCollection, reference } from 'astro:content'
import { glob, file } from 'astro/loaders'
import { z } from 'astro/zod'

/*
 * Content model — adding a chapter needs NO code changes:
 *   src/content/chapters/zh/<slug>.mdx  +  src/content/chapters/en/<slug>.mdx
 * Navigation, prev/next, sitemap, hreflang, llms.txt, search and JSON-LD are all
 * derived from these files (see src/data/chapters.ts). See CONTRIBUTING.md.
 */

// Phases group parts (Phase-0 basics, Phase-1 DeFi, future phases …).
const phases = defineCollection({
  loader: file('src/content/phases.json'),
  schema: z.object({ order: z.number(), zh: z.string(), en: z.string() })
})

// Parts (sections) of the book, shown as groups in the contents.
const parts = defineCollection({
  loader: file('src/content/parts.json'),
  schema: z.object({ order: z.number(), phase: reference('phases'), zh: z.string(), en: z.string() })
})

const chapterSchema = z.object({
  title: z.string(),
  description: z.string(),
  /** Short label for contents / prev-next, e.g. "10　授权不是付款". Defaults to title. */
  navTitle: z.string().optional(),
  /** id from src/content/parts.json */
  part: z.string(),
  /** Sort key inside the book (gaps of 10 leave room for insertions). */
  order: z.number(),
  /**
   * published — normal page.
   * upcoming  — listed in the contents as "coming soon", no page, not in sitemap/search/llms.
   * draft     — excluded from production builds entirely (visible in `npm run dev`).
   */
  status: z.enum(['published', 'upcoming', 'draft']).default('published'),
  /** Optional last-updated date (YYYY-MM-DD); defaults to the site publish date. */
  updated: z.string().optional()
})

// One file per chapter per language: src/content/chapters/<lang>/<slug>.mdx
const chapters = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/chapters' }),
  schema: chapterSchema
})

// Stand-alone (non-book) pages such as the accessibility statement.
const pages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/pages' }),
  schema: z.object({ title: z.string(), description: z.string() })
})

export const collections = { phases, parts, chapters, pages }
