import { BigNumberish, BigNumber } from "ethers";
import { EventHandlerInput, database } from "flair-sdk";
import { AssetType, Ownership, EntityTypes } from "../types";

export const upsertOwnership = async function (
  event: EventHandlerInput<any>,
  assetType: AssetType,
  assetId: string,
  owner: string,
  amount: BigNumberish
): Promise<Ownership> {
  return await database.upsert<Ownership>({
    entityType: EntityTypes.OWNERSHIP,
    entityId:
      `${event.chainId}:${event.log.address}:${assetId}:${owner}`.toLowerCase(),
    horizon: event.horizon,
    chainId: event.chainId,
    blockTimestamp: event.blockTimestamp,
    txHash: event.txHash,
    address: event.log.address,
    assetType,
    assetId,
    owner: owner.toLowerCase(),
    amount: BigNumber.from(amount),
  });
};
