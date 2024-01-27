import { multiplex } from './multiplex'
import { blockchain, database } from 'flair-sdk'

interface Token {
  name: string
  symbol: string
  decimals: number
}

const TOKEN_FUNCTIONS_ABI: string[] = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
]

const getOrCreateToken = async function (
  chainId: number,
  address: string,
  cache = true,
): Promise<Token> {
  if (!chainId || !address) {
    throw new Error(
      `Missing chainId or address for getOrCreateToken: ${JSON.stringify({
        chainId,
        address,
      })}`,
    )
  }

  return multiplex(`token:${chainId}:${address}`, 60000, async () => {
    const tokenId = `${chainId.toString()}:${address.toString()}`.toLowerCase()

    const token = await getToken(tokenId, cache)

    if (token && token.decimals !== undefined && token.decimals !== null) {
      return token
    }

    const contract = await blockchain.getContract(
      chainId,
      address,
      TOKEN_FUNCTIONS_ABI,
    )

    const [name, symbol, decimals] = (await Promise.allSettled([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
    ])) as any

    if (name?.reason) {
      console.warn('Could not fetch token name ', {
        reason: name?.reason,
        reasonType: typeof name?.reason,
        reasonString: name?.reason?.toString?.(),
        reasonStack: name?.reason?.stack,
        reasonCode: name?.reason?.code,
        chainId,
        address,
      })
    }
    if (symbol?.reason) {
      console.warn('Could not fetch token symbol ', {
        reason: symbol?.reason,
        reasonType: typeof symbol?.reason,
        reasonString: symbol?.reason?.toString?.(),
        reasonStack: symbol?.reason?.stack,
        reasonCode: symbol?.reason?.code,
        chainId,
        address,
      })
    }
    if (decimals?.reason) {
      console.warn('Could not fetch token decimals ', {
        reason: decimals?.reason,
        reasonType: typeof decimals?.reason,
        reasonString: decimals?.reason?.toString?.(),
        reasonStack: decimals?.reason?.stack,
        reasonCode: decimals?.reason?.code,
        chainId,
        address,
      })
    }

    return await database.upsert({
      entityType: 'Token',
      entityId: tokenId,
      chainId,
      address,
      name: name?.value,
      symbol: symbol?.value,
      decimals: decimals?.value || 18,
    })
  })
}

const getToken = async function (tokenId: string, cache = true): Promise<any> {
  return await database.get({
    entityType: 'Token',
    entityId: tokenId,
    cache,
  })
}

export { getOrCreateToken, getToken }
