// Custom Processor: Store all events to SQL-enabled database.
//
// To read about available global variables visit: https://docs.flair.build/reference/custom-scripting
//
exports.processEvent = function (event, callback) {
  (async () => {
    const provider = await blockchain.getProvider(event.chainId);
    const transaction = await provider.cached().getTransaction(event.txHash);

    let eventData = {};
    const isFeesCollectedEvent = !!event.parsed.args._integratorFee;
    if (isFeesCollectedEvent) {
      eventData.integrator = event.parsed.args._integrator;
      eventData.token = event.parsed.args._token;

      eventData.integratorFee = event.parsed.args._integratorFee;
      eventData.integratorFeeInUsd = await calculateFeeInUsd({
        event,
        token: eventData.token,
        amount: eventData.integratorFee,
      });

      eventData.lifiFee = event.parsed.args._lifiFee;
      eventData.lifiFeeInUsd = await calculateFeeInUsd({
        event,
        token: eventData.token,
        amount: eventData.lifiFee,
      });
    } else {
      eventData.token = event.parsed.args._token;
      eventData.amount = event.parsed.args._amount;
      eventData.to = event.parsed.args._to;

      eventData.inUsd = await calculateFeeInUsd({
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
      horizon: {
        forkIndex: event.blockForkIndex,
        blockNumber: event.blockNumber,
        transactionIndex: event.txIndex,
        logIndex: event.log.logIndex,
      },

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

        // Save prepared data
        ...eventData,
      },
    });

    return true;
  })()
    .then((res) => callback(res, null))
    .catch((error) => callback(null, error));
};

async function calculateFeeInUsd({ event, token, amount }) {
  if (token && amount) {
    const price = await integrations.prices.getUsdAmountByAddress({
      chainId: event.chainId,
      tokenAddress: token,
      tokenAmount: amount,
      idealBlockNumber: event.blockNumber,
      idealTimestamp: event.blockTimestamp,
    });

    return price.amountUsd;
  }
}

async function persistToken(chainId, tokenAddress) {
  const token = await database.get({
    entityType: "Token",
    entityId: tokenAddress?.toLowerCase(),
    cache: true,
  });

  if (token) {
    return;
  }

  const contract = (
    await blockchain.getContract(chainId, tokenAddress, [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
    ])
  ).cached();

  const [name, symbol, decimals] = await Promise.allSettled([
    contract.name(),
    contract.symbol(),
    contract.decimals(),
  ]);

  await database.upsert({
    entityType: "Token",
    entityId: tokenAddress?.toLowerCase(),
    data: {
      chainId,
      tokenAddress,
      name: name?.value,
      symbol: symbol?.value,
      decimals: decimals?.value,
    },
  });
}
