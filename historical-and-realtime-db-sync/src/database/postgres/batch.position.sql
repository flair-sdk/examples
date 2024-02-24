SET 'execution.runtime-mode' = 'BATCH';

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
    'connector' = 'database',
    'mode' = 'read',
    'namespace' = '{{ namespace }}',
    'entity-type' = 'Position',
    -- 'scan.partition.num' = '10',
    -- 'scan.partition.column' = 'blockTimestamp',
    -- 'scan.partition.lower-bound' = '{{ chrono(fromTimestamp | default("01-01-2024 00:00 UTC")) }}',
    -- 'scan.partition.upper-bound' = '{{ chrono(toTimestamp | default("now")) }}'
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
   'connector' = 'jdbc',
    'url' = 'jdbc:postgresql://DB_HOST_HERE:PORT_HERE/DB_NAME_HERE',
    'table-name' = 'Position',
    'username' = 'USERNAME_HERE',
    'password' = '{{ secret("postgres.password") }}',
    'sink.max-retries' = '10',
    'sink.buffer-flush.interval' = '10s'
);

INSERT INTO sink_position SELECT * FROM source_position WHERE entityId IS NOT NULL;