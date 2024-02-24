CREATE TABLE Position (
    entityId VARCHAR(255) PRIMARY KEY,
    entityUpdatedAt BIGINT,
    horizon VARCHAR(255),
    blockNumber BIGINT,
    blockTimestamp BIGINT,
    forkIndex BIGINT,
    transactionIndex BIGINT,
    logIndex BIGINT,
    localIndex BIGINT,
    borrowRate INT,
    positionAddress VARCHAR(255),
    healthFactor VARCHAR(255),
    isInIsolationMode VARCHAR(255),
    totalCollateralUSD VARCHAR(255),
    totalBorrowsUSD VARCHAR(255),
    netWorthUSD VARCHAR(255)
);

CREATE INDEX idx_blockNumber ON Position (blockNumber);
CREATE INDEX idx_blockNUmber ON Position (blockTimestamp);