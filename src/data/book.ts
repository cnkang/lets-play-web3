// Languages and UI strings. Both languages share the same chapter slugs, so the
// language switcher always lands on the matching chapter.
export type Lang = 'zh' | 'en'
export const langs: Lang[] = ['zh', 'en']
export const defaultLang: Lang = 'zh'

// Chapter order, parts and titles now come from the content files themselves
// (frontmatter + src/content/parts.json); see src/data/chapters.ts.

export const ui = {
  zh: {
    siteTitle: '一起玩 Web3',
    /** wordmark: lead text + accented part */
    brandLead: '一起玩',
    brandAccent: 'Web3',
    siteTagline: '从生活例子看懂区块链，用测试网实验核对',
    seoTagline: '双语区块链入门指南',
    contents: '目录',
    start: '开始阅读',
    appendix: '地址与交易',
    glossary: '术语与自测',
    search: '搜索',
    prev: '上一章',
    next: '下一章',
    onThisPage: '本章目录',
    switchTo: 'English',
    switchLabel: '切换到英文版',
    skip: '跳到正文',
    footer:
      '非官方的个人学习资料，与 Ethereum、Etherscan 或任何公司无关 · 公共广播仅 Ethereum Sepolia · 第 17–19 章为本地实验 · 不构成投资建议',
    snapshot: '链上数字截至 2026-11-12 15:39:55（新加坡时间，UTC+8）· Sepolia 区块 12117419',
    menu: '菜单'
  },
  en: {
    siteTitle: 'Let’s Play Web3',
    brandLead: 'Let’s Play',
    brandAccent: 'Web3',
    siteTagline: 'Learn how blockchains work. See for yourself on a testnet.',
    seoTagline: 'A hands-on blockchain guide',
    contents: 'Contents',
    start: 'Start reading',
    appendix: 'Addresses & transactions',
    glossary: 'Glossary & quiz',
    search: 'Search',
    prev: 'Previous',
    next: 'Next',
    onThisPage: 'On this page',
    switchTo: '中文',
    switchLabel: 'Switch to Chinese',
    skip: 'Skip to content',
    footer:
      'Unofficial personal study notes, not affiliated with Ethereum, Etherscan or any company · Public broadcasts on Ethereum Sepolia only · Chapters 17–19 are local labs · Not financial advice',
    snapshot: 'On-chain figures as of 2026-11-12 15:39:55 Singapore time (UTC+8) · Sepolia block 12117419',
    menu: 'Menu'
  }
} as const

/** Prefix a site-relative path with the configured base (works for '/' and '/repo/'). */
export function url(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : '/' + path
  return base + p
}

export function chapterUrl(lang: Lang, slug: string) {
  return url(`/${lang}/chapters/${slug}/`)
}
