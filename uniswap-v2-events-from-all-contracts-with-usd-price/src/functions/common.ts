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

export async function fetchUsdPrice({
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

export function getISOWeekNumber(date) {
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

