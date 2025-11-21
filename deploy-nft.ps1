# PowerShell script to deploy PlaidQuestNFT contract
# Usage: .\deploy-nft.ps1

Write-Host "Deploying PlaidQuestNFT contract..." -ForegroundColor Cyan

# Set oracle address (change this to your oracle address)
$env:ORACLE_ADDRESS = "0x3Dc88401919665Ee05159985656A139ecEb072bb"

Write-Host "Oracle Address: $env:ORACLE_ADDRESS" -ForegroundColor Yellow

# Deploy to Polygon Amoy testnet
npx hardhat run scripts/deploy-nft.js --network amoy

Write-Host ""
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Don't forget to update CONTRACT_ADDRESS in scripts/oracleFulfillQuests.mjs" -ForegroundColor Yellow
