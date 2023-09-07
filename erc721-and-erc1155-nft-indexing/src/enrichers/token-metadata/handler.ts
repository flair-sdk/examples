import { EnricherHandlerInput } from "flair-sdk";
import { getOrCreateToken, upsertToken } from "../../lib/tokens";
import { fetchMetadataByUri, resolveTokenUri } from "../../lib/metadata";

export type TokenMetadataEnricherData = {
  chainId: number;
  address: string;
  tokenId: string;
};

export type TokenMetadataEnricherParameters = {
  forceUpdate?: boolean;
};

// This enricher is called to fetch and store token metadata
export async function handleInput({
  data,
  parameters,
}: EnricherHandlerInput<
  TokenMetadataEnricherData,
  TokenMetadataEnricherParameters
>) {
  if (!data?.chainId || !data?.address || !data?.tokenId) {
    throw new Error(
      `Missing required data to fetch token metadata: ${JSON.stringify(data)}`
    );
  }

  const token = await getOrCreateToken(
    data.chainId,
    data.address,
    data.tokenId
  );

  if (
    token?.metadataContent &&
    !parameters?.forceUpdate &&
    token?.metadataLastUpdateAt &&
    // Skip if already updated in last 24 hours
    token.metadataLastUpdateAt < Date.now() - 86400_000
  ) {
    return false;
  }

  try {
    const metadataUri = await resolveTokenUri(token);
    const metadataContent = await fetchMetadataByUri(
      metadataUri,
      token.tokenId
    );

    await upsertToken({
      entityId: token.entityId,
      // TODO upload to S3 for larger metadata
      metadataUri,
      metadataContent,
      metadataLastUpdateAt: Date.now(),
    });
  } catch (error) {
    await upsertToken({
      entityId: token.entityId,
      metadataLastErrorAt: Date.now(),
      metadataLastError: error.stack || error.message || error?.toString(),
    });
  }
}
