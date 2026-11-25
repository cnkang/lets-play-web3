// Fail closed before any local write. No wallet, no public chain, no fork.
export const WRITE_URL = 'http://127.0.0.1:18549'

export function assertLoopbackUrl(url) {
  if (url !== WRITE_URL) throw new Error('REFUSED: write endpoint must be exactly http://127.0.0.1:18549')
  const parsed = new URL(url)
  if (parsed.protocol !== 'http:' || parsed.hostname !== '127.0.0.1' || parsed.port !== '18549') {
    throw new Error('REFUSED: write endpoint must be loopback http://127.0.0.1:18549')
  }
  if (parsed.username || parsed.password) throw new Error('REFUSED: credentials are not accepted in the write URL')
}

export function assertChainId(chainId) {
  const value = typeof chainId === 'bigint' ? chainId : BigInt(chainId)
  if (value !== 31337n) throw new Error(`REFUSED: chainId ${value} is not 31337`)
}

export function assertNoFork(nodeInfo) {
  if (nodeInfo?.forkConfig?.forkUrl || nodeInfo?.forkConfig?.forkBlockNumber) {
    throw new Error('REFUSED: this lab does not run on a fork')
  }
}

export function assertGenesis(blockNumber) {
  if (BigInt(blockNumber) !== 0n) throw new Error('REFUSED: lab must start at local block 0')
}

export async function preflight(url, fetchImpl = globalThis.fetch) {
  assertLoopbackUrl(url)
  const rpc = async (method) => {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: [] })
    })
    const body = await response.json()
    if (body.error) throw new Error(`REFUSED: ${method} failed before any write`)
    return body.result
  }
  assertChainId(BigInt(await rpc('eth_chainId')))
  const info = await rpc('anvil_nodeInfo')
  assertNoFork(info)
  if (Number(info?.environment?.chainId) !== 31337) throw new Error('REFUSED: node environment chainId is not 31337')
  assertGenesis(BigInt(await rpc('eth_blockNumber')))
  return { chainId: 31337, blockNumber: 0 }
}
