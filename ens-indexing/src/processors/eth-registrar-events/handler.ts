import { EventHandlerInput } from 'flair-sdk';

import { ETH_NODE } from '../../../constants';
import { getOrCreateAccount } from '../../functions/account';
import { makeNode, nameAndAddressByHash, persistDomain } from '../../functions/domain';
import { upsertEvent, uint256ToByteArray, byteArrayFromHex } from '../../functions/common';


async function handleNameRegistered(event: EventHandlerInput) { 
  const rootNode = byteArrayFromHex(ETH_NODE);
  
  const label = event.parsed.args?.id
    ? uint256ToByteArray(event.parsed.args?.id.toHexString())
    : event.parsed.args?.label;

  const node = await makeNode(rootNode, label);
  const {name,address} = await nameAndAddressByHash(event, node);

  const owner = event.parsed.args?.owner;

  const extraData = {
    node,
    name,
    address,
    owner,
  }

  await persistDomain(event, extraData);
}

export const processEvent = async (event: EventHandlerInput) => {
  if (event.parsed.name === "NameRegistered") {
    await upsertEvent(event);
    await getOrCreateAccount(event.chainId, event.parsed.args?.owner);
    await handleNameRegistered(event);
  };
}