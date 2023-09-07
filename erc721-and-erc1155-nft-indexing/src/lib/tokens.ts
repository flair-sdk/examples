import {
  ERC1155TransferBatchArgs,
  ERC1155TransferSingleArgs,
  ERC721TransferArgs,
  EntityTypes,
  Token,
  Transfer,
} from "../types";
import { EventHandlerInput, database } from "flair-sdk";
import { BigNumberish, BigNumber } from "ethers";
import { multiplex } from "./multiplex";

const hasRequiredFields = (token: Token) => {
  return Boolean(token.standard && token.collectionId && token.tokenId);
};

export const getOrCreateToken = async function (
  chainId: number,
  address: string,
  tokenId: string,
  cache = true,
  extra?: Partial<Token>
): Promise<Token> {
  if (!chainId || !address) {
    throw new Error(
      `Missing fields for getOrCreateToken: ${JSON.stringify({
        chainId,
        address,
        tokenId,
      })}`
    );
  }

  const entityId =
    `${chainId.toString()}${address.toString()}:${tokenId.toString()}`.toLowerCase();

  return multiplex(`token:${entityId}`, 60000, async () => {
    const token = cache
      ? await getToken(chainId, address, tokenId, cache)
      : null;

    if (token && hasRequiredFields(token)) {
      return token;
    }

    if (token && !extra) {
      return token;
    }

    return await database.upsert<Token>({
      entityType: EntityTypes.TOKEN,
      entityId,
      collectionId: `${chainId}:${address}`.toLowerCase(),
      chainId,
      address,
      tokenId,
      ...extra,
    });
  });
};

export const upsertToken = async function (
  token: Partial<Omit<Token, "entityId">> & { entityId: string }
): Promise<Token> {
  if (!token.chainId || !token.collectionId || !token.tokenId) {
    throw new Error(`Missing fields for upsertToken: ${JSON.stringify(token)}`);
  }

  return await database.upsert<Token>({
    entityType: EntityTypes.TOKEN,
    ...token,
  });
};

export const getToken = async function (
  chainId: number,
  address: string,
  tokenId: string,
  cache = true
): Promise<Token | null> {
  const entityId =
    `${chainId.toString()}${address.toString()}:${tokenId.toString()}`.toLowerCase();

  return database.get<Token>({
    entityType: EntityTypes.TOKEN,
    entityId,
    cache,
  });
};

export const upsertTransfer = async function (
  event: EventHandlerInput<
    ERC721TransferArgs | ERC1155TransferSingleArgs | ERC1155TransferBatchArgs
  >,
  tokenId: string,
  from: string,
  to: string,
  amount: BigNumberish
): Promise<Transfer> {
  return await database.upsert<Transfer>({
    entityType: EntityTypes.TRANSFER,
    entityId:
      `${event.chainId}:${event.log.address}:${event.txHash}:${event.log.localIndex}`.toLowerCase(),
    horizon: event.horizon,
    chainId: event.chainId,
    blockTimestamp: event.blockTimestamp,
    txHash: event.txHash,
    collectionId: `${event.chainId}:${event.log.address}`.toLowerCase(),
    tokenId,
    from: from.toLowerCase(),
    to: to.toLowerCase(),
    amount: BigNumber.from(amount),
  });
};
