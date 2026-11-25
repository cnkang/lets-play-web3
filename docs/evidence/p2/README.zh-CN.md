# 第 2 阶段已保存的读数

[English](README.md) · **简体中文**

这些文件用来核对第 17–19 章里的本地哈希。不需要启动一条链。它们也不是 Sepolia 上的交易。

## 三件不同的事

1. **已保存的回执。** `p2a-readings.json`、`p2b-readings.json` 和 `oracle-readings.json` 摘录了教材数字要用的状态、gas、事件金额和余额。来源压缩包是 `teaching-evidence.zip`，SHA-256 为 `d5e801918f6333ecd4c80d192af6939d0601bdcbeea581b406ecc2897ebaf6e3`。用 `manifest.sha256` 核对这几个 JSON 文件。
2. **重新跑一次。** [`labs/local-oracle`](../../labs/local-oracle/README.zh-CN.md) 会生成新的临时账户和新的交易哈希。比对整数，不要比对哈希。第 17 章和第 18 章没有附带重放脚本。
3. **Anvil 状态转储。** 脱敏后的证据包里没有这种文件。`classification.json` 记录了这次查找。就算有转储，它通常也不能恢复全部历史区块、回执和追踪，也不能让分叉实验脱离归档 Sepolia 节点。

本地哈希的 chainId 是 **31337**。不要把它们贴进 Sepolia 浏览器。

## 可以离线核对的内容

在仓库根目录运行：

```bash
npm run check:evidence
```

这条命令检查本目录，并打印 `bundled subset PASSED`。除非把 `P2_EVIDENCE_DIR` 指到解压后的 teaching-evidence 目录，否则它还会打印 `external archive SKIPPED`。跳过不是原始档案已经通过对账。

第 17 章和第 18 章只读了 Sepolia 区块 **12165973**，然后在本地副本里写账。要重做，需要能读到这个历史区块的归档节点，也需要互联网。本仓库不附带那两个启动脚本。它们会在分叉里调用真实的 Aave 资金池地址。放出来就会变成对准那个池子的工具。

第 19 章的玩具没有分叉。装好 Node、Python 和 Foundry 之后，[`labs/local-oracle`](../../labs/local-oracle/README.zh-CN.md) 不需要网络。

## 限度

- 每次重跑都会换临时账户。JSON 里的哈希只标识已保存的那一次。
- 第 17 章和第 18 章的数字不能互换。
- 测试币计价不是收入。
- P2A 的节点日志含有 Anvil 自带测试密钥，没有放进本目录。
- 这里没有读者的钱包、私钥，也没有公共链广播。
