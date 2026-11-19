// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import { satteri } from '@astrojs/markdown-satteri'
import { satteriNoOrphans } from './src/lib/rehype-no-orphans.mjs'

// Hosting is controlled by two PUBLIC env vars (see .env.example):
//   SITE_URL  absolute origin used for canonical / hreflang / sitemap / OG / JSON-LD
//   BASE      path prefix the site is served under
// Local:                 SITE_URL=http://localhost:4321                 BASE=/
// GitHub project Pages:  SITE_URL=https://<user>.github.io               BASE=/lets-play-web3/
// Cloudflare Pages:      SITE_URL=https://<project>.pages.dev (or domain) BASE=/
// Optional local .env (git-ignored). Real environment variables win.
try {
  process.loadEnvFile?.('.env')
} catch {}

const rawBase = process.env.BASE || '/'
const trimmed = rawBase.replace(/^\/+|\/+$/g, '')
const base = trimmed ? `/${trimmed}/` : '/'
const site = (process.env.SITE_URL || 'http://localhost:4321').replace(/\/+$/, '')

export default defineConfig({
  site,
  base,
  redirects: {
    '/zh/chapters/19-next-p1-defi/': `${base}zh/chapters/16-defi-labs/`,
    '/en/chapters/19-next-p1-defi/': `${base}en/chapters/16-defi-labs/`,
    '/zh/chapters/16-appendix-addresses-txs/': `${base}zh/chapters/appendix-a-addresses-txs/`,
    '/en/chapters/16-appendix-addresses-txs/': `${base}en/chapters/appendix-a-addresses-txs/`,
    '/zh/chapters/17-credentials-api-keys/': `${base}zh/chapters/appendix-b-credentials-api-keys/`,
    '/en/chapters/17-credentials-api-keys/': `${base}en/chapters/appendix-b-credentials-api-keys/`,
    '/zh/chapters/18-glossary-quiz/': `${base}zh/chapters/appendix-c-glossary-quiz/`,
    '/en/chapters/18-glossary-quiz/': `${base}en/chapters/appendix-c-glossary-quiz/`
  },
  trailingSlash: 'always',
  output: 'static',
  build: { format: 'directory' },
  integrations: [mdx()],
  markdown: {
    // Glue the last few characters of each text block so no 1–3 character orphan line appears
    processor: satteri({ hastPlugins: [satteriNoOrphans] }),
    shikiConfig: { themes: { light: 'github-light-high-contrast', dark: 'github-dark-high-contrast' }, defaultColor: 'light' }
  }
})
