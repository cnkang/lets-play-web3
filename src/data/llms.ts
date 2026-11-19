import { type Lang } from './book'
import { getPublishedChapters, type BookChapter } from './chapters'
import { absolute, PUBLISHED, REPO_URL, sepoliaExplorerUrl, SNAPSHOT_BLOCK, SNAPSHOT_ISO } from './site'

const license = `License / 授权: Kang’s original English and Chinese teaching text, term explanations, self-check questions and original teaching diagrams are shared under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/); this does not cover the whole repository. Full scope and contact / 完整范围与联系: [LICENSING.md](${REPO_URL}/blob/main/LICENSING.md).`
const HEADER = `# Let’s Play Web3 / 一起玩 Web3

> A free, bilingual (Simplified Chinese + English) guide to blockchains for beginners, with hands-on labs on the **Ethereum Sepolia testnet** (chainId 11155111). Start with everyday examples, then inspect transaction records. Reading needs no wallet, faucet or account. Unofficial personal learning material, not affiliated with Ethereum, Etherscan or any company. **Testnet only; not financial advice; test ETH and test tokens have no market value.**

${license}

Important context for citation:
- All on-chain figures are a historical snapshot as of ${SNAPSHOT_ISO}, Sepolia block ${SNAPSHOT_BLOCK}, unless a chapter says otherwise. They are not live chain state.
- Phase-0 basics, experiments and review are complete. Phase-1 DeFi labs (Chapter 19: swaps, arbitrage on an odd-priced testnet pool, v2 and v3 liquidity) ran on Sepolia on 2026-11-19; Chapter 19 uses its own snapshot (block 12165973) and is not part of the 2026-11-12 snapshot. Budgets were $0. No mainnet assets were used; no real seed phrase or private key was ever imported. Testnet "profits" have no real value.
- General explanations, on-chain results, local tests/simulations and future plans are distinct kinds of content. Phase-0 concluded PASS WITH FINDINGS, not no vulnerabilities. MBox-Burn’s leftover allowance was revoked by D-01 in block 12117312.
- Etherscan source verification was submitted but still "Pending in queue" at the snapshot; do not cite it as verified. Sourcify: 8/8 matched (5 exact_match, 3 match).
- UBOX V4 exists only locally (tests + fork simulation); it was never deployed on Sepolia.
- Pages first published ${PUBLISHED}. Editions: /zh/ and /en/ with identical slugs. At /, JavaScript uses a saved choice, then the first supported browser language, then English. Without JavaScript it falls back to Chinese. Language pages do not auto-redirect.
`

const editions = { en: 'English edition', zh: '中文版' }

export async function llmsIndex(): Promise<string> {
  const chapters = await getPublishedChapters()
  const sections = (['en', 'zh'] as const).map((lang) => {
    const lines = chapters.map(({ slug, entries }) => {
      const { title, description } = entries[lang].data
      const label = title.replace(/[\\\[\]]/g, '\\$&').replace(/\s+/g, ' ')
      return `- [${label}](${absolute(`${lang}/chapters/${slug}/index.md`)}): ${description.replace(/\s+/g, ' ')}`
    })
    return `## ${editions[lang]}\n\n${lines.join('\n')}`
  })

  return `${HEADER}
${sections.join('\n\n')}

## Optional

- [Full bilingual text](${absolute('llms-full.txt')}): All published chapters in one file.
- [English homepage](${absolute('en/')})
- [中文首页](${absolute('zh/')})
- [Accessibility statement](${absolute('en/accessibility/')})
- [无障碍声明](${absolute('zh/accessibility/')})
- [Sitemap](${absolute('sitemap.xml')})
`
}

/** Turn chapter MDX into readable plain Markdown for llms-full.txt. */
function plain(body: string): string {
  return body
    .replace(/^import .*$/gm, '')
    .replace(/<Addr\s+a="([^"]+)"[^>]*\/>/g, (_match, address) => `[${address}](${sepoliaExplorerUrl('address', address)})`)
    .replace(/<Tx\s+h="([^"]+)"[^>]*\/>/g, (_match, hash) => `[${hash}](${sepoliaExplorerUrl('tx', hash)})`)
    .replace(/<Figure[^>]*alt="([^"]*)"[^>]*>([\s\S]*?)<\/Figure>/g, (_m, alt, cap) => `[Figure: ${alt}] ${cap.trim()}`)
    .replace(/<Callout[^>]*title="([^"]*)"[^>]*>/g, '**$1**')
    .replace(/<\/?(Callout|T)(\s[^>]*)?>/g, '')
    .replace(/<Lab[^>]*title="([^"]*)"[^>]*>/g, '**$1**')
    .replace(/<\/Lab>/g, '')
    .replace(/<(SafetyNotice|Snapshot|Quiz)[^>]*\/>/g, '')
    .replace(/<h([1-6])\b[^>]*>([^\n]*?)<\/h\1>/g, (_match, level, heading) => `${'#'.repeat(Number(level))} ${heading}`)
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function chapterBody(chapter: BookChapter, lang: Lang, url: string): string {
  return plain(chapter.entries[lang].body ?? '').replace(/\]\(((?:\.{1,2}\/|#)[^\s)]+)\)/g, (_match, href) => `](${new URL(href, url)})`)
}

export function llmsChapter(chapter: BookChapter, lang: Lang): string {
  const { title, description, snapshot: own } = chapter.entries[lang].data
  const url = absolute(`${lang}/chapters/${chapter.slug}/`)
  const at = own?.at ?? SNAPSHOT_ISO
  const block = own?.block ?? SNAPSHOT_BLOCK
  const snapshot = lang === 'zh'
    ? `链上历史快照：${at}，Sepolia 区块 ${block}。章节另有注明时，以文中时间为准。`
    : `Historical chain snapshot: ${at}, Sepolia block ${block}. Dates noted in the chapter take precedence.`
  return `# ${title}\n\n> ${description.replace(/\s+/g, ' ')}\n\n${snapshot}\n\n${license}\n\n[HTML](${url}) · [Book index and citation context](${absolute('llms.txt')})\n\n${chapterBody(chapter, lang, url)}\n`
}

export async function llmsFull(): Promise<string> {
  const chapters = await getPublishedChapters()
  const parts: string[] = [HEADER]
  for (const lang of ['en', 'zh'] as const) {
    parts.push(`\n\n# ${editions[lang]}\n`)
    for (const chapter of chapters) {
      const url = absolute(`${lang}/chapters/${chapter.slug}/`)
      parts.push(`\n---\n\n## ${chapter.title[lang]}\n\nURL: ${url}\n\n${chapterBody(chapter, lang, url)}\n`)
    }
  }
  return parts.join('')
}
