# Local oracle toy

**English** · [简体中文](README.zh-CN.md)

This is a closed lesson. It deploys toy tokens on a new local Anvil node. It does not call Aave, Uniswap, Sepolia, or any other public chain. It is not an exploit tool. The amounts and the counterparties are fixed in `src/LocalOracleLab.sol`.

It is not one of the browser labs under `/labs/` (allowance, constant-product pool, hash chain). Those pages are in-browser simulations with no Anvil. This folder needs Foundry and writes only on `127.0.0.1:18549`.

The saved run is in [`docs/evidence/p2/oracle-readings.json`](../../docs/evidence/p2/oracle-readings.json). A run you start here is a **new** run. The health of the lesson is the integers. The transaction hashes will not match the book.

## What you need

- Node.js 22 or newer
- Python 3
- Foundry (`forge` and `anvil`)

The first `forge build` may download Solidity 0.8.24. After that compiler is on disk, the lab does not use the network. It also does not use a fork.

## Run

From this directory:

```bash
npm ci
chmod +x run.sh
./run.sh
```

The script accepts no URL and no arguments. It listens on `127.0.0.1:18549` only, starts Anvil with `--accounts 0 --silent` and `--chain-id 31337`, and checks `eth_chainId` before any write. If port 18549 is already in use, it stops. If `evidence/` already contains a run, it stops so it does not hide that output. Move the directory yourself. Do not commit `evidence/` or `anvil.log`.

Then compare `evidence/reconciliation.json` with the integers in `oracle-readings.json`. `debt` stays `8000000000000000000000`. `anchorShortfall` stays `5000000000000000000000`. `exitQuoteShortfall` stays `3714031198495643589346`.

## Keys and licenses

The script creates one temporary account in memory with `generatePrivateKey()`. It does not print the key, save the key, or read a wallet. The 100 test ETH are for local gas only.

`src/LocalOracleLab.sol` is the original file, SPDX-License-Identifier MIT. `viem` is pinned at 2.58.2 by `package-lock.json` (MIT). Foundry and `solc` 0.8.24 are tools you install; they are not copied into the book. The author’s original `foundry.toml` pointed at a machine-local `solc` binary. This copy uses `solc_version = "0.8.24"` with the same optimizer settings (200 runs, via IR). The book’s teaching text stays under CC BY-NC 4.0. See `LICENSING.md`. This lab does not change that license.

Chapters 17 and 18 are not repeated here. Those runs need an archival Sepolia node for block 12165973, and their scripts are not published.
