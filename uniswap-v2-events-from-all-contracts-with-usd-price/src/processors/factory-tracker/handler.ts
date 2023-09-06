import { blockchain, database, graph, EventHandlerInput } from 'flair-sdk';

export async function processEvent(event: EventHandlerInput) {
    const chainId = event.chainId;
    const poolAddress = event?.parsed?.args?.pair;

    if (!poolAddress) {
      console.log(
        `Skipping processing event, no pair address found: ${JSON.stringify(
          event?.parsed?.args
        )}`
      );
      return false;
    }

    await graph.run(`
      mutation {
          upsertContractsToFilterGroup(
              chainId: ${chainId},
              contractAddresses: ["${poolAddress.toString()}"],
              groupId: "addresses"
          ) {
              groupId
          }
      }
    `);

    await persistPool(event);

    return true;
};

async function persistPool(event) {
  const poolAddress = event.parsed.args.pair.toString();
  const poolId = `${event.chainId.toString()}#${poolAddress}`.toLowerCase();

  const pool = await database.get({
    entityType: "Pool",
    entityId: poolId,
    cache: true,
  });

  if (pool) {
    return false;
  }

  const token0 = event.parsed.args.token0.toString();
  const token1 = event.parsed.args.token1.toString();

  const abi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function token0() view returns (address)",
    "function token1() view returns (address)",
  ];
  const poolContract = (
    await blockchain.getContract(event.chainId, poolAddress, abi)
  ).cached();
  const token0Contract = (
    await blockchain.getContract(event.chainId, token0, abi)
  ).cached();
  const token1Contract = (
    await blockchain.getContract(event.chainId, token1, abi)
  ).cached();

  // Running at once forces batching
  // Also we ignore errors since some contracts are broken (missing name() method for example)
  const [
    poolName,
    poolSymbol,
    poolDecimals,
    token0Name,
    token0Symbol,
    token0Decimals,
    token1Name,
    token1Symbol,
    token1Decimals,
  ] = await Promise.allSettled([
    poolContract.name(),
    poolContract.symbol(),
    poolContract.decimals(),
    token0Contract.name(),
    token0Contract.symbol(),
    token0Contract.decimals(),
    token1Contract.name(),
    token1Contract.symbol(),
    token1Contract.decimals(),
  ]) as any;

  await database.upsert({
    entityType: "Pool",
    entityId: poolId,
    horizon: event.horizon,
    data: {
      chainId: event.chainId,
      contractAddress: poolAddress,
      token0: token0?.value,
      token1: token1?.value,
      name: poolName?.value,
      symbol: poolSymbol?.value,
      decimals: poolDecimals?.value,
      token0Name: token0Name?.value,
      token0Symbol: token0Symbol?.value,
      token0Decimals: token0Decimals?.value,
      token1Name: token1Name?.value,
      token1Symbol: token1Symbol?.value,
      token1Decimals: token1Decimals?.value,
    },
  });

  return true;
}
