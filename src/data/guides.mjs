/** Question-oriented guides. They point at labs and chapters. They do not repeat a chapter. */
export const guides = [
  {
    slug: 'why-wallets-ask-approval',
    lab: 'erc20-allowance',
    chapters: ['10-approve-vs-payment', '11-lab-mbox-burn'],
    en: {
      title: 'Why does a wallet ask you to approve a token?',
      description: 'An approval writes an allowance (a spending limit). Your balances stay put. A later transferFrom moves the tokens. Learn that split before you sign.',
      answer: [
        'The wallet is asking you to let another address spend up to a limit of one token. That limit is the allowance.',
        'Your token balance does not change when the approval is recorded. The approval is a spending limit, not a payment.'
      ],
      why: [
        'Many apps move tokens in two steps. You approve a contract. Later that contract calls transferFrom.',
        'The wallet shows the first step because it needs your signature. A standing allowance remains until it is used up or you replace it.'
      ],
      example: [
        'In the book’s MBox-Burn lab, account A approved account B for 500 test tokens. Balances did not change.',
        'Later spending used part of that allowance. A later approve of 0 revoked what remained once confirmed. Tokens that had already moved stayed with the recipient.',
        'Chapter 10 explains the rule. Chapter 11 records the Sepolia transactions. The browser lab lets you try the same steps with fictional PLAY tokens. It does not sign anything.'
      ],
      limits: [
        'Token contracts differ. In this site’s simplified model, a finite allowance decreases when it is used. type(uint256).max (the largest 256-bit unsigned integer) often stays unlimited and is not decremented.',
        'A new approve overwrites the old number. It does not add to it. Changing or revoking an allowance takes effect only once the transaction is confirmed on-chain.',
        'This page is not a request to approve a live contract. Read the address and the amount before you sign anything outside this simulation.'
      ]
    },
    zh: {
      title: '钱包为什么让你授权代币，而不是直接付款？',
      description: '授权写下的是额度（可支配额度），余额不动。之后的 transferFrom 才会动余额。签名之前先分清这两步。',
      answer: [
        '钱包是在请你允许另一个地址，在限额内花掉你的一种代币。这个限额叫做授权额度。',
        '授权被记下时，你的代币余额不变。授权是可支配额度，不是付款。'
      ],
      why: [
        '很多应用分两步动用代币。你先授权某个合约。之后那个合约再调用 transferFrom。',
        '钱包弹出的是第一步，因为它需要你的签名。额度会一直留着，直到被用完，或被你重新设置。'
      ],
      example: [
        '在本书的 MBox-Burn 实验里，账户 A 给账户 B 授权了 500 枚测试代币。两边的余额都没有因此改变。',
        '后来的代扣用掉了一部分额度。再发一笔 approve 0，链上确认后撤销的是剩下的额度。已经转走的代币仍在收款人那里。',
        '第 10 章讲规则。第 11 章留下了 Sepolia 上的交易记录。浏览器实验用虚构的 PLAY 代币让你走同样的步骤。它不会签名。'
      ],
      limits: [
        '代币合约的写法并不相同。本站的简化模型里，有限额度在使用后会减少；type(uint256).max（256 位无符号整数的最大值）常作为无限额度，使用后通常不递减。',
        '新的 approve 会覆盖旧数字，不是在旧数字上相加。改额度或撤销须等交易链上确认后才生效。',
        '本页不是让你去授权某个真实合约。离开这个模拟之后，签名前要核对地址和数量。'
      ]
    }
  },
  {
    slug: 'how-pools-set-a-price',
    lab: 'constant-product-amm',
    chapters: ['16-defi-labs'],
    en: {
      title: 'How can a pool price a swap with no order book?',
      description: 'A constant-product pool prices a swap from its reserves and a fee. Price impact is already in the quote. Slippage is the gap if the pool moves before you trade.',
      answer: [
        'The pool holds two tokens. A formula, not a list of buy and sell orders, turns your input into an output.',
        'In the constant-product model, the product of the two reserves stays near k. A larger trade moves the price further.'
      ],
      why: [
        'Price impact is that move. It comes from your own trade size compared with the pool. The quote already includes it, and it includes the fee.',
        'Slippage is the gap between the amount you were quoted and the amount you receive if someone else trades first.',
        'A slippage tolerance does not change the quote. It sets the minimum you will accept. If the output would be lower, the swap does not run.'
      ],
      example: [
        'Chapter 16 follows a real Sepolia swap of 0.001 SepETH and asks you to compare the quote with the receipt. Those figures are historical testnet records.',
        'The browser lab uses fictional PLAY and COIN reserves and a default fee of 30 basis points (30 bps = 0.30%), with the Uniswap v2 integer formula. It is not that Sepolia swap and not Uniswap v3.'
      ],
      limits: [
        'Real pools add fee tiers, concentrated liquidity, and routers. A thin pool can show a price far from any other market.',
        'Integer division rounds the output down. A very small trade can round to zero in the lab.',
        'The curve is a teaching model. It is not a forecast and not an offer to trade.'
      ]
    },
    zh: {
      title: '没有挂单簿，兑换价格从哪来？',
      description: '恒定乘积资金池用存量和手续费给兑换定价。价格影响已经在报价里。滑点是池子在你成交前又变动时，到账和报价之间的差。',
      answer: [
        '资金池放着两种代币。把你付出的数量换成到账数量的，是公式，不是一串买单和卖单。',
        '在恒定乘积模型里，两个存量的乘积保持在 k 附近。兑换越大，价格被推得越远。'
      ],
      why: [
        '这个推动就是价格影响。它来自你这笔兑换相对池子有多大。报价里已经包含它，也包含手续费。',
        '如果有人在你之前成交，你最后拿到的数量可能和报价不同。这个差额才是滑点。',
        '滑点容忍度不会改报价。它只写下你愿意接受的最少到账。到不了这个数，兑换就不执行。'
      ],
      example: [
        '第 16 章跟着一笔真实的 Sepolia 兑换：0.001 SepETH 换出了多少，并把报价和回执放在一起看。那些数字是当时测试网的记录。',
        '浏览器实验用虚构的 PLAY 和 COIN，默认手续费是 30 个基点（30 bps = 0.30%），整数算法与 Uniswap v2 相同。它不是那笔 Sepolia 兑换，也不是 Uniswap v3。'
      ],
      limits: [
        '真实的池子还有费率档、集中流动性和路由合约。很浅的池子可以给出远离其他市场的价格。',
        '整数除法会把到账往下舍。在实验里，太小的兑换可能舍成 0。',
        '这条曲线是教学模型。它不是预测，也不是在邀请你交易。'
      ]
    }
  },
  {
    slug: 'upgrades-and-immutable-history',
    lab: 'hash-chain',
    chapters: ['03-blocks-hashes-consensus', '13-upgradeable-ubox'],
    en: {
      title: 'How can a contract change if a blockchain does not?',
      description: 'Old blocks stay. An upgradeable token can keep one address and point it at new code. The upgrade is a new transaction. It does not rewrite history.',
      answer: [
        'A normal contract’s code is fixed at its address after deployment. What can still change is which code a proxy address will run next.',
        'Users keep calling the same proxy. The proxy holds the balances. An admin transaction points the proxy at a new implementation.',
        'That transaction is appended. Older blocks are not edited.'
      ],
      why: [
        'Two ideas get mixed together. A ledger that is hard to edit can still host a contract designed to switch its logic.',
        'The hash chain shows the first idea. Change an old page and later hashes fail. Recalculating them on your own computer creates a new head. It does not create agreement.',
        'The proxy shows the second idea. New code can be selected for a stable address, if the contract was built to allow that.'
      ],
      example: [
        'Chapter 13 records UBOX. The proxy address stayed fixed. Implementation contracts were replaced through the project’s upgrade path. V4 was local only and was not deployed on Sepolia.',
        'Chapter 3 explains why a private rewrite of every hash is not consensus. The browser lab computes real SHA-256 so you can see the head change.'
      ],
      limits: [
        'Not every contract has an admin or a proxy. Do not assume a token can be upgraded.',
        'Upgrade power is a risk. The person who can switch the implementation can change behaviour for every holder.',
        'This page does not say that any upgrade is safe. It only separates a new transaction from an edited history.'
      ]
    },
    zh: {
      title: '区块链不能改历史，合约为什么还能升级？',
      description: '旧区块还在。可升级代币可以保持同一个地址，再把这个地址指到新代码。升级本身是一笔新交易，不是改写历史。',
      answer: [
        '普通合约部署之后，那个地址上的代码就固定了。还能变的，是某个代理地址接下来要运行哪一份代码。',
        '用户一直调用同一个代理。余额记在代理里。一笔管理员交易把代理指到新的实现合约。',
        '这笔交易是追加上去的。更早的区块没有被改掉。'
      ],
      why: [
        '两件事容易混在一起。账本很难被篡改，同时一份合约仍可以被设计成可以更换逻辑。',
        '哈希链对应第一件事。改掉旧的一页，后面的哈希就不再匹配。只在自己的电脑上重算，会得到一个新的链头，不会因此形成网络共识。',
        '代理对应第二件事。如果合约一开始就留了升级路径，同一个地址可以改去运行新代码。'
      ],
      example: [
        '第 13 章记录了 UBOX。代理地址没有变。实现合约按项目的升级路径被换过。V4 只在本地，没有部署到 Sepolia。',
        '第 3 章说明，私下把每个哈希都重算一遍并不是共识。浏览器实验用真实的 SHA-256，让你看到链头变了。'
      ],
      limits: [
        '不是每份合约都有管理员或代理。不要默认一枚代币可以升级。',
        '升级权本身是风险。能更换实现合约的人，可以改变所有持有人面对的行为。',
        '本页不是在说某次升级是安全的。它只是把「新的一笔交易」和「改掉旧历史」分开。'
      ]
    }
  },
  {
    slug: 'why-loans-can-be-liquidated',
    lab: null,
    chapters: ['17-lending-liquidation', '19-oracle-safety'],
    en: {
      title: 'Why can a DeFi loan be liquidated?',
      description: 'A lower price does not take the collateral by itself. Liquidation happens when a transaction the protocol allows actually runs. Chapter 17 is a local fork, not a new Sepolia trade.',
      answer: [
        'You post collateral and borrow another asset. A quoted price can fall. The collateral is still posted until someone sends a liquidation transaction.',
        'In the book’s plain words, the health factor is collateral value times a liquidation threshold, divided by debt. Above 1, that chapter’s rule does not allow liquidation. A value of exactly 1 is still not low enough.'
      ],
      why: [
        'The price quote changes a ratio. It does not move the token balance.',
        'Someone has to call the protocol and repay part of the debt in exchange for part of the collateral. Until that call, the position stays open.',
        'A thin-pool spot price is a poor input for that ratio. Chapter 19 compares an independent price with a spot price the same trade just pushed.'
      ],
      example: [
        'Chapter 17 uses a pawn-shop picture and Aave V3 Sepolia contracts as they were at block 12165973. The writes ran on the author’s local Anvil node, chainId 31337. They are not new Sepolia transactions. Do not look those hashes up on Etherscan.',
        'There is no browser lab for liquidation. The allowance lab and the pool lab stay on this site because they do not need a fork. The loan chapter is evidence from a saved local run.'
      ],
      limits: [
        'That run used test tokens and one historical configuration. It is not a statement about mainnet, and it is not a prediction.',
        'Other protocols use other formulas. Read the market you are actually touching.',
        'Nothing on this page is a suggestion to borrow.'
      ]
    },
    zh: {
      title: '链上借款为什么会被清算？',
      description: '价格下跌本身不会把抵押品拿走。清算发生在有人发出协议允许的那笔交易时。第 17 章是本地分叉，不是一笔新的 Sepolia 交易。',
      answer: [
        '你放入抵押品，再借出另一种资产。报价可以下跌。在有人发出清算交易之前，抵押品仍然押在那里。',
        '按本书的白话，健康因子是抵押品价值乘以清算阈值，再除以债务。高于 1 时，那一章的规则不允许清算。正好等于 1 也还不够低。'
      ],
      why: [
        '价格报价改变的是一个比例。它不会自己把代币余额搬走。',
        '必须有人去调用协议，偿还一部分债务，并按规则拿走一部分抵押品。在这次调用之前，仓位还开着。',
        '很浅的池子的现价，不适合拿来当这个比例的输入。第 19 章比较了独立价格，以及同一笔交易刚刚推高的现价。'
      ],
      example: [
        '第 17 章用当铺作比喻，并用了区块 12165973 当时的 Aave V3 Sepolia 合约。写入发生在作者本机的 Anvil 上，chainId 是 31337。它们不是新的 Sepolia 交易。不要到 Etherscan 上查那些本地哈希。',
        '本站没有清算的浏览器实验。授权实验和资金池实验可以留在网页里，因为它们不需要分叉。借贷那一章是一次已保存的本地运行的证据。'
      ],
      limits: [
        '那次运行用的是测试代币和当时的一套配置。它不是对主网的判断，也不是预测。',
        '别的协议用别的公式。要看你真正接触的那个市场。',
        '本页没有任何借钱的建议。'
      ]
    }
  },
  {
    slug: 'learn-without-real-money',
    lab: 'erc20-allowance',
    chapters: ['01-how-to-read', '08-lab-counter'],
    en: {
      title: 'How can you learn Web3 without spending real money?',
      description: 'Start with the book and the browser labs. They need no wallet. A testnet comes later, with a new practice wallet and test coins, not with the wallet that holds anything of value.',
      answer: [
        'You can read every chapter and use all three browser labs with no account, no faucet, and no real money.',
        'The labs are simulations. The chapters that name a transaction are historical evidence. They are not instructions to repeat a transfer today.'
      ],
      why: [
        'A wallet signature can move assets or grant an allowance. Practise the idea before you are asked to sign.',
        'A testnet coin has no market value in this project, but a faucet can be offline. The browser labs do not depend on one.',
        'If you later want a testnet, create a new wallet for practice. Do not import a seed phrase from a wallet that already holds assets.'
      ],
      example: [
        'Path one: read Chapter 1, then Chapter 2, and decide when a shared ledger is even useful.',
        'Path two: open the allowance lab, the pool lab, and the hash-chain lab. Reset them as often as you like.',
        'Path three: open Chapter 8 and inspect a recorded testnet transaction in the block explorer. Do not connect a wallet.',
        'An AI agent can walk these paths with you. Use the prompt page. It tells the agent not to ask for a seed phrase and not to touch mainnet.'
      ],
      limits: [
        'This site cannot promise that a public faucet will give you test coins.',
        'A simulation can be wrong about a particular token’s code. When the book shows a transaction, the transaction is the evidence. The lab is the practice.',
        'Nothing here is investment instruction.'
      ]
    },
    zh: {
      title: '怎样不花真钱学习 Web3？',
      description: '先读教材，再用浏览器实验。这两件事都不需要钱包。测试网是后面的事：用新的练习钱包和测试币，不要用已经放着资产的那个钱包。',
      answer: [
        '每一章都可以读，三个浏览器实验也都可以用。不需要账号，不需要水龙头，也不花真钱。',
        '实验页是模拟。点名某笔交易的章节是历史证据。它们不是让你今天再去转一笔。'
      ],
      why: [
        '钱包签名可以转走资产，也可以给出授权额度。在有人请你签名之前，先把这个差别练熟。',
        '在这个项目里，测试币没有市场价格，但水龙头可能领不到。浏览器实验不依赖水龙头。',
        '如果以后要上测试网，请新建一个练习钱包。不要导入那个已经放着资产的钱包的助记词。'
      ],
      example: [
        '第一条路：读第 1 章，再读第 2 章，先判断共享账本到底有没有必要。',
        '第二条路：打开授权实验、资金池实验和哈希链实验。随时可以重置。',
        '第三条路：打开第 8 章，在区块浏览器里查看一笔已经记录的测试网交易。不要连接钱包。',
        '也可以请 AI 代理带你走这些路。用「请 AI 带练」那一页。它要求代理不要索取助记词，也不要碰主网。'
      ],
      limits: [
        '本站不能保证公共水龙头一定发得出测试币。',
        '模拟可能和某一份代币代码不一致。书里给出交易时，交易才是证据。实验页是练习。',
        '这里没有任何投资指引。'
      ]
    }
  }
]

export function guideBySlug(slug) {
  return guides.find((guide) => guide.slug === slug)
}
