import pkg from 'ethers';
import ethers from 'ethers';
import axios from 'axios';
import CONTRACT_ABI from '../PlaidQuestABI.js';
// TODO: Update this to my new PlaidQuestNFT contract address after deployment
const CONTRACT_ADDRESS = '0x9BDA0c09AF4c130eb6D51AF74E6C87868AEad53f'; // Replace with your deployed PlaidQuestNFT address
const ORACLE_PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY;
const PROVIDER_URL = 'https://rpc-amoy.polygon.technology/';

// Fetch quest results from Plaid backend
async function fetchQuestResults(userId) {
  const response = await axios.get(`http://localhost:3003/quests?userId=${userId}`);
  return response.data.quests;
}

export async function fulfillQuestsOnChain(userAddress, userId) {
  const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
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
      details,
      {
        maxPriorityFeePerGas: ethers.utils.parseUnits('30', 'gwei'),
        maxFeePerGas: ethers.utils.parseUnits('40', 'gwei')
      }
    );
    await tx.wait();
    console.log(`Quest ${quest.id} fulfilled for user ${userAddress}`);
  }
}
export async function fulfillSingleQuestOnChain(userAddress, userId, questId) {
  const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
  const wallet = new ethers.Wallet(ORACLE_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

  const quests = await fetchQuestResults(userId);
  const quest = quests.find(q => q.id === questId || q.id === questId.replace(/ /g, '-'));
  if (!quest) throw new Error('Quest not found: ' + questId);

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
    details,
    {
      maxPriorityFeePerGas: ethers.utils.parseUnits('30', 'gwei'),
      maxFeePerGas: ethers.utils.parseUnits('40', 'gwei')
    }
  );
  const receipt = await tx.wait();
  
  // Parse the QuestNFTMinted event to get token ID
  let tokenId = null;
  const eventInterface = new ethers.utils.Interface(CONTRACT_ABI);
  for (const log of receipt.logs) {
    try {
      const parsed = eventInterface.parseLog(log);
      if (parsed.name === 'QuestNFTMinted') {
        tokenId = parsed.args.tokenId.toString();
        console.log(`NFT minted! Token ID: ${tokenId}`);
      }
    } catch (e) {
      // Not the event we're looking for
    }
  }
  
  console.log(`Quest ${quest.id} fulfilled for user ${userAddress}`, receipt.transactionHash);
  return { txHash: receipt.transactionHash, tokenId: tokenId };
}

// CLI support: allow calling from command line to fulfill a single quest
async function cli() {
  const argv = process.argv.slice(2);
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    const val = argv[i + 1];
    args[key.replace(/^--/, '')] = val;
  }
  if (args.userAddress && args.userId && args.questId) {
    try {
      const result = await fulfillSingleQuestOnChain(args.userAddress, args.userId, args.questId);
      console.log(JSON.stringify({ success: true, txHash: result.txHash, tokenId: result.tokenId }));
    } catch (err) {
      console.error(JSON.stringify({ success: false, error: err.message }));
      process.exit(1);
    }
  }
}

if (process.argv.length > 2) {
  cli();
}
