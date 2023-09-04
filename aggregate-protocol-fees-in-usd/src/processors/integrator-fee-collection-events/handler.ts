
import { blockchain, database, EventHandlerInput } from 'flair-sdk';

import { fetchUsdPrice, persistToken } from '../../functions/common';

interface EventData {
  integrator: string;
  token: string;
  integratorFee: number;
  integratorFeeInUsd: number | null;
  lifiFee: number;
  lifiFeeInUsd: number | null;
  amount: number;
  to: string;
  inUsd: number | null;
}


export async function processEvent(event: EventHandlerInput) {
    const provider = await blockchain.getProvider(event.chainId);
    const transaction = await provider.cached().getTransactionReceipt(event.txHash);

    let eventData: EventData = {
      integrator: '',
      token: '',
      integratorFee: 0,
      integratorFeeInUsd: 0,
      lifiFee: 0,
      lifiFeeInUsd: 0,
      amount: 0,
      to: '',
      inUsd: 0
    };
  
    const isFeesCollectedEvent = !!event.parsed.args?._integratorFee;
    
    if (isFeesCollectedEvent) {
      eventData.integrator = event.parsed.args?._integrator;
      eventData.token = event.parsed.args?._token;

      eventData.integratorFee = event.parsed.args?._integratorFee;
      eventData.integratorFeeInUsd = await fetchUsdPrice({
        event,
        token: eventData.token,
        amount: eventData.integratorFee,
      });

      eventData.lifiFee = event.parsed.args?._lifiFee;
      eventData.lifiFeeInUsd = await fetchUsdPrice({
        event,
        token: eventData.token,
        amount: eventData.lifiFee,
      });
    } else {
      eventData.token = event.parsed.args?._token;
      eventData.amount = event.parsed.args?._amount;
      eventData.to = event.parsed.args?._to;

      eventData.inUsd = await fetchUsdPrice({
        event,
        token: eventData.token,
        amount: eventData.amount,
      });
    }

    await persistToken(event.chainId, eventData.token);

    await database.upsert({
      // Entity type is used to group entities together.
      // Here we're creating 1 entity per event (Transfer, Borrow, Approval, etc),
      // based on either entityName defined in the ABI JSON or exact event name.
      entityType: event.parsed.name as string,

      // Unique ID for this entity.
      //
      // Some useful tips:
      // - chainId makes sure if potentially same tx has happened on different chains it will be stored separately.
      // - hash and logIndex make sure this event is stored uniquely.
      // - hash also makes sure with potential reorgs we don't store same event twice.
      // - logIndex also makes sure if such event has happened multiple times in same tx it will be stored separately.
      entityId: `${event.chainId}-${event.txHash}-${event.log.logIndex}`,

      // Horizon helps with chronological ordering of events and handling re-orgs
      horizon: event.horizon,

      // You can store any data you want, even every single entity of the same type can have different fields.
      // Must not include "entityId" field as it's already defined above.
      data: {
        chainId: event.chainId,
        contractAddress: event.log.address,
        blockTimestamp: event.blockTimestamp,

        txFrom: transaction.from,
        txTo: transaction.to,
        txHash: event.txHash,

        // Save prepared data
        ...eventData,
      },
    });

    return true;
};
