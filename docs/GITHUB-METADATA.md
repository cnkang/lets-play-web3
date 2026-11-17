# GitHub About, Website and Topics

These are repository settings, separate from the Git diff. No remote settings were changed in this local editing session. “Topics” below means GitHub Topics, not Git tags or Releases.

Read the current settings first (the review found an empty website and no topics):

```bash
gh repo view cnkang/lets-play-web3 --json description,homepageUrl,repositoryTopics,url
```

Copyable update command; `--add-topic` preserves existing topics, so keep any still applicable ones:

```bash
gh repo edit cnkang/lets-play-web3 \
  --description 'A free, bilingual guide to blockchains for beginners, with hands-on labs on Ethereum’s Sepolia testnet.' \
  --homepage 'https://letsplayweb3.liukang.com/' \
  --add-topic web3 \
  --add-topic blockchain \
  --add-topic ethereum \
  --add-topic sepolia \
  --add-topic astro \
  --add-topic bilingual \
  --add-topic education
```

Read back and check the result:

```bash
gh repo view cnkang/lets-play-web3 --json description,homepageUrl,repositoryTopics,url
gh api repos/cnkang/lets-play-web3/topics --jq '.names'
```
