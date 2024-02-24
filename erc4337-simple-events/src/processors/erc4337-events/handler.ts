import { EventHandlerInput, blockchain, database } from "flair-sdk";

export const processEvent = async (input: EventHandlerInput) => {
  const provider = await blockchain.getProvider(input.chainId);
  const transaction = await provider
    .cached()
    .getTransactionReceipt(input.txHash);

  await database.upsert({
    // Entity type is used to group entities together.
    // Here we're creating 1 entity per event (Transfer, Borrow, Approval, etc),
    // based on either entityName defined in the ABI JSON or exact event name.
    entityType: input.parsed?.name || input.abi?.eventName || 'RawEvent',

    // Unique ID for this entity.
    //
    // Some useful tips:
    // - chainId makes sure if potentially same tx has happened on different chains it will be stored separately.
    // - hash and localIndex make sure this event is stored uniquely.
    // - hash also makes sure with potential reorgs we don't store same event twice.
    // - logIndex also makes sure if such event has happened multiple times in same tx it will be stored separately.
    entityId: `${input.chainId}-${input.txHash}-${input.event.logIndex}`,

    // Horizon helps with chronological ordering of events and handling re-orgs
    // This will automatically add blockNumber and logIndex fields to the entity.
    horizon: input.horizon,

    // You can store any data you want, even every single entity of the same type can have different fields.
    // Must not include "entityId" field as it's already defined above.
    chainId: input.chainId,
    contractAddress: input.event.address,
    blockTimestamp: input.blockTimestamp,

    txFrom: transaction.from,
    txTo: transaction.to,
    txHash: input.txHash,

    // Save event raw data as-is
    data: input.event.data,
    topic0: input.event.topics?.[0],
    topic1: input.event.topics?.[1],
    topic2: input.event.topics?.[2],

    // Save all event args as-is
    ...input.parsed?.args,
  });
};
