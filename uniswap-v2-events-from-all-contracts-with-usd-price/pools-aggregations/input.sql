WITH

-- Last 1 Hour aggregations for each pool
last1HData AS (
    SELECT
        poolId, 
        'last1H' as range,
        SUM(amountUsd) as volumeUsd
    FROM
        entities
    WHERE
        namespace = 'my-awesome-swapper'
        AND entityType = 'Swap'
        AND poolId IS NOT NULL
        AND blockTimestamp >= UNIX_SECONDS(CURRENT_TIMESTAMP() - HOURS(1))
    GROUP BY poolId
),

-- Last 1 Day aggregations for each pool
last1DData AS (
    SELECT
        poolId,
        'last1D' as range,
        SUM(amountUsd) as volumeUsd
    FROM
        entities
    WHERE
        namespace = 'my-awesome-swapper'
        AND entityType = 'Swap'
        AND blockTimestamp >= UNIX_SECONDS(CURRENT_TIMESTAMP() - DAYS(1))
    GROUP BY poolId
),

-- Last 7 Days aggregations for each pool
last7DData AS (
    SELECT
        poolId,
        'last7D' as range,
        SUM(amountUsd) as volumeUsd
    FROM
        entities
    WHERE
        namespace = 'my-awesome-swapper'
        AND entityType = 'Swap'
        AND blockTimestamp >= UNIX_SECONDS(CURRENT_TIMESTAMP() - DAYS(7))
    GROUP BY poolId
),

-- Last 30 Days aggregations for each pool
last30DData AS (
    SELECT
        poolId,
        'last30D' as range,
        SUM(amountUsd) as volumeUsd
    FROM
        entities
    WHERE
        namespace = 'my-awesome-swapper'
        AND entityType = 'Swap'
        AND blockTimestamp >= UNIX_SECONDS(CURRENT_TIMESTAMP() - DAYS(30))
    GROUP BY poolId
),

-- Previous to last 1 Hour aggregations for each pool
prev1HData AS (
    SELECT
        poolId,
        SUM(amountUsd) as volumeUsd
    FROM
        entities
    WHERE
        namespace = 'my-awesome-swapper'
        AND entityType = 'Swap'
        AND poolId IS NOT NULL
        AND blockTimestamp < UNIX_SECONDS(CURRENT_TIMESTAMP() - HOURS(1))
        AND blockTimestamp >= UNIX_SECONDS(CURRENT_TIMESTAMP() - HOURS(2))
    GROUP BY poolId
),

-- Previous to last 1 Day aggregations for each pool
prev1DData AS (
    SELECT
        poolId,
        SUM(amountUsd) as volumeUsd
    FROM
        entities
    WHERE
        namespace = 'my-awesome-swapper'
        AND entityType = 'Swap'
        AND blockTimestamp < UNIX_SECONDS(CURRENT_TIMESTAMP() - DAYS(1))
        AND blockTimestamp >= UNIX_SECONDS(CURRENT_TIMESTAMP() - DAYS(2))
    GROUP BY poolId
),

-- Previous to last 7 Days aggregations for each pool
prev7DData AS (
    SELECT
        poolId,
        SUM(amountUsd) as volumeUsd
    FROM
        entities
    WHERE
        namespace = 'my-awesome-swapper'
        AND entityType = 'Swap'
        AND blockTimestamp < UNIX_SECONDS(CURRENT_TIMESTAMP() - DAYS(7))
        AND blockTimestamp >= UNIX_SECONDS(CURRENT_TIMESTAMP() - DAYS(7))
    GROUP BY poolId
),

-- Previous to last 30 Days aggregations for each pool
prev30DData AS (
    SELECT
        poolId,
        SUM(amountUsd) as volumeUsd
    FROM
        entities
    WHERE
        namespace = 'my-awesome-swapper'
        AND entityType = 'Swap'
        AND blockTimestamp < UNIX_SECONDS(CURRENT_TIMESTAMP() - DAYS(30))
        AND blockTimestamp >= UNIX_SECONDS(CURRENT_TIMESTAMP() - DAYS(60))
    GROUP BY poolId
)

--
-- Join all aggregations together with their previous values
--

-- Last 1 Hour aggregations for each pool
SELECT
    l.*,
    l.volumeUsd - p.volumeUsd as volumeChangeUsd
FROM last1HData l
LEFT JOIN prev1HData p ON p.poolId = l.poolId

-- Last 1 Day aggregations for each pool
UNION SELECT
    l.*,
    l.volumeUsd - p.volumeUsd as volumeChangeUsd
FROM last1DData l
LEFT JOIN prev1DData p ON p.poolId = l.poolId

-- Last 7 Day aggregations for each pool
UNION SELECT
    l.*,
    l.volumeUsd - p.volumeUsd as volumeChangeUsd
FROM last7DData l
LEFT JOIN prev7DData p ON p.poolId = l.poolId

-- Last 30 Day aggregations for each pool
UNION SELECT
    l.*,
    l.volumeUsd - p.volumeUsd as volumeChangeUsd
FROM last30DData l
LEFT JOIN prev30DData p ON p.poolId = l.poolId
