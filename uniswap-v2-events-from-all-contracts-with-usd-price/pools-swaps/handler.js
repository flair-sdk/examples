exports.processEvent = function (event, callback) {
  (async () => {
    const provider = await blockchain.getProvider(event.chainId);
    const transaction = await provider.cached().getTransaction(event.txHash);

    const { token0, token1 } = await persistPool(event);

    await persistEvent(event, transaction, token0, token1);

    return true;
  })()
    .then((res) => callback(res, null))
    .catch((error) => callback(null, error));
};

async function persistEvent(event, transaction, token0, token1) {
  const { monthBucket, weekBucket, dayBucket, hourBucket } =
    generateTimeBuckets(event.blockTimestamp);
  const [amount0InUsd, amount1InUsd, amount0OutUsd, amount1OutUsd] =
    await Promise.all([
      calculateFeeInUsd({
        event,
        token: token0,
        amount: event.parsed.args.amount0In,
      }),
      calculateFeeInUsd({
        event,
        token: token1,
        amount: event.parsed.args.amount1In,
      }),
      calculateFeeInUsd({
        event,
        token: token0,
        amount: event.parsed.args.amount0Out,
      }),
      calculateFeeInUsd({
        event,
        token: token1,
        amount: event.parsed.args.amount1Out,
      }),
    ]);

  let amountUsd = 0;

  // Ideally we should only use the amountOut, but if it's 0, second best thing is to use the average of amountIn and amountOut, and as a last resort use amountIn
  if (amount0OutUsd > 0) {
    amountUsd = amount0OutUsd;
  } else if (amount1OutUsd > 0) {
    amountUsd = amount1OutUsd;
  } else if (amount0InUsd > 0 && amount1OutUsd > 0) {
    amountUsd = (amount0InUsd + amount1OutUsd) / 2;
  } else if (amount0InUsd > 0) {
    amountUsd = amount0InUsd;
  } else if (amount1InUsd > 0) {
    amountUsd = amount1InUsd;
  }

  const poolId =
    `${event.chainId.toString()}#${event.log.address.toString()}`.toLowerCase();

  const data = {
    chainId: event.chainId,
    contractAddress: event.log.address,
    blockTimestamp: Number(event.blockTimestamp),
    removed: Boolean(event.log.removed),

    txFrom: transaction.from,
    txTo: transaction.to,
    txHash: event.txHash,

    poolId,
    token0,
    token1,

    // Time buckets useful for aggregations
    monthBucket,
    weekBucket,
    dayBucket,
    hourBucket,

    // Save all event args as-is
    ...event.parsed.args,

    // Store USD value
    amountUsd,
  };

  await database.upsert({
    // Entity type is used to group entities together.
    // Here we're creating 1 entity per event (Swap, etc).
    entityType: event.parsed.name,

    // Unique ID for this entity.
    //
    // Soem useful tips:
    // - chainId makes sure if potentially same tx has happened on different chains it will be stored separately.
    // - hash and logIndex make sure this event is stored uniquely.
    // - hash also makes sure with potential reorgs we don't store same event twice.
    // - logIndex also makes sure if such event has happened multiple times in same tx it will be stored separately.
    entityId: `${event.chainId}-${event.txHash}-${event.log.logIndex}`,

    // Horizon helps with chronological ordering of events and handling re-orgs
    horizon: event.horizon,

    // You can store any data you want, even every single entity of the same type can have different fields.
    // Must not include "entityId" field as it's already defined above.
    data,
  });

  if (!event.backfill || event.backfill?.context?.applyAtomicCounters) {
    await increaseRollingRecentStats(poolId, data);
  }
}

async function persistPool(event) {
  const poolId =
    `${event.chainId.toString()}#${event.log.address.toString()}`.toLowerCase();

  const pool = await database.get({
    entityType: "Pool",
    entityId: poolId,
    cache: true,
  });

  if (pool?.token0 && pool?.token1) {
    return { token0: pool.token0, token1: pool.token1 };
  }

  const contract = await blockchain.getContract(
    event.chainId,
    event.log.address,
    [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function token0() view returns (address)",
      "function token1() view returns (address)",
    ]
  );

  const [name, symbol, token0, token1] = await Promise.allSettled([
    contract.name(),
    contract.symbol(),
    contract.token0(),
    contract.token1(),
  ]);

  await database.upsert({
    entityType: "Pool",
    entityId: poolId,
    horizon: event.horizon,
    data: {
      chainId: event.chainId,
      contractAddress: event.log.address,
      name: name?.value,
      symbol: symbol?.value,
      token0: token0?.value,
      token1: token1?.value,
    },
  });

  return { token0: token0?.value, token1: token1?.value };
}

async function increaseRollingRecentStats(poolId, data) {
  await database.applyCounters({
    entityType: "Pool",
    entityId: poolId,
    changes: {
      last1HVolumeUsd: data.amountUsd,
      last1DVolumeUsd: data.amountUsd,
      last7DVolumeUsd: data.amountUsd,
      last30DVolumeUsd: data.amountUsd,
    },
  });
}

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

function generateTimeBuckets(timestamp) {
  const full = new Date(timestamp * 1000);
  const monthTimestamp = new Date(full.getFullYear(), full.getMonth(), 1);
  const weekTimestamp = new Date(
    full.getFullYear(),
    full.getMonth(),
    full.getDate() - full.getDay()
  );
  const dayTimestamp = new Date(
    full.getFullYear(),
    full.getMonth(),
    full.getDate()
  );
  const hourTimestamp = new Date(
    full.getFullYear(),
    full.getMonth(),
    full.getDate(),
    full.getHours()
  );

  return {
    monthTimestamp,
    monthBucket: monthTimestamp.toISOString().slice(0, 7),
    weekTimestamp,
    weekBucket: `${weekTimestamp.toISOString().slice(0, 7)}-W${getISOWeekNumber(
      full
    )}`,
    dayTimestamp,
    dayBucket: dayTimestamp.toISOString().slice(0, 10),
    hourTimestamp,
    hourBucket: hourTimestamp.toISOString().slice(0, 13),
  };
}

function getISOWeekNumber(date) {
  const tempDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNumber = (tempDate.getUTCDay() + 6) % 7;
  tempDate.setUTCDate(tempDate.getUTCDate() - dayNumber + 3);
  const firstThursday = tempDate.getTime();
  tempDate.setUTCMonth(0, 1);

  if (tempDate.getUTCDay() !== 4) {
    tempDate.setUTCMonth(0, 1 + ((4 - tempDate.getUTCDay() + 7) % 7));
  }

  return (
    1 +
    Math.ceil((firstThursday - tempDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
  );
}
