#!/usr/bin/env python3
"""Generate a Chinese explanation from actual local receipts and integer assertions."""
import json,hashlib
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
P=Path(__file__).parent
E=P/'evidence'
load=lambda n:json.loads((E/f'{n}.json').read_text())
r=load('reconciliation');v=load('vulnerable');c=load('control');o=load('opening-state');addresses=load('addresses');txs=load('transactions')
U=10**18
# Exact integer formatting. Never convert monetary values to float.
def f(x,places=6):
 x=int(x);sgn='-' if x<0 else '';x=abs(x)
 scale=10**places
 n=(x+10**(18-places)//2)//10**(18-places) if places<18 else x
 a,b=divmod(n,scale)
 return sgn+str(a)+(('.'+str(b).zfill(places)) if places else '')
def val(k,places=6):return f(r[k],places)
def native(b):return f(int(b['receipt']['gasUsed'])*int(b['receipt']['effectiveGasPrice']),9)
vhash=v['receipt']['transactionHash'];chash=c['receipt']['transactionHash']
addressrows='\n'.join(f'| {name} | `{a}` |' for name,a in addresses.items())
receipts='\n'.join(f"| {x['label']} | `{x['receipt']['transactionHash']}` | {x['receipt']['status']} | {x['receipt']['gasUsed']} |" for x in txs)
ledger='\n'.join(f"| {h} | {f(o['stable'][h])} | {f(v['after']['stable'][h])} | {f(o['collateral'][h])} | {f(v['after']['collateral'][h])} |" for h in o['stable'])
keyevents=[]
for e in v['decodedEvents']:
 if e.get('eventName') in ['Swap','Deposit','Borrow','Stage','Flash','Completed']:
  keyevents.append(f"| {e['logIndex']} | {e['name']}.{e['eventName']} | `{json.dumps(e['args'],ensure_ascii=False)}` |")
eventrows='\n'.join(keyevents)
now=datetime.now(ZoneInfo('Asia/Singapore')).strftime('%Y-%m-%d %H:%M:%S SGT')
text=f'''# 本地预言机现价依赖与闪电贷模拟报告

生成时间：{now}。

> **全部地址、代币、交易均为本机虚构教学证据，非 Sepolia，非任何公共链。**
> 本实验使用无 fork 的独立 Anvil，chainId 31337，固定接口 `http://127.0.0.1:18549`。
> 没有调用真实协议，没有使用公共 RPC，没有使用用户钱包、历史密钥或凭据，没有改 GitHub。
> tUSD 不是真美元，tCOL 不是 WETH。本文的“价格”为 tUSD/tCOL，不代表美元价格。

## 1. 先看实际结果

同一份初始快照、同一套合约、同一笔 `ToyScenario.run()` 参数，仅把借贷估值来源由池现价改为独立固定价。

| 项目 | 脆弱分支：直接读薄池现价 | 对照分支：独立固定 mock 价 |
|---|---:|---:|
| AMM 初始价格 | 1 | 1 |
| 操作中 AMM 峰值价格 | {val('peakPrice',18)} | 相同，但只是回退前的临时状态 |
| 交易结束后 AMM 价格 | {val('endPrice',18)} | 1，全部资金操作回滚 |
| 借贷合约采用的估值价格 | {val('peakPrice',18)} | 1 |
| 请求借款 | 8,000 tUSD | 8,000 tUSD |
| 当时允许借款上限 | {val('peakBorrowLimit',18)} tUSD | 2,250 tUSD |
| 实际留下的普通借款债务 | 8,000 tUSD | 0 |
| 实际锁定抵押品 | 3,000 tCOL | 0，临时存入也回滚 |
| 结束时抵押品按独立锚价估值 | 3,000 tUSD | 0 |
| 借贷池稳定币余额 | 50,000 → 42,000 tUSD | 50,000 → 50,000 tUSD |
| 按独立锚价计的不足额抵押部分 | 5,000 tUSD | 0 |
| 按结束储备卖出全部抵押品的报价缺口 | {val('exitQuoteShortfall')} tUSD | 0 |
| 无 AMM 费且无闪贷费的收益反事实 | {val('noAMMNoFlashCounterfactualProfit')} tUSD | 不适用，没有完成交易 |
| 真实 AMM 费后、闪贷费前的剩余 | {val('profitBeforeFlashFee')} tUSD | 0 |
| AMM 费和闪贷费后、gas 前的剩余 | **{val('profitAfterFeesBeforeGas',18)} tUSD** | **0** |
| 闪贷资金是否留给模拟者 | 否，10,000 本金及 5 手续费均已归还 | 否，连发放借款本身也回滚 |
| 本地交易状态 | success | reverted，BorrowLimit |

峰值价格来自成功事件和失败调用 trace，不是失败交易的持久链上状态。对照分支不能把“尝试借 8,000”写成“已借 8,000”。

**闪电贷只是资金放大器。真正漏洞是：借贷合约把借款人刚刚推高的薄池现价，当成了可靠抵押估值。**

## 2. 一步一步发生了什么

正文按显示位数四舍五入，18 位精确值与整数原值见表格和 JSON。
所有代币都是 18 位小数。AMM 初始持有 10,000 tUSD 和 10,000 tCOL，初价为 1。
借贷池有 50,000 tUSD 储备，LTV 为 75%。闪贷池另有 100,000 tUSD，闪贷费为 5 bps，即 0.05%。
模拟者合约开始时没有 tUSD 或 tCOL，也没有预供手续费。

```text
本地闪贷池实际转出 10,000 tUSD
                  ↓
模拟者花 9,000 tUSD 买薄池 tCOL，保留 1,000 tUSD
                  ↓
买到 {val('bought')} tCOL，薄池现价升到 {val('peakPrice')} tUSD/tCOL
                  ↓
把其中 3,000 tCOL 实际 transferFrom 存入借贷合约
                  ↓
脆弱估值允许借约 {val('peakBorrowLimit')}，于是实际借出 8,000 tUSD
                  ↓
只卖未抵押的 {val('sold')} tCOL，收到 {val('saleOutput')} tUSD
                  ↓
余额 1,000 + 8,000 + {val('saleOutput')} = {f(1000*U+8000*U+r['saleOutput'])} tUSD
                  ↓
闪贷池实际 transferFrom 收回 10,000 + 5 tUSD
                  ↓
模拟者合约剩 {val('profitAfterFeesBeforeGas')} tUSD
借贷池留下 8,000 tUSD 应收债务及 3,000 tCOL 抵押品
```

这是一笔交易里的有序调用，不是多笔交易抢时间。抵押进去的 3,000 tCOL 没有又被取出卖掉。
后面的卖出只处理剩下约 1,729.352237 tCOL。

### 为什么 3,000 枚抵押币能借出 8,000

按独立教学锚价 1 计算，3,000 tCOL 只值 3,000 tUSD，75% LTV 应最多借 2,250 tUSD。
薄池报价被推高到约 3.60487 后，脆弱借贷合约算出：

```text
抵押估值约为 3,000 × 3.60487 = 10,814.61 tUSD
允许借款约为 10,814.61 × 75% = 8,110.9575 tUSD
实际请求借款为 8,000 tUSD，因此错误估值放行
```

请求金额比独立锚价下的借款上限多 5,750 tUSD。
这与“按锚价存在 5,000 tUSD 抵押不足”不同。前者涉及 LTV 安全垫，后者直接比较全部债务与抵押价值。
合约取整后的精确上限为 `{r['peakBorrowLimit']}` 个最小单位，见第 7 节。

### 为什么卖完后价格没有回到 1

AMM 最终剩 7,000 tCOL。另有 3,000 tCOL 锁在借贷合约，并没有卖回 AMM。
因此卖出剩余代币后，AMM 价格仍是 {val('endPrice')}，不能把它写成“已完全恢复原价”。
外部套利者若能按独立锚价供币，会继续改变储备与回收价值。这个封闭玩具系统没有外部市场。

## 3. 对照分支在哪里被拦住

脚本先调用 `evm_snapshot` 保存初始状态。脆弱分支结束后，脚本调用 `evm_revert`，并逐项核对恢复状态。
随后只通过本地管理员把 `ToyBorrowing.source` 改为 `ToyFixedSource`。
AMM、闪贷池、借贷池、模拟者地址、代币、储备、LTV 和 `run()` 调用数据均不变。
配置交易会多消耗一个 nonce 和一笔 gas，这不是经济操作参数变化。

同样买入会产生同样的临时峰值，随后仍尝试抵押 3,000 tCOL、借出 8,000 tUSD。
独立固定价保持为 1。借贷合约在 `borrow()` 里返回：

```text
BorrowLimit(
    requestedDebt = 8000000000000000000000,
    maximumDebt   = 2250000000000000000000,
    oraclePrice   = 1000000000000000000
)
```

本地失败交易哈希：`{chash}`。
回执 `status = reverted`，日志数为 `{len(c['receipt']['logs'])}`。
失败前模拟已经得到同一错误，脚本仍按实验要求发送了有上限的本地失败交易取得回执。

失败后逐项对比 `control.json` 的 `before` 和 `after`：

- AMM 回到 10,000 tUSD 和 10,000 tCOL，价格为 1。
- 闪贷池仍有 100,000 tUSD，没有收手续费，也没有丢掉本金。
- 借贷池仍有 50,000 tUSD，模拟者债务与抵押记录都为 0。
- 模拟者两种代币余额都为 0，代币总量及所有本次授权不变。
- operator nonce 增加 1，mock ETH 减少 {native(c)}。资金状态回滚，gas 和 nonce 不回滚。

失败 receipt 没有已确认事件。`control-transaction-trace-decoded.json` 仅用于观察回滚前的内部调用，不能把里面的临时转账当成最终到账。

固定价源只是不可由这次薄池交易改变的本地教学锚。
**它不代表真实预言机永远安全。** 真实系统还要处理报价过期、脱锚、数据源操纵、管理员权限和流动性风险。
本实验也没有证明 TWAP 或任何真实产品天然安全。

## 4. 剩余资产来自谁

不是闪贷池无偿送钱，也不是 AMM 凭空 mint。
借贷池按错误估值实际转出了 8,000 tUSD。
模拟者用这些资金和卖币收入，完成闪贷还本付费并留下余额。

tUSD 的实际变化满足精确守恒：

```text
借贷池流出 8,000
= 模拟者增加 {val('profitAfterFeesBeforeGas',18)}
+ 闪贷池增加 5
+ AMM 增加 {val('ammStableGain',18)}
```

| 持有人 | 初始 tUSD | 脆弱分支结束 tUSD | 初始 tCOL | 脆弱分支结束 tCOL |
|---|---:|---:|---:|---:|
{ledger}

两种代币总量分别恒为 200,000 tUSD、20,000 tCOL。
`reconcile.py` 对五个持有地址的前后余额求和，并核对每次 swap 输出、普通债务、抵押记录和闪贷还款。
所有转账都走自建代币的 `transfer` 或 `transferFrom`，债务只由真实 `borrow()` 调用增加。
没有直接改写储备、债务、抵押记录或 token 余额。
唯一 Anvil 人工注资是给新随机 operator 的 100 mock ETH，专门支付本地 gas，不进入代币经济模型。

初始化时代币构造器一次发行总量，随后管理员把储备转给三个池。
代币没有公开 mint 函数，闪贷回调没有补币手段。
管理员本身也充当本地实验操作者，角色只在合约层隔离，不代表现实中这些机构是同一主体。

### 借贷池风险不等于已实现损失

普通债务 8,000 tUSD 没有被抹掉，抵押品 3,000 tCOL 仍锁在借贷合约。
本实验只还清闪贷，没有还清普通借款，也没有执行违约处置或减记。

- 借贷池现金减少 8,000 tUSD，但同时持有 8,000 tUSD 账面应收债权。不能把全部现金流出直接叫损失。
- 按独立锚价，抵押品值 3,000 tUSD，**不足额抵押部分估计为 5,000 tUSD**。
- 按结束时 AMM 真实储备、0.3% 费率报价，假设能扣押并卖出全部 3,000 tCOL，可得到 {val('executableAMMQuoteRecovery',18)} tUSD，报价缺口为 **{val('exitQuoteShortfall',18)} tUSD**。
- 最后一项是整数计算的可成交数量报价，不是实际执行的清算或回收。玩具借贷合约没有清算入口，因此不能声称已经收回这些资金。
- 报价假设无人抢先交易，也不计清算激励和处置 gas。外部交易改变储备后，回收量会变化。

按独立锚价把 AMM 丢掉的 3,000 tCOL 也计入，AMM 的净资产增加约 {f(r['ammStableGain']-3000*U)} tUSD。
模拟者余额、闪贷手续费和这部分 AMM 价值变化合计等于 5,000 tUSD 锚价短缺。
这是指定锚价下的资产负债解释，不是市场已兑现的损失。

## 5. 费用与收益分别记

| 口径 | 脆弱分支实际值或明确标注的反事实 |
|---|---:|
| 闪贷本金 | 10,000 tUSD |
| 闪贷费率与费用 | 5 bps，5 tUSD |
| AMM 买入输入费 | {val('ammBuyFeeStable')} tUSD |
| AMM 卖出输入费 | {val('ammSellFeeCollateral',18)} tCOL |
| 同金额但 AMM 费和闪贷费均为 0 的反事实剩余 | {val('noAMMNoFlashCounterfactualProfit',18)} tUSD |
| 使用实际 AMM、尚未扣闪贷费的余额增量 | {val('profitBeforeFlashFee',18)} tUSD |
| 两者差额，即 AMM 费及其价格路径影响 | {val('combinedAMMFeePathEffect',18)} tUSD |
| 扣实际 AMM 费和闪贷费，未扣 gas | {val('profitAfterFeesBeforeGas',18)} tUSD |

AMM 手续费留在池内。卖出输入费以 tCOL 计，不能直接和 tUSD 相加。
上表无 AMM 费的行重新计算了整个恒积路径，所以差额不等于把两笔输入费按结束价随手相加。
实际 swap 输出已经包含价格影响和费率，不会再重复扣一次手续费。

### Gas 单列，不把 mock ETH 换成美元

| 本地交易 | 事前模拟 | gas 预算或估算 | 回执 gasUsed | gas 实付 |
|---|---|---:|---:|---:|
| 脆弱分支 | eth_call 成功 | estimateGas {next(t['estimatedGas'] for t in txs if t['label']=='vulnerable atomic scenario')} | {r['vulnerableGas']} | {native(v)} mock ETH |
| 固定价对照 | eth_call 返回 BorrowLimit | estimateGas 拒绝；trace gas {int(c['traceGasUsed'],16)}，发送上限 1,000,000 | {r['controlGas']} | {native(c)} mock ETH |

固定本地 gasPrice 为 1 gwei。成功交易估算与回执的差异包括 allowance 清零产生的退款与执行预算，不影响代币对账。
以上不含初始化部署、注资和修改价源的 gas。所有这些回执另列在附录。
因此成功结果是 **+{val('profitAfterFeesBeforeGas')} tUSD，以及 -{native(v)} mock ETH**，不是美元净收入。
失败结果是 0 tUSD 变化，以及 -{native(c)} mock ETH。

## 6. 一笔交易的证据

脆弱分支本地交易哈希：`{vhash}`。
区块号为 {v['receipt']['blockNumber']}，成功回执包含 {len(v['receipt']['logs'])} 条日志。
`vulnerable.json` 保存原始回执与解码日志，`vulnerable-transaction-trace-decoded.json` 保存带函数名的嵌套调用。
以下关键日志属于同一张回执。表中金额均为 18 位小数的整数最小单位。

| logIndex | 事件 | 参数 |
|---|---|---|
{eventrows}

`Flash` 事件记录借前 100,000 tUSD、借后 100,005 tUSD。
代币日志还记录了模拟者向闪贷池的 10,005 tUSD `transferFrom`。
`Completed` 位于 `Flash` 之后，记录还款后的模拟者余额。
成功分支结束时，模拟者对 AMM、借贷池和闪贷池的所有本次授权都为 0，脚本已断言。

## 7. 整数复算与精度

两个代币都是 18 位，价格也按 1e18 编码。没有把 Circle USDC 的 6 位精度带入本实验。
AMM 采用恒积输入公式，0.3% 的输入费留在储备内：

```text
amountOut = floor(amountIn × 997 × reserveOut / (reserveIn × 1000 + amountIn × 997))
price = floor(stableReserve × 1e18 / collateralReserve)
maxDebt = floor(floor(collateral × price / 1e18) × 7500 / 10000)
```

买入实际得到 `{r['bought']}` 个 tCOL 最小单位。
峰值编码为 `{r['peakPrice']}`，比十进制理论值 3.60487 少一个价格最小单位，来自整数截断。
允许借款上限编码为 `{r['peakBorrowLimit']}`。
结束价格编码为 `{r['endPrice']}`。
`reconcile.py` 不使用浮点数，逐项与事件、储备和债务读数比较。

完整校验结果为：`{r['checks']}`。
两分支还逐项校验 ETH gas 支出、nonce 变化、代币总量和失败回滚。

## 8. 环境、复现与边界

合约全部来自本目录 `src/LocalOracleLab.sol`，不是实际 Aave 或 Uniswap 部署。
`ToyFlashLender` 是自建回调式玩具闪贷池，不冒充 Aave 的 `flashLoanSimple()`。
`ToyBorrowing` 故意省略利息、清算和完整风险控制，用于隔离“现价依赖”这一个错误。
只修复此错误并不使它成为可上线的借贷协议。

- Anvil 只绑定 `127.0.0.1:18549`，无 `--fork-url`，无加载外部状态。
- 启动时要求创世区块为 0，`anvil_nodeInfo` 中 fork 配置为空，chainId 必须是 31337。
- 合约的构造和写方法都带 31337 保护。31337 这个数字本身不是隔离证明，还依赖固定 loopback、全新节点和无 fork 的启动脚本。
- 脚本不接受 RPC 参数或外部 chain 配置。端口被占用就拒绝运行，不接管其他节点。
- operator 为每次运行内存中新生成的随机密钥。密钥不落盘、不打印，Anvil 用 `--accounts 0 --silent` 启动。
- 所有 EVM 交易发送前都先做本地 eth_call。正常交易另做 estimateGas；预期失败交易保存 revert、trace 和有上限的发送预算。
- 所有合约地址及链下引用的 immutable 对手地址在运行时核对。精确额度 approve 均由交易内真实调用设置并消费。
- 运行脚本退出时只停止自己启动的 Anvil。停止记录在 `evidence/anvil-stopped.txt`。不保存链状态或账户密钥。

已安装依赖位于本目录 `node_modules`，从已有本地实验只读复制，未联网安装。
编译固定使用本地缓存的 Solidity 0.8.24，`forge build --offline` 不下载编译器。
在这台 box 上重跑：

```bash
cd /workspace/web3-local-oracle-lab
./run.sh
```

重跑会把旧的 evidence 目录改名保留，并重新生成报告。临时账户地址及本地交易哈希会变化，经济读数不变。
仅离线重做账目校验，无需启动节点：

```bash
cd /workspace/web3-local-oracle-lab
python3 reconcile.py
python3 make-report.py
```

若换电脑，需准备相应的本地 Foundry、Solidity 0.8.24、Node 和锁文件对应依赖，并调整 foundry.toml 中的编译器文件路径。
不要把 RPC 改成公共地址。本源码不是生产部署脚本，也没有扫描外部目标的功能。

### 文件索引

- `src/LocalOracleLab.sol`：代币、恒积池、两种价源、借贷池、闪贷池和固定场景合约。
- `run.sh`：离线构建、启动全新 loopback Anvil、运行、核算、停止。
- `run-lab.mjs`：临时账户、部署、初始化、快照、两分支、发送前模拟和证据保存。
- `reconcile.py`：整数公式、储备守恒、事件及失败回滚断言。
- `make-report.py`：根据实际证据生成本报告。
- `evidence/environment.json`、`verified-configuration.json`：创世环境、无 fork 配置及对手地址校验。
- `evidence/transactions.json`：全部交易对象、模拟记录、回执及解码事件。
- `evidence/opening-state.json`、`vulnerable.json`、`control.json`：前后余额、普通债务、抵押、授权和回执。
- `evidence/*trace*.json`：模拟及实际交易调用轨迹，包括解码版本。
- `evidence/reconciliation.json`、`assertions.json`：精确数字与关键断言。
- `MANIFEST.sha256`：源文件、报告及当前 evidence 的校验和。

### 只属于本地虚构演示的地址

| 本地组件 | 地址，非 Sepolia |
|---|---|
{addressrows}

### 全部本地回执索引

所有哈希仅属于本次临时 Anvil，不附公共区块浏览器链接。
快照恢复会删除脆弱分支的节点内历史。报告已在恢复前保存其回执和 trace。
最后节点也会停止，因此证据以保存的 JSON 及可复跑脚本为准。

| 操作 | 本地哈希，非 Sepolia | 状态 | gasUsed |
|---|---|---|---:|
{receipts}

## 9. 意外发现与复盘

1. 价格没有恢复到原点，因为 3,000 tCOL 仍锁着。报告不能为了让故事完整而虚构“卖回全部抵押币”。
2. 闪贷池按时收钱，借贷池却留下不足额抵押债务。闪贷按时还款并不证明其他参与方没有风险。
3. 同一个池价可显示 3.60，但持有大量 tCOL 并不能都按 3.60 卖掉。恒积曲线决定实际成交额。
4. 8,000 tUSD 现金流出、5,000 tUSD 锚价短缺与约 {val('exitQuoteShortfall')} tUSD 回收报价缺口，是三个不同数字。
5. 固定价对照也会在回滚前暂时买入并存入抵押品，但失败回执没有确认这些临时动作，最终余额恢复原样。
6. 模拟者合约无需预存 tUSD，也不代表“无成本”。本次用从脆弱借贷池取出的资金承担 AMM 费用与闪贷费，发起者另外支付 gas。

你可以这样解释本次实验：**模拟者先用借来的资金改变薄池比例，制造更高的现价。借贷合约错误信任这个现价，放出了抵押品无法可靠覆盖的债务。独立价源没有跟着薄池波动，所以同样的借款被拒绝。闪电贷让整套操作能一次完成，但制造损害的根因是错误估值。**
'''
(P/'LOCAL-ORACLE-LAB-REPORT.md').write_text(text)
files=[P/n for n in ['foundry.toml','package.json','package-lock.json','run.sh','run-lab.mjs','reconcile.py','make-report.py','LOCAL-ORACLE-LAB-REPORT.md']]
files+=list((P/'src').rglob('*.sol'))+sorted(x for x in E.rglob('*') if x.is_file())
(P/'MANIFEST.sha256').write_text(''.join(hashlib.sha256(x.read_bytes()).hexdigest()+'  '+str(x.relative_to(P))+'\n' for x in files))
print('Report generated from actual receipts:',P/'LOCAL-ORACLE-LAB-REPORT.md')
