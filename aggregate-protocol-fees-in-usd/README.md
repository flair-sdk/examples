# Example: Aggregate protocol fees in USD across multiple chains

This example shows how to track fee colelction events of a DeFi protocol where fees can be any arbitrary ERC20 token. 

In this example you learn:
* To use [`prices` integration](https://docs.flair.build/advanced/integrations#prices)  to get USD price of any ERC20 token for any block number or timestamp in the past.
* Track same contract address across all EVM chains at once.

## Main [`manifest.yml`](./manifest.yml)

Contains list of indexing components deployed in your cluster.

## Processors

Each processor is defined to listen for a particular event (log topic) and/or contract address.

### [fee-collection-events](./fee-collection-events)

Responsible for tracking all FeesWithdrawn, GasFeesCollected, InsuranceFeesCollected.

Listens to: All events defined in [fee-collection-events/abi.json](./fee-collection-events/abi.json).
Custom script: [fee-collection-events/handler.js](./fee-collection-events/handler.js)

## Scheduled Jobs

A scheduled job accepts a SQL as input, retrieves all rows and executes a custom enricher script for each row.

### Nothing yet...

_An example of scheduled is: every 10 minutes aggregate total fees collected (the USD price) and store in a simple entity ready to be queried from Frontend dashboard_

Read more about [scheduled jobs](https://docs.flair.build/advanced/schedules).

## SQL Examples

### All entities order by latest at top

- Method: `POST`
- Endpoint: [https://graph.flair.dev/](https://graph.flair.dev/)
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
        namespace = 'lifi'
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
- Endpoint: [https://graph.flair.dev/](https://graph.flair.dev/)
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
        namespace = 'lifi' AND
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
- Endpoint: [https://graph.flair.dev/](https://graph.flair.dev/)
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
        entities t ON t.namespace = 'lifi' AND t.entityType = 'Token' AND t.chainId = f.chainId AND t.tokenAddress = f.token
      WHERE
        f.namespace = 'lifi' AND
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
- Endpoint: [https://graph.flair.dev/](https://graph.flair.dev/)
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
              namespace = 'lifi'
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
- Endpoint: [https://graph.flair.dev/](https://graph.flair.dev/)
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
        namespace = 'lifi'
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
- Endpoint: [https://graph.flair.dev/](https://graph.flair.dev/)
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
        namespace = 'lifi'
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
- Endpoint: [https://graph.flair.dev/](https://graph.flair.dev/)
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
        namespace = 'lifi' AND feeAmount is NOT NULL AND feeAmountInUsd IS NULL
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
