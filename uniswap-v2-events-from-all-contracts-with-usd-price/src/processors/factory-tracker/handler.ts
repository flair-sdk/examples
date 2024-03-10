import { EventHandlerInput, graph } from 'flair-sdk';
import { persistPool } from '../../functions/pool';

export async function processEvent(event: EventHandlerInput) {
  const chainId = event.chainId;

  const poolAddress = event.parsed?.args?.pair.toString();

  if (!poolAddress) {
    console.warn(
      `Skipping processing event, no pair address found: ${JSON.stringify(
        event?.parsed?.args,
      )}`,
    );
    return false;
  }

  await graph.run(`
    mutation {
        upsertContractsToFilterGroup(
            cluster: "${process.env.CLUSTER}",
            chainId: ${chainId},
            contractAddresses: ["${poolAddress.toString()}"],
            groupId: "addresses"
        ) {
          groupId
        }
    }
  `);

  // If you need to upsert a custom entity (e.g. Pool, Collection, etc) you can do it here
  await persistPool(event);

  if (!event.backfill) {
    // Manually trigger backfill for creation block to ensure events in the same block as contract creation are indexed
    const backfillMutation = `
      mutation {
          backfillEvents(
              tagKey: "factory"
              cluster: "${process.env.CLUSTER}"
              chainId: ${event.chainId}
              startBlockNumber: "${event.blockNumber}"
              endBlockNumber: "${event.blockNumber}"
              contractAddresses: ["${poolAddress.toString()}"]
              skipCaching: true
          ) {
              id
              request
              orchestrationState
              orchestrationError
          }
      }
    `;

    await graph.run(backfillMutation);
  }
};
