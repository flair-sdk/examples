import { EventHandlerInput } from 'flair-sdk';

import { EMPTY_ADDRESS } from '../../../constants';
import { _lookupAddress, persistDomain } from '../../functions/domain';


async function handleReverseClaimed(event: EventHandlerInput) { 
  
  const address = event.parsed.args?.addr;
  const node = event.parsed.args?.node;
  if (node == EMPTY_ADDRESS) { 
    return;
  }

  const name = await _lookupAddress(event, address);

  const extraData = {
    node,
    name,
    address,
  }

  if (name && address !== EMPTY_ADDRESS) {
      await persistDomain(event, extraData);
  }
}

export async function processEvent(event: EventHandlerInput) {
  if (event.parsed.name === "ReverseClaimed") {
        await handleReverseClaimed(event);
    }
};