import { TransactionHandlerInput, database } from "flair-sdk";

export async function processTransaction({
  transaction,
  horizon,
}: TransactionHandlerInput) {
  await database.upsert({
    // Entity type is used to group entities together,
    // also will be used when querying your data.
    entityType: "Transaction",

    // Unique ID for this entity.
    //
    // Some useful tips:
    // - chainId makes sure if potentially same tx has happened on different chains it will be stored separately.
    // - hash and localIndex make sure this tx is stored uniquely (including internal transactions).
    // - localIndex will 0 for top-level transaction and will start from 1...n for internal transactions.
    entityId: `${transaction.chainId}-${transaction.hash}-${transaction.localIndex}`,

    // Horizon helps with handling re-orgs and chronological ordering of entities.
    horizon,

    // You can store any data you want.
    // Must not include "entityId" field as it's already defined above.
    ...transaction,
  });
}
