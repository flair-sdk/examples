exports.processEvent = function (event, callback) {
  (async () => {
    const chainId = event.chainId;
    const vaultAddress = event?.parsed?.args?.vault;

    if (!vaultAddress) {
      console.log(
        `Skipping processing event, no vault address: ${JSON.stringify(
          event?.parsed?.args,
        )}`,
      );
      return false;
    }

    const response = await graph.run(`
        mutation {
            upsertContractsToFilterGroup(
                chainId: ${chainId},
                contractAddresses: ["${vaultAddress}"],
            ) {
                groupId
            }
        }
    `);

    console.log(
      `Tracked newly deployed vault: ${JSON.stringify({
        vaultAddress,
        response,
      })}`,
    );

    return true;
  })()
    .then((res) => callback(res, null))
    .catch((err) => callback(null, err));
};
