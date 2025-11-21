async function main() {
  const PlaidQuest = await ethers.getContractFactory("PlaidQuest");
  const contract = await PlaidQuest.deploy("0x3Dc88401919665Ee05159985656A139ecEb072bb"); // Replace with your MetaMask address
  await contract.deployed();
  console.log("PlaidQuest deployed to:", contract.address);
}
main().catch(console.error);
