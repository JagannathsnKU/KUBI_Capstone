import hre from "hardhat";
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log("🚀 Deploying PlaidQuestNFT contract to Polygon Amoy...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "POL");
  
  if (balance < hre.ethers.parseEther("0.01")) {
    console.warn("⚠️ Low balance! You need at least 0.01 POL for deployment.");
  }
  
  const PlaidQuestNFT = await hre.ethers.getContractFactory("PlaidQuestNFT");
  
  // Use zero address for oracle (we'll use owner minting instead)
  const ORACLE_ADDRESS = process.env.ORACLE_ADDRESS || "0x0000000000000000000000000000000000000000";
  
  console.log("📋 Using Oracle Address:", ORACLE_ADDRESS);
  console.log("🔨 Deploying contract...");
  
  const contract = await PlaidQuestNFT.deploy(ORACLE_ADDRESS);
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  
  console.log("\n✅ PlaidQuestNFT deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("📋 Contract details:");
  console.log("   - Name: PlaidQuest Achievement");
  console.log("   - Symbol: PLAIDQ");
  console.log("   - Owner:", deployer.address);
  console.log("   - Oracle:", ORACLE_ADDRESS);
  console.log("\n🌐 View on PolygonScan:");
  console.log(`   https://amoy.polygonscan.com/address/${contractAddress}`);
  console.log("\n💡 Next steps:");
  console.log("   1. Contract address automatically saved to .env file");
  console.log("   2. Restart your backend to use the new contract");
  console.log("   3. Test NFT minting by completing a quest");
  
  // Save to .env file (create if doesn't exist, update if exists)
  const envPath = join(process.cwd(), '.env');
  
  let envContent = '';
  if (fs.existsSync(envPath)) {
    const existing = fs.readFileSync(envPath, 'utf8');
    // Remove old POLYGON_CONTRACT_ADDRESS if exists
    envContent = existing.replace(/POLYGON_CONTRACT_ADDRESS=.*\n/g, '');
  }
  
  envContent += `POLYGON_CONTRACT_ADDRESS=${contractAddress}\n`;
  if (!envContent.includes('POLYGON_NETWORK=')) {
    envContent += `POLYGON_NETWORK=amoy\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log("\n💾 Contract address saved to .env file");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
