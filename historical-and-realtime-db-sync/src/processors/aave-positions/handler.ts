import { ethers } from 'ethers';
import { blockchain, database } from 'flair-sdk';
import * as markets from '@bgd-labs/aave-address-book';
import { UiPoolDataProvider } from '@aave/contract-helpers';
import { formatUserSummary, formatReserves } from '@aave/math-utils';

// sample aave position addresses
const AAVE_POSITIONS_ADDRESSES = [
  '0xbcf15a9f3f935939aade66056dae3c1ec468547a',
];

export async function processBlock({ block, horizon }: any) {

  // considers every 300th block (at every hour)
  if (block.number % 300 !== 0) {
    console.log(`Skipping block ${block.number} as it is not at a sharp hour`);
    return;
  }

  for (let positionAddress of AAVE_POSITIONS_ADDRESSES) {
    const provider = await blockchain.getProvider(block.chainId);
    
    const poolDataProviderContract = new UiPoolDataProvider({
      uiPoolDataProviderAddress: markets.AaveV3Ethereum.UI_POOL_DATA_PROVIDER,
      provider: provider.cached().withBlockTag(block.number),
      chainId: block.chainId,
    });

    const reserves = await poolDataProviderContract.getReservesHumanized({
      lendingPoolAddressProvider: markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER
    });

    const userReserves = await poolDataProviderContract.getUserReservesHumanized({
      lendingPoolAddressProvider: markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
      user: positionAddress,
    }) as any;

    const reservesArray = reserves.reservesData as any;
    const userReservesArray = userReserves.userReserves as any;
    const baseCurrencyData = reserves.baseCurrencyData;
    const currentTimestamp = block.timestamp;

    const formattedPoolReserves = formatReserves({
      currentTimestamp: currentTimestamp,
      reserves: reservesArray,
      marketReferenceCurrencyDecimals:
        baseCurrencyData.marketReferenceCurrencyDecimals,
      marketReferencePriceInUsd: baseCurrencyData.marketReferenceCurrencyPriceInUsd,
    });

    let userSummary: any = formatUserSummary({
      currentTimestamp: currentTimestamp,
      marketReferencePriceInUsd: baseCurrencyData.marketReferenceCurrencyPriceInUsd,
      marketReferenceCurrencyDecimals:
        baseCurrencyData.marketReferenceCurrencyDecimals,
      userReserves: userReservesArray,
      formattedReserves: formattedPoolReserves,
      userEmodeCategoryId: userReserves.userEmodeCategoryId,
    });

    const { healthFactor, isInIsolationMode, totalCollateralUSD, totalBorrowsUSD, netWorthUSD } = userSummary;
    
    await database.upsert({
      entityType: 'Position',
      entityId: `${block.chainId}-${positionAddress}-${block.number}`,
      blockTimestamp: block.timestamp,
      horizon,
      positionAddress,
      healthFactor,
      isInIsolationMode,
      totalCollateralUSD,
      totalBorrowsUSD,
      netWorthUSD
    });
  }
};