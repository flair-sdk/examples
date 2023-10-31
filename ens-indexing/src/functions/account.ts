

import { database } from 'flair-sdk'

import { multiplex } from './multiplex'

export const getOrCreateAccount = async function (
  chainId: number,
  address: string,
  cache = true,
) {
  return multiplex(`account:${chainId}:${address}`, 60000, async () => {
    const accountId = `${chainId.toString()}:${address.toString()}`.toLowerCase();

    const account = await database.get({
        entityType: 'Account',
        entityId: accountId,
        cache,
    })

    if (account) {
        return account
    }

    return await database.upsert({
        entityType: 'Account',
        entityId: accountId,
        chainId,
        address
    })
  })
}
