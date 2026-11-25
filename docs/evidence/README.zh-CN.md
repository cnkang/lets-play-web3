# 历史实验的证据来源

[English](README.md) · **简体中文**

项目所有者为本轮核对提供了 `web3-sandbox-repo.zip`。[实验记录节选](phase-0-notebook-excerpts.md)按中文原文保留第 3、5、10 节：公开账户、合约、交易及较晚的决策执行结果，并标明原始行号范围和源文件 SHA-256。没有发布整个压缩包、钱包、凭证、原始日志或可执行实验脚本。

请按时间阅读。第 5 节早于收尾：第 10.2 节记录 D-01 在区块 12117312 撤销剩余授权；10.3 记录 Sourcify 的 5 个 `exact_match` + 3 个 `match`，Etherscan 仍排队；10.4 记录 V4 只有本地测试/模拟；10.6 保留 **2026-11-12 15:39:55 UTC+8 / 区块 12117419** 快照；10.7 列出没做的事。较晚记录优先于早期计划和早期复核快照。

压缩包还包含 `reports/p0/03-test-results.md`、`04-verification-results.md`、`05-revoke-allowance-plan.md`（含后来的执行补记）、`06-v4-design-and-sim.md`、`07-git-archive.md`，本轮已用它们核对第 15 章。原文中的命令和批准记录属于当时的会话，只是历史证据，不是执行新交易的指令。

要用**完整外部来源**运行检查，只把审阅过的实验记录、凭证指南和顶层 Markdown 报告放在本站仓库以外的本地目录，保留路径，再从本站根目录运行：

```bash
# 替换为本机审阅过的实验来源目录。
SOURCES_DIR=/absolute/path/to/web3-sandbox npm run check:facts
```

本仓库节选用于引用，不能用书中内容反过来拼成「原始来源」自证。`check:facts` 只查地址/哈希字面出处和疑似密钥，结论仍要阅读相应证据。本轮文档核对没有重跑链上实验。

第 17–19 章另有一份公开数字摘要：[p2-public-digest.json](p2-public-digest.json)。带校验和的回执摘录在 [p2/](p2/README.zh-CN.md)。它们不能恢复一条链。脱敏证据包里没有 Anvil 状态转储。无分叉的预言机玩具可以从 [labs/local-oracle](../../labs/local-oracle/README.zh-CN.md) 再跑一次。新的一次会有新哈希。分叉实验的重放脚本没有公开。P2A 的 Anvil 启动日志含有节点自带测试密钥，没有放进来。没有外部 Phase-0/1 档案时，`check:facts` 会标明历史出处检查被跳过，这不算那些章节已通过对账。`npm run check:evidence` 只通过已提交的摘录，并且会这样写明。
