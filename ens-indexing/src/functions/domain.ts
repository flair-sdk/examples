import { ethers } from 'ethers';
import { blockchain, database, EventHandlerInput } from 'flair-sdk'

import { REGISTRY_ABI, REGISTRY_ADDRESS, RESOLVER_ABI, EMPTY_ADDRESS, REGISTRY_ADDRESS_OLD } from '../../constants';

// local methods
export async function _lookupAddress(event: EventHandlerInput, address: string): Promise<string | null> {
  const provider = await blockchain.getProvider(event.chainId);
  return await provider.lookupAddress(address);
}

export async function makeNode(node: Uint8Array, label: Uint8Array): Promise<string> {
  return ethers.utils.keccak256(ethers.utils.hexConcat([node, label]));
}

export async function nameAndAddressByHash(event: EventHandlerInput, node: string) {
  const chainId = event.chainId;

  const registryContract = await blockchain.getContract(
    chainId,
    REGISTRY_ADDRESS,
    REGISTRY_ABI,
  );

  let resolver;
  let [recordExists] = await Promise.all([
    registryContract.recordExists(node),
  ]);

  if (recordExists) {
    [resolver] = await Promise.all([
      registryContract.resolver(node),
    ]);
  } else { 
    const registryContractOld = await blockchain.getContract(
      chainId,
      REGISTRY_ADDRESS_OLD,
      REGISTRY_ABI,
    );
    [resolver] = await Promise.all([
      registryContractOld.resolver(node),
    ]);
  }

  const resolverContract = await blockchain.getContract(
    chainId,
    resolver,
    RESOLVER_ABI,
  );

  const [address] = await Promise.all([
    resolverContract.addr(node),
  ]);

  if (address == EMPTY_ADDRESS) {
    return {
      name: null,
      address: EMPTY_ADDRESS,
    }
  }

  const name = await _lookupAddress(event, address);

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