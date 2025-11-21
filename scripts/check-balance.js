import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const address = deployer.address;
  
  console.log("Checking balance for:", address);
  console.log("Network: Polygon Amoy Testnet");
  
  const balance = await deployer.getBalance();
  const balanceInEth = hre.ethers.utils.formatEther(balance);
  
  console.log("\n💰 Current Balance:", balanceInEth, "MATIC");
  console.log("   (Raw:", balance.toString(), "wei)");
  
  if (parseFloat(balanceInEth) < 0.001) {
    console.log("\n⚠️  Insufficient balance for deployment!");
    console.log("   You need at least 0.001 MATIC on Polygon Amoy");
    console.log("\n💧 Get testnet tokens from:");
    console.log("   1. https://faucet.polygon.technology/");
    console.log("   2. https://www.alchemy.com/faucets/polygon-amoy");
    console.log("   3. https://portal.polygon.technology/amoy/faucet");
    console.log("\n   Make sure to select 'Amoy' testnet, not Mainnet!");
  } else {
    console.log("\n✅ Sufficient balance for deployment!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

