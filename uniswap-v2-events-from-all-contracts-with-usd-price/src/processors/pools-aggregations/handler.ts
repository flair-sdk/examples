import { database } from 'flair-sdk';


export async function handleInput({ data }) {
  if (!data || !data.poolId || !data.range) {
      throw new Error(
        `Skipping processing pool, missing poolId and/or range: ${JSON.stringify(
          { data }
        )}`
      );
    }

    const { poolId, range, volumeUsd } = data;

    await database.upsert({
      entityType: "Pool",
      entityId: poolId,
      data: {
        [`${range}VolumeUsd`]: volumeUsd,
      },
    });

    return true;
};
