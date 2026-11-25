# Historical experiment evidence

**English** · [简体中文](README.zh-CN.md)

The project owner supplied `web3-sandbox-repo.zip` for this review. [Notebook excerpts](phase-0-notebook-excerpts.md) preserve the original Chinese record’s public accounts, contracts, transactions and later decision outcomes (§3, §5, §10), with original line ranges and a source-file SHA-256. The archive itself, wallets, credentials, raw logs and executable lab scripts are not published here.

Read the record in time order. §5 predates the wrap-up. §10.2 records D-01 revoking the remaining MBox-Burn allowance in block 12117312. §10.3 records Sourcify’s 5 `exact_match` + 3 `match`, with Etherscan still queued. §10.4 records local V4 tests/simulation, with no deployment. §10.6 preserves **2026-11-12 15:39:55 UTC+8 / block 12117419**. §10.7 lists work not done. These later sections take precedence over early plans and the earlier review snapshot.

The archive also contains `reports/p0/03-test-results.md`, `04-verification-results.md`, `05-revoke-allowance-plan.md` (including its later execution addendum), `06-v4-design-and-sim.md` and `07-git-archive.md`; these were cross-checked for Chapter 15. An original document’s commands and approval notes describe that historical session. They are evidence, not instructions to execute new transactions.

To use the **complete external source set** with the checker, place only the reviewed notebook, credential guide and top-level Markdown reports in a local directory outside this repository, preserving their paths, then run from this guide’s root:

```bash
# Replace this path with your reviewed local lab-source directory.
SOURCES_DIR=/absolute/path/to/web3-sandbox npm run check:facts
```

For the included excerpt alone, create no source corpus from the book itself: it is a citation, not a substitute for all original files. `check:facts` only checks literal address/hash provenance and suspected secrets; the historical conclusions still require reading the corresponding evidence. No experiments were rerun during this documentation review.

Chapters 17–19 also have a public figure digest: [p2-public-digest.json](p2-public-digest.json). It keeps only the readings, environment boundaries and local hashes cited in the book. Raw receipts, scripts, traces and the toy-contract source are not in this repository. The P2A Anvil startup log contained the node’s built-in test keys and is not in the digest. Without the external Phase-0/1 archives, `check:facts` reports that historical provenance was skipped. That is not a pass for those earlier chapters.
