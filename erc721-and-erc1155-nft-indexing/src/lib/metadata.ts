import {
  ERC721Metadata__factory,
  ERC1155Metadata__factory,
} from "@flair-sdk/contracts";
import got from "got";
import { blockchain } from "flair-sdk";
import { BigNumber, BytesLike } from "ethers";
import { Token, TokenStandard } from "../types";

async function getCachedProvider(chainId: number) {
  return (await blockchain.getProvider(chainId)).cached({
    // Provider with 24 hour cache
    ttlSeconds: 86400,
  });
}

export async function resolveTokenUri(token: Token): Promise<string> {
  const failures: string[] = [];

  const tryERC721First =
    !token.standard || token.standard === TokenStandard.ERC721;

  const firstResult = (
    await Promise.allSettled([
      tryERC721First ? fetchERC721Uri(token) : fetchERC1155Uri(token),
    ])
  )[0];
  if (firstResult.status === "fulfilled") {
    return firstResult.value;
  } else {
    failures.push(
      firstResult.reason?.toString() || JSON.stringify(firstResult.reason)
    );
  }

  const secondResult = (
    await Promise.allSettled([
      tryERC721First ? fetchERC1155Uri(token) : fetchERC721Uri(token),
    ])
  )[0];
  if (secondResult.status === "fulfilled") {
    return secondResult.value;
  } else {
    failures.push(
      secondResult.reason?.toString() || JSON.stringify(secondResult.reason)
    );
  }

  throw new Error(
    `Failed to resolve token URI for ${token.chainId}:${
      token.address
    } tokenId=${token.tokenId}:\n${failures.join("\n")}`
  );
}

async function fetchERC721Uri(token: Token): Promise<string> {
  const contract = ERC721Metadata__factory.connect(
    token.address,
    await getCachedProvider(token.chainId)
  );

  return (await Promise.race([
    contract.tokenURI(token.tokenId),
    new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `Timeout ERC721Metadata.tokenURI() for ${token.tokenId}:${token.address}`
            )
          ),
        15_000
      )
    ),
  ])) as string;
}

async function fetchERC1155Uri(token: Token): Promise<string> {
  const contract = ERC1155Metadata__factory.connect(
    token.address,
    await getCachedProvider(token.chainId)
  );

  return (await Promise.race([
    contract.uri(token.tokenId),
    new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `Timeout ERC721Metadata.tokenURI() for ${token.tokenId}:${token.address}`
            )
          ),
        15_000
      )
    ),
  ])) as string;
}

export async function fetchMetadataByUri(
  metadataUri: BytesLike,
  tokenId?: string
): Promise<string> {
  let contentJson;

  if (metadataUri?.toString().toLowerCase().trim().startsWith("data:")) {
    const base64Data = metadataUri.toString().replace(/^\s*data:[^,]+,/i, "");
    const decodedData = base64Data.trim().startsWith("{")
      ? base64Data
      : Buffer.from(base64Data, "base64").toString("utf8");
    try {
      contentJson = JSON.parse(decodedData);
    } catch (error) {
      throw new Error(
        `Error parsing metadata content based on data: ${JSON.stringify({
          error: error.message || error.stack,
          base64Data,
        })}`
      );
    }
  } else if (metadataUri?.toString().toLowerCase().trim().startsWith("{")) {
    try {
      contentJson = JSON.parse(metadataUri.toString());
    } catch (error) {
      throw new Error(
        `Error parsing metadata content based on data: ${JSON.stringify({
          error: error.message || error.stack,
          metadataUri,
        })}`
      );
    }
  } else if (metadataUri) {
    const uriCandidates = generateUriCandidates(metadataUri, tokenId);
    contentJson = await tryCandidatesOrFail(uriCandidates);
  }

  if (!contentJson) {
    return "";
  }

  return contentJson;
}

/**
 * Generate various URI candidates to try to fetch metadata from.
 * Sometimes contracts return "ipfs:" protocol, also we want to try different IPFS providers.
 *
 * @param metadataUri Exact URI returned by the contract
 * @param tokenId Optional NFT token to be replaced with standard {id} placeholder
 * @returns Various URIs to "try" to fetch metadata from, we expect at least 1 one to work
 */
function generateUriCandidates(
  metadataUri: BytesLike,
  tokenId?: string
): string[] {
  const candidates: string[] = [];

  // 1) 4 Ever Land
  const fourEverUri = metadataUri
    .toString()
    .replace(
      /^(https|http):\/\/.*\/ipfs\/Qm/i,
      "https://flair-indexing.4everland.link/ipfs/Qm"
    )
    .replace(
      /^(https|http):\/\/.*\/ipfs\/baf/i,
      "https://flair-indexing.4everland.link/ipfs/baf"
    )
    .replace("ipfs://", "https://flair-indexing.4everland.link/ipfs/");
  candidates.push(fourEverUri);
  candidates.push(fourEverUri?.toString().replace("/ipfs/ipfs/", "/ipfs/"));

  // 2) Original URI
  if (metadataUri?.toString().toLowerCase().trim().startsWith("http")) {
    candidates.push(metadataUri.toString());
  }

  // 3) Pinata
  const pinataUri = metadataUri
    .toString()
    .replace(
      /^(https|http):\/\/.*\/ipfs\/Qm/i,
      "https://flair-indexing.mypinata.cloud/ipfs/Qm"
    )
    .replace(
      /^(https|http):\/\/.*\/ipfs\/baf/i,
      "https://flair-indexing.mypinata.cloud/ipfs/baf"
    )
    .replace("ipfs://", "https://flair-indexing.mypinata.cloud/ipfs/");
  candidates.push(pinataUri);
  candidates.push(pinataUri?.toString().replace("/ipfs/ipfs/", "/ipfs/"));

  // 3) Public ipfs.io
  const globalIPFS = metadataUri
    .toString()
    .replace(/^(https|http):\/\/.*\/ipfs\/Qm/i, "https://ipfs.io/ipfs/Qm")
    .replace(/^(https|http):\/\/.*\/ipfs\/baf/i, "https://ipfs.io/ipfs/baf")
    .replace("ipfs://", "https://ipfs.io/ipfs/");
  candidates.push(globalIPFS);
  candidates.push(globalIPFS?.toString().replace("/ipfs/ipfs/", "/ipfs/"));

  // 3) Arweave public
  const arweaveReplaced = metadataUri
    ?.toString()
    .replace("ar://", "https://arweave.net/")
    .replace("arweave://", "https://arweave.net/");
  if (arweaveReplaced?.toString().toLowerCase().trim().startsWith("http")) {
    candidates.push(arweaveReplaced);
  }

  const returnCandidates = candidates
    .filter((c) => Boolean(c))
    .flatMap((url) =>
      url.includes("{id}") && tokenId
        ? [
            url.replace(
              "{id}",
              `${
                tokenId !== undefined
                  ? BigNumber.from(tokenId)
                      .toHexString()
                      .replace("0x", "")
                      .padStart(64, "0")
                  : tokenId
              }`
            ),
            url.replace(
              "{id}",
              `${
                tokenId !== undefined
                  ? BigNumber.from(tokenId).toString()
                  : tokenId
              }`
            ),
            url.replace(
              "{id}",
              `${
                tokenId !== undefined
                  ? BigNumber.from(tokenId).toHexString().replace("0x", "")
                  : tokenId
              }`
            ),
            url.replace(
              "{id}",
              `${
                tokenId !== undefined
                  ? BigNumber.from(tokenId).toHexString()
                  : tokenId
              }`
            ),
          ]
        : [url]
    )
    // Remove duplicates
    .filter((url, index, self) => self.indexOf(url) === index);

  return returnCandidates;
}

async function tryCandidatesOrFail(
  remoteCandidates: string[]
): Promise<string> {
  let contentJson;
  let lastError;

  for (const remoteCandidate of remoteCandidates) {
    try {
      const response = await got.get<any>(remoteCandidate, {
        https: {
          rejectUnauthorized: false,
        },
        responseType: "json",
        throwHttpErrors: true,
        timeout: 5000,
        headers:
          remoteCandidate.includes("pinata") && process.env.PINATA_GATEWAY_TOKEN
            ? {
                "x-pinata-gateway-token": process.env.PINATA_GATEWAY_TOKEN,
              }
            : remoteCandidate.includes("opensea") && process.env.OPENSEA_API_KEY
            ? {
                "x-api-key": process.env.OPENSEA_API_KEY,
              }
            : {},
      });

      contentJson = response.body;

      if (contentJson) {
        break;
      }
    } catch (e) {
      lastError = e;
    }
  }

  if (!contentJson) {
    throw new Error(
      `Failed to fetch metadata content from ${JSON.stringify(
        remoteCandidates
      )}: lastError=${
        lastError.message || lastError.stack
      } statusCode=${lastError?.response
        ?.statusCode} body=${lastError?.response?.body
        ?.toString()
        .slice(0, 500)} url=${
        lastError?.request?.url ||
        lastError?.response?.request?.url ||
        lastError?.response?.url
      }`
    );
  }

  return contentJson;
}
