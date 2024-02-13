### Historical and Real-time Syncing

DB Syncing involves creating a table in DB (e.g Postgres, MySQL, MongoDB, etc.) to store the data and then setting up Flink SQL scripts for both historical and real-time syncing. For more info, check [this link](https://docs.flair.dev/reference/database).

<details>
<summary><b>1) Preparation</b></summary>

**Note:** We are going to use **"AMMBundleClosed"** as a sample Entity in this guide. <br />
**Note:** Make sure you have access to a database credentials where you want to store the indexed data.

### Setting secrets for DB credentials
```bash
pnpm flair auth
pnpm flair secret set -n postgres.password -v 'PASSWORD'
```

### Create DB Table
Execute the following SQL query in your database to create a table to store the **"AMMBundleClosed"** entity data:

```sql
-- ### AMMBundleClosed Table ###
CREATE TABLE AMMBundleClosed (
    `entityId` VARCHAR(255),
    `entityUpdatedAt` BIGINT,
    `chainId` INT,
    `contractAddress` VARCHAR(255),
    `horizon` VARCHAR(255),
    `blockNumber` BIGINT,
    `blockTimestamp` BIGINT,
    `forkIndex` INT,
    `transactionIndex` INT,
    `logIndex` INT,
    `localIndex` INT,
    `txHash` VARCHAR(255),
    `txTo` VARCHAR(255),
    `txFrom` VARCHAR(255),
    `assetId` VARCHAR(255),
    `removed` BOOLEAN,
    `resolver` VARCHAR(255),
    PRIMARY KEY (`entityId`),
    INDEX idx_chainId (`chainId`), -- add as many as needed indexes as necessary
);
```

**Note:** the above query is for creating a table in MySQL. Remember that depending on your type of DB, you might need to use a slightly different query.
</details>

<details>
<summary><b>2) Enable real-time sync</b></summary>

For real-time syncing, create a Flink SQL script (e.g `realtime-sync.sql`). This will push incoming namespace data to the destination DB, **in real-time**.

**Note:** A good practice is to have all real-time syncs in one file, but separate historical syncs into separate files as usually they take longer to sync.

```sql
CREATE TABLE source_AMMBundleClosed (
    `entityId` STRING,
    `entityUpdatedAt` BIGINT,
    `chainId` INT,
    `contractAddress` STRING,
    `horizon` STRING,
    `blockNumber` BIGINT,
    `blockTimestamp` BIGINT,
    `forkIndex` INT,
    `transactionIndex` INT,
    `logIndex` INT,
    `localIndex` INT,
    `txHash` STRING,
    `txTo` STRING,
    `txFrom` STRING,
    `assetId` STRING,
    `removed` BOOLEAN,
    `resolver` STRING,
    PRIMARY KEY (`entityId`) NOT ENFORCED
) WITH (
    'connector' = 'stream',
    'mode' = 'cdc',
    'namespace' = '{{ namespace }}',
    'entity-type' = 'AMMBundleClosed',
    'scan.startup.mode' = 'timestamp',
    'scan.startup.timestamp-millis' = '{{ chrono("2 hours ago") * 1000 }}'
);

CREATE TABLE sink_AMMBundleClosed (
    `entityId` STRING,
    `entityUpdatedAt` BIGINT,
    `chainId` INT,
    `contractAddress` STRING,
    `horizon` STRING,
    `blockNumber` BIGINT,
    `blockTimestamp` BIGINT,
    `forkIndex` INT,
    `transactionIndex` INT,
    `logIndex` INT,
    `localIndex` INT,
    `txHash` STRING,
    `txTo` STRING,
    `txFrom` STRING,
    `assetId` STRING,
    `removed` BOOLEAN,
    `resolver` STRING,
    PRIMARY KEY (`entityId`) NOT ENFORCED
) WITH (
    'connector' = 'jdbc',
    'url' = 'jdbc:postgressql://HOST:PORT/DB',
    'table-name' = 'AMMBundleClosed',
    'username' = 'USERNAME',
    'password' = '{{ secret("postgres.password") }}',
    'sink.max-retries' = '10',
    'sink.buffer-flush.interval' = '1s'
);

INSERT INTO sink_AMMBundleClosed SELECT * FROM source_AMMBundleClosed WHERE entityId IS NOT NULL;
```

After this, make sure you have the real-time enricher setup in `manifest.yaml`:

```yaml
- id: database-streaming-sync
    engine: flink
    parallelism: 4
    inputSql: ./src/database/streaming.sql
```

After this, running a simple `pnpm deploy:prod` should setup the real-time syncing.

**Note:** A good practice is to enable **"real-time syncing"** enabled before **"historical syncing"**. This ensures that no data is missed.
</details>

<details>
<summary><b>3) Historical data sync (one-off)</b></summary>

For one-off historical syncing, create a Flink SQL script (e.g `historical-sync-amm.sql`). This will push existing namespace data to the destination DB.

```sql
CREATE TABLE source_AMMBundleClosed (
    `entityId` STRING,
    `entityUpdatedAt` BIGINT,
    `chainId` INT,
    `contractAddress` STRING,
    `horizon` STRING,
    `blockNumber` BIGINT,
    `blockTimestamp` BIGINT,
    `forkIndex` INT,
    `transactionIndex` INT,
    `logIndex` INT,
    `localIndex` INT,
    `txHash` STRING,
    `txTo` STRING,
    `txFrom` STRING,
    `assetId` STRING,
    `removed` BOOLEAN,
    `resolver` STRING,
    PRIMARY KEY (`entityId`) NOT ENFORCED
) WITH (
    'connector' = 'database',
    'mode' = 'read',
    'namespace' = '{{ namespace }}',
    'entity-type' = 'AMMBundleClosed',
    -- NOTE: if you have a large dataset, you can use the below partitioning configs. 
    -- A good rule of thumb is to add 10 partition.num for every 1M row for your entity
    -- 'scan.partition.num' = '400',
    -- 'scan.partition.column' = 'blockTimestamp',
    -- 'scan.partition.lower-bound' = '{{ chrono(fromTimestamp | default("01-01-2021 00:00 UTC")) }}',
    -- 'scan.partition.upper-bound' = '{{ chrono(toTimestamp | default("now")) }}'
);

CREATE TABLE sink_AMMBundleClosed (
    `entityId` STRING,
    `entityUpdatedAt` BIGINT,
    `chainId` INT,
    `contractAddress` STRING,
    `horizon` STRING,
    `blockNumber` BIGINT,
    `blockTimestamp` BIGINT,
    `forkIndex` INT,
    `transactionIndex` INT,
    `logIndex` INT,
    `localIndex` INT,
    `txHash` STRING,
    `txTo` STRING,
    `txFrom` STRING,
    `assetId` STRING,
    `removed` BOOLEAN,
    `resolver` STRING,
    PRIMARY KEY (`entityId`) NOT ENFORCED
) WITH (
    'connector' = 'jdbc',
    'url' = 'jdbc:postgressql://HOST:PORT/DB',
    'table-name' = 'AMMBundleClosed',
    'username' = 'USERNAME',
    'password' = '{{ secret("postgres.password") }}',
    'sink.max-retries' = '10',
    'sink.buffer-flush.interval' = '10s'
);

INSERT INTO sink_AMMBundleClosed SELECT * FROM source_AMMBundleClosed WHERE entityId IS NOT NULL;
```

After this, make sure to update your `manifest.yaml` file with a new enricher:

```yaml
  - id: database-historical-sync-amm
    engine: flink
    inputSql: ./src/database/batch.amm.sql
```

and run this command in terminal. adjust the parallelism depending on how large your data is:

```bash
pnpm deploy:prod
pnpm flair enricher trigger database-historical-sync-amm -l DEBUG -o parallelism=16
```

Upon triggering this command, you should be able to monitor logs of enricher via the Flink job link shown in terminal or using `pnpm flair logs JobID`

</details>

<details>
<summary><b>Maintenance</b></summary>

### Partial Syncs

* For fixing data problems or db down times, run a time-bound sync

```bash
pnpm flair enricher trigger database-historical-sync-amm -o fromTimestamp='2 days ago' toTimestamp='1 hour ago'
```

or a full sync

```bash
pnpm flair backfill -c 1 -d backward --max-blocks=1000000
```

* **Note:** If processors logic is changed, you must do a `flair backfill` and that won't need a partial db sync as changes will be applied as they happen on the data.

* **Note:** Separate historical syncs on separate **"batch.sql"** files so it helps when doing partial syncs.

### Best Practices

* Avoid changing field data types on RDBMS databases and instead `CAST` the types in the `INSERT SELECT` statement
* Define all indexes and check the schema before syncing a huge table
</details>