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
  /** Optional date of the last significant edit to this translation. Becomes schema.org dateModified. */
  updated: z.iso.date().optional(),
  /**
   * Public release date of this chapter (schema.org datePublished).
   * Omit it to use the book date in src/data/site.ts. Set `unreleased: true` instead
   * when the chapter is in the build but has not been published on the public site.
   */
  released: z.iso.date().optional(),
  /** True when this chapter must not claim the book’s first publication date. */
  unreleased: z.boolean().optional(),
  /** Date the recorded lab ran. This is not a publication date. */
  experiment: z.iso.date().optional(),
  /**
   * Where this chapter's recorded actions ran.
   * sepolia — public Sepolia broadcasts (the default for earlier chapters).
   * anvil-fork — local Anvil (chainId 31337) writing on a read-only Sepolia fork. `snapshot` is the fork source block, not a new public transaction.
   * anvil-local — a fully local teaching model with no public-chain fork and no `snapshot`.
   */
  lab: z.enum(['sepolia', 'anvil-fork', 'anvil-local']).optional(),
  /**
   * Optional chapter-specific chain snapshot (e.g. Chapter 16, Phase-1). Defaults to the
   * book snapshot in src/data/site.ts. `at` is ISO 8601 with a +08:00 offset.
   * For `lab: anvil-fork`, this is the fork source block. Do not set it on `anvil-local`.
   */
  snapshot: z.object({ at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/), block: z.number().int() }).optional()
})

// One file per chapter per language: src/content/chapters/<lang>/<slug>.mdx
const chapters = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/chapters' }),
  schema: chapterSchema
})

// Stand-alone (non-book) pages such as the accessibility statement.
const pages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/pages' }),
  schema: z.object({ title: z.string(), description: z.string(), updated: z.iso.date().optional() })
})

export const collections = { phases, parts, chapters, pages }
