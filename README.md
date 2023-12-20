# Examples

Explore real-world usage of Flair indexing primitives for various use-cases.

### DeFi

* [Aggregate protocol fees in USD across multiple chains](./aggregate-protocol-fees-in-usd/README.md)
* [Calculate "Health Factor" of positions with contract factory tracking](./health-factor-with-factory-tracking/README.md)
* [Index Uniswap v2 swaps with USD price for all addresses](./uniswap-v2-events-from-all-contracts-with-usd-price/README.md)

### NFT

* [Index ERC721 and ERC1155 NFTs on any EVM chain with an RPC URL](./erc721-and-erc1155-nft-indexing/README.md)

### ENS

* [Index ENS data](./ens-indexing/README.md)

## How to deploy?

1. Create a new project in Flair as described in [flair-sdk/starter-boilerplate](https://github.com/flair-sdk/starter-boilerplate) repo.
2. Copy the contents of the example you want to deploy into your project directory.
3. Run `flair deploy` command to deploy the project to your cluster.
4. Do [backfill](https://docs.flair.dev/basic-tutorial#4-backfill-historical-data-to-test) of a certain block range to see how your script works.

## Need help?

Our [engineers](https://docs.flair.dev/talk-to-an-engineer) are always available to help.
