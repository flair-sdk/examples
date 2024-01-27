# ERC721 and ERC1155 NFT Indexing on any EVM chain

Example processors for ERC721 and ERC1155 NFTs on any EVM chain using Flair's indexing service.

#### Work in progress

This example has base processors for NFT Transfers, Ownership, Tokens and Collections, but other aspects such as Media ingestion (for resizing image), etc are still in progress, watch this repo for updates and feel free to fork and update based on your own logic.

## Table of Contents

- [🏁 Getting Started](#getting-started)
- [💎 Examples](#examples)
- [🤔 FAQ](#faq)

## Getting Started

1️⃣ Clone this repo:

```bash
git clone https://github.com/flair-sdk/starter-boilerplate.git my-indexer
cd my-indexer
```

<br /> 
2️⃣ Install packages and authenticate:

```bash
pnpm i
pnpm flair auth
```

<br />
3️⃣ Set the namespace and config.json:

`config.dev.json` and `config.prod.json` are sample configs for `dev` and `prod` clusters.

Set a globally unique namespace in each config file (recommended to use `{ORG_NAME}-{ENV}`; e.g `sushiswap-dev` or `sushiswap-prod`) and then run:

```bash
# Setting configs for dev testing
cp config.dev.json config.json

# Or setting it for production
cp config.prod.json config.json
```

<br />
4️⃣ Generate manifest.yml and deploy:

```bash
pnpm generate-and-deploy
```

<br />
5️⃣ Backfill certain contracts or block ranges:

```bash
# Index last recent 10,000 blocks of BoredApe NFTs like this:
pnpm flair backfill --chain 1 --address 0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d -d backward --max-blocks 10000

# Index last recent 10,000 blocks of an ERC1155 NFT like this:
pnpm flair backfill --chain 1 --address 0x76be3b62873462d2142405439777e971754e8e77 -d backward --max-blocks 10000 
```

Or you can backfill for a specific block number, if you have certain events you wanna test with:

```bash
pnpm flair backfill --chain 1 -b 17998797
```

Or backfill for the recent data in the last X minutes:

```bash
pnpm flair backfill --chain 1 --min-timestamp="5 mins ago" -d backward
```

<br />
6️⃣ Look at the logs:

```bash
pnpm flair logs --full -tag Level=warn
pnpm flair logs --full -tag TransactionHash=0xXXXXX
pnpm flair logs --full -tag ProcessorId=swap-events
pnpm flair logs --full -tag ProcessorId=swap-events --watch
```

<br />
7️⃣ Explore the data in playground:
<br />

Visit the [playground](https://api.flair.build) and run the following query in Examples section.

## Examples

#### Get all entity types total count

- Method: `POST`
- Endpoint: [https://api.flair.build/](https://api.flair.build/)
- Headers: `X-API-KEY: <your-api-key>`
- Body:

```graphql
query {
  sql(
    query: """
    SELECT
        *
    FROM
        entities
    WHERE
        namespace = 'sushiswap-dev'
    """
  ) {
    stats {
      elapsedMs
    }
    rows
  }
}
```

## FAQ

**Q:** How do I enable/disable real-time ingestion for indexer? <br />
**A:** For each indexer defined in `config.json`, you can enable/disable it via the `enabled: true/false` flag. Remember to run `pnpm generate-and-deploy` for the changes to apply on the cluster. <br/><br />

### Todo Checklist

- [ ] Add reorg handler for transfers, ownerships
- [ ] Support consequtive transfers for erc721
- [X] Add enricher for NFT metadata
- [ ] Upload large metadata to S3
- [ ] Add enricher for NFT media resizing
- [ ] Trigger enricher for NFT metadata on mint
- [ ] Add enricher for contracts that can be triggered to import a contract before tracking for example
- [X] Make inputSql optional for enrichers
- [ ] Support topic hashes without data (on processor? or in ingestor? or in handler?)
