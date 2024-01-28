SET 'execution.runtime-mode' = 'STREAMING';

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
    'connector' = 'stream',
    'mode' = 'cdc',
    'namespace' = '{{ namespace }}',
    'entity-type' = 'AavePositionSnapshot',
    'scan.startup.mode' = 'timestamp',
    'scan.startup.timestamp-millis' = '{{ chrono("now") }}'
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
   'collection' = 'transactions'
);

INSERT INTO data_sink SELECT * FROM data_store;