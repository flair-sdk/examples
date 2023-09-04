import {
  EventHandlerInput,
  blockchain,
  database,
  integrations,
} from 'flair-sdk'

interface FetchUsdPriceParams {
  event: EventHandlerInput
  token: string
  amount: number
}

const fetchUsdPrice = async function ({
  event,
  token,
  amount,
}: FetchUsdPriceParams): Promise<number | null> {
  if (token && amount) {
    const price = await integrations.prices.getUsdAmountByAddress({
      chainId: event.chainId,
      tokenAddress: token,
      tokenAmount: amount,
      idealBlockNumber: event.blockNumber,
      idealTimestamp: event.blockTimestamp,
    })

    return price ? price.amountUsd : null
  }

  return null
}

async function persistToken(chainId: number, tokenAddress: string) {
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
  ]) as any;

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

export { fetchUsdPrice, persistToken }
