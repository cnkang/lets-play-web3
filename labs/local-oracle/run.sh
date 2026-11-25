#!/usr/bin/env bash
# Local teaching lab only. No arguments, no public RPC, no saved keys.
set -euo pipefail
cd "$(dirname "$0")"
export PATH="${FOUNDRY_DIR:-$HOME/.foundry}/bin:$PATH"
[[ $# == 0 ]] || { echo 'No external URL or arguments allowed'; exit 1; }
command -v forge >/dev/null && command -v anvil >/dev/null && command -v node >/dev/null || { echo 'Need forge, anvil and node on PATH'; exit 1; }
if [[ -e evidence/vulnerable.json ]]; then
  echo 'evidence/ already has a run. Move that directory aside before starting another. A new run is not the saved historical hashes.'
  exit 1
fi
mkdir -p evidence
node --input-type=module <<'JS'
import net from 'node:net'
const server = net.createServer()
server.once('error', () => { console.error('18549 in use: refusing to attach'); process.exit(1) })
server.listen(18549, '127.0.0.1', () => server.close())
JS
{ forge --version; anvil --version; node --version; } > evidence/toolchain.txt
forge build --force > evidence/build.log 2>&1
anvil --host 127.0.0.1 --port 18549 --chain-id 31337 --accounts 0 --silent \
  --hardfork cancun --disable-default-create2-deployer > evidence/anvil.log 2>&1 &
pid=$!
cleanup() {
  kill "$pid" 2>/dev/null || true
  wait "$pid" 2>/dev/null || true
  printf 'Own Anvil PID %s stopped; %s\n' "$pid" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" > evidence/anvil-stopped.txt
}
trap cleanup EXIT
node --input-type=module <<'JS'
import { preflight } from './guard.mjs'
for (let i = 0; i < 40; i++) {
  try { await preflight('http://127.0.0.1:18549'); process.exit(0) } catch {}
  await new Promise((resolve) => setTimeout(resolve, 100))
}
throw new Error('Local Anvil did not reach chainId 31337 at block 0')
JS
node run-lab.mjs | tee evidence/console.log
python3 reconcile.py
python3 make-report.py
