SELECT 
    chainId, contractAddress, owner,
    MAX(horizon) as highestHorizon,
    SUM(IF(entityType = 'Deposit', 1, 0)) as totalDeposits,
    SUM(IF(entityType = 'Withdraw', 1, 0)) as totalWithdraws,
    TRY_CAST( 
        ( 
            SUM(IF(entityType = 'Deposit', TRY_CAST(shares as u256), TRY_CAST(0 as u256))) 
            - SUM(IF(entityType = 'Withdraw', TRY_CAST(shares as u256), TRY_CAST(0 as u256))) 
        ) as string
    ) as totalShares
FROM entities
WHERE 
    namespace = 'fuji-finance' AND (
        entityType = 'Deposit' OR entityType = 'Withdraw'
    )
GROUP BY
    chainId, contractAddress, owner
ORDER BY totalShares DESC
