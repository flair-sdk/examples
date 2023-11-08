# Indexing Starter Boilerplate

This repository contains boilerplate scripts, abis and schema for ENS indexing

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
5️⃣ Backfill for a specific block number, if you have certain events you wanna test with:

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
pnpm flair logs --full -tag ProcessorId=reverse-registrar-events
pnpm flair logs --full -tag ProcessorId=reverse-registrar-events --watch
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
                COUNT(*) as totalCount,
                entityType
            FROM
                entities
            WHERE
                namespace = 'ens-indexing-example'
            GROUP BY entityType
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

## TODO

- [ ] Reverse Registrar (PrimaryName<>Address Resolution)
  - [x] Track new Reverse Registrar with events (0xa58E81fe9b61B5c3fE2AFD33CF304c454AbFc7Cb)
  - [ ] Track Old Reverse Registrar with transaction tracing (0xa58E81fe9b61B5c3fE2AFD33CF304c454AbFc7Cb)
  - [ ] Track DNS Registrar (0x58774Bb8acD458A640aF0B88238369A167546ef2)

## FAQ

**Q:** How do I enable/disable real-time ingestion for indexer? <br />
**A:** For each indexer defined in `config.json`, you can enable/disable it via the `enabled: true/false` flag. Remember to run `pnpm deploy` for the changes to apply on the cluster. <br/><br />
