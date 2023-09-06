import { blockchain, database, Entity, EventHandlerInput } from 'flair-sdk';

import {fetchUsdPrice, getISOWeekNumber } from './common';

export type Pool = Entity<{
  chainId: number
  address: string
  token0: string
  token1: string
  name: string
}>

export async function persistEvent(event: EventHandlerInput, transaction, token0, token1) {
  const { monthBucket, weekBucket, dayBucket, hourBucket } =
    generateTimeBuckets(event.blockTimestamp);
  const [amount0InUsd, amount1InUsd, amount0OutUsd, amount1OutUsd] =
    await Promise.all([
      fetchUsdPrice({
        event,
        token: token0,
        amount: event.parsed.args?.amount0In,
      }),
      fetchUsdPrice({
        event,
        token: token1,
        amount: event.parsed.args?.amount1In,
      }),
      fetchUsdPrice({
        event,
        token: token0,
        amount: event.parsed.args?.amount0Out,
      }),
      fetchUsdPrice({
        event,
        token: token1,
        amount: event.parsed.args?.amount1Out,
      }),
    ]) as any;

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
    data,
  });

  if (!event.backfill || event.backfill?.context?.applyAtomicCounters) {
    await increaseRollingRecentStats(poolId, data);
  }
}

export async function persistPool(event) {
  const poolId =
    `${event.chainId.toString()}#${event.log.address.toString()}`.toLowerCase();

  const pool = await database.get({
    entityType: "Pool",
    entityId: poolId,
    cache: true,
  }) as Pool;

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
  ]) as any;

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

// local methods
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
