# 本地预言机玩具

[English](README.md) · **简体中文**

这是一场封闭的教学。它在一台新的本地 Anvil 上部署玩具代币。它不调用 Aave、Uniswap、Sepolia 或任何公共链。它不是攻击工具。金额和对手方都写死在 `src/LocalOracleLab.sol` 里。

它也不是网站 `/labs/` 下的浏览器实验（授权、恒定乘积池、哈希链）。那些页面只在浏览器里计算，不启动 Anvil。这个目录需要 Foundry，并且只在 `127.0.0.1:18549` 上写账。

已保存的那一次在 [`docs/evidence/p2/oracle-readings.json`](../../docs/evidence/p2/oracle-readings.json)。你在这里启动的是**新的**一次。要核对的是整数。交易哈希不会和第 19 章相同。

## 需要先安装

- Node.js 22 或更新版本
- Python 3
- Foundry（`forge` 和 `anvil`）

第一次 `forge build` 可能会下载 Solidity 0.8.24。编译器到了本机以后，这场实验不再使用网络，也不使用分叉。

## 运行

在本目录执行：

```bash
npm ci
chmod +x run.sh
./run.sh
```

脚本不接受网址，也不接受参数。它只监听 `127.0.0.1:18549`，用 `--accounts 0 --silent` 和 `--chain-id 31337` 启动 Anvil，并在任何写操作之前检查 `eth_chainId`。18549 端口已被占用时，脚本会停。`evidence/` 里已经有一轮结果时，脚本也会停，避免盖住那份输出。请自己把目录移开。不要提交 `evidence/` 或 `anvil.log`。

然后把 `evidence/reconciliation.json` 和 `oracle-readings.json` 里的整数对照。`debt` 仍是 `8000000000000000000000`。`anchorShortfall` 仍是 `5000000000000000000000`。`exitQuoteShortfall` 仍是 `3714031198495643589346`。

## 密钥与许可

脚本用 `generatePrivateKey()` 在内存里生成一个临时账户。它不打印密钥，不保存密钥，也不读取钱包。那 100 枚测试 ETH 只付本地 gas。

`src/LocalOracleLab.sol` 是原文件，SPDX 许可为 MIT。`package-lock.json` 把 `viem` 固定在 2.58.2（MIT）。Foundry 和 `solc` 0.8.24 由你本机安装，不抄进这本书。作者原来的 `foundry.toml` 指向一台机器上的 `solc` 路径。这份公开副本改用 `solc_version = "0.8.24"`，优化器仍是 200 次、via IR。教材正文仍是 CC BY-NC 4.0，见 `LICENSING.md`。这个实验不改变该许可。

第 17 章和第 18 章不在这里重做。那两场需要能读到 Sepolia 区块 12165973 的归档节点，脚本也没有公开。
