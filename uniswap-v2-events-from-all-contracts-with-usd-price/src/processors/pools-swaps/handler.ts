import { blockchain, EventHandlerInput } from 'flair-sdk';

import { persistEvent, persistPool } from '../../functions/pool';


export async function processEvent(event: EventHandlerInput) {
    const provider = await blockchain.getProvider(event.chainId);
    const transaction = await provider.cached().getTransactionReceipt(event.txHash);

    const { token0, token1 } = await persistPool(event);
    await persistEvent(event, transaction, token0, token1);

    return true;
};
