/**
 * XRPL Verifiable Credentials Chain of Trust
 * 
 * Implements the 3-step Chain of Trust:
 * 1. User VC (e.g., "5 years on-time payments") - Signed by Bank
 * 2. Bank Legitimacy VC (e.g., "Bank is licensed") - Signed by Regulator
 * 3. Verification: Verifier checks chain backwards (Regulator → Bank → User)
 */

// xrpl is a Node.js module and cannot be imported in browser
// Browser code should use demo mode (issueDemoVC) instead
// Only import xrpl in Node.js scripts, not in browser modules
let Client, Wallet, convertStringToHex;

// Helper to dynamically load xrpl (only works in Node.js)
async function loadXRPLModule() {
  // In browser, xrpl is not available - return null
  if (typeof window !== 'undefined') {
    return null;
  }
  // In Node.js, try to import xrpl dynamically
  try {
    const xrpl = await import('xrpl');
    return xrpl;
  } catch (e) {
    return null;
  }
}

// XRPL Testnet
const XRPL_TESTNET = 'wss://s.altnet.rippletest.net:51233';
// XRPL Mainnet (for production)
// const XRPL_MAINNET = 'wss://xrplcluster.com';

/**
 * VC Structure stored on XRPL (in Account Memo or NFT metadata)
 */
class VerifiableCredential {
  constructor({
    id,
    type,
    issuerDid,
    subjectDid,
    credentialSubject,
    issuanceDate,
    expirationDate,
    proof,
    chainOfTrust = null // Reference to parent VC (for chain)
  }) {
    this.id = id;
    this.type = type;
    this.issuerDid = issuerDid; // DID of issuer (e.g., "did:xrpl:BangaloreBank:123")
    this.subjectDid = subjectDid; // DID of subject (user or bank)
    this.credentialSubject = credentialSubject; // The actual claim
    this.issuanceDate = issuanceDate;
    this.expirationDate = expirationDate;
    this.proof = proof; // Cryptographic signature
    this.chainOfTrust = chainOfTrust; // Reference to parent VC ID
  }

  toJSON() {
    return {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      id: this.id,
      type: ['VerifiableCredential', this.type],
      issuer: { id: this.issuerDid },
      issuanceDate: this.issuanceDate,
      expirationDate: this.expirationDate,
      credentialSubject: {
        id: this.subjectDid,
        ...this.credentialSubject
      },
      proof: this.proof,
      chainOfTrust: this.chainOfTrust
    };
  }
}

/**
 * Trust Registry - Stores which DIDs the verifier trusts
 */
class TrustRegistry {
  constructor() {
    // Map of DID → trust level
    // 'trusted' = fully trusted (e.g., regulators)
    // 'verified' = verified by trusted entity
    // 'unknown' = not trusted
    this.trustedDIDs = new Map();
  }

  /**
   * Add a trusted DID (e.g., regulator)
   */
  addTrustedDID(did, trustLevel = 'trusted') {
    this.trustedDIDs.set(did, trustLevel);
  }

  /**
   * Check if a DID is trusted
   */
  isTrusted(did) {
    return this.trustedDIDs.has(did) && 
           this.trustedDIDs.get(did) === 'trusted';
  }

  /**
   * Verify chain of trust
   * Returns: { valid: boolean, chain: array, reason: string }
   */
  verifyChain(vc, maxDepth = 10) {
    const chain = [vc];
    let currentVC = vc;
    let depth = 0;

    // Follow the chain backwards
    while (currentVC.chainOfTrust && depth < maxDepth) {
      // In real implementation, fetch parent VC from XRPL
      // For now, we'll simulate it
      const parentVC = this.fetchVCFromXRPL(currentVC.chainOfTrust);
      if (!parentVC) {
        return {
          valid: false,
          chain: chain,
          reason: `Parent VC ${currentVC.chainOfTrust} not found`
        };
      }
      chain.push(parentVC);
      currentVC = parentVC;
      depth++;
    }

    // Check if root of chain is trusted
    const rootIssuer = currentVC.issuerDid;
    if (this.isTrusted(rootIssuer)) {
      return {
        valid: true,
        chain: chain.reverse(), // Reverse to show root → leaf
        reason: `Chain verified: Root issuer ${rootIssuer} is trusted`
      };
    } else {
      return {
        valid: false,
        chain: chain.reverse(),
        reason: `Chain invalid: Root issuer ${rootIssuer} is not trusted`
      };
    }
  }

