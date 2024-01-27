import { Entity, blockchain, database } from 'flair-sdk'

import { multiplex } from './multiplex'
import { getOrCreateToken } from './token'

export type Pool = Entity<{
  chainId: number
  address: string
  token0Id?: string
  token1Id?: string
  token0Address: string
  token1Address: string
  _name: string
  fee: number
  horizon?: string
}>

const POOL_FUNCTIONS_ABI = [
  'function token0() view returns (address)',
  'function token1() view returns (address)',
]

export const getOrCreatePool = async function (
  chainId: number,
  address: string,
  cache = true,
) {
  return multiplex(`pool:${chainId}:${address}`, 60000, async () => {
    const poolId = `${chainId.toString()}:${address.toString()}`.toLowerCase()

    const pool = await database.get<Pool>({
      entityType: 'Pool',
      entityId: poolId,
      cache,
    })

    if (pool?.token0Address && pool.token1Address) {
      return pool
    }

    const contract = (
      await blockchain.getContract(chainId, address, POOL_FUNCTIONS_ABI)
    ).cached()

    const [token0Address, token1Address] = await Promise.all([
      contract.token0(),
      contract.token1(),
    ])

    const [token0, token1] = await Promise.all([
      getOrCreateToken(chainId, token0Address, cache),
      getOrCreateToken(chainId, token1Address, cache),
    ])

    const regex = /([^\w ]|_|-)/g

    return await database.upsert({
      entityType: 'Pool',
      entityId: poolId,
      chainId,
      address,
      token0Id: `${chainId}:${token0Address}`.toLowerCase(),
      token1Id: `${chainId}:${token1Address}`.toLowerCase(),
      token0Address: token0Address?.toLowerCase(),
      token1Address: token1Address?.toLowerCase(),
      _name: token0?.symbol
        ?.replace(regex, '')
        .slice(0, 15)
        .concat('-')
        .concat(token1?.symbol?.replace(regex, '').slice(0, 15)),
      fee: 0.003,
    })
  })
}
