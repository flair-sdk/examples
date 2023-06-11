exports.processEvent = function (event, callback) {
  (async () => {
    await database.upsert({
      // Entity type is used to group entities together
      entityType: event.parsed.name,

      // chainId makes sure if potentially same tx has happened on different chains it will be stored separately
      // hash and logIndex make sure this event is stored uniquely
      // hash also makes sure with potential reorgs we don't store same event twice
      // logIndex also makes sure if such event has happened multiple times in same tx it will be stored separately
      entityId: `${transaction.chainId}-${transaction.hash}-${event.log.logIndex}`,

      // Horizon helps with chronological ordering of entities and handling re-orgs
      horizon: event.horizon,

      // You can store any data you want.
      // Index fields are optional, i.e. their value can be null or undefined.
      // Must not include "ID" field as it's already defined above.
      data: {
        chainId: event.chainId,
        contractAddress: event.log.address,
        blockTimestamp: event.blockTimestamp,
        txHash: event.txHash,
        removed: Boolean(event.log.removed),

        // Save all event args as-is
        ...(event.parsed.args || {}),
      },
    });

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
        entityId: `${transaction.chainId}-${event.log.address}`,
        horizon,
        data: {
          asset: await contract.asset(),
        },
      });
    }

    return true;
  })()
    .then((res) => callback(res, null))
    .catch((err) => callback(null, err));
};
