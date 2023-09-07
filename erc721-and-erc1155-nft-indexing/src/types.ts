import { Entity } from "flair-sdk";
import { BigNumber } from "ethers";

export enum EntityTypes {
  COLLECTION = "Collection",
  TOKEN = "Token",
  METADATA = "Metadata",
  TRANSFER = "Transfer",
  OWNERSHIP = "Ownership",
}

export type Collection = Entity<{
  name?: string;
  symbol?: string;

  metadataUri?: string;
  metadataContent?: string;
  metadataLastErrorAt?: number;
  metadataLastError?: string;
  metadataLastUpdateAt?: number;

  interfaceERC173?: boolean;
  interfaceERC721?: boolean;
  interfaceERC1155?: boolean;
}>;

export type Token = Entity<{
  collectionId: string;
  chainId: number;
  address: string;
  tokenId: string;
  standard?: TokenStandard;

  mintBlockTimestamp?: number;
  mintTxHash?: string;
  burnBlockTimestamp?: number;
  burnTxHash?: string;

  metadataUri?: string;
  metadataContent?: string;
  metadataLastErrorAt?: number;
  metadataLastError?: string;
  metadataLastUpdateAt?: number;
}>;

export type Ownership = Entity<{
  chainId: number;
  address: string;
  blockTimestamp: number;
  txHash: string;

  assetType: AssetType;
  assetId: string;

  owner: string;
  amount: BigNumber;
}>;

export type Transfer = Entity<{
  chainId: number;
  blockTimestamp: number;
  txHash: string;
  collectionId: string;
  tokenId: string;
  from: string;
  to: string;
  amount: BigNumber;
}>;

export enum TokenStandard {
  ERC721 = "ERC721",
  ERC1155 = "ERC1155",
}

export enum AssetType {
  CONTRACT = "Contract",
  ERC721 = "TokenERC721",
  ERC1155 = "TokenERC1155",
}

export type ERC721TransferArgs = {
  from: string;
  to: string;
  tokenId: string;
};

export type ERC1155TransferSingleArgs = {
  from: string;
  to: string;
  tokenId: string;
  amount: BigNumber;
};

export type ERC1155TransferBatchArgs = {
  from: string;
  to: string;
  tokenIds: string[];
  amounts: BigNumber[];
};
