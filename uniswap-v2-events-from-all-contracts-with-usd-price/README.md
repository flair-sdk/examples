# Example: Track Uniswap v2 swaps with USD price for all contracts across all chains

This example demonstrates how to index Swap events from a Uniswap fork on all chains and all contracts with USD price of the tokens swapped at the time of the swap.

In this example you learn:
* Tracking newly deployed pool contracts on known [factories](./factories.csv). 
* Using [workers](https://docs.flair.build/advanced/workers) to Re-calculate Pools stats such as total volume for last 7 days, last 1 hour, etc. This job makes sure that the stats are always up-to-date and not skewed from reality when events are processed multiple times due to retries.
* Index all "Swap" events and [store USD price](https://docs.flair.build/advanced/integrations#prices) at the time of swap. This processor also "optimistically" increments rolling stats of aPool such as total volume for last 7 days.

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

## Not seeing any data?

This is most probably because initially no Pool is being tracked. The indexer will always look at the "filterGroups" defined in your manifest, and any address/topic defined in ingestion or processing filter group will be tracked.

You have few ways to track Pools:
* Use the correct factory address in [factories.csv](./factories.csv) and run `pnpm generate-and-deploy` again. Then do a full (or limited) backfill for that factory to capture and track all the pools:
```bash
pnpm flair backfill --chain 1 --address 0x1F984__FactoryAddress__a31F984 --max-blocks 1000000 --provisioned
```

* Or, manually add few Pool addresses to the processing filterGroup:
```yaml
# manifest.yml.mustache
...
processing:
  filterGroups:
    - id: addresses 
      addresses:
        - chainId: '*'
          address: '0x0000000000'
```

* Or track all Uniswap-compatible pools, remember this might be very expensive on bigger chains like Polygon or Arbitrum:
```yaml
# manifest.yml.mustache
...
processing:
  filterGroups:
    - id: addresses 
      addresses:
        - chainId: '*'
          address: '*'
```

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
        COUNT(*),
        entityType
    FROM
        entities
    WHERE
        namespace = 'my-awesome-swapper'
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

#### Order all Pools by total USD volume in last 7 days

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
        namespace = 'my-awesome-swapper' AND
        entityType = 'Pool' AND
        last7DVolumeUsd IS NOT NULL
      ORDER BY last7DVolumeUsd DESC
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

**Q:** Not seeing any data? <br />
Refer to [Not seeing any data?](#not-seeing-any-data) section above. <br/><br />
