import { Entity, EventHandlerInput, database } from "flair-sdk";

export async function upsertEvent<T extends Entity>(
  event: EventHandlerInput,
  extraData: Partial<T> = {}
) {
  if (!event.parsed.name) {
    throw new Error(
      `Cannot upsert because event.parsed.name is missing: ${JSON.stringify(
        event.parsed
      )}`
    );
  }

  await database.upsert<T>({
    // Entity type is used to group entities together.
    // Here we're creating 1 entity per event (Transfer, Borrow, Approval, etc),
    // based on either entityName defined in the ABI JSON or exact event name.
    entityType: event.parsed.name,

    // Unique ID for this entity.
    //
    // Some useful tips:
    // - chainId makes sure if potentially same tx has happened on different chains it will be stored separately.
    // - hash and localIndex make sure this event is stored uniquely.
    // - hash also makes sure with potential reorgs we don't store same event twice.
    // - logIndex also makes sure if such event has happened multiple times in same tx it will be stored separately.
    entityId: `${event.chainId}-${event.txHash}-${event.log.localIndex}`,

    // Horizon helps with chronological ordering of events and handling re-orgs,
    // This field automatically populates block number and log index.
    horizon: event.horizon,

    // You can store any data you want, even every single entity of the same type can have different fields.
    // Must not include "entityId" field as it's already defined above.
    chainId: event.chainId,
    contractAddress: event.log.address,
    blockTimestamp: event.blockTimestamp,

    txHash: event.txHash,

    // Save all event args as-is
    ...event.parsed.args,

    // Save incoming data as-is
    ...(extraData as any),
  });

  return true;
}

export async function throttledPromiseAll(
  promises: (() => Promise<any>)[],
  concurrency = 10
) {
  const results: any[] = [];
  for (const batch of chunk(promises, concurrency)) {
    results.push(...(await Promise.all(batch.map((p) => p()))));
  }
  return results;
}

function chunk(array: any[], size: number) {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, index) =>
    array.slice(index * size, index * size + size)
  );
}
