SET 'execution.runtime-mode' = 'STREAMING';

CREATE TABLE source_position (
    `entityId` STRING,
    `entityUpdatedAt` BIGINT,
    `horizon` STRING,
    `blockNumber` BIGINT,
    `blockTimestamp` BIGINT,
    `forkIndex` BIGINT,
    `transactionIndex` BIGINT,
    `logIndex` BIGINT,
    `localIndex` BIGINT,
    `borrowRate` INT,
    `positionAddress` STRING,
    `healthFactor` STRING,
    `isInIsolationMode` STRING,
    `totalCollateralUSD` STRING,
    `totalBorrowsUSD` STRING,
    `netWorthUSD` STRING,
    PRIMARY KEY (`entityId`) NOT ENFORCED
) PARTITIONED BY (`entityId`) WITH (
    'connector' = 'stream',
    'mode' = 'cdc',
    'namespace' = '{{ namespace }}',
    'entity-type' = 'Position',
    'scan.startup.mode' = 'timestamp',
    'scan.startup.timestamp-millis' = '{{ chrono("2 hours ago") * 1000 }}'
);

CREATE TABLE sink_position (
    `entityId` STRING,
    `entityUpdatedAt` BIGINT,
    `horizon` STRING,
    `blockNumber` BIGINT,
    `blockTimestamp` BIGINT,
    `forkIndex` BIGINT,
    `transactionIndex` BIGINT,
    `logIndex` BIGINT,
    `localIndex` BIGINT,
    `borrowRate` INT,
    `positionAddress` STRING,
    `healthFactor` STRING,
    `isInIsolationMode` STRING,
    `totalCollateralUSD` STRING,
    `totalBorrowsUSD` STRING,
    `netWorthUSD` STRING,
    PRIMARY KEY (`entityId`) NOT ENFORCED
) WITH (
    'connector' = 'mongodb',
    'uri' = '{{ secret("mongodb.uri") }}',
    'database' = 'MY_DB_NAME_HERE'
    'collection' = 'MY_COLLECTION_NAME_HERE',
    'write.batch-size' = '100',
    'write.flush.interval' = '60s'
);

INSERT INTO sink_position SELECT * FROM source_position WHERE entityId IS NOT NULL;