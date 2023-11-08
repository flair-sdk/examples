import { blockchain, database, EventHandlerInput } from 'flair-sdk'

// local methods
export async function _lookupAddress(event: EventHandlerInput, address: string): Promise<string | null> {
  const provider = await blockchain.getProvider(event.chainId);
  return await provider.lookupAddress(address);
}

export async function persistDomain(event: EventHandlerInput, extraData: any) {
  return await database.upsert({
      entityType: "Domain",
      entityId: extraData.node,
      // Horizon helps with chronological ordering of events and handling re-orgs
      horizon: event.horizon,
      data: {
        chainId: event.chainId,
        contractAddress: event.log.address,
        blockTimestamp: event.blockTimestamp,
        txHash: event.txHash,
        ...extraData,
      }
  });
}