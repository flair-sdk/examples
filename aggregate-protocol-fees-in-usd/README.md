# Example: Aggregate protocol fees in USD across multiple chains

This example shows how to track fee collection events of a DeFi protocol where fees can be any arbitrary ERC20 token. 

In this example you learn:
* To use [`prices` integration](https://docs.flair.build/advanced/integrations#prices) to get USD price of any ERC20 token for any block number or timestamp in the past

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

<br />
7️⃣ Explore the data in playground:
<br />

Visit the [playground](https://api.flair.build) and run the following query in Examples section.

## Examples

### All entities order by latest at top

- Method: `POST`
- Endpoint: [https://api.flair.build/](https://api.flair.build/)
- Headers: `X-API-KEY: <your-api-key>`
- Body:

```graphql
query {
  sql(
    query:
    """
      SELECT
        *
      FROM
        entities
      WHERE
        namespace = 'aggregator-protocol-fee-in-usd-example-dev'
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

### Total gas fees and insurance fees collected

- Method: `POST`
- Endpoint: [https://api.flair.build/](https://api.flair.build/)
- Headers: `X-API-KEY: <your-api-key>`
- Body:

```graphql
query {
  sql(
    query: """
      SELECT
        chainId,
        contractAddress,
        SUM(IF(entityType = 'GasFeesCollected', 1, 0)) as totalGasFeesCount,
        SUM(IF(entityType = 'InsuranceFeesCollected', 1, 0)) as totalInsuranceFeesCount,
        CAST(SUM(IF(entityType = 'GasFeesCollected',  CAST(feeAmount as u256), CAST(0 as u256))) as string) as totalGasFeesAmount,
        CAST(SUM(IF(entityType = 'InsuranceFeesCollected',  CAST(feeAmount as u256), CAST(0 as u256))) as string) as totalInsuranceFeesAmount
      FROM
        entities
      WHERE
        namespace = 'aggregator-protocol-fee-in-usd-example-dev' AND
        (
          entityType = 'GasFeesCollected' OR
          entityType = 'InsuranceFeesCollected'
        )
      GROUP BY
        chainId, contractAddress
      ORDER BY totalGasFeesAmount DESC
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

### Total gas fees and insurance fees collected (with token symbol)

- Method: `POST`
- Endpoint: [https://api.flair.build/](https://api.flair.build/)
- Headers: `X-API-KEY: <your-api-key>`
- Body:

```graphql
query {
  sql(
    query: """
      SELECT
        f.chainId,
        f.contractAddress,
        t.tokenAddress,
        t.name,
        t.symbol,
        SUM(IF(f.entityType = 'GasFeesCollected', 1, 0)) as totalGasFeesCount,
        SUM(IF(f.entityType = 'InsuranceFeesCollected', 1, 0)) as totalInsuranceFeesCount,
        CAST(SUM(IF(f.entityType = 'GasFeesCollected',  CAST(f.feeAmount as u256), CAST(0 as u256))) as string) as totalGasFeesAmount,
        CAST(SUM(IF(f.entityType = 'InsuranceFeesCollected', CAST(f.feeAmount as u256), CAST(0 as u256))) as string) as totalInsuranceFeesAmount
      FROM
        entities f
      LEFT JOIN
        entities t ON t.namespace = 'aggregator-protocol-fee-in-usd-example-dev' AND t.entityType = 'Token' AND t.chainId = f.chainId AND t.tokenAddress = f.token
      WHERE
        f.namespace = 'aggregator-protocol-fee-in-usd-example-dev' AND
        (
          f.entityType = 'GasFeesCollected' OR
          f.entityType = 'InsuranceFeesCollected'
        )
      GROUP BY
        f.chainId, f.contractAddress, t.tokenAddress, t.name, t.symbol
      ORDER BY totalGasFeesAmount DESC
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

### Total number of entities by type and chain

- Method: `POST`
- Endpoint: [https://api.flair.build/](https://api.flair.build/)
- Headers: `X-API-KEY: <your-api-key>`
- Body:

```graphql
query {
    sql(
        query: """
          SELECT
              COUNT(*) as totalCount,
              chainId,
              entityType
          FROM
              entities
          WHERE
              namespace = 'aggregator-protocol-fee-in-usd-example-dev'
          GROUP BY entityType, chainId
          ORDER BY totalCount DESC
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

### Total fees collected grouped by chain

- Method: `POST`
- Endpoint: [https://api.flair.build/](https://api.flair.build/)
- Headers: `X-API-KEY: <your-api-key>`
- Body:

```graphql
query {
  sql(
    query: """
      SELECT
        SUM(feeAmountInUsd) as totalFeesInUsd,
        chainId
      FROM
        entities
      WHERE
        namespace = 'aggregator-protocol-fee-in-usd-example-dev'
      GROUP BY chainId
      ORDER BY totalFeesInUsd DESC
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

### Total fees collected grouped by token address

- Method: `POST`
- Endpoint: [https://api.flair.build/](https://api.flair.build/)
- Headers: `X-API-KEY: <your-api-key>`
- Body:

```graphql
query {
  sql(
    query: """
      SELECT
        SUM(feeAmountInUsd) as totalFeesInUsd,
        chainId, token
      FROM
        entities
      WHERE
        namespace = 'aggregator-protocol-fee-in-usd-example-dev'
      GROUP BY chainId, token
      HAVING SUM(feeAmountInUsd) > 0
      ORDER BY totalFeesInUsd DESC
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

### Tokens without USD price

- Method: `POST`
- Endpoint: [https://api.flair.build/](https://api.flair.build/)
- Headers: `X-API-KEY: <your-api-key>`
- Body:

```graphql
query {
  sql(
    query: """
      SELECT
        COUNT(*) as totalEvents,
        chainId, token
      FROM
        entities
      WHERE
        namespace = 'aggregator-protocol-fee-in-usd-example-dev' AND feeAmount is NOT NULL AND feeAmountInUsd IS NULL
      GROUP BY chainId, token
      ORDER BY totalEvents DESC
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

## FAQ

**Q:** How do I enable/disable real-time ingestion for indexer? <br />
**A:** For each indexer defined in `config.json`, you can enable/disable it via the `enabled: true/false` flag. Remember to run `pnpm generate-and-deploy` for the changes to apply on the cluster. <br/><br />
