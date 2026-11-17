#!/usr/bin/env python3
"""Generate Appendix A (addresses + every broadcast tx) for both locales directly
from the lab notebook (实验记录.md §5.2 and §10.2) so no hash can be mistyped.

Usage:  npm run appendix            (default notebook: /workspace/web3-sandbox/实验记录.md)
        python3 scripts/gen_appendix.py /path/to/实验记录.md

Adding a new experiment (see CONTRIBUTING.zh-CN.md「追加实验到附录 A」):
  1. Append the transaction rows to the notebook table in §5.2, same format:
     | nonce | A/B | 用途 | success/**reverted** | fee | [交易](https://sepolia.etherscan.io/tx/0x…) |
  2. Add the block number to `blocks` below (key = first 10 chars of the hash).
  3. Add an English label for each new 用途 to `en_purpose` (and, optionally, a
     nicer Chinese label to `zh_purpose`).
  4. New contract / account addresses go into `contracts` / `accounts`.
  5. Run `npm run appendix`, then `npm run check:facts` and `npm run build`.
The script stops with a clear message if a row has no block number or label.
Only zh/en 16-appendix-addresses-txs.mdx are written; never edit them by hand.
"""
import re, sys
from pathlib import Path

nb = Path(sys.argv[1] if len(sys.argv) > 1 else '/workspace/web3-sandbox/实验记录.md').read_text(encoding='utf-8')
sec = nb[nb.index('### 5.2'):nb.index('## 6.')]
rows = []
for line in sec.splitlines():
    m = re.match(r'\| (\d+|—) \| (A|B) \| (.+?) \| (\*\*reverted\*\*|success) \| (\d+) \| \[交易\]\(https://sepolia.etherscan.io/tx/(0x[0-9a-f]{64})\) \|', line)
    if m:
        rows.append(list(m.groups()))
if not rows:
    sys.exit('✖ no transaction rows found in §5.2 of the notebook — check the table format')
print(f'{len(rows)} transaction rows from §5.2')
# D-01 from §10.2
d01 = re.search(r'交易：`(0x[0-9a-f]{64})`', nb[nb.index('### 10.2'):]).group(1)
assert d01 == '0x4571e581958308c820ab16da26aa9d1a2622caa7c720ebe164b5d2c29a3747f2'
fund = '0xc8b5c548e4e42c69c9f0b9cd8a9a8c4381d7cb2a1e0823b1ef22f539d344d92b'
assert fund in nb

# block numbers as recorded in §4 / §10.2 of the notebook, keyed by tx hash prefix
blocks = {'0x5619a108': 12110961, '0x9e63d7a2': 12110964, '0x6051310d': 12111025, '0xd61e5768': 12111091,
          '0x8141d5f3': 12111181, '0xf9fccb16': 12115620, '0x039ffbb8': 12115621, '0xd6582fec': 12115825,
          '0xe11a7f5e': 12115826, '0xdeb79686': 12115897, '0x36e04d36': 12115898, '0x8cd1de93': 12115899,
          '0x678e1de0': 12115993, '0x2974d0c2': 12115994, '0xdf571b52': 12116097, '0xaeb0216f': 12116098,
          '0xcc60956b': 12116317, '0x91e5ec0b': 12116319, '0x7dd2f863': 12116493, '0xd7789d98': 12116568,
          '0xad0fd9cb': 12117040, '0x5765d84e': 12117041}
for k, v in blocks.items():
    assert k in nb and str(v) in nb, f'block {v} / hash {k} is not in the notebook'

