import { getBook } from './chapters'
import { absolute, PUBLISHED } from './site'

const HEADER = (full: boolean) => `# Let’s Play Web3 / 一起玩 Web3

> A free, bilingual (Simplified Chinese + English) guide to blockchains for beginners, with hands-on labs on the **Ethereum Sepolia testnet** (chainId 11155111). Start with everyday examples, then inspect transaction records. Reading needs no wallet, faucet or account. Unofficial personal learning material, not affiliated with Ethereum, Etherscan or any company. **Testnet only; not financial advice; test ETH and test tokens have no market value.**

Important context for citation:
- All on-chain figures are a historical snapshot as of 2026-11-12 15:39:55 Asia/Singapore (UTC+8), Sepolia block 12117419, unless a chapter says otherwise. They are not live chain state.
- Phase-0 basics, experiments and review are complete; Phase-1 DeFi has not started. The Phase-0 budget was $0. No mainnet assets were used; no real seed phrase or private key was ever imported.
- General explanations, on-chain results, local tests/simulations and future plans are distinct kinds of content. Phase-0 concluded PASS WITH FINDINGS, not no vulnerabilities. MBox-Burn’s leftover allowance was revoked by D-01 in block 12117312.
- Etherscan source verification was submitted but still "Pending in queue" at the snapshot; do not cite it as verified. Sourcify: 8/8 matched (5 exact_match, 3 match).
- UBOX V4 exists only locally (tests + fork simulation); it was never deployed on Sepolia.
- Pages first published ${PUBLISHED}. Editions: /zh/ and /en/ with identical slugs. At /, JavaScript uses a saved choice, then the first supported browser language, then English. Without JavaScript it falls back to Chinese. Language pages do not auto-redirect.
${full ? '' : `- Full plain-text version of every chapter: ${absolute('llms-full.txt')}`}
`

export async function llmsIndex(): Promise<string> {
  const book = await getBook()
  const lines = book.pages.filter((c) => c.status === 'published').map((c) => {
    const { en, zh } = c.entries
    return `- [${en?.data.title}](${absolute(`en/chapters/${c.slug}/`)}) / [${zh?.data.title}](${absolute(`zh/chapters/${c.slug}/`)}): ${en?.data.description}`
  })
  const soon = book.listed.filter((c) => c.status === 'upcoming').map((c) => `- ${c.title.en} / ${c.title.zh} (not published yet)`)
  return `${HEADER(false)}
## Chapters (reading order)

${lines.join('\n')}
${soon.length ? `\n## Coming soon\n\n${soon.join('\n')}\n` : ''}
## Other pages

- [Home (中文)](${absolute('zh/')}) · [Home (English)](${absolute('en/')})
- [Accessibility statement](${absolute('en/accessibility/')}) · [无障碍声明](${absolute('zh/accessibility/')})
- [Sitemap](${absolute('sitemap.xml')})
`
}

/** Turn chapter MDX into readable plain Markdown for llms-full.txt. */
function plain(body: string): string {
  return body
    .replace(/^import .*$/gm, '')
    .replace(/<Addr\s+a="([^"]+)"[^>]*\/>/g, '$1')
    .replace(/<Tx\s+h="([^"]+)"[^>]*\/>/g, '$1')
    .replace(/<Figure[^>]*alt="([^"]*)"[^>]*>([\s\S]*?)<\/Figure>/g, (_m, alt, cap) => `[Figure: ${alt}] ${cap.trim()}`)
    .replace(/<Callout[^>]*title="([^"]*)"[^>]*>/g, '**$1**')
    .replace(/<\/?(Callout|T)(\s[^>]*)?>/g, '')
    .replace(/<Lab[^>]*title="([^"]*)"[^>]*>/g, '**$1**')
    .replace(/<\/Lab>/g, '')
    .replace(/<(SafetyNotice|Snapshot|Quiz)[^>]*\/>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function llmsFull(): Promise<string> {
  const book = await getBook()
  const parts: string[] = [HEADER(true)]
  for (const lang of ['en', 'zh'] as const) {
    parts.push(`\n\n# ${lang === 'en' ? 'English edition' : '中文版'}\n`)
    for (const c of book.pages.filter((x) => x.status === 'published')) {
      const e = c.entries[lang]
      parts.push(`\n---\n\n## ${e.data.title}\n\nURL: ${absolute(`${lang}/chapters/${c.slug}/`)}\n\n${plain(e.body ?? '')}\n`)
    }
  }
  return parts.join('')
}
