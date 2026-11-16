// Self-check questions. Rendered as real HTML on the glossary page AND emitted as
// FAQPage JSON-LD from the same data, so the two can never drift apart.
export interface QA { q: string; a: string }

export const quiz: Record<'zh' | 'en', QA[]> = {
  zh: [
    { q: '一个供应商愿意完全信任运营平台时，为什么不一定需要区块链？', a: '因为大家已经信任同一个记账者，集中式数据库更简单、更快、更便宜，也更容易保护隐私。区块链的价值在于多个互不完全信任的参与方共同维护一份账本；没有这个前提，它的成本往往不值得。' },
    { q: '钱包签名交易时，私钥需要发送给矿工或验证者吗？', a: '不需要。私钥只在你本地用来生成签名；网络上传播的是已签名的交易，节点用签名和公开信息验证它确实由该地址授权。' },
    { q: 'approve(100) 会立刻扣掉 100 枚代币吗？', a: '不会。approve 只是写入一个「最多可代扣多少」的额度（allowance），余额不变。真正动余额的是之后被授权者调用的 transferFrom 或 burnFrom。' },
    { q: '为什么 Proxy 地址不变，业务规则仍可能变化？', a: '代理只是固定的入口，它把调用转给「实现合约」执行。ProxyAdmin 的所有者可以把代理指向新的实现，于是同一个地址背后的规则就变了。' },
    { q: '49/49 单元测试通过，是否意味着不存在漏洞？', a: '不能。测试只证明「写下来的那些用例」通过了。P0 中 49 个单元测试全部通过，审查仍然记录了 1 个 Medium、3 个 Low 和 6 个 Info 发现。' },
    { q: 'V4 在 Fork 模拟中通过了，能否说「V4 已在 Sepolia 部署」？', a: '不能。Fork 模拟没有发出任何真实交易，也没有交易哈希。快照时 UBOX 代理仍然指向 V3 实现 0x16E3D2f25e28253b467C66c462973e4ca86fad28。' },
    { q: '把 1,000 MBox 转到一个没有私钥的地址后，还能找回吗？', a: '不能。已确认的交易不能撤销，而没有私钥就没有人能为那个地址签名转出。演示地址 0x878fFf967331D01E97c8DdCD76C3Dd97333BcA6E 上的 1,000 MBox 永久锁死，不要再往那里转任何东西。' },
    { q: '两个代币的名称和符号一模一样，它们是同一个代币吗？', a: '不一定。name 和 symbol 只是合约返回的字符串，没有注册机制，任何人都能部署同名合约。识别代币要看合约地址。' },
    { q: 'burn 和「转到 0x0 地址」有什么区别？', a: 'burn 同时减少持有人余额和 totalSupply；普通 transfer 到零地址（若合约允许）只改余额，不减少总供应。判断要读 totalSupply()，不能只看 Transfer 事件。' },
    { q: '分两笔交易调用 transferFrom，第二笔失败了，第一笔会自动退回吗？', a: '不会。两笔独立交易不是原子的。只有在同一笔交易里完成的一批操作（例如 UBOX V2 的 batchTransfer）才会「一处失败，全部回滚」。' },
    { q: 'UBOX 面额重标后，旧的 Transfer 事件会被改写吗？', a: '不会。链上日志不可改写。成功批次里「100 给 B」的旧日志仍是旧单位 100e18；若按新单位去读，会比实际大 10,000 倍。重标后 B 的 balanceOf 是 0.01。' },
    { q: '一笔交易状态是失败（reverted），还要付手续费吗？', a: '要。失败交易仍会占用 nonce、消耗 gas、出现在浏览器上，只是状态改动被回滚。实验中预期失败的 batchTransfer 用了 51,719 gas，手续费 3,516,892 wei。' }
  ],
  en: [
    { q: 'If a supplier is happy to fully trust the platform operator, why might it not need a blockchain?', a: 'Because everyone already trusts one record-keeper. A central database is simpler, faster, cheaper and better for privacy. A blockchain earns its cost when several parties who do not fully trust each other must keep one shared ledger; without that, it is rarely worth it.' },
    { q: 'When a wallet signs a transaction, does the private key get sent to miners or validators?', a: 'No. The private key stays on your device and is only used to produce a signature. The network receives the signed transaction and checks the signature against public information.' },
    { q: 'Does approve(100) immediately take 100 tokens from you?', a: 'No. approve only records an allowance — the most the spender may move later. Your balance is unchanged until the spender actually calls transferFrom or burnFrom.' },
    { q: 'Why can the business rules change even though the proxy address stays the same?', a: 'The proxy is only a fixed entrance that forwards calls to an implementation contract. The ProxyAdmin owner can point the proxy at a new implementation, so the rules behind the same address change.' },
    { q: 'If 49/49 unit tests pass, does that mean there are no vulnerabilities?', a: 'No. Tests only show that the cases someone wrote down pass. In P0 all 49 unit tests passed, and the review still recorded 1 Medium, 3 Low and 6 Info findings.' },
    { q: 'V4 passed a fork simulation. Can we say "V4 is deployed on Sepolia"?', a: 'No. A fork simulation sends no real transaction and has no transaction hash. At the snapshot the UBOX proxy still pointed to the V3 implementation 0x16E3D2f25e28253b467C66c462973e4ca86fad28.' },
    { q: 'After 1,000 MBox were sent to an address with no private key, can they be recovered?', a: 'No. Confirmed transactions cannot be undone, and without a private key nobody can sign a transfer out. The 1,000 MBox at the demo address 0x878fFf967331D01E97c8DdCD76C3Dd97333BcA6E are locked forever — do not send anything else there.' },
    { q: 'Two tokens have exactly the same name and symbol. Are they the same token?', a: 'Not necessarily. name and symbol are just strings returned by the contract; there is no registry, and anyone can deploy a look-alike. Identify a token by its contract address.' },
    { q: 'What is the difference between burn and "transfer to address 0x0"?', a: 'burn lowers both the holder\'s balance and totalSupply. A plain transfer to the zero address (if a contract allows it) only moves the balance and does not reduce supply. Read totalSupply(); do not rely on the Transfer event alone.' },
    { q: 'You call transferFrom in two separate transactions and the second one fails. Is the first one undone?', a: 'No. Two separate transactions are not atomic. Only a batch executed inside one transaction (such as UBOX V2 batchTransfer) is "all or nothing".' },
    { q: 'After the UBOX redenomination, are the old Transfer events rewritten?', a: 'No. On-chain logs cannot be rewritten. The old "100 to B" log in the successful batch still says 100e18 in old units; read as new units it would be 10,000 times too large. After the redenomination B\'s balanceOf is 0.01.' },
    { q: 'If a transaction fails (reverted), do you still pay a fee?', a: 'Yes. A failed transaction still uses a nonce, consumes gas and appears in the explorer; only its state changes are rolled back. The intentionally failing batchTransfer in the lab used 51,719 gas and cost 3,516,892 wei.' }
  ]
}