  /**
   * Fetch VC from XRPL (placeholder - implement actual XRPL lookup)
   */
  fetchVCFromXRPL(vcId) {
    // TODO: Implement actual XRPL account memo or NFT lookup
    // For now, return null (would fetch from XRPL in production)
    return null;
  }
}

/**
 * XRPL VC Manager - Handles VC operations on XRPL
 * Note: This class requires the 'xrpl' Node.js module
 * In browser environments, use issueDemoVC() instead
 */
class XRPLVCManager {
  constructor(accountAddress, secret) {
    // XRPLVCManager requires xrpl module which is only available in Node.js
    // In browser, this will throw an error - use issueDemoVC() instead
    if (typeof window !== 'undefined') {
      throw new Error('XRPLVCManager cannot be used in browser. Use issueDemoVC() from xrpl-vc-chain.js instead.');
    }
    
    // Try to load xrpl synchronously (this will fail in browser, which is expected)
    // Note: In actual Node.js usage, xrpl should be imported at the top of the file
    // This is a fallback for when the file is loaded in browser
    try {
      // In Node.js, this would need to be handled differently
      // For now, we'll throw an error if xrpl is not available
      if (!Client || !Wallet || !convertStringToHex) {
        throw new Error('xrpl module not loaded. XRPLVCManager requires xrpl to be imported in Node.js environment.');
      }
    } catch (e) {
      throw new Error('XRPLVCManager requires xrpl module (Node.js only). In browser, use issueDemoVC() instead.');
    }
    
    this.accountAddress = accountAddress;
    this.wallet = Wallet.fromSeed(secret);
    this.client = new Client(XRPL_TESTNET);
    this.trustRegistry = new TrustRegistry();
  }

  /**
   * Connect to XRPL
   */
  async connect() {
    await this.client.connect();
    console.log('✅ Connected to XRPL');
  }

  /**
   * Issue a VC and store on XRPL
   * 
   * @param {VerifiableCredential} vc - The VC to issue
   * @param {string} parentVCId - Optional: ID of parent VC in chain
   */
  async issueVC(vc, parentVCId = null) {
    if (parentVCId) {
      vc.chainOfTrust = parentVCId;
    }

    // Store VC on XRPL using Account Memo
    // In production, you might use XRPL NFTs (XLS-20) for better storage
    const memo = {
      MemoType: convertStringToHex('VC'),
      MemoData: convertStringToHex(JSON.stringify(vc.toJSON())),
      MemoFormat: convertStringToHex('application/json')
    };

    // Create payment transaction with memo (or use NFT minting)
    const tx = await this.client.submit({
      command: 'submit',
      tx_json: {
        TransactionType: 'Payment',
        Account: this.wallet.address,
        Destination: this.wallet.address, // Self-payment to store memo
        Amount: '1', // Minimum amount
        Memos: [memo]
      },
      secret: this.wallet.seed
    });

    console.log(`✅ VC issued: ${vc.id}`);
    console.log(`   Transaction: ${tx.result.tx_json.hash}`);
    console.log(`   Issuer: ${vc.issuerDid}`);
    console.log(`   Subject: ${vc.subjectDid}`);
    if (parentVCId) {
      console.log(`   Chain: Linked to parent VC ${parentVCId}`);
    }

    return {
      vcId: vc.id,
      txHash: tx.result.tx_json.hash,
      vc: vc
    };
  }

  /**
   * Issue a Bank Legitimacy VC (Step 2 in chain)
   * 
   * Example: Indian Regulator issues VC for Bangalore Bank
   */
  async issueBankLegitimacyVC(bankDid, regulatorDid, regulatorSecret) {
    const bankVC = new VerifiableCredential({
      id: `vc:bank:${bankDid}:${Date.now()}`,
      type: 'BankLegitimacyCredential',
      issuerDid: regulatorDid,
      subjectDid: bankDid,
      credentialSubject: {
        bankName: bankDid.split(':')[2], // Extract bank name from DID
        licenseNumber: 'IN-BANK-2024-001',
        jurisdiction: 'India',
        verified: true,
        verificationDate: new Date().toISOString()
      },
      issuanceDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        proofPurpose: 'assertionMethod',
        verificationMethod: `${regulatorDid}#keys-1`
      }
    });

    // Use regulator's wallet to issue
    const regulatorWallet = Wallet.fromSeed(regulatorSecret);
    const originalWallet = this.wallet;
    this.wallet = regulatorWallet;

    const result = await this.issueVC(bankVC);
    
    // Restore original wallet
    this.wallet = originalWallet;

    return result;
  }

  /**
   * Issue a User Payment History VC (Step 1 in chain)
   * 
   * Example: Bangalore Bank issues VC for user's payment history
   */
  async issueUserPaymentHistoryVC(
    userDid,
    bankDid,
    bankSecret,
    paymentHistory,
    bankLegitimacyVCId
  ) {
    const userVC = new VerifiableCredential({
      id: `vc:user:${userDid}:${Date.now()}`,
      type: 'PaymentHistoryCredential',
      issuerDid: bankDid,
      subjectDid: userDid,
      credentialSubject: {
        yearsOfHistory: paymentHistory.years,
        onTimePayments: paymentHistory.onTimeCount,
        totalPayments: paymentHistory.totalCount,
        averageAmount: paymentHistory.averageAmount,
        country: paymentHistory.country || 'India'
      },
      issuanceDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        proofPurpose: 'assertionMethod',
        verificationMethod: `${bankDid}#keys-1`
      },
      chainOfTrust: bankLegitimacyVCId // Link to bank's legitimacy VC
    });

    // Use bank's wallet to issue
    const bankWallet = Wallet.fromSeed(bankSecret);
    const originalWallet = this.wallet;
    this.wallet = bankWallet;

    const result = await this.issueVC(userVC, bankLegitimacyVCId);
    
    // Restore original wallet
    this.wallet = originalWallet;

    return result;
  }

  /**
   * Verify a VC chain
   * 
   * @param {string} vcId - ID of VC to verify
   * @param {Array<string>} trustedRegulators - List of trusted regulator DIDs
   */
  async verifyVCChain(vcId, trustedRegulators = []) {
    // Add trusted regulators to registry
    trustedRegulators.forEach(regulator => {
      this.trustRegistry.addTrustedDID(regulator);
    });

    // Fetch VC from XRPL
    const vc = await this.fetchVCFromXRPL(vcId);
    if (!vc) {
      return {
        valid: false,
        reason: `VC ${vcId} not found on XRPL`
      };
    }

    // Verify chain
    const verification = this.trustRegistry.verifyChain(vc);

    return {
      vcId: vcId,
      ...verification
    };
  }

  /**
   * Fetch VC from XRPL (actual lookup)
   */
  async fetchVCFromXRPL(vcId) {
    try {
      // Get account transactions
      const accountTx = await this.client.request({
        command: 'account_tx',
        account: this.accountAddress,
        ledger_index_min: -1,
        ledger_index_max: -1,
        limit: 100
      });

      // Search for VC in transaction memos
      for (const tx of accountTx.result.transactions) {
        if (tx.tx?.Memos) {
          for (const memo of tx.tx.Memos) {
            try {
              const memoData = Buffer.from(memo.Memo.MemoData, 'hex').toString('utf8');
              const vcData = JSON.parse(memoData);
              
              // Check if this is the VC we're looking for
              if (vcData.id === vcId || vcData['@context']) {
                // Reconstruct VC object
                const vc = new VerifiableCredential({
                  id: vcData.id,
                  type: Array.isArray(vcData.type) ? vcData.type[1] : vcData.type,
                  issuerDid: vcData.issuer?.id || vcData.issuer,
                  subjectDid: vcData.credentialSubject?.id,
                  credentialSubject: vcData.credentialSubject,
                  issuanceDate: vcData.issuanceDate,
                  expirationDate: vcData.expirationDate,
                  proof: vcData.proof,
                  chainOfTrust: vcData.chainOfTrust
                });
                return vc;
              }
            } catch (e) {
              // Not a VC memo, continue
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching VC from XRPL:', error);
      return null;
    }
  }

  /**
   * Disconnect from XRPL
   */
  async disconnect() {
    await this.client.disconnect();
    console.log('✅ Disconnected from XRPL');
  }
}

/**
 * Demo Mode: Issue VCs without XRPL (for testing)
 * Uses localStorage instead of XRPL blockchain
 */
async function issueDemoVC(vcData) {
  const vc = new VerifiableCredential({
    id: vcData.id || `vc:${vcData.type}:${Date.now()}`,
    type: vcData.type,
    issuerDid: vcData.issuerDid || 'did:demo:PlaidSandbox:001',
    subjectDid: vcData.subjectDid || 'did:demo:user:001',
    credentialSubject: vcData.credentialSubject || {},
    issuanceDate: new Date().toISOString(),
    expirationDate: vcData.expirationDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    proof: {
      type: 'DemoSignature',
      created: new Date().toISOString(),
      proofPurpose: 'assertionMethod',
      verificationMethod: `${vcData.issuerDid || 'did:demo:PlaidSandbox:001'}#keys-1`
    },
    chainOfTrust: vcData.chainOfTrust || null
  });

  // Store in localStorage (demo mode)
  if (typeof localStorage !== 'undefined') {
    const vcs = JSON.parse(localStorage.getItem('xrpl_vcs') || '[]');
    vcs.push({
      vcId: vc.id,
      vc: vc.toJSON(),
      txHash: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      storedAt: new Date().toISOString()
    });
    localStorage.setItem('xrpl_vcs', JSON.stringify(vcs));
  }

  return {
    vcId: vc.id,
    txHash: `demo_${Date.now()}`,
    vc: vc
  };
}

/**
 * Example Usage: Complete Chain of Trust Flow
 */
async function exampleChainOfTrust() {
  // DEMO MODE: Use demo values, no real XRPL connection needed
  console.log('📋 Running in DEMO MODE (no XRPL connection required)');
  
  // Step 1: Demo Regulator issues Bank Legitimacy VC
  const regulatorDid = 'did:demo:IndianRegulator:456';
  const bankDid = 'did:demo:BangaloreBank:123';

  const bankVC = await issueDemoVC({
    type: 'BankLegitimacyCredential',
    issuerDid: regulatorDid,
    subjectDid: bankDid,
    credentialSubject: {
      bankName: 'Bangalore Bank',
      licenseNumber: 'IN-BANK-2024-001',
      jurisdiction: 'India',
      verified: true
    }
  });

  console.log('\n📋 Bank Legitimacy VC issued (DEMO):');
  console.log(`   VC ID: ${bankVC.vcId}`);

  // Step 2: Demo Bank issues User Payment History VC
  const userDid = 'did:demo:user:789';

  const userVC = await issueDemoVC({
    type: 'PaymentHistoryCredential',
    issuerDid: bankDid,
    subjectDid: userDid,
    credentialSubject: {
      yearsOfHistory: 5,
      onTimePayments: 60,
      totalPayments: 60,
      averageAmount: 50000,
      country: 'India'
    },
    chainOfTrust: bankVC.vcId
  });

  console.log('\n📋 User Payment History VC issued (DEMO):');
  console.log(`   VC ID: ${userVC.vcId}`);
  console.log(`   Chain: Linked to ${bankVC.vcId}`);

  return { bankVC, userVC };
}

// Export for use in other modules
export {
  VerifiableCredential,
  TrustRegistry,
  XRPLVCManager,
  issueDemoVC,
  exampleChainOfTrust
};

/* REAL XRPL MODE (commented out for demo):
async function exampleChainOfTrustXRPL() {
  const manager = new XRPLVCManager(
    'rYourAccountAddress',
    'sYourSecretKey'
  );

  await manager.connect();

  // Step 1: Regulator issues Bank Legitimacy VC
  const regulatorDid = 'did:xrpl:IndianRegulator:456';
  const regulatorSecret = 'sRegulatorSecretKey';
  const bankDid = 'did:xrpl:BangaloreBank:123';

  const bankVC = await manager.issueBankLegitimacyVC(
    bankDid,
    regulatorDid,
    regulatorSecret
  );

  console.log('\n📋 Bank Legitimacy VC issued:');
  console.log(`   VC ID: ${bankVC.vcId}`);
  console.log(`   TX Hash: ${bankVC.txHash}`);

  // Step 2: Bank issues User Payment History VC (with chain link)
  const bankSecret = 'sBankSecretKey';
  const userDid = 'did:xrpl:user:789';

  const userVC = await manager.issueUserPaymentHistoryVC(
    userDid,
    bankDid,
    bankSecret,
    {
      years: 5,
      onTimeCount: 60,
      totalCount: 60,
      averageAmount: 50000,
      country: 'India'
    },
    bankVC.vcId // Link to bank's legitimacy VC
  );

  console.log('\n📋 User Payment History VC issued:');
  console.log(`   VC ID: ${userVC.vcId}`);
  console.log(`   TX Hash: ${userVC.txHash}`);
  console.log(`   Chain: Linked to ${bankVC.vcId}`);

  // Step 3: Verifier verifies the chain
  const verification = await manager.verifyVCChain(
    userVC.vcId,
    [regulatorDid] // US lender trusts Indian Regulator
  );

  console.log('\n🔍 Chain Verification Result:');
  console.log(`   Valid: ${verification.valid}`);
  console.log(`   Reason: ${verification.reason}`);
  console.log(`   Chain Length: ${verification.chain?.length || 0}`);

  await manager.disconnect();
}
*/
