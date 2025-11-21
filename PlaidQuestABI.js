// PlaidQuest contract ABI (ESM export)
export default [
  {
    "inputs": [
      { "internalType": "address", "name": "_oracle", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "questId", "type": "string" },
      { "indexed": false, "internalType": "bool", "name": "completed", "type": "bool" },
      { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "details", "type": "string" }
    ],
    "name": "QuestCompleted",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" },
      { "internalType": "string", "name": "questId", "type": "string" },
      { "internalType": "bool", "name": "completed", "type": "bool" },
      { "internalType": "uint256", "name": "value", "type": "uint256" },
      { "internalType": "string", "name": "details", "type": "string" }
    ],
    "name": "fulfillQuest",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "oracle",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "userId", "type": "string" }
    ],
    "name": "requestBalance",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" },
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "name": "userQuestResults",
    "outputs": [
      { "internalType": "bool", "name": "completed", "type": "bool" },
      { "internalType": "uint256", "name": "value", "type": "uint256" },
      { "internalType": "string", "name": "details", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
