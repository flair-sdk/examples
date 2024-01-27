-- Set the execution runtime mode to BATCH
SET 'execution.runtime-mode' = 'BATCH';

-- Create source table
CREATE TABLE aave_positions_store (
    `entityId` STRING,
    `blockTimestamp` BIGINT,
    `positionAddress` STRING,
    `variableDetBalance` STRING,
    PRIMARY KEY (`entityId`) NOT ENFORCED
) PARTITIONED BY (`entityId`) WITH (
    'connector' = 'database',
    'mode' = 'read',
    'namespace' = '{{ namespace }}',
    'entity-type' = 'AavePositionSnapshot'
);

-- Create sink table
CREATE TABLE aave_positions_sink (
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
    'mode' = 'write',
    'namespace' = '{{ namespace }}',
    'entity-type' = 'AavePositionSnapshot'
);

-- Create view for reusability
CREATE VIEW aave_positions_view AS
SELECT
    *,
    CAST(`variableDetBalance` AS DOUBLE) AS `currentVariableDebtBalance`,
    LAG(CAST(`variableDetBalance` AS DOUBLE)) OVER (PARTITION BY `positionAddress` ORDER BY `blockTimestamp`) AS `previousVariableDebtBalance`
FROM
    aave_positions_store;

-- Insert into sink table with new variables
INSERT INTO
    aave_positions_sink
SELECT
    `entityId`,
    `blockTimestamp`,
    `positionAddress`,
    `variableDetBalance`,
    CASE
        WHEN a.`previousVariableDebtBalance` IS NULL
        THEN 0
        WHEN a.`currentVariableDebtBalance` < a.`previousVariableDebtBalance`
        THEN -((a.`currentVariableDebtBalance` - a.`previousVariableDebtBalance`) / a.`currentVariableDebtBalance`) * 100 * (24 * 365)
        ELSE ((a.`currentVariableDebtBalance` - a.`previousVariableDebtBalance`) / a.`currentVariableDebtBalance`) * 100 * (24 * 365)
    END,
    `currentVariableDebtBalance`,
    `previousVariableDebtBalance`
FROM
    aave_positions_view a;