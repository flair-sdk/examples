import { EventHandlerInput } from 'flair-sdk';

import { ETH_NODE, EMPTY_ADDRESS } from '../../../constants';
import { makeNode, nameAndAddressByHash, persistDomain } from '../../functions/domain';
import { uint256ToByteArray, byteArrayFromHex } from '../../functions/common';


async function handleNameRegistered(event: EventHandlerInput) { 
  const rootNode = byteArrayFromHex(ETH_NODE);
  
  const label = event.parsed.args?.id
    ? uint256ToByteArray(event.parsed.args?.id.toHexString())
    : event.parsed.args?.label;
  
  const node = await makeNode(rootNode, label);
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

export const processEvent = async (event: EventHandlerInput) => {
  if (event.parsed.name === "NameRegistered") {
    await handleNameRegistered(event);
  };
}