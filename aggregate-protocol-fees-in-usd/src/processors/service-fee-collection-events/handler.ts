
import { blockchain, database, EventHandlerInput } from 'flair-sdk';

import { fetchUsdPrice, persistToken } from '../../functions/common'


export async function processEvent(event: EventHandlerInput) {
    const provider = await blockchain.getProvider(event.chainId);
    const transaction = await provider.cached().getTransactionReceipt(event.txHash);

    await persistToken(event.chainId, event.parsed.args?.token);

    await database.upsert({
      // Entity type is used to group entities together.
      // Here we're creating 1 entity per event (Transfer, Borrow, Approval, etc),
      // based on either entityName defined in the ABI JSON or exact event name.
      entityType: event.abi?.entityName || event.parsed.name,

      // Unique ID for this entity.
      //
      // Some useful tips:
      // - chainId makes sure if potentially same tx has happened on different chains it will be stored separately.
      // - hash and logIndex make sure this event is stored uniquely.
      // - hash also makes sure with potential reorgs we don't store same event twice.
      // - logIndex also makes sure if such event has happened multiple times in same tx it will be stored separately.
      entityId: `${event.chainId}-${event.txHash}-${event.log.logIndex}`,

      // Horizon helps with chronological ordering of events and handling re-orgs
      // Horizon helps with chronological ordering of events and handling re-orgs
      horizon: event.horizon,

       // You can store any data you want, even every single entity of the same type can have different fields.
      // Must not include "entityId" field as it's already defined above.
      data: {
        chainId: event.chainId,
        contractAddress: event.log.address,
        blockTimestamp: event.blockTimestamp,
        removed: Boolean(event.log.removed),

        txFrom: transaction.from,
        txTo: transaction.to,
        txHash: event.txHash,

        // Save all event args as-is
        ...event.parsed.args,

        feeAmountInUsd: await fetchUsdPrice({
            event,
            token: event.parsed.args?._token,
            amount: event.parsed.args?._amount,
        }),
      },
    });

    return true;
};
