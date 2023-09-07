const promises: Record<string, Promise<any>> = {};

/**
 * A utility that helps when multiple events are trying to execute the exact same function.
 * Multiplexing helps run only 1 promise for all of those attempts, saving on resources used and writes to the database.
 *
 * @param {string} keyId A unique identifier for the promise
 * @param {number} ttl How long (in milliseconds) result must be kept in memory cache
 * @param {Function} fn The actual code to run
 *
 * @returns {any}
 */
export async function multiplex<T>(
  keyId: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  if (!promises[keyId]) {
    promises[keyId] = fn();
  }

  // Wait for a while before deleting the promise
  setTimeout(async () => {
    //@ts-ignore: we don't need to await this value here
    if (promises[keyId]) {
      // Awaiting here helps with potential race conditions
      await promises[keyId];
      delete promises[keyId];
    }
  }, ttl);

  try {
    return await promises[keyId];
  } catch (e) {
    delete promises[keyId];
    throw e;
  }
}
