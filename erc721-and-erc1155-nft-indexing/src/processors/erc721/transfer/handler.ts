import { EventHandlerInput } from "flair-sdk";
import { AssetType, ERC721TransferArgs, TokenStandard } from "../../../types";
import { getOrCreateCollection } from "../../../lib/collection";
import { upsertOwnership } from "../../../lib/ownership";
import { getOrCreateToken, upsertTransfer } from "../../../lib/tokens";

/**
 * This processor receives ERC721 Transfer event
 */
export async function processEvent(
  event: EventHandlerInput<ERC721TransferArgs>
) {
  if (!event.parsed.args) {
    throw new Error("Missing event.parsed.args");
  }

  await getOrCreateCollection(event.chainId, event.log.address, true, {
    // This forces contracts that don't have interface flag to be updated
    // even if they don't support standard ERC173.
    interfaceERC721: true,
  });
  await getOrCreateToken(
    event.chainId,
    event.log.address,
    event.parsed.args.tokenId,
    true,
    {
      standard: TokenStandard.ERC721,
    }
  );

  await Promise.all([
    upsertTransfer(
      event,
      event.parsed.args.tokenId,
      event.parsed.args.from,
      event.parsed.args.to,
      // For ERC721 Transfers amount is always 1 as tokens are non-fungible.
      "1"
    ),
    // We need this to upsert only if prev owner is different to avoid
    // overwriting amount to 0 if transfer is to same wallet.
    event.parsed.args.from.toString() === event.parsed.args.to.toString()
      ? null
      : upsertOwnership(
          event,
          AssetType.ERC721,
          event.parsed.args.tokenId,
          event.parsed.args.from,
          "0"
        ),
    upsertOwnership(
      event,
      AssetType.ERC721,
      event.parsed.args.tokenId,
      event.parsed.args.to,
      "1"
    ),
  ]);
}