en_purpose = {
    '部署 Counter': 'Deploy Counter', 'Counter increment': 'Counter increment', 'Counter reset': 'Counter reset',
    'increment（1 wei tip）': 'increment (1 wei tip)', 'increment（2 wei tip）': 'increment (2 wei tip)',
    '部署 MBox': 'Deploy MBox', '转 1000 MBox 给无密钥地址': 'Send 1,000 MBox to the keyless address',
    '部署 MBox-Burn': 'Deploy MBox-Burn', 'burn 1000 MBox-Burn': 'burn 1,000 MBox-Burn',
    '给 B 0.0001 SepETH': 'Send B 0.0001 SepETH', 'approve(B, 500)': 'approve(B, 500)',
    'burnFrom(A, 100)': 'burnFrom(A, 100)', 'transferFrom 100 给 B': 'transferFrom 100 to B',
    'transferFrom 200 给 A': 'transferFrom 200 to A', '部署 UBOX V1 实现': 'Deploy UBOX V1 implementation',
    '部署代理并 initialize': 'Deploy proxy and initialize', '部署 UBOX V2 实现': 'Deploy UBOX V2 implementation',
    '升级代理到 V2': 'Upgrade proxy to V2', '预期失败的 batchTransfer': 'Intentionally failing batchTransfer',
    '成功的 batchTransfer': 'Successful batchTransfer', '部署 UBOX V3 实现': 'Deploy UBOX V3 implementation',
    '升级到 V3 并 initializeV3': 'Upgrade to V3 and initializeV3'}

zh_purpose = {'transferFrom 100 给 B': 'transferFrom 100 给 B', 'transferFrom 200 给 A': 'transferFrom 200 给 A（自转账）',
              '转 1000 MBox 给无密钥地址': '转 1,000 MBox 给无私钥地址', 'burn 1000 MBox-Burn': 'burn 1,000 MBox-Burn'}

missing = [f'  - {h[:10]}… ({p}): add its block number to `blocks`' for _, _, p, _, _, h in rows if h[:10] not in blocks]
missing += [f'  - 用途 "{p}": add an English label to `en_purpose`' for _, _, p, _, _, _ in rows if p not in en_purpose]
if missing:
    sys.exit('✖ appendix generator needs data for new notebook rows:\n' + '\n'.join(dict.fromkeys(missing)))

def fmt(n): return f'{int(n):,}'

def tx_rows(lang):
    out = []
    b_nonce = 0
    for nonce, sender, purpose, status, fee, h in rows:
        if sender == 'B':
            nonce = str(b_nonce); b_nonce += 1
        p = en_purpose[purpose] if lang == 'en' else zh_purpose.get(purpose, purpose)
        st = ('**reverted**' if lang == 'en' else '**失败（预期）**') if 'reverted' in status else ('success' if lang == 'en' else '成功')
        out.append(f'| {sender} | {nonce} | {p} | {st} | {blocks[h[:10]]} | {fmt(fee)} | <Tx h="{h}" /> |')
    p = 'D-01 approve(B, 0) (revoke)' if lang == 'en' else 'D-01 approve(B, 0)（撤销授权）'
    out.append(f'| A | 19 | {p} | {"success" if lang == "en" else "成功"} | 12117312 | {fmt(1693122)} | <Tx h="{d01}" /> |')
    return '\n'.join(out)

