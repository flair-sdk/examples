# ERC-4337 (Account Abstraction) events indexing on any EVM chain

This repository is a starting point of indexing ERC4337 for any chain, entry point and account factory. You can customize the handler logic, chains and addresses as needed.

## Table of Contents

- [🏁 Getting Started](#getting-started)
- [💎 Examples](#examples)
- [🚀 Next Steps](#next-steps)
- [🤔 FAQ](#faq)

## Getting Started

1️⃣ Clone this repo:

```bash
git clone https://github.com/flair-sdk/examples.git examples
cd erc4337-events
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

> For the first time it'll take few minutes to create your cluster components.

<br />
5️⃣ Backfill certain contracts or block ranges:

```bash
# Index last recent 10,000 blocks of a contract like this:
pnpm flair backfill --chain 1 --address 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789 -d backward --max-blocks 10000
```

Or you can backfill for a specific block number, if you have certain events you wanna test with:

```bash
pnpm flair backfill --chain 1 -b 17998797 --emit evm-transactions
```

Or backfill for the recent data in the last X minutes:

```bash
pnpm flair backfill --chain 1 --min-timestamp="5 mins ago" -d backward --emit evm-transactions
```

<br />
6️⃣ Look at the logs:

```bash
pnpm flair logs --full -tag Level=warn
pnpm flair logs --full -tag TransactionHash=0xXXXXX
pnpm flair logs --full -tag ProcessorId=erc4337-events
pnpm flair logs --full -tag ProcessorId=erc4337-events --watch
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
        namespace = 'erc4337-dev'
        -- NOTE change the namespace to your own
    """
  ) {
    stats {
      elapsedMs
    }
    rows
  }
}
```

## Next Steps

You can sync the indexed data in real-time to your own database. Follow the [Database guide](https://docs.flair.dev/reference/database).

## FAQ

**Q:** How do I enable/disable real-time ingestion for indexer? <br />
**A:** For each indexer defined in `config.json`, you can enable/disable it via the `enabled: true/false` flag. Remember to run `pnpm generate-and-deploy` for the changes to apply on the cluster. <br/><br />
