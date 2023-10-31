import { ethers } from 'ethers';
import { blockchain, database, EventHandlerInput } from 'flair-sdk'

import { REGISTRY_ABI, REGISTRY_ADDRESS, RESOLVER_ABI } from '../../constants';


export async function makeNode(node: Uint8Array, label: Uint8Array): Promise<string> {
  return ethers.utils.keccak256(ethers.utils.hexConcat([node, label]));
}

export async function lookupAddress(event: EventHandlerInput, address: string): Promise<string | null> {
  const provider = await blockchain.getProvider(event.chainId);
  return await provider.lookupAddress(address);
}

export async function nameAndAddressByHash(event: EventHandlerInput, node: string) {
  const chainId = event.chainId;

  const registryContract = await blockchain.getContract(
    chainId,
    REGISTRY_ADDRESS,
    REGISTRY_ABI,
  );

  const [resolver] = await Promise.all([
    registryContract.resolver(node),
  ]);

  const resolverContract = await blockchain.getContract(
    chainId,
    resolver,
    RESOLVER_ABI,
  );

  const [address] = await Promise.all([
    resolverContract.addr(node),
  ]);

  const name = await lookupAddress(event, address);

  return {
    name,
    address
  }
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