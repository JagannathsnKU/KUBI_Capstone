/**
 * Test Script: Cross-Border Verification Flow
 * 
 * Tests the complete 3-step chain of trust:
 * 1. Regulator → Bank (Bank Legitimacy VC)
 * 2. Bank → User (User Payment History VC)
 * 3. Lender → Verifies Chain
 * 
 * Usage:
 *   node scripts/test-cross-border-flow.mjs
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3003';

// Test data (replace with your actual XRPL testnet accounts)
const TEST_DATA = {
  regulator: {
    did: 'did:xrpl:IndianRegulator:456',
    secret: 'sYourRegulatorSecret' // Replace with actual secret
  },
  bank: {
    did: 'did:xrpl:BangaloreBank:123',
    secret: 'sYourBankSecret', // Replace with actual secret
    name: 'Bangalore Bank',
    licenseNumber: 'IN-BANK-2024-001',
    jurisdiction: 'India'
  },
  user: {
    did: 'did:xrpl:user:789',
    address: '0x1234567890abcdef1234567890abcdef12345678'
  },
  lender: {
    address: 'US Lender Address',
    trustedRegulators: ['did:xrpl:IndianRegulator:456']
  }
};

async function testCrossBorderFlow() {
  console.log('🌍 Testing Cross-Border Verification Flow\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Regulator Issues Bank Legitimacy VC
    console.log('\n📋 Step 1: Regulator Issues Bank Legitimacy VC');
    console.log('-'.repeat(60));
    
    const bankVCResponse = await fetch(`${API_BASE}/cross-border/issue-bank-legitimacy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        regulatorDid: TEST_DATA.regulator.did,
        regulatorSecret: TEST_DATA.regulator.secret,
        bankDid: TEST_DATA.bank.did,
        bankName: TEST_DATA.bank.name,
        licenseNumber: TEST_DATA.bank.licenseNumber,
        jurisdiction: TEST_DATA.bank.jurisdiction
      })
    });

    if (!bankVCResponse.ok) {
      const error = await bankVCResponse.json();
      throw new Error(`Step 1 failed: ${error.error || bankVCResponse.statusText}`);
    }

    const bankVCResult = await bankVCResponse.json();
    console.log('✅ Bank Legitimacy VC issued!');
    console.log(`   VC ID: ${bankVCResult.vcId}`);
    console.log(`   TX Hash: ${bankVCResult.txHash}`);
    console.log(`   Explorer: ${bankVCResult.xrplExplorer}`);

    const bankVCId = bankVCResult.vcId;

    // Step 2: Bank Issues User Payment History VC
    console.log('\n📋 Step 2: Bank Issues User Payment History VC');
    console.log('-'.repeat(60));

    const userVCResponse = await fetch(`${API_BASE}/cross-border/issue-user-payment-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bankDid: TEST_DATA.bank.did,
        bankSecret: TEST_DATA.bank.secret,
        userDid: TEST_DATA.user.did,
        userAddress: TEST_DATA.user.address,
        bankLegitimacyVCId: bankVCId,
        paymentHistory: {
          years: 5,
          onTimeCount: 60,
          totalCount: 60,
          averageAmount: 1000,
          country: 'India',
          bankName: TEST_DATA.bank.name
        }
      })
    });

    if (!userVCResponse.ok) {
      const error = await userVCResponse.json();
      throw new Error(`Step 2 failed: ${error.error || userVCResponse.statusText}`);
    }

    const userVCResult = await userVCResponse.json();
    console.log('✅ User Payment History VC issued!');
    console.log(`   VC ID: ${userVCResult.vcId}`);
    console.log(`   TX Hash: ${userVCResult.txHash}`);
    console.log(`   Chain of Trust: ${userVCResult.chainOfTrust}`);
    console.log(`   Explorer: ${userVCResult.xrplExplorer}`);

    const userVCId = userVCResult.vcId;

    // Wait a bit for XRPL to confirm transactions
    console.log('\n⏳ Waiting 3 seconds for XRPL confirmation...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 3: Lender Verifies VC Chain
    console.log('\n📋 Step 3: Lender Verifies VC Chain');
    console.log('-'.repeat(60));

    const verifyResponse = await fetch(`${API_BASE}/cross-border/verify-chain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userVCId: userVCId,
        trustedRegulators: TEST_DATA.lender.trustedRegulators,
        verifierAddress: TEST_DATA.lender.address
      })
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      throw new Error(`Step 3 failed: ${error.error || verifyResponse.statusText}`);
    }

    const verifyResult = await verifyResponse.json();
    const verification = verifyResult.verification;

    console.log(`\n${verification.valid ? '✅' : '❌'} VC Chain Verification: ${verification.valid ? 'VALID' : 'INVALID'}`);
    console.log(`   Root Issuer: ${verification.rootIssuer}`);
    console.log(`   Trusted: ${verification.isTrusted ? 'Yes' : 'No'}`);
    console.log(`   Chain Integrity: ${verification.chainIntegrity ? 'Valid' : 'Invalid'}`);
    console.log(`   Chain Length: ${verification.chain?.length || 0}`);

    if (verification.chain && verification.chain.length > 0) {
      console.log('\n   Chain of Trust:');
      verification.chain.forEach((vc, index) => {
        console.log(`   ${index + 1}. ${vc.type} (Issuer: ${vc.issuer})`);
      });
    }

    if (verification.valid) {
      console.log('\n🎉 SUCCESS! Cross-border credit approved!');
      console.log('   The chain of trust is valid:');
      console.log('   ✅ User VC verified');
      console.log('   ✅ Bank VC verified');
      console.log('   ✅ Regulator is trusted');
      console.log('   ✅ Chain integrity confirmed');
    } else {
      console.log('\n❌ FAILED! Cross-border credit not approved.');
      if (verification.reason) {
        console.log(`   Reason: ${verification.reason}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nMake sure:');
    console.error('1. Backend server is running (npm start in plaid_node)');
    console.error('2. XRPL testnet accounts are configured');
    console.error('3. Replace TEST_DATA secrets with actual XRPL testnet secrets');
    process.exit(1);
  }
}

// Run test
testCrossBorderFlow();

