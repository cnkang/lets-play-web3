/**
 * Timed learning tracks for the homepage.
 * Durations are rough estimates for planning, not measured study times.
 * Path ids must stay in analytics PATHS (src/lib/analytics.mjs).
 */
export const learningTracks = [
  {
    id: 'track-5m',
    minutes: 5,
    primaryLab: 'hash-chain',
    en: {
      label: 'About 5 minutes',
      title: 'Your first Web3 experiment',
      goal: 'See how changing one block breaks later hashes, and why a new chain head is not network consensus.',
      requires: 'A browser. No wallet.',
      after: 'You can point at a broken hash and say what recalculation does not decide by itself.',
      links: [
        { href: 'labs/hash-chain/', text: 'SHA-256 hash-chain lab' },
        { href: 'chapters/03-blocks-hashes-consensus/', text: 'Chapter 3 (optional short read)' }
      ]
    },
    zh: {
      label: '大约 5 分钟',
      title: '第一次 Web3 互动实验',
      goal: '亲手改一个区块，看后面的哈希怎样对不上，并弄清「本地重算链头」不等于全网共识。',
      requires: '一个浏览器。不需要钱包。',
      after: '你能指出哪个哈希断了，并说明重算本身不能代替网络共识。',
      links: [
        { href: 'labs/hash-chain/', text: 'SHA-256 哈希链实验' },
        { href: 'chapters/03-blocks-hashes-consensus/', text: '第 3 章（可选短读）' }
      ]
    }
  },
  {
    id: 'track-30m',
    minutes: 30,
    en: {
      label: 'About 30 minutes',
      title: 'Blockchain basics',
      goal: 'Learn when a shared ledger helps, how blocks and hashes work, and what a wallet actually holds.',
      requires: 'A browser. No wallet required for reading.',
      after: 'You can explain shared ledgers vs databases, and why a wallet is a key tool rather than a coin drawer.',
      links: [
        { href: 'chapters/02-who-needs-blockchain/', text: 'Chapter 2' },
        { href: 'chapters/03-blocks-hashes-consensus/', text: 'Chapter 3' },
        { href: 'chapters/04-nodes-trust/', text: 'Chapter 4' },
        { href: 'chapters/05-wallets-keys-signatures/', text: 'Chapter 5' },
        { href: 'labs/hash-chain/', text: 'Hash-chain lab' }
      ]
    },
    zh: {
      label: '大约 30 分钟',
      title: '弄清区块链基础',
      goal: '弄清什么时候需要共享账本、区块和哈希怎样工作，以及钱包真正保管的是什么。',
      requires: '一个浏览器。阅读不需要钱包。',
      after: '你能区分共享账本和普通数据库，并说明钱包更像钥匙，而不是装币的抽屉。',
      links: [
        { href: 'chapters/02-who-needs-blockchain/', text: '第 2 章' },
        { href: 'chapters/03-blocks-hashes-consensus/', text: '第 3 章' },
        { href: 'chapters/04-nodes-trust/', text: '第 4 章' },
        { href: 'chapters/05-wallets-keys-signatures/', text: '第 5 章' },
        { href: 'labs/hash-chain/', text: '哈希链实验' }
      ]
    }
  },
  {
    id: 'track-60m',
    minutes: 60,
    en: {
      label: 'About 60 minutes',
      title: 'Smart contracts and tokens',
      goal: 'See contracts run on a testnet record, then separate approve from payment, burning, and atomic batches.',
      requires: 'Chapters 1–5 help. Still no wallet for the browser lab.',
      after: 'You can read a testnet transaction and say what approve changes versus what transferFrom moves.',
      links: [
        { href: 'chapters/07-smart-contracts-evm/', text: 'Chapter 7' },
        { href: 'chapters/08-lab-counter/', text: 'Chapter 8' },
        { href: 'chapters/10-approve-vs-payment/', text: 'Chapter 10' },
        { href: 'labs/erc20-allowance/', text: 'Allowance lab' },
        { href: 'chapters/11-lab-mbox-burn/', text: 'Chapter 11' },
        { href: 'chapters/12-atomicity-batch/', text: 'Chapter 12' }
      ]
    },
    zh: {
      label: '大约 60 分钟',
      title: '智能合约与代币',
      goal: '对照测试网记录看合约怎样执行，再分清授权与付款、销毁和原子批量。',
      requires: '建议先读第 1–5 章。浏览器实验仍不需要钱包。',
      after: '你能读一笔测试网交易，并说出 approve 改了什么、transferFrom 动了什么。',
      links: [
        { href: 'chapters/07-smart-contracts-evm/', text: '第 7 章' },
        { href: 'chapters/08-lab-counter/', text: '第 8 章' },
        { href: 'chapters/10-approve-vs-payment/', text: '第 10 章' },
        { href: 'labs/erc20-allowance/', text: '授权额度实验' },
        { href: 'chapters/11-lab-mbox-burn/', text: '第 11 章' },
        { href: 'chapters/12-atomicity-batch/', text: '第 12 章' }
      ]
    }
  },
  {
    id: 'track-defi',
    minutes: null,
    en: {
      label: 'Advanced',
      title: 'Explore DeFi',
      goal: 'Follow swaps and liquidity on Sepolia records, then local labs on lending, flash loans, and oracle safety.',
      requires: 'Comfort with chapters 1–12 helps. Chapters 17–19 are local Anvil labs, not new public Sepolia txs. Advanced reproduction may need developer tools.',
      after: 'You can separate browser simulations, historical Sepolia evidence, and local Anvil runs, and say why a thin-pool spot price is a poor collateral mark.',
      links: [
        { href: 'chapters/16-defi-labs/', text: 'Chapter 16' },
        { href: 'labs/constant-product-amm/', text: 'Constant-product lab' },
        { href: 'chapters/17-lending-liquidation/', text: 'Chapter 17' },
        { href: 'chapters/18-flash-loans/', text: 'Chapter 18' },
        { href: 'chapters/19-oracle-safety/', text: 'Chapter 19' }
      ]
    },
    zh: {
      label: '进阶',
      title: '探索 DeFi',
      goal: '顺着 Sepolia 记录看兑换和流动性，再读本机实验里的借贷、闪电贷和预言机安全。',
      requires: '熟悉第 1–12 章会更顺。第 17–19 章是本机 Anvil 实验，不是新的公共 Sepolia 交易。完整复现进阶实验可能需要开发工具。',
      after: '你能分清浏览器模拟、历史 Sepolia 证据和本机 Anvil 记录，并说明为什么流动性不足的池子现价不宜直接当抵押估值。',
      links: [
        { href: 'chapters/16-defi-labs/', text: '第 16 章' },
        { href: 'labs/constant-product-amm/', text: '恒定乘积实验' },
        { href: 'chapters/17-lending-liquidation/', text: '第 17 章' },
        { href: 'chapters/18-flash-loans/', text: '第 18 章' },
        { href: 'chapters/19-oracle-safety/', text: '第 19 章' }
      ]
    }
  }
]
