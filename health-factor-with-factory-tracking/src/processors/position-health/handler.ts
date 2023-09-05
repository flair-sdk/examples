import { database, blockchain } from 'flair-sdk';

import { tryCallOrNull } from '../../functions/common';

export async function handleInput({ data }) {
  if (!data || !data.owner) {
      console.log(
        `Skipping processing item without owner: ${JSON.stringify(data)}`,
      );
      return false;
    }

    const contract = await blockchain.getContract(
      data.chainId,
      data.contractAddress,
      [
        'function getHealthFactor(address) view returns (uint256)',
        'function getLiquidationFactor(address) view returns (uint256)',
        'function balanceOfDebt(address) view returns (uint256)',
        'function balanceOfAsset(address) view returns (uint256)',
      ],
    );

    const provider = await blockchain.getProvider(data.chainId);

    await database.upsert({
      entityType: 'PositionHealth',
      entityId:
        `${data.chainId}-${data.contractAddress}-${data.owner}`.toLowerCase(),
      horizon: {
        blockNumber: await provider.getBlockNumber(),
      },
      data: {
        // Append aggregations from query such as totalDeposits, totalWithdraws, totalShares
        ...data,

        // Fetch on-chain data for this specific owner wallet address
        healthFactor: await tryCallOrNull(contract, 'getHealthFactor', [
          data.owner,
        ]),
        liquidationFactor: await tryCallOrNull(
          contract,
          'getLiquidationFactor',
          [data.owner],
        ),
        balanceOfDebt: await tryCallOrNull(contract, 'balanceOfDebt', [
          data.owner,
        ]),
        balanceOfAsset: await tryCallOrNull(contract, 'balanceOfAsset', [
          data.owner,
        ]),
      },
    });

    return true;
};
