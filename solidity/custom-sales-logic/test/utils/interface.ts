import { ethers } from 'ethers';
import hre from 'hardhat';

export async function getInterfaceIDByContractName(name: string) {
  const contractInterface = (await hre.ethers.getContract(name)).interface;
  const functions: string[] = Object.keys(contractInterface.functions);

  let interfaceID: ethers.BigNumber = ethers.constants.Zero;
  for (let i = 0; i < functions.length; i++) {
    interfaceID = interfaceID.xor(contractInterface.getSighash(functions[i]));
  }

  return interfaceID;
}

export function getInterfaceID(contractInterface: ethers.utils.Interface) {
  let interfaceID: ethers.BigNumber = ethers.constants.Zero;
  const functions: string[] = Object.keys(contractInterface.functions);

  for (let i = 0; i < functions.length; i++) {
    interfaceID = interfaceID.xor(contractInterface.getSighash(functions[i]));
  }

  return interfaceID;
}
