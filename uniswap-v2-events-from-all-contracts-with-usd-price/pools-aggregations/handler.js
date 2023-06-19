exports.handleInput = function ({ data }, callback) {
  (async () => {
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
  })()
    .then((res) => callback(res, null))
    .catch((err) => callback(null, err));
};
