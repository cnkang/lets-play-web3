# Phase-2 saved readings

**English** · [简体中文](README.zh-CN.md)

These files let you check the local hashes in chapters 17–19 without a blockchain node. They are not a chain you can start, and they are not Sepolia transactions.

## Three different things

1. **Saved receipts.** `p2a-readings.json`, `p2b-readings.json` and `oracle-readings.json` copy the status, gas, event amounts and balances needed for the figures in the book. The source archive is `teaching-evidence.zip`, SHA-256 `d5e801918f6333ecd4c80d192af6939d0601bdcbeea581b406ecc2897ebaf6e3`. Check the file hashes with `manifest.sha256`.
2. **A fresh replay.** Running the toy in [`labs/local-oracle`](../../labs/local-oracle/README.md) creates new accounts and new transaction hashes. Compare the integers, not the hashes. Chapters 17 and 18 do not ship a replay script.
3. **An Anvil state dump.** The sanitized archive does not contain one. `classification.json` records that search. A dump would still not restore every old receipt, and it would not make the fork labs work without an archival Sepolia node.

Local hashes use chainId **31337**. Do not paste them into a Sepolia explorer.

## What you can check offline

From the repository root:

```bash
npm run check:evidence
```

That command checks this folder. It prints `bundled subset PASSED`. It then prints `external archive SKIPPED` unless you set `P2_EVIDENCE_DIR` to the unpacked teaching-evidence directory. A skip is not a pass of the raw archive.

The fork labs (chapters 17 and 18) read Sepolia block **12165973** and then wrote on the local copy. Repeating them needs an archival Sepolia endpoint and the internet. This repository does not include those runners. They call a real Aave pool address inside the fork. Publishing them would turn a saved lesson into a tool aimed at that pool.

The oracle toy (chapter 19) has no fork. After Node, Python and Foundry are installed, [`labs/local-oracle`](../../labs/local-oracle/README.md) does not need a network.

## Limits

- Temporary accounts change on every run. The hashes in the JSON identify the saved run only.
- P2A and P2B numbers are not interchangeable.
- Test-token marks are not income.
- The P2A node log contained Anvil’s built-in test keys. It is not in this folder.
- No file here is a reader wallet, a private key, or a public-chain broadcast.
