# Examples

Explore real-world usage of Flair indexing primitives for various use-cases.

### Generic

* [Sync example to your own Database](./historical-and-realtime-db-sync)
* [ENS simple domain reversals indexer](./ens-simple-name-reversal)
* [Index all transactions (including internal calls) with revert reason for failures](./transactions-with-internals-and-reverts)
* [ERC-4337 (Account Abstraction) entry point and factory events](./erc4337-simple-events)

### DeFi

* [Aggregate protocol fees in USD across multiple chains](./aggregate-protocol-fees-in-usd)
* [Calculate "Health Factor" of positions with contract factory tracking](./health-factor-with-factory-tracking)
* [Index Uniswap v2 swaps with USD price for all addresses](./uniswap-v2-events-from-all-contracts-with-usd-price)
* [Track and notify Aave position total borrows and borrow rate change per block](./aave-position-borrow-rate-notification)

### NFT

* [Index ERC721 and ERC1155 NFTs on any EVM chain with an RPC URL](./erc721-and-erc1155-nft-indexing)

## How to deploy?

1. Create a new project in Flair as described in [flair-sdk/starter-boilerplate](https://github.com/flair-sdk/starter-boilerplate) repo.
2. Copy the contents of the example you want to deploy into your project directory.
3. Run `flair deploy` command to deploy the project to your cluster.
4. Do [backfill](https://docs.flair.dev/reference/cli-commands#flair-backfill) of a certain block range to see how your script works.

## Need help?

Our [engineers](https://docs.flair.dev/talk-to-an-engineer) are always available to help.
