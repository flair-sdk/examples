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