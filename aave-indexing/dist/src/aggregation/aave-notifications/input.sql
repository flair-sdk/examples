SELECT
    q1.positionAddress,
    q1.borrowRateLast24H,
    q2.borrowRateLast48H
FROM (
    -- Borrow rate for the last 24 hours
    SELECT
        positionAddress,
        AVG(CAST(borrowRate AS DOUBLE)) as borrowRateLast24H
    FROM
        entities
    WHERE
        namespace = 'aave-indexing-example-dev' AND entityType = 'AavePositionSnapshot'
        AND blockTimestamp BETWEEN
            UNIX_SECONDS(CURRENT_TIMESTAMP() - INTERVAL '24' HOUR)  
            AND UNIX_SECONDS(CURRENT_TIMESTAMP())
    GROUP BY positionAddress
) q1

LEFT JOIN (
    -- Borrow rate for the last 48 hours
    SELECT
        positionAddress,
        AVG(CAST(borrowRate AS DOUBLE)) as borrowRateLast48H
    FROM
        entities
    WHERE
        namespace = 'aave-indexing-example-dev' AND entityType = 'AavePositionSnapshot'
        AND blockTimestamp BETWEEN
            UNIX_SECONDS(CURRENT_TIMESTAMP() - INTERVAL '48' HOUR)  
            AND UNIX_SECONDS(CURRENT_TIMESTAMP())
    GROUP BY positionAddress
) q2

ON q1.positionAddress = q2.positionAddress;