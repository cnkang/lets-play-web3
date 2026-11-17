# Phase-0 evidence: notebook excerpts / 实验记录节选

Source: owner-supplied `web3-sandbox-repo.zip`, member `web3-sandbox/实验记录.md`.

Original file SHA-256: `30f77bceb8904c637340f13fe7a179a1d4b5e2e9e8c8be174a62b102a8054b94`.

Sections 3, 5 and 10 are reproduced below in their original Chinese. Original line ranges: 53–74, 357–404, 505–582. No commands were executed. Historical P0 / Phase 0 labels are retained as source text; the guide calls this stage Phase-0.

以下按原文保留第 3、5、10 节，作为公开地址、交易和较晚决策结果的出处。第 5 节是早期交易汇总；第 10 节的撤销、验证和快照记录更晚。命令和待办只是历史记录，不是本次操作指令。未收录钱包、密钥或原始日志。

---

## 3. 账户与启动资金

全部为 **Sepolia 测试账户**，切勿向这些地址转入主网资产。

| 角色 | 地址 | 说明 |
|---|---|---|
| 账户 A（主测试账户 / 部署者 / UBOX owner） | [0xE3e61E8650A1E203Be24a83Ea050Ccc4113e25AC](https://sepolia.etherscan.io/address/0xE3e61E8650A1E203Be24a83Ea050Ccc4113e25AC) | 本地生成的一次性测试账户 |
| 账户 B（授权 spender） | [0x1dB261d3d5BE16E1A81582E8786A6FAB82Fe218c](https://sepolia.etherscan.io/address/0x1dB261d3d5BE16E1A81582E8786A6FAB82Fe218c) | 另一次本地生成，用于 approve / burnFrom / transferFrom |
| MBox 演示收款地址 | [0x878fFf967331D01E97c8DdCD76C3Dd97333BcA6E](https://sepolia.etherscan.io/address/0x878fFf967331D01E97c8DdCD76C3Dd97333BcA6E) | **无密钥、不可找回**；未灌入 SepETH |
| UBOX 失败批次演示地址 C | [0x6E7F8eF4353DB8012Dea3F70eb523aB1A3051711](https://sepolia.etherscan.io/address/0x6E7F8eF4353DB8012Dea3F70eb523aB1A3051711) | 内存中临时生成，不保存密钥；收款为 0 |

**启动资金（已上链）**

- 2026-11-11 15:58:24 新加坡时间（07:58:24 UTC），账户 A 收到 **0.05 SepETH**（50000000000000000 wei）。
- 入账交易：[0xc8b5c548e4e42c69c9f0b9cd8a9a8c4381d7cb2a1e0823b1ef22f539d344d92b](https://sepolia.etherscan.io/tx/0xc8b5c548e4e42c69c9f0b9cd8a9a8c4381d7cb2a1e0823b1ef22f539d344d92b)，区块 **12110419**。
- 来源地址：[0x52f1984Cd3e46e1214dB222D3Ff63712E7aCEedD](https://sepolia.etherscan.io/address/0x52f1984Cd3e46e1214dB222D3Ff63712E7aCEedD)。该地址在 Sepolia 上持续向许多地址转出 0.05 ETH，金额与常见 PoW 水龙头（例如 pk910）的最低档一致，但浏览器上**没有官方名称标签**，因此本记录只写可核验的来源地址与金额，不把水龙头品牌写成已证实事实。
- 账户 B 没有独立水龙头入账；后文 approve/burnFrom 实验中，由 A 转给 B **0.0001 SepETH** 作为测试 gas。

私钥存放在本地 `.secrets/`（目录权限 700，密钥文件 600，已被 `.gitignore` 忽略）。公开记录与本文都不含密钥。

---


---

## 5. 重要合约与全部已广播交易一览

### 5.1 合约

| 名称 | 地址 | 说明 |
|---|---|---|
| Counter | [0xAf6f88Cf8bf6e9211CD11B375AECBa37d61CD00f](https://sepolia.etherscan.io/address/0xAf6f88Cf8bf6e9211CD11B375AECBa37d61CD00f) | 教学计数器，不可升级 |
| MBox | [0xc4B187783f074111EbeFC50B9a1901f2a4F94630](https://sepolia.etherscan.io/address/0xc4B187783f074111EbeFC50B9a1901f2a4F94630) | 长中文名 ERC-20 |
| MBox-Burn | [0x2AE6BbE8b524381535D1f443fe95018b1f64e3F2](https://sepolia.etherscan.io/address/0x2AE6BbE8b524381535D1f443fe95018b1f64e3F2) | 带 burn / burnFrom |
| UBOX 代理 | [0xc3F20D5488784D922aC3428a54125715fA98db04](https://sepolia.etherscan.io/address/0xc3F20D5488784D922aC3428a54125715fA98db04) | 用户面对的代币地址 |
| UBOX V1 实现 | [0xdaBaDC03042B010eFF67Bf2553798d75e817300a](https://sepolia.etherscan.io/address/0xdaBaDC03042B010eFF67Bf2553798d75e817300a) | 已被代理换下，代码仍在 |
| UBOX V2 实现 | [0x0711Ef7C97b061fd3C87026ad38703dd253E779F](https://sepolia.etherscan.io/address/0x0711Ef7C97b061fd3C87026ad38703dd253E779F) | 已被代理换下，代码仍在 |
| UBOX V3 实现 | [0x16E3D2f25e28253b467C66c462973e4ca86fad28](https://sepolia.etherscan.io/address/0x16E3D2f25e28253b467C66c462973e4ca86fad28) | 当前实现 |
| ProxyAdmin | [0x6DEAe6C7fAa9fabe1983082277922CDcf90BBEE9](https://sepolia.etherscan.io/address/0x6DEAe6C7fAa9fabe1983082277922CDcf90BBEE9) | owner 为 A |

### 5.2 账户 A 的全部交易（nonce 0–18）以及账户 B 的三笔

入账（水龙头，不占 A 的 nonce）：[0xc8b5c548…4d92b](https://sepolia.etherscan.io/tx/0xc8b5c548e4e42c69c9f0b9cd8a9a8c4381d7cb2a1e0823b1ef22f539d344d92b)，0.05 SepETH。

| nonce | 发送者 | 目的 | 状态 | 手续费（wei） | 链接 |
|---:|---|---|---|---:|---|
| 0 | A | 部署 Counter | success | 115684870 | [交易](https://sepolia.etherscan.io/tx/0x5619a1084d03bbf2101514963485178160ffb59a3876b2920123055ec09c65a6) |
| 1 | A | Counter increment | success | 8651572 | [交易](https://sepolia.etherscan.io/tx/0x9e63d7a2bf89d4dd7330623a6729ce35f1c249c9d735de0e7fb770b380a98e73) |
| 2 | A | Counter reset | success | 1653820 | [交易](https://sepolia.etherscan.io/tx/0x6051310d025382a9b0b943fac0e8791036db4d3ededd27dedf333b616d60017a) |
| 3 | A | increment（1 wei tip） | success | 2671809 | [交易](https://sepolia.etherscan.io/tx/0xd61e57686959b7c4c9d774a6aa35b0fb9dac72e8317055146da4676a9e4e4b31) |
| 4 | A | increment（2 wei tip） | success | 762034 | [交易](https://sepolia.etherscan.io/tx/0x8141d5f30dc7abd76c7c2ebfcc9f4861af625e38ca11220605057e1275512da8) |
| 5 | A | 部署 MBox | success | 428632485 | [交易](https://sepolia.etherscan.io/tx/0xf9fccb16dd1a0ef99a86d7f4e81cb0e286d4ed4e154963db517c375e3aa92058) |
| 6 | A | 转 1000 MBox 给无密钥地址 | success | 9907800 | [交易](https://sepolia.etherscan.io/tx/0x039ffbb819638f771e760b12e0e01de6ec2c2c6bb5691fa2ed5cd0d6c45eb054) |
| 7 | A | 部署 MBox-Burn | success | 555368628 | [交易](https://sepolia.etherscan.io/tx/0xd6582fecf142f8879e0d9259c79c3a07885ed0ef9d67ceb6d94d98cdd80d8c20) |
| 8 | A | burn 1000 MBox-Burn | success | 2857684 | [交易](https://sepolia.etherscan.io/tx/0xe11a7f5e583e272633f5b1ef420597b496d594b976a6c698e3289de568f3b03b) |
| 9 | A | 给 B 0.0001 SepETH | success | 13912800 | [交易](https://sepolia.etherscan.io/tx/0xdeb796869c494aac1311ea91248f54be4e1fd922d311ec73c9c949440fa4b77d) |
| 10 | A | approve(B, 500) | success | 8749968 | [交易](https://sepolia.etherscan.io/tx/0x36e04d365cc5c032ecaf752d938856a33ef00bc14432383c75b074258ae96fb9) |
| — | B | burnFrom(A, 100) | success | 3815208 | [交易](https://sepolia.etherscan.io/tx/0x8cd1de93ef180aa1c3590f8eb1dbafb6d63f5358f9b132d91c2a26c98130f259) |
| — | B | transferFrom 100 给 B | success | 10998894 | [交易](https://sepolia.etherscan.io/tx/0x678e1de0786a5fa5eda737f1be0638e3feb86acd0da4c153e8ce45bf7cc20bbd) |
| — | B | transferFrom 200 给 A | success | 2555716 | [交易](https://sepolia.etherscan.io/tx/0x2974d0c2ba1d18cf89cc7fed7747c539d2591962fcf6bc2e0bdc843616ca5e97) |
| 11 | A | 部署 UBOX V1 实现 | success | 701305506 | [交易](https://sepolia.etherscan.io/tx/0xdf571b52c1d2c323b1ef40bb8305c62be7f447fa605a758f5137334c38cacd66) |
| 12 | A | 部署代理并 initialize | success | 491788308 | [交易](https://sepolia.etherscan.io/tx/0xaeb0216f26dfe3270faf68bb4b280ab61e763b371f869d989061205f5a9bb0db) |
| 13 | A | 部署 UBOX V2 实现 | success | 838443474 | [交易](https://sepolia.etherscan.io/tx/0xcc60956bd0b5b285ec61ca2eaaf6c074df07b92f50303c5e7112fba58ad71878) |
| 14 | A | 升级代理到 V2 | success | 2753784 | [交易](https://sepolia.etherscan.io/tx/0x91e5ec0b662fa6622841386e81b410cafe5ef2a433fba8fe309e30093990cb61) |
| 15 | A | 预期失败的 batchTransfer | **reverted** | 3516892 | [交易](https://sepolia.etherscan.io/tx/0x7dd2f8636c730acd9b1dbe095a1d6ebd6f9b327f5090042bcd448a80f60c1243) |
| 16 | A | 成功的 batchTransfer | success | 10201688 | [交易](https://sepolia.etherscan.io/tx/0xd7789d9824d35afe60240767af5cf7dab098a2492349da62db8e6b267860679f) |
| 17 | A | 部署 UBOX V3 实现 | success | 1010158896 | [交易](https://sepolia.etherscan.io/tx/0xad0fd9cbb6c1c9ef9df16ab039d1dfa54eac7c95327c976ac961fcfcbe6f28f9) |
| 18 | A | 升级到 V3 并 initializeV3 | success | 10776765 | [交易](https://sepolia.etherscan.io/tx/0x5765d84eaff6cab6851f4c3dd7675dae11cf54c7514e084a9a054db9a89295f1) |

账户 A 全部 gas 手续费合计 **4,217,798,783 wei**（0.000000004217798783 SepETH），另外向 B 转出 **0.0001 SepETH**。与入账 0.05、期末余额 0.049899995782201217 相符（0.05 − 0.0001 − 0.000000004217798783 = 0.049899995782201217）。

---


---

## 10. Phase 0 技术复核与决策执行（2026-11-12）

本节是追加，不改写上文已经发生的历史。上文第 7–8 节记录的是复核前的状态（当时授权尚未清零、尚未做公开验证）。用户随后确认执行 D-01 至 D-05，并要求更新本实验记录、把整个项目打成不含密钥的 zip。

教学材料指针（只写路径与一句说明，不把全文贴进本记录）：`docs/新手指南-账号凭证与API密钥.md` 是一份面向完全初学者的账号、凭证与 API 密钥获取说明，供后续教学使用。

### 10.1 P0 复核结论

详见 `reports/p0/P0-SUMMARY.md` 及同目录下 00–05 号报告。结论为 **PASS WITH FINDINGS**：Critical 0、High 0、Medium 1（F-V3-001：`type(uint256).max` 授权不兼容）、Low 3、Info 6。Foundry 当时：单元 49/49，fuzz 9/9 × 1000（seed 0x5030），invariant 256×100。复核时 Etherscan 尚未验证；Sourcify 已有 Proxy exact_match 与 ProxyAdmin match。

### 10.2 D-01 撤销 MBox-Burn 遗留授权（已上链，仅此一笔）

在重新读取 allowance / nonce / 余额并模拟之后，由测试账户 A 在 Sepolia（chainId 11155111）对 MBox-Burn `0x2AE6BbE8b524381535D1f443fe95018b1f64e3F2` 广播 `approve(B, 0)`。没有向无密钥地址再转账，也没有动 UBOX。

- 交易：`0x4571e581958308c820ab16da26aa9d1a2622caa7c720ebe164b5d2c29a3747f2`
- 浏览器：https://sepolia.etherscan.io/tx/0x4571e581958308c820ab16da26aa9d1a2622caa7c720ebe164b5d2c29a3747f2
- 区块 12117312，成功。gasUsed 24538，effectiveGasPrice 69 wei，费用 1693122 wei（**0.000000000001693122 SepETH**）
- allowance(A=`0xE3e61E8650A1E203Be24a83Ea050Ccc4113e25AC`, B=`0x1dB261d3d5BE16E1A81582E8786A6FAB82Fe218c`)：100 → **0**
- 余额与供应不变：A 998,800，B 100，totalSupply 998,900
- A nonce 19 → 20；A 的 SepETH 0.049899995782201217 → 0.049899995780508095
- 公开记录：`build/SandboxTokenBurn.revoke-allowance.sepolia.json`；计划与结果见 `reports/p0/05-revoke-allowance-plan.md`

### 10.3 D-02 / D-03 源码验证（诚实结果）

详细表格与 GUID 见 `reports/p0/04-verification-results.md`，机器可读结果见 `reports/p0/verification/results.json`。

- **Sourcify**：Counter、MBox、MBox-Burn、UBOX V3、UBOX 代理均为 **exact_match**；ProxyAdmin 为既有 **match**。V1 / V2 使用 `reports/p0/_layout/historical-attempt/` 重建的历史源码提交，得到 **match**（非 exact），且没有覆盖当前的 `contracts/UBoxTokenV1.sol` / `UBoxTokenV2.sol`。
- **Etherscan API V2**：8 个合约的 Standard JSON 提交均被接受（各有 GUID），但截至 2026-11-12 15:39 Asia/Singapore 的状态扫瞄，`checkverifystatus` 仍为 Pending in queue，`getsourcecode` 仍显示未验证。不能写成 Etherscan 已经验证成功。
- 代理关联 `verifyproxycontract` 返回成功：实现指向 V3，但注明 implementation saved (unverified - without ABI)，因为实现源码在 Etherscan 队列中尚未完成。

### 10.4 D-04 UBOX V4 设计与本地模拟（明确未上链）

本地实现了 `contracts/UBoxTokenV4.sol`：兼容存储（`_scale` 仍在 slot 58，新变量在其后），`initializeV4()` 只执行一次、不重新铸造，实现合约构造时锁定初始化。修复 F-V3-001（`type(uint256).max` 作为无限授权哨兵，存储时不缩放，`_spendAllowance` 不递减）以及粉尘相关的 F-V3-002 / F-V3-003（`dustOf` / `sweepDust`）。

为让 V4 能够 override，仅在当前 `contracts/UBoxTokenV3.sol` 源码上为 `approve` / `allowance` / `_spendAllowance` 增加了 `virtual`；**没有改写**已保存的 `build/UBoxTokenV3.json`。该改动只影响源码元数据，剥离后的 runtime 与已部署字节码一致。

测试（见 `reports/p0/logs/v4-tests.txt`、`reports/p0/logs/v4-fork-sim.txt` 与 `reports/p0/06-v4-design-and-sim.md`）：

- 单元 10/10 通过；fuzz 3/3 × 1000（seed 0x5030）通过
- 对最新 Sepolia 的 fork 模拟通过：部署 V4 实现约 2,777,602 gas，`upgradeAndCall(initializeV4)` 约 72,181 gas；升级后供应 100、A 99.99、B 0.01、当前粉尘为 0，max approve 行为符合设计

**没有广播 V4 部署或升级。** 链上 UBOX 实现仍为 V3。真正上链升级需要以后另行明确确认。

### 10.5 D-05 本地 Git 归档

在 `/workspace/web3-sandbox` 初始化**仅本地**的 git 仓库，不添加 remote，不 push，不打 tag。已处理嵌套的 `foundry/.git`，并扩展 `.gitignore` 覆盖 `.secrets/`、`node_modules/`、`*.key`、`.env`、Foundry cache/out。提交前对索引做密钥扫描。根提交 `516dcf6`（`516dcf63d12643f043b482ba655c825dfcbbbdc7`）。其后有一条误伤说明文件的提交 `504e2b2`，以及一条修复说明的提交；最终 HEAD 以 `reports/p0/07-git-archive.md` 与 `git rev-parse HEAD` 为准。

### 10.6 更新后的链上快照

只读核对时间：2026-11-12 15:39:55 Asia/Singapore，区块 **12117419**，chainId 11155111。

| 项目 | 值 |
|---|---|
| 账户 A nonce | **20** |
| 账户 A ETH | 49899995780508095 wei（**0.049899995780508095 SepETH**） |
| 账户 B nonce | 3 |
| 账户 B ETH | 99999982630182 wei（0.000099999982630182 SepETH） |
| MBox-Burn totalSupply | 998,900 |
| MBox-Burn balanceOf(A) | 998,800 |
| MBox-Burn balanceOf(B) | 100 |
| MBox-Burn allowance(A, B) | **0**（已撤销） |
| UBOX 代理实现槽 | 仍为 V3 `0x16E3D2f25e28253b467C66c462973e4ca86fad28`（V4 未上链） |
| UBOX name / symbol / decimals / scale | 可升级沙盒代币 / UBOX / 18 / 10000 |
| UBOX totalSupply | 100（新单位） |
| UBOX balanceOf(A) | 99.99 |
| UBOX balanceOf(B) | 0.01 |

Counter、MBox（含无密钥地址上的 1,000）以及其它未在 D-01 中改动的状态与第 7 节一致，本轮未再广播那些合约上的交易。

### 10.7 本轮仍未做的事

- 没有使用主网，没有买入加密资产，没有把真实助记词或主网私钥写入报告、git 或 zip。
- 没有广播 V4 部署或升级。
- 没有把 Etherscan 尚未完成的验证写成已经成功。
- 没有向无密钥演示地址再转入任何代币。
- 没有把 UBOX 的升级权转给多签或放弃管理员权限。
- 没有 `git push`、没有添加 remote、没有打 tag 或发 GitHub Release。
