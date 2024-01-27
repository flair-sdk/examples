# Example: Aggregate protocol fees in USD across multiple chains

This example demonstrates how to calculate "Health Factor" of positions of a protocol that is using ERC4626 and deploys new Vaults using a factory.

In this example you learn:
* Tracking newly deployed pool contracts on known [factories](./factories.csv). 
* Using [workers](https://docs.flair.build/advanced/workers) to re-calculate position health for each Position every 15 minutes.

## Table of Contents

- [🏁 Getting Started](#getting-started)
- [💎 Examples](#examples)
- [🤔 FAQ](#faq)

## Getting Started

1️⃣ Clone this repo:

```bash
git clone git@github.com:flair-sdk/examples.git my-indexer
cd aggregate-protocol-fees-in-usd
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
# Index last recent 10,000 blocks of a contract like this:
pnpm flair backfill --chain 1 --address 0xbD6C7B0d2f68c2b7805d88388319cfB6EcB50eA9 -d backward --max-blocks 10000
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



## Examples

#### Get all entity types total count

- Method: `POST`
- Endpoint: [https://graph.flair.dev/](https://graph.flair.dev/)
- Headers: `X-API-KEY: <your-api-key>`
- Body:

```graphql
query {
  sql(
    query: """
    SELECT
        COUNT(*),
        entityType
    FROM
        entities
    WHERE
        namespace = 'health-factor-with-factory-tracking-dev'
    GROUP BY entityType
    """
  ) {
    stats {
      elapsedMs
    }
    rows
  }
}
```

#### Get deposits and withdrawals for a specific wallet, most recent first

- Method: `POST`
- Endpoint: [https://graph.flair.dev/](https://graph.flair.dev/)
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
        namespace = 'health-factor-with-factory-tracking-dev' AND
        entityType IN ('Deposit', 'Withdraw') AND
        owner = '0x4ba15d5f02394b774731e2be83213028303cce75'
      ORDER BY horizon DESC
      LIMIT 100
    """
  ) {
    stats {
      elapsedMs
    }
    rows
  }
}
```

#### Get health positions with limit-offset pagination

- Method: `POST`
- Endpoint: [https://graph.flair.dev/](https://graph.flair.dev/)
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
        namespace = 'health-factor-with-factory-tracking-dev' AND
        entityType = 'PositionHealth' AND
        healthFactor != '0'
      ORDER BY entityId DESC
      LIMIT 10 OFFSET 0 -- for page three use: OFFSET 20
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
