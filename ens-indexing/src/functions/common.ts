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

async function upsertEvent(event: EventHandlerInput, extraData?: any) {
  const provider = await blockchain.getProvider(event.chainId)
  const transaction = await provider
    .cached()
    .getTransactionReceipt(event.txHash)

  await database.upsert({
    // Entity type is used to group entities together.
    // Here we're creating 1 entity per event (Transfer, Borrow, Approval, etc),
    // based on either entityName defined in the ABI JSON or exact event name.
    entityType: event.abi.entityName || event.parsed.name,

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
      removed: Boolean(event.log.removed),

      txFrom: transaction.from,
      txTo: transaction.to,
      txHash: event.txHash,

      // Save all event args as-is
      ...event.parsed.args,

      // Save incoming data as-is
      ...extraData,
    },
  })

  return true
}

function byteArrayFromHex(s: string) {
  if (s.length % 2 !== 0) {
    throw new TypeError("Hex string must have an even number of characters");
  }
  let out = new Uint8Array(s.length / 2);
  for (var i = 0; i < s.length; i += 2) {
    out[i / 2] = parseInt(s.substring(i, i + 2), 16);
  }
  return out;
}

function uint256ToByteArray(i: string) {
  let hex = i
    .slice(2)
    .padStart(64, "0");
  return byteArrayFromHex(hex);
}

export { fetchUsdPrice, upsertEvent, byteArrayFromHex, uint256ToByteArray }


