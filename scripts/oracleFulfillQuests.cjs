const { ethers } = import ('ethers');
import { ethers } from 'ethers';
import axios from 'axios';
import CONTRACT_ABI from '../PlaidQuestABI.js';
const CONTRACT_ADDRESS = '0x9BDA0c09AF4c130eb6D51AF74E6C87868AEad53f'; // Replace with your deployed contract address
const ORACLE_PRIVATE_KEY = '78851d0be91fab0f4f59e41773e757ac873628d2af1a8d14277f244e83328ab9';
const PROVIDER_URL = 'https://rpc-amoy.polygon.technology/';

// Fetch quest results from Plaid backend
async function fetchQuestResults(userId) {
  const response = await axios.get(`http://localhost:3000/quests?userId=${userId}`);
  return response.data.quests;
}

export async function fulfillQuestsOnChain(userAddress, userId) {
  const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
  const wallet = new ethers.Wallet(ORACLE_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

  const quests = await fetchQuestResults(userId);

  for (const quest of quests) {
    const details = JSON.stringify({ ...quest });
    let value = 0;
    if (typeof quest.balance === 'number') value = quest.balance;
    if (typeof quest.totalDebt === 'number') value = quest.totalDebt;
    if (typeof quest.fastFoodSpent === 'number') value = quest.fastFoodSpent;
    if (typeof quest.rentTxCount === 'number') value = quest.rentTxCount;
    if (typeof quest.charityTxCount === 'number') value = quest.charityTxCount;
    if (typeof quest.overdraftCount === 'number') value = quest.overdraftCount;
    if (typeof quest.lastIncome === 'number') value = quest.lastIncome;
    const tx = await contract.fulfillQuest(
      userAddress,
      quest.id,
      quest.completed,
      value,
      details
    );
    await tx.wait();
    console.log(`Quest ${quest.id} fulfilled for user ${userAddress}`);
  }
}

// Example usage:
// fulfillQuestsOnChain('0xUSER_ADDRESS', 'user123');
