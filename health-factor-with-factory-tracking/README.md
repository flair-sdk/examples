# Example: calculate "Health Factor" of positions with contract factory tracking

This example demonstrates how to calculate "Health Factor" of positions of a protocol that is using ERC4626 and deploys new Vaults using a factory.

## Main [`manifest.yml`](./manifest.yml)

Contains list of indexing components deployed in your cluster.

## Processors

Each processor is defined to listen for a particular event (log topic) and/or contract address.

### (1) [factory-tracker](./factory-tracker)

Responsible for tracking newly deployed pools on known [factories](./factories.csv) based on [`DeployBorrowingVault`](./factory-tracker/abi.json) event.

Listens to:

- All factory contracts listed in [factories.csv](./factories.csv)
- Only "DeployBorrowingVault" event defined in [factory-tracker/abi.json](./factory-tracker/abi.json).

Custom script: [factory-tracker/handler.js](./factory-tracker/handler.js)

### (2) [erc4626-events](./erc4626-events)

Responsible for tracking all Deposit and Withdraw events on pool contracts.

Listens to:

- All pool contracts tracked via factory-tracker processor above.
- All events defined in [erc4626-events/abi.json](./erc4626-events/abi.json).

Custom script: [erc4626-events/handler.js](./erc4626-events/handler.js)

## Scheduled Jobs

A scheduled job accepts a SQL as input, retrieves all rows and executes a custom enricher script for each row.

### Every 15 minutes

Re-calculate position health for each Position every 15 minutes.

- **Input:** [position-health/input.sql](./position-health/input.sql) is a query to return all active Positions.
- **Script:** [position-health/handler.js](./position-health/handler.js) calculates position health and updates the entity in the database.

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
        namespace = 'fuji-finance'
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
        namespace = 'fuji-finance' AND
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
        namespace = 'fuji-finance' AND
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
