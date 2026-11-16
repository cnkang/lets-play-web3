import { ui, type Lang } from './book'

/** Absolute origin from SITE_URL (astro.config.mjs → `site`). No trailing slash. */
export const SITE_ORIGIN = (import.meta.env.SITE || 'http://localhost:4321').replace(/\/+$/, '')
/** Base path from BASE, always with leading and trailing slash. */
export const BASE = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/'

/** Site-relative URL including base, e.g. '/lets-play-web3/zh/'. */
export function href(path = ''): string {
  return BASE + path.replace(/^\/+/, '')
}
/** Absolute URL for canonical / hreflang / sitemap / OG / JSON-LD. */
export function absolute(path = ''): string {
  return SITE_ORIGIN + href(path)
}

/** Public attribution (a schema.org Person). Defaults to "Kang"; override with
 *  AUTHOR_NAME at build time. */
export const AUTHOR_NAME = (process.env.AUTHOR_NAME || 'Kang').trim()
/** Localized attribution shown on pages. */
export function authorFor(lang: Lang): string {
  return AUTHOR_NAME || ui[lang].siteTitle
}
/** schema.org author/publisher: a Person if AUTHOR_NAME is set, else the project as an Organization. */
export function authorLd(lang: Lang) {
  return AUTHOR_NAME ? { '@type': 'Person', name: AUTHOR_NAME } : { '@type': 'Organization', name: ui[lang].siteTitle }
}
/** Public source repository (footer "Report a problem" + accessibility page).
 *  Defaults to the published repo; the GitHub workflow also sets REPO_URL. */
export const REPO_URL = (process.env.REPO_URL || 'https://github.com/cnkang/lets-play-web3').replace(/\/+$/, '')
export const SNAPSHOT_ISO = '2026-11-12T15:39:55+08:00'
export const SNAPSHOT_BLOCK = 12117419
export const PUBLISHED = '2026-11-13'

export const htmlLang: Record<Lang, string> = { zh: 'zh-CN', en: 'en' }
export const ogLocale: Record<Lang, string> = { zh: 'zh_CN', en: 'en_US' }
