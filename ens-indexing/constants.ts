export const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';
export const REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
export const REGISTRY_ADDRESS_OLD = '0x314159265dd8dbb310642f98f50c066173c1259b';
export const REVERSE_RECORDS_ADDRESS = '0x3671aE578E63FdF66ad4F3E12CC0c0d71Ac7510C';

export const ETH_NODE =
  "93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae";

export const REGISTRY_ABI = [
	"function resolver(bytes32) view returns (address)",
	"function recordExists(bytes32) view returns (bool)",
];

export const REVERSE_RECORDS_ABI = [
	"function getNames(address[]) view returns (string[])",
];

export const RESOLVER_ABI = [
	"function addr(bytes32) view returns (address)",
];
