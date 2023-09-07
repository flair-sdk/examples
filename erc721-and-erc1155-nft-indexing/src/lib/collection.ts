import { Collection, EntityTypes } from "../types";
import { getContractInterfaces } from "./erc165";
import { multiplex } from "./multiplex";
import { blockchain, database } from "flair-sdk";

const COMMON_TOKEN_CONTRACT_FUNCTIONS_ABI: string[] = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
];

function shouldForceUpdate(
  collection: Collection,
  upcomingFields?: Partial<Collection>
) {
  return Boolean(
    !collection.symbol ||
      (collection.interfaceERC721 === undefined &&
        upcomingFields?.interfaceERC721 !== undefined) ||
      (collection.interfaceERC1155 === undefined &&
        upcomingFields?.interfaceERC1155 !== undefined) ||
      (collection.interfaceERC173 === undefined &&
        upcomingFields?.interfaceERC173 !== undefined)
  );
}

export const getOrCreateCollection = async function (
  chainId: number,
  address: string,
  cache = true,
  extra?: Partial<Collection>
): Promise<Collection> {
  if (!chainId || !address) {
    throw new Error(
      `Missing chainId or address for getOrCreateCollection: ${JSON.stringify({
        chainId,
        address,
      })}`
    );
  }

  return multiplex(`collection:${chainId}:${address}`, 60000, async () => {
    const collectionId =
      `${chainId.toString()}:${address.toString()}`.toLowerCase();

    const collection: Collection | null = cache
      ? await getCollection(collectionId, cache)
      : null;

    if (collection && !shouldForceUpdate(collection, extra)) {
      return collection;
    }

    const commonContract = await blockchain.getContract(
      chainId,
      address,
      COMMON_TOKEN_CONTRACT_FUNCTIONS_ABI
    );

    const [name, symbol] = (await Promise.allSettled([
      commonContract.name(),
      commonContract.symbol(),
    ])) as any;

    if (name?.reason) {
      console.warn("Could not fetch token name ", {
        reason: name?.reason?.toString?.() || name?.reason?.stack,
        chainId,
        address,
      });
    }
    if (symbol?.reason) {
      console.warn("Could not fetch token symbol ", {
        reason: symbol?.reason?.toString?.() || symbol?.reason?.stack,
        chainId,
        address,
      });
    }

    const interfaces = await getContractInterfaces(chainId, address);

    return await database.upsert({
      entityType: EntityTypes.COLLECTION,
      entityId: collectionId,
      chainId,
      address,
      name: name?.value,
      symbol: symbol?.value,
      ...(interfaces.reduce((acc, cur) => {
        acc[`interface${cur}`] = true;
        return acc;
      }, {} as any) || {}),
      ...extra,
    });
  });
};

export const getCollection = async function (
  contractId: string,
  cache = true
): Promise<any> {
  return await database.get({
    entityType: EntityTypes.COLLECTION,
    entityId: contractId,
    cache,
  });
};
