# Index and notify Aave cumulative metrics (e.g totalBorrows) and aggregations (e.g borrow rate change)

Index and Notify Aave Cumulative Metrics
This repository provides a solution to index and notify cumulative metrics, such as totalBorrows, and aggregations, such as borrow rate change, for Aave positions. The solution is designed to gather relevant data and send notifications for informed decision-making based on the aggregated metrics.

## Overview
Aave is a decentralized finance (DeFi) platform, and tracking key metrics related to user positions is crucial for assessing the health and performance of the protocol. This solution leverages indexing and notification mechanisms to facilitate the monitoring of cumulative metrics and aggregations related to Aave positions.

## Features
* Cumulative Metrics Indexing: The solution captures and indexes cumulative metrics, including but not limited to totalBorrows, associated with Aave positions.

* Aggregations: Aggregated metrics, such as borrow rate change, are computed to provide a comprehensive view of the dynamics within the Aave protocol.

* Notification Mechanism: Notifications are sent to a specified endpoint (e.g., Zapier webhook) to enable real-time awareness and response to changes in the Aave positions.


## Table of Contents

- [🏁 Getting Started](#getting-started)
- [💎 Examples](#examples)
- [🚀 Next Steps](#next-steps)
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
# Index last recent 10,000 blocks of a contract like this:
pnpm flair backfill --chain 1 --address 0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc -d backward --max-blocks 10000
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
        *
    FROM
        entities
    WHERE
        namespace = 'vektor-finance'
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

The current flow covers a very basic indexing use-case. For more advanced ones, check the list below:

- [Aggregate protocol fees in USD across multiple chains](https://github.com/flair-sdk/examples/tree/main/aggregate-protocol-fees-in-usd) <br/>
- [calculate "Health Factor" of positions with contract factory tracking](https://github.com/flair-sdk/examples/tree/main/health-factor-with-factory-tracking) <br/>
- [Uniswap v2 swaps with USD price for all contracts across all chains](https://github.com/flair-sdk/examples/tree/main/uniswap-v2-events-from-all-contracts-with-usd-price) <br/>

## FAQ

**Q:** How do I enable/disable real-time ingestion for indexer? <br />
**A:** For each indexer defined in `config.json`, you can enable/disable it via the `enabled: true/false` flag. Remember to run `pnpm deploy` for the changes to apply on the cluster. <br/><br />
