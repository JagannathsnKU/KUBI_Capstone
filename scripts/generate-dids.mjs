/**
 * DID Generator Script
 * 
 * Generates DIDs (Decentralized Identifiers) for XRPL entities
 * 
 * Usage:
 *   node scripts/generate-dids.mjs
 * 
 * Or with arguments:
 *   node scripts/generate-dids.mjs --type regulator --name IndianRegulator --id 456
 */

import { Wallet } from 'xrpl';

/**
 * Generate DID from XRPL address
 * 
 * @param {string} address - XRPL account address
 * @param {string} entityType - Type of entity (regulator, bank, user)
 * @returns {string} DID in format did:xrpl:<entityType>:<address>
 */
function generateDIDFromAddress(address, entityType = 'entity') {
  if (!address.startsWith('r')) {
    throw new Error('Invalid XRPL address. Must start with "r"');
  }
  
  // Use full address or shortened version
  // Format: did:xrpl:<entityType>:<address>
  return `did:xrpl:${entityType}:${address}`;
}

/**
 * Generate custom DID
 * 
 * @param {string} entityName - Name of entity
 * @param {string} uniqueId - Unique identifier (optional)
 * @returns {string} DID in format did:xrpl:<entityName>:<uniqueId>
 */
function generateCustomDID(entityName, uniqueId = null) {
  const id = uniqueId || Date.now().toString().slice(-6);
  return `did:xrpl:${entityName}:${id}`;
}

/**
 * Generate DID from wallet
 * 
 * @param {Wallet} wallet - XRPL wallet
 * @param {string} entityType - Type of entity
 * @returns {string} DID
 */
function generateDIDFromWallet(wallet, entityType = 'entity') {
  return generateDIDFromAddress(wallet.address, entityType);
}

// Main function
async function main() {
  console.log('🆔 DID Generator for XRPL Cross-Border Verification\n');
  console.log('='.repeat(60));

  // Parse command line arguments
  const args = process.argv.slice(2);
  const typeIndex = args.indexOf('--type');
  const nameIndex = args.indexOf('--name');
  const idIndex = args.indexOf('--id');
  const addressIndex = args.indexOf('--address');

  // If arguments provided, generate specific DID
  if (typeIndex !== -1 || nameIndex !== -1 || addressIndex !== -1) {
    if (addressIndex !== -1) {
      // Generate from address
      const address = args[addressIndex + 1];
      const entityType = typeIndex !== -1 ? args[typeIndex + 1] : 'entity';
      const did = generateDIDFromAddress(address, entityType);
      console.log(`\n✅ Generated DID from XRPL address:`);
      console.log(`   Address: ${address}`);
      console.log(`   Entity Type: ${entityType}`);
      console.log(`   DID: ${did}\n`);
      return;
    } else if (nameIndex !== -1) {
      // Generate custom DID
      const entityName = args[nameIndex + 1];
      const uniqueId = idIndex !== -1 ? args[idIndex + 1] : null;
      const did = generateCustomDID(entityName, uniqueId);
      console.log(`\n✅ Generated Custom DID:`);
      console.log(`   Entity Name: ${entityName}`);
      console.log(`   Unique ID: ${uniqueId || 'auto-generated'}`);
      console.log(`   DID: ${did}\n`);
      return;
    }
  }

  // Interactive mode: Generate example DIDs
  console.log('\n📋 Example DIDs for Cross-Border Verification:\n');

  // Example 1: Generate from XRPL addresses (if you have wallets)
  console.log('1️⃣ From XRPL Addresses:');
  console.log('   (Generate XRPL testnet accounts at: https://xrpl.org/xrp-testnet-faucet.html)');
  
  try {
    // Generate example wallets
    const regulatorWallet = Wallet.generate();
    const bankWallet = Wallet.generate();
    const userWallet = Wallet.generate();

    console.log(`\n   Regulator Wallet:`);
    console.log(`   Address: ${regulatorWallet.address}`);
    console.log(`   Secret: ${regulatorWallet.seed}`);
    console.log(`   DID: ${generateDIDFromWallet(regulatorWallet, 'regulator')}`);

    console.log(`\n   Bank Wallet:`);
    console.log(`   Address: ${bankWallet.address}`);
    console.log(`   Secret: ${bankWallet.seed}`);
    console.log(`   DID: ${generateDIDFromWallet(bankWallet, 'bank')}`);

    console.log(`\n   User Wallet:`);
    console.log(`   Address: ${userWallet.address}`);
    console.log(`   Secret: ${userWallet.seed}`);
    console.log(`   DID: ${generateDIDFromWallet(userWallet, 'user')}`);
  } catch (error) {
    console.log('   (XRPL library not available, using custom DIDs instead)');
  }

  // Example 2: Custom DIDs
  console.log('\n2️⃣ Custom DIDs (Recommended for Testing):');
  console.log('\n   Regulator:');
  const regulatorDID = generateCustomDID('IndianRegulator', '456');
  console.log(`   ${regulatorDID}`);

  console.log('\n   Bank:');
  const bankDID = generateCustomDID('BangaloreBank', '123');
  console.log(`   ${bankDID}`);

  console.log('\n   User:');
  const userDID = generateCustomDID('user', '789');
  console.log(`   ${userDID}`);

  // Usage instructions
  console.log('\n' + '='.repeat(60));
  console.log('\n📝 Usage Instructions:\n');
  console.log('1. For testing, use Custom DIDs (Example 2 above)');
  console.log('2. For production, use DIDs from XRPL addresses (Example 1)');
  console.log('3. DIDs are just identifiers - they don\'t need to exist on XRPL');
  console.log('4. The XRPL secret keys are what matter for signing VCs\n');

  console.log('💡 Quick Commands:\n');
  console.log('   Generate from address:');
  console.log('   node scripts/generate-dids.mjs --address rAccountAddress... --type regulator\n');
  console.log('   Generate custom:');
  console.log('   node scripts/generate-dids.mjs --name IndianRegulator --id 456\n');
}

main().catch(console.error);

