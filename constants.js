export const ASSET_HUB_RPC = "https://westend-asset-hub-eth-rpc.polkadot.io";
export const ASSET_HUB_WS = "wss://westend-asset-hub-rpc.polkadot.io:443";
export const RECIPIENT = "5Ggfb9LDwGQtimCkYr9ip737FxCvyL2ki6rmwXdn8wB5u5SZ";
export const WND_DECIMALS = 10 ** 12;
export const WND_SYMBOL = "WND";
export const PASSET_HUB_RPC = "https://testnet-passet-hub-eth-rpc.polkadot.io/";
export const PASSET_HUB_WS = "wss://passet-hub.polkadot.io";
export const PASSEO_SYMBOL = "PAS";
export const PASSEO_DECIMALS = 10 ** 10;
export const CONTRACT_ADDRESS = "0x94956d465f5E6434d6516Dd5A54B3AaA9d66170E";

// Storage contract ABI - A simple contract that stores and retrieves numbers
export const Storage_ABI = [
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "num",
          "type": "uint256"
        }
      ],
      "name": "store",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "retrieve",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
];