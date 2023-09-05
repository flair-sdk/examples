import { graph, EventHandlerInput } from 'flair-sdk';

export async function processEvent(event: EventHandlerInput) {
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
};
