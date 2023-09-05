import { blockchain, database, EventHandlerInput } from 'flair-sdk';

export async function processEvent(event: EventHandlerInput) {
  const provider = await blockchain.getProvider(event.chainId);
  const transaction = await provider
    .cached()
    .getTransactionReceipt(event.txHash);

  await database.upsert({
    // Entity type is used to group entities together.
    // Here we're creating 1 entity per event (Transfer, Borrow, Approval, etc),
    entityType: event.parsed.name as string,

    // Unique ID for this entity.
    //
    // Some useful tips:
    // - chainId makes sure if potentially same tx has happened on different chains it will be stored separately.
    // - hash and localIndex make sure this event is stored uniquely.
    // - hash also makes sure with potential reorgs we don't store same event twice.
    // - logIndex also makes sure if such event has happened multiple times in same tx it will be stored separately.
    entityId: `${event.chainId}-${event.txHash}-${event.log.localIndex}`,

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

      // Save incoming data as-is
      ...(event.parsed.args || {}),
    },
  })

  const vault = await database.get({
    entityType: 'Vault',
    entityId: `${event.chainId}-${event.log.address}`,
    cache: true,
  });

  if (!vault) {
    const contract = await blockchain.getContract(
      event.chainId,
      event.log.address,
      ['function asset() external view returns (address)'],
    );

    await database.upsert({
      entityType: 'Vault',
      entityId: `${event.chainId}-${event.txHash}-${event.log.localIndex}`,
      horizon: event.horizon,
      data: {
        asset: await contract.asset(),
      },
    });
  }

  return true;
};
