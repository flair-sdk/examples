# Example: indexing Uniswap v2 swaps with USD price for all contracts across all chains

This example demonstrates how to index Swap events from a Uniswap fork on all chains and all contracts with USD price of the tokens swapped at the time of the swap.

# How to use?

1. Clone this repo and `cd` into this directory.
2. Update namespace in [manifest.yml](./manifest.yml) to your own namespace.
3. Example [factories.csv](./factories.csv) contains Uniswap v2 factory, which you can keep or replace.
4. Deploy the components using `flair deploy` command.
5. After deployment newly deployed pools will be tracked and their swaps will be indexed.
6. To do a historical backfill you can use [backfill command](https://docs.flair.build/reference/backfilling)

Need helps? [Our engineers](https://docs.flair.build/talk-to-an-engineer) are ready to help.

## Main [`manifest.yml`](./manifest.yml)

Contains list of indexing components deployed in your cluster.

## Processors

Each processor is defined to listen for a particular event (log topic) and/or contract address.

### [factory-tracker](./factory-tracker)

Responsible for tracking newly deployed pools on known [factories](./factories.csv) based on `PoolCreated` event.

Listens to:

- All factory contracts listed in [factories.csv](./factories.csv)
- Only "PoolCreated" event defined in [factory-tracker/abi.json](./factory-tracker/abi.json).

Custom script: [factory-tracker/handler.js](./factory-tracker/handler.js)

### [pools-swaps](./pools-swaps)

Index all "Swap" events and store USD price at the time of swap. This processor also "optimistically" increments rolling stats of aPool such as total volume for last 7 days.

Listens to:

- All pool contracts tracked via factory-tracker processor above.
- Swap event defined in [pools-swaps/abi.json](./pools-swaps/abi.json).

Custom script: [pools-swaps/handler.js](./pools-swaps/handler.js)

## Scheduled Jobs

A scheduled job accepts a SQL as input, retrieves all rows and executes a custom enricher script for each row.

### [pools-aggregations](./pools-aggregations)

Re-calculate Pools stats such as total volume for last 7 days, last 1 hour, etc. This job makes sure that the stats are always up-to-date and not skewed from reality when events are processed multiple times due to retries.

- **Input:** [pools-aggregations/input.sql](./pools-aggregations/input.sql) is a query to return all Pools and the appropriate ranges like 1H, 1D, etc.
- **Script:** [pools-aggregations/handler.js](./pools-aggregations/handler.js) updates each Pool with the aggregated values (last 1 hour volume etc) in the database.

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
