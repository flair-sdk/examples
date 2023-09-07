import { EventHandlerInput, blockchain } from "flair-sdk";
import { getOrCreateCollection } from "../../../lib/collection";
import {
  ERC1155TransferSingleArgs,
  ERC1155TransferBatchArgs,
  Transfer,
  Ownership,
  AssetType,
  Token,
  TokenStandard,
} from "../../../types";
import { getOrCreateToken, upsertTransfer } from "../../../lib/tokens";
import { throttledPromiseAll } from "../../../lib/common";
import { upsertOwnership } from "../../../lib/ownership";
import { ERC1155_FUNCTIONS_ABI } from "../../../lib/erc1155";

/**
 * This processor receives ERC1155 SingleTransfer and BatchTransfer events
 */
export async function processEvent(
  event: EventHandlerInput<ERC1155TransferSingleArgs | ERC1155TransferBatchArgs>
) {
  if (!event.parsed.args) {
    throw new Error("Missing event.parsed.args");
  }

  const contractAddress = event.log.address.toString();
  await getOrCreateCollection(event.chainId, contractAddress, true, {
    // This forces contracts that don't have interface flag to be updated
    // even if they don't support standard ERC173.
    interfaceERC1155: true,
  });

  const transferUpserts = await generateTransferUpserts(event);
  const tokenUpserts = await generateTokenUpserts(event);
  const ownershipUpserts = await generateOwnershipUpserts(event);

  await throttledPromiseAll(tokenUpserts);
  await throttledPromiseAll(transferUpserts);
  await throttledPromiseAll(ownershipUpserts);
}

async function generateTransferUpserts(
  event: EventHandlerInput<ERC1155TransferSingleArgs | ERC1155TransferBatchArgs>
): Promise<(() => Promise<Transfer>)[]> {
  const transferUpserts: (() => Promise<Transfer>)[] = [];

  if (event.parsed.name === "TransferSingle") {
    const evt = event as EventHandlerInput<ERC1155TransferSingleArgs>;
    const args = evt.parsed.args as ERC1155TransferSingleArgs;
    transferUpserts.push(() =>
      upsertTransfer(evt, args.tokenId, args.from, args.to, args.amount)
    );
  }

  if (event.parsed.name === "TransferBatch") {
    const evt = event as EventHandlerInput<ERC1155TransferBatchArgs>;
    const args = evt.parsed.args as ERC1155TransferBatchArgs;
    for (let i = 0; i < args.tokenIds.length; i++) {
      transferUpserts.push(() =>
        upsertTransfer(
          evt,
          args.tokenIds[i],
          args.from,
          args.to,
          args.amounts[i]
        )
      );
    }
  }

  return transferUpserts;
}

async function generateTokenUpserts(
  event: EventHandlerInput<ERC1155TransferSingleArgs | ERC1155TransferBatchArgs>
): Promise<(() => Promise<Token>)[]> {
  const tokenUpserts: (() => Promise<Token>)[] = [];
  if (event.parsed.name === "TransferSingle") {
    const evt = event as EventHandlerInput<ERC1155TransferSingleArgs>;
    const args = evt.parsed.args as ERC1155TransferSingleArgs;
    tokenUpserts.push(() =>
      getOrCreateToken(evt.chainId, event.log.address, args.tokenId, true, {
        standard: TokenStandard.ERC1155,
      })
    );
  }

  if (event.parsed.name === "TransferBatch") {
    const evt = event as EventHandlerInput<ERC1155TransferBatchArgs>;
    const args = evt.parsed.args as ERC1155TransferBatchArgs;
    for (let i = 0; i < args.tokenIds.length; i++) {
      tokenUpserts.push(() =>
        getOrCreateToken(
          evt.chainId,
          event.log.address,
          args.tokenIds[i],
          true,
          {
            standard: TokenStandard.ERC1155,
          }
        )
      );
    }
  }

  return tokenUpserts;
}

async function generateOwnershipUpserts(
  event: EventHandlerInput<ERC1155TransferSingleArgs | ERC1155TransferBatchArgs>
): Promise<(() => Promise<Ownership>)[]> {
  const contract = await blockchain.getContract(
    event.chainId,
    event.log.address,
    ERC1155_FUNCTIONS_ABI
  );

  const updatedOwnersAndTokenIds: [string, string][] = [];
  if (event.parsed.name === "TransferSingle") {
    const args = event.parsed.args as ERC1155TransferSingleArgs;
    updatedOwnersAndTokenIds.push(
      [args.to, args.tokenId],
      [args.from, args.tokenId]
    );
  }
  if (event.parsed.name === "TransferBatch") {
    const args = event.parsed.args as ERC1155TransferBatchArgs;
    for (let i = 0; i < args.tokenIds.length; i++) {
      updatedOwnersAndTokenIds.push(
        [args.to, args.tokenIds[i]],
        [args.from, args.tokenIds[i]]
      );
    }
  }

  const balances = await contract.balanceOfBatch(
    updatedOwnersAndTokenIds.map((x) => x[0]),
    updatedOwnersAndTokenIds.map((x) => x[1])
  );

  const ownershipUpserts: (() => Promise<Ownership>)[] = [];
  for (let i = 0; i < updatedOwnersAndTokenIds.length; i++) {
    const [owner, tokenId] = updatedOwnersAndTokenIds[i];
    const balance = balances[i];
    ownershipUpserts.push(() =>
      upsertOwnership(event, AssetType.ERC1155, tokenId, owner, balance)
    );
  }

  return ownershipUpserts;
}
