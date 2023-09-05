export async function tryCallOrNull(contract, method, args) {
  try {
    return await contract[method](...args);
  } catch (e) {
    console.log(
      `Failed tryCallOrNull: ${e?.message || e?.toString()} ${e.stack}`,
    );
    return null;
  }
}
