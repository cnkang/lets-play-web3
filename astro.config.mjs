// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'

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
  trailingSlash: 'always',
  output: 'static',
  build: { format: 'directory' },
  integrations: [mdx()],
  markdown: {
    shikiConfig: { themes: { light: 'github-light-high-contrast', dark: 'github-dark-high-contrast' }, defaultColor: 'light' }
  }
})
