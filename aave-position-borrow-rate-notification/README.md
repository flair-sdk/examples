# Track and notify Aave position total borrows and borrow rate change per block

This repository provides scripts, processors and aggregations to index and notify cumulative metrics, such as totalBorrows, and aggregations, such as borrow rate change, for Aave positions (v2 and v3). The solution is designed to gather relevant data and send notifications for informed decision-making based on the aggregated metrics.

## Features
* **Cumulative Metrics Indexing:** The solution captures and indexes cumulative metrics, including but not limited to totalBorrows, associated with Aave positions, <b>per block</b>.

* **Aggregations:** Aggregated metrics, such as borrow rate change, are computed to provide a comprehensive view of the dynamics within the Aave protocol.

* **Notification:** Notifications are sent to any remote endpoint (e.g. Zapier webhook) to enable real-time awareness and response to changes in the Aave positions.

* **Database:** All the historical and real-time new data can be written to your own database (Postgres, MongoDB, DynamoDB, etc.)


## Table of Contents

- [🏁 Getting Started](#getting-started)
- [💎 Usage](#usage)
- [🤔 FAQ](#faq)

## Getting Started

1️⃣ Clone this repo:

```bash
git clone https://github.com/flair-sdk/examples.git examples
cd aave-position-borrow-rate-notification
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

Set a globally unique namespace in each config file (recommended to use `{ORG_NAME}-{ENV}`; e.g `aave-position-borrow-rate-notification-dev` or `aave-position-borrow-rate-notification-prod`) and then run:

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
5️⃣ Backfill block ranges or certain time interval:

you can backfill for a specific block number, if you have certain events you wanna test with:

```bash
pnpm flair backfill --chain 1 -b 17998797 --emit evm-blocks
```

Or backfill for the recent data in the last X minutes:

```bash
pnpm flair backfill --chain 1 --min-timestamp="5 mins ago" -d backward --emit evm-blocks
```

<br />
6️⃣ Look at the logs:

```bash
pnpm flair logs --full -tag Level=warn
pnpm flair logs --full -tag ProcessorId=aave-positions
pnpm flair logs --full -tag ProcessorId=aave-positions --watch
```

<br />
7️⃣ Explore the data in playground:
<br />

Visit the [playground](https://api.flair.build) and run the following query in Examples section.

## Examples

#### Query indexed entity types

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
        namespace = 'aave-position-borrow-rate-notification-dev'
    """
  ) {
    stats {
      elapsedMs
    }
    rows
  }
}
```

#### Visaulize indexed data via Grafana

[Dashboard Link](https://grafana.flair.build/public-dashboards/03189ef9b57f4167bcc16bc51a21b651?orgId=1)

![grafana](https://i.imgur.com/kwZK9yO.png)

Note: Grafana feature is in beta mode. Reach out to our [engineers](https://docs.flair.dev/talk-to-an-engineer) for access.

#### Notify changes in real-time

Configure [any data or aggregation](https://github.com/flair-sdk/examples/blob/main/aave-position-borrow-rate-notification/src/aggregation/aave-notifications/input.sql) and get [notification via zapier webhooks (e.g discord, slack, email, etc.)](https://github.com/flair-sdk/examples/blob/main/aave-position-borrow-rate-notification/src/aggregation/aave-notifications/handler.ts)

![notification](https://i.imgur.com/T4UUz83.png)

## FAQ

**Q:** How do I enable/disable real-time ingestion for indexer? <br />
**A:** For each indexer defined in `config.json`, you can enable/disable it via the `enabled: true/false` flag. Remember to run `pnpm generate-and-deploy` for the changes to apply on the cluster. <br/><br />

**Q:** How can this scale to many more positions? <br />
**A:** For up to 100 positions the current approach can work, for up to 10k positions you can take advantage of the scheduled worker feature, and for 1m+ positions you need to change the approach instead of fetching data for each position, index the Aave protocol and use the aggregations feature of Flair. Reach out to our team if you need to scale this solution. <br/><br />


