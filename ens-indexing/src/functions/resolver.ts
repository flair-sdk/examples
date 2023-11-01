import { database } from 'flair-sdk'

import { multiplex } from './multiplex'


export const getOrCreateResolver = async function (
  chainId: number,
  address: string,
  cache = true,
) {
  return multiplex(`account:${chainId}:${address}`, 60000, async () => {
    const resolverId = `${chainId.toString()}:${address.toString()}`.toLowerCase();

    const resolver = await database.get({
        entityType: 'Resolver',
        entityId: resolverId,
        cache,
    })

    if (resolver) {
        return resolver
    }

    return await database.upsert({
        entityType: 'Resolver',
        entityId: resolverId,
        chainId,
        address
    })
  })
}
