SET 'execution.runtime-mode' = 'BATCH';

CREATE TABLE data_store (
     `entityId` STRING,
    `blockTimestamp` BIGINT,
    `positionAddress` STRING,
    `variableDetBalance` STRING,
    `borrowRate` DOUBLE,
    `currentVariableDebtBalance` DOUBLE,
    `previousVariableDebtBalance` DOUBLE,
    PRIMARY KEY (`entityId`) NOT ENFORCED
) PARTITIONED BY (`entityId`) WITH (
    'connector' = 'database',
    'mode' = 'read',
    'namespace' = '{{ namespace }}',
    'entity-type' = 'AavePositionSnapshot',
    'scan.partition.num' = '10',
    'scan.partition.column' = 'blockTimestamp',
    'scan.partition.lower-bound' = '{{ chrono(fromTimestamp | default("01-01-2024 00:00 UTC")) }}',
    'scan.partition.upper-bound' = '{{ chrono(toTimestamp | default("now")) }}'
);

CREATE TABLE data_sink (
    `entityId` STRING,
    `blockTimestamp` BIGINT,
    `positionAddress` STRING,
    `variableDetBalance` STRING,
    `borrowRate` DOUBLE,
    `currentVariableDebtBalance` DOUBLE,
    `previousVariableDebtBalance` DOUBLE,
     PRIMARY KEY (`entityId`) NOT ENFORCED
) WITH (
   'connector' = 'postgres',
   'uri' = '{{ secret("prod.postgres.uri") }}',
   'database' = 'cluster0',
   'collection' = 'pools'
);

INSERT INTO transactions_sink SELECT * FROM transactions_store;