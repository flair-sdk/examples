import { EventHandlerInput } from 'flair-sdk';

import { EMPTY_ADDRESS } from '../../../constants';
import { nameAndAddressByHash, persistDomain } from '../../functions/domain';


async function handleNameChanged(event: EventHandlerInput) { 
  
  const node = event.parsed.args?.node;
  if (node == EMPTY_ADDRESS) { 
    return;
  }

  const {name,address} = await nameAndAddressByHash(event, node);

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
  if (event.parsed.name === "NameChanged") {
        await handleNameChanged(event);
    }
};