import { blockchain } from "flair-sdk";
import { throttledPromiseAll } from "./common";
import { multiplex } from "./multiplex";
import { ERC721_INTERFACE_ID } from "./erc721";
import { ERC1155_INTERFACE_ID } from "./erc1155";
import { ERC173_INTERFACE_ID } from "./erc173";

export const ERC165_FUNCTIONS_ABI = [
  "function supportsInterface(bytes4) view returns (bool)",
];

const knownInterfaces = {
  [ERC173_INTERFACE_ID]: "ERC173",
  [ERC721_INTERFACE_ID]: "ERC721",
  [ERC1155_INTERFACE_ID]: "ERC1155",
};

export const getContractInterfaces = async function (
  chainId: number,
  address: string
): Promise<string[]> {
  return multiplex(
    `contract-interfaces:${chainId}:${address}`,
    3600_000,
    async () => {
      const contract = await blockchain.getContract(
        chainId,
        address,
        ERC165_FUNCTIONS_ABI
      );

      const checkPromises = Object.keys(knownInterfaces).map(
        (interfaceId) => async () => {
          try {
            const isSupported = await contract.supportsInterface(interfaceId);
            if (isSupported) {
              return knownInterfaces[interfaceId];
            }
          } catch (e) {
            console.warn("Error checking interface", {
              interfaceId,
              chainId,
              address,
              errorCode: e?.code,
              error: e?.toString?.() || e?.stack,
            });

            if (e?.code !== "RpcCallReverted") {
              throw e;
            }
          }
        }
      );

      return (await throttledPromiseAll(checkPromises)).filter(Boolean);
    }
  );
};
