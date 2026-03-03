// Hardhat Local Network Configuration
export const CHAIN_ID = 31337; // Hardhat
export const CHAIN_ID_HEX = "0x7a69";
export const RPC_URL = process.env.REACT_APP_RPC_URL || "http://127.0.0.1:8545";

export const PROPERTY_TOKEN_ADDRESS =
  process.env.REACT_APP_PROPERTY_TOKEN_ADDRESS || "";

export const NETWORK_CONFIG = {
  chainId: CHAIN_ID_HEX,
  chainName: "Hardhat Local",
  nativeCurrency: {
    name: "Hardhat ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: [RPC_URL],
  blockExplorerUrls: [],
};