contracts = [
    ('Counter', '0xAf6f88Cf8bf6e9211CD11B375AECBa37d61CD00f', '教学计数器，不可升级', 'Teaching counter, not upgradeable'),
    ('MBox', '0xc4B187783f074111EbeFC50B9a1901f2a4F94630', '长中文名 ERC-20', 'ERC-20 with a long Chinese name'),
    ('MBox-Burn', '0x2AE6BbE8b524381535D1f443fe95018b1f64e3F2', '带 burn / burnFrom', 'With burn / burnFrom'),
    ('UBOX proxy', '0xc3F20D5488784D922aC3428a54125715fA98db04', '用户面对的代币地址', 'The token address users use'),
    ('UBOX V1', '0xdaBaDC03042B010eFF67Bf2553798d75e817300a', '已被代理换下，代码仍在', 'Replaced; code remains'),
    ('UBOX V2', '0x0711Ef7C97b061fd3C87026ad38703dd253E779F', '已被代理换下，代码仍在', 'Replaced; code remains'),
    ('UBOX V3', '0x16E3D2f25e28253b467C66c462973e4ca86fad28', '快照时的当前实现', 'Current implementation at the snapshot'),
    ('ProxyAdmin', '0x6DEAe6C7fAa9fabe1983082277922CDcf90BBEE9', 'owner 为账户 A', 'Owner: account A'),
]
accounts = [
    ('A', '0xE3e61E8650A1E203Be24a83Ea050Ccc4113e25AC', '主测试账户 / 部署者 / UBOX owner', 'Main test account / deployer / UBOX owner'),
    ('B', '0x1dB261d3d5BE16E1A81582E8786A6FAB82Fe218c', '被授权者（spender）', 'Approved spender'),
    ('MBox demo', '0x878fFf967331D01E97c8DdCD76C3Dd97333BcA6E', '**无私钥，不可找回**；持有 1,000 MBox。请勿再转入', '**No key, unrecoverable**; holds 1,000 MBox. Do not send anything here'),
    ('C', '0x6E7F8eF4353DB8012Dea3F70eb523aB1A3051711', '失败批次的演示收款方，不保存密钥，收到 0', 'Recipient in the failing batch; key never stored; received 0'),
    ('Faucet source', '0x52f1984Cd3e46e1214dB222D3Ff63712E7aCEedD', '启动资金 0.05 SepETH 的来源，无官方名称标签', 'Source of the 0.05 SepETH starting funds; no official name tag'),
]
zh_names = {'UBOX proxy': 'UBOX 代理', 'UBOX V1': 'UBOX V1 实现', 'UBOX V2': 'UBOX V2 实现', 'UBOX V3': 'UBOX V3 实现',
            'A': '账户 A', 'B': '账户 B', 'MBox demo': 'MBox 演示收款地址', 'C': '演示地址 C', 'Faucet source': '启动资金来源'}
en_names = {'UBOX proxy': 'UBOX proxy', 'UBOX V1': 'UBOX V1 implementation', 'UBOX V2': 'UBOX V2 implementation',
            'UBOX V3': 'UBOX V3 implementation', 'A': 'Account A', 'B': 'Account B', 'MBox demo': 'MBox demo recipient',
            'C': 'Demo address C', 'Faucet source': 'Starting-funds source'}

def table(items, lang):
    names = zh_names if lang == 'zh' else en_names
    return '\n'.join(f'| {names.get(n, n)} | <Addr a="{a}" /> | {zh if lang == "zh" else en} |' for n, a, zh, en in items)

ZH = f'''---
title: "附录 A　地址与交易总表"
description: "本书提到的全部 Sepolia 合约地址、账户地址，以及账户 A（nonce 0–19）和账户 B（nonce 0–2）的全部已广播交易，附完整哈希、区块号、手续费和 Sepolia Etherscan 链接；另附实验环境参数。"
navTitle: "附录 A　地址与交易总表"
part: wrapup
order: 160
status: published
---

<p class="lead">这一页可以独立核对：每个地址、每笔交易都附完整值和 Sepolia <Term id="etherscan">Etherscan</Term> 链接。表格由脚本直接从实验记录生成，没有手工抄写哈希。</p>

<Snapshot lang="zh" />

本页保留历史快照，可从[原始实验记录节选](https://github.com/cnkang/lets-play-web3/blob/main/docs/evidence/phase-0-notebook-excerpts.md)核对第 5 节交易表与第 10 节收尾结果。查询不需要钱包。

## 合约地址（8 个）

<T label="合约地址">

| 名称 | 地址 | 说明 |
| --- | --- | --- |
{table(contracts, 'zh')}

</T>

## 账户与演示地址

这些都是 **Sepolia <Term id="testnet">测试网</Term>地址**。切勿向它们转入<Term id="mainnet">主网</Term>资产，也不要再向无<Term id="private-key">私钥</Term>的演示地址转入任何东西。

<T label="账户与演示地址">

| 名称 | 地址 | 说明 |
| --- | --- | --- |
{table(accounts, 'zh')}

</T>

## 全部已广播交易

启动资金（<Term id="faucet">水龙头</Term>转入，不占 A 的 <Term id="nonce">nonce</Term>）：2026-11-11 15:58:24（新加坡时间），<Term id="block">区块</Term> 12110419，0.05 <Term id="sepeth">SepETH</Term>：

<Tx h="{fund}" />

下表是账户 A 的全部交易（nonce 0–19）和账户 B 的全部交易（nonce 0–2），按发生顺序排列。手续费单位为 <Term id="wei">wei</Term>。

<T label="全部已广播交易">

| 发送者 | nonce | 目的 | 状态 | 区块 | 手续费（wei） | 交易哈希 |
| --- | ---: | --- | --- | ---: | ---: | --- |
{tx_rows('zh')}

</T>

### 对账

- 账户 A 在 D-01 之前（nonce 0–18）的 gas 手续费合计 **4,217,798,783 wei**；加上 D-01 的 1,693,122 wei，共 **4,219,491,905 wei**。
- 另外 A 向 B 转出 **0.0001 SepETH**。
- 0.05 − 0.0001 − 0.000000004219491905 = **0.049899995780508095 SepETH**，与快照时 A 的余额完全一致。
- 快照时：A 的 nonce 为 **20**，B 的 nonce 为 **3**；B 的余额 0.000099999982630182 SepETH。

## 实验环境

<T label="实验环境参数">

| 项目 | 实际使用 |
| --- | --- |
| 网络 | Ethereum Sepolia |
| chainId | 11155111（每个广播脚本都会断言，不符则中止） |
| RPC | `https://ethereum-sepolia-rpc.publicnode.com`（免费公共节点，无 archive） |
| 编译器 | solc 0.8.34+commit.80d5c536，optimizer 关闭 |
| EVM 版本（编译产物） | osaka |
| 库 | viem 2.57.18；OpenZeppelin Contracts 5.6.1 |
| 费用市场 | EIP-1559（maxFeePerGas + maxPriorityFeePerGas） |
| 测试 | Foundry 1.9.0 |
| 区块浏览器 | Sepolia Etherscan（sepolia.etherscan.io） |

</T>

## 快照时的链上状态（区块 12117419）

<T label="快照时的链上状态">

| 项目 | 值 |
| --- | --- |
| Counter.count / owner | 2 / 账户 A |
| MBox totalSupply / A / 无私钥演示地址 | 1,000,000 / 999,000 / 1,000（不可找回） |
| MBox-Burn totalSupply / A / B | 998,900 / 998,800 / 100 |
| MBox-Burn allowance(A, B) | 0（已撤销） |
| UBOX 实现 | V3 `0x16E3D2f25e28253b467C66c462973e4ca86fad28`（V4 未上链） |
| UBOX name / symbol / decimals / scale | 可升级沙盒代币 / UBOX / 18 / 10000 |
| UBOX totalSupply / A / B（新单位） | 100 / 99.99 / 0.01 |
| UBOX owner 与 ProxyAdmin owner | 账户 A |

</T>
'''

EN = f'''---
title: "Appendix A · Addresses and transactions"
description: "Every Sepolia contract address and account address mentioned in this book, plus every broadcast transaction from account A (nonces 0–19) and account B (nonces 0–2), with full hashes, block numbers, fees and Sepolia Etherscan links, and the lab environment."
navTitle: "Appendix A · Addresses and transactions"
part: wrapup
order: 160
status: published
---

<p class="lead">This page can be checked on its own: every address and transaction has its full value and a Sepolia <Term id="etherscan">Etherscan</Term> link. The tables are generated by a script straight from the lab notebook; no hash was copied by hand.</p>

<Snapshot lang="en" />

For the historical source, compare §5 (transactions) and §10 (wrap-up) in the [original notebook excerpts](https://github.com/cnkang/lets-play-web3/blob/main/docs/evidence/phase-0-notebook-excerpts.md). Looking up these records needs no wallet.

## Contract addresses (8)

<T label="Contract addresses">

| Name | Address | Notes |
| --- | --- | --- |
{table(contracts, 'en')}

</T>

## Accounts and demo addresses

These are all **Sepolia <Term id="testnet">testnet</Term> addresses**. Never send <Term id="mainnet">mainnet</Term> assets to them, and never send anything more to the demo address that has no <Term id="private-key">private key</Term>.

<T label="Accounts and demo addresses">

| Name | Address | Notes |
| --- | --- | --- |
{table(accounts, 'en')}

</T>

## Every broadcast transaction

Starting funds (<Term id="faucet">faucet</Term> transfer, does not use one of A's <Term id="nonce">nonces</Term>): 2026-11-11 15:58:24 Singapore time, <Term id="block">block</Term> 12110419, 0.05 <Term id="sepeth">SepETH</Term>:

<Tx h="{fund}" />

The table lists every transaction from account A (nonces 0–19) and from account B (nonces 0–2), in the order they happened. Fees are in <Term id="wei">wei</Term>.

<T label="Every broadcast transaction">

| Sender | Nonce | Purpose | Status | Block | Fee (wei) | Transaction hash |
| --- | ---: | --- | --- | ---: | ---: | --- |
{tx_rows('en')}

</T>

### Reconciliation

- Account A's gas fees before D-01 (nonces 0–18) total **4,217,798,783 wei**; adding D-01's 1,693,122 wei gives **4,219,491,905 wei**.
- A also sent **0.0001 SepETH** to B.
- 0.05 − 0.0001 − 0.000000004219491905 = **0.049899995780508095 SepETH**, exactly A's balance at the snapshot.
- At the snapshot: A's nonce was **20** and B's nonce **3**; B's balance was 0.000099999982630182 SepETH.

## Lab environment

<T label="Lab environment">

| Item | Actually used |
| --- | --- |
| Network | Ethereum Sepolia |
| chainId | 11155111 (asserted by every broadcast script; abort on mismatch) |
| RPC | `https://ethereum-sepolia-rpc.publicnode.com` (free public node, no archive) |
| Compiler | solc 0.8.34+commit.80d5c536, optimizer off |
| EVM version (build output) | osaka |
| Libraries | viem 2.57.18; OpenZeppelin Contracts 5.6.1 |
| Fee market | EIP-1559 (maxFeePerGas + maxPriorityFeePerGas) |
| Testing | Foundry 1.9.0 |
| Block explorer | Sepolia Etherscan (sepolia.etherscan.io) |

</T>

## On-chain state at the snapshot (block 12117419)

<T label="On-chain state at the snapshot">

| Item | Value |
| --- | --- |
| Counter.count / owner | 2 / account A |
| MBox totalSupply / A / keyless demo address | 1,000,000 / 999,000 / 1,000 (unrecoverable) |
| MBox-Burn totalSupply / A / B | 998,900 / 998,800 / 100 |
| MBox-Burn allowance(A, B) | 0 (revoked) |
| UBOX implementation | V3 `0x16E3D2f25e28253b467C66c462973e4ca86fad28` (V4 not on-chain) |
| UBOX name / symbol / decimals / scale | 可升级沙盒代币 / UBOX / 18 / 10000 |
| UBOX totalSupply / A / B (new units) | 100 / 99.99 / 0.01 |
| UBOX owner and ProxyAdmin owner | Account A |

</T>
'''
base = Path(__file__).resolve().parent.parent / 'src' / 'content' / 'chapters'
(base / 'zh' / '16-appendix-addresses-txs.mdx').write_text(ZH, encoding='utf-8')
(base / 'en' / '16-appendix-addresses-txs.mdx').write_text(EN, encoding='utf-8')
print('appendix written')
