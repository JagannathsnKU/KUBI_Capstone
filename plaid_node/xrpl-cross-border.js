/**
 * XRPL Cross-Border Document Verification Service
 * 
 * Implements the 3-step Chain of Trust:
 * 1. Regulator → Bank (Bank Legitimacy VC)
 * 2. Bank → User (User Payment History VC)
 * 3. Lender verifies chain (Regulator → Bank → User)
 * 
 * DEMO MODE: Stores data locally for reliable demo (simulates XRPL)
 * Production: Can switch to real XRPL by setting USE_REAL_XRPL=true
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Demo mode by default (set USE_REAL_XRPL=true for production)
const USE_REAL_XRPL = process.env.USE_REAL_XRPL === 'true';
let XRPL = null;

// Try to load XRPL only if needed
if (USE_REAL_XRPL) {
  try {
    XRPL = require('xrpl');
  } catch (e) {
    console.warn('⚠️ XRPL module not available, using demo mode');
  }
}

// Demo storage file
const DEMO_STORAGE_FILE = path.join(__dirname, 'xrpl_vcs_demo.json');

// Demo storage helper functions
function loadDemoStorage() {
  try {
    if (fs.existsSync(DEMO_STORAGE_FILE)) {
      return JSON.parse(fs.readFileSync(DEMO_STORAGE_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('Could not load demo storage:', e.message);
  }
  return { vcs: [], transactions: [] };
}

function saveDemoStorage(data) {
  try {
    fs.writeFileSync(DEMO_STORAGE_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Could not save demo storage:', e.message);
  }
}

function generateDemoHash(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data) + Date.now() + Math.random()).digest('hex').toUpperCase();
}

// XRPL Testnet URL
const XRPL_TESTNET = 'wss://s.altnet.rippletest.net:51233';

class XRPLCrossBorderService {
  constructor(accountAddress, accountSecret) {
    this.accountAddress = accountAddress;
    this.accountSecret = accountSecret;
    this.client = null;
    this.wallet = null;
    this.useDemoMode = !USE_REAL_XRPL || !XRPL;
  }

  /**
   * Connect to XRPL (or use demo mode)
   */
  async connect() {
    if (this.useDemoMode) {
      console.log('🎭 DEMO MODE: Simulating XRPL (storing locally)');
      return;
    }

    if (this.client && this.client.isConnected()) {
      return;
    }

    try {
      const { Client, Wallet } = XRPL;
      this.client = new Client(XRPL_TESTNET);
      await this.client.connect();
      console.log('✅ Connected to XRPL Testnet for cross-border verification');

      // Create wallet from secret
      this.wallet = Wallet.fromSeed(this.accountSecret);
      console.log('✅ Wallet loaded:', this.wallet.address);
      
      // Get latest ledger info to ensure we're synced
      const serverInfo = await this.client.request({
        command: 'server_info'
      });
      console.log('📊 Latest ledger:', serverInfo.result.info.validated_ledger?.seq);
    } catch (error) {
      console.error('❌ XRPL connection error, falling back to demo mode:', error.message);
      this.useDemoMode = true;
    }
  }

  /**
   * Disconnect from XRPL
   */
  async disconnect() {
    if (this.useDemoMode) {
      return; // Nothing to disconnect in demo mode
    }
    
    if (this.client && this.client.isConnected()) {
      await this.client.disconnect();
      console.log('✅ Disconnected from XRPL');
    }
  }

  /**
   * Step 1: Regulator issues Bank Legitimacy VC
   * 
   * Example: Indian Regulator verifies Bangalore Bank is legitimate
   * 
   * @param {Object} params
   * @param {string} params.regulatorDid - DID of regulator (e.g., "did:xrpl:IndianRegulator:456")
   * @param {string} params.regulatorSecret - Regulator's XRPL secret key
   * @param {string} params.bankDid - DID of bank (e.g., "did:xrpl:BangaloreBank:123")
   * @param {string} params.bankName - Name of bank
   * @param {string} params.licenseNumber - Bank license number
   * @param {string} params.jurisdiction - Country/jurisdiction (e.g., "India")
   * 
   * @returns {Object} VC result with vcId and txHash
   */
  async issueBankLegitimacyVC({
    regulatorDid,
    regulatorSecret,
    bankDid,
    bankName,
    licenseNumber,
    jurisdiction
  }) {
    try {
      await this.connect();

      // Create bank legitimacy VC data
      const vcData = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: `vc:bank:${bankDid}:${Date.now()}`,
        type: ['VerifiableCredential', 'BankLegitimacyCredential'],
        issuer: { id: regulatorDid },
        issuanceDate: new Date().toISOString(),
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        credentialSubject: {
          id: bankDid,
          bankName: bankName,
          licenseNumber: licenseNumber,
          jurisdiction: jurisdiction,
          verified: true,
          verificationDate: new Date().toISOString()
        },
        proof: {
          type: 'Ed25519Signature2020',
          created: new Date().toISOString(),
          proofPurpose: 'assertionMethod',
          verificationMethod: `${regulatorDid}#keys-1`
        }
      };

      // DEMO MODE: Store locally instead of XRPL
      if (this.useDemoMode) {
        const storage = loadDemoStorage();
        const txHash = generateDemoHash(vcData);
        
        // Store VC in demo storage
        storage.vcs.push({
          vcId: vcData.id,
          vc: vcData,
          txHash: txHash,
          type: 'BankLegitimacyCredential',
          issuerDid: regulatorDid,
          subjectDid: bankDid,
          createdAt: new Date().toISOString()
        });
        
        storage.transactions.push({
          txHash: txHash,
          type: 'bank_legitimacy_vc',
          vcId: vcData.id,
          timestamp: new Date().toISOString()
        });
        
        saveDemoStorage(storage);
        
        console.log('✅ Bank Legitimacy VC issued (DEMO MODE):', txHash);
        console.log('   Stored locally, instantly confirmed');
        
        return {
          success: true,
          vcId: vcData.id,
          txHash: txHash,
          vc: vcData,
          bankDid: bankDid,
          regulatorDid: regulatorDid,
          status: 'confirmed',
          message: 'VC issued successfully (Demo Mode - stored locally)',
          demoMode: true
        };
      }

      // REAL XRPL MODE (if enabled)
      const { Wallet, convertStringToHex } = XRPL;
      const memoData = convertStringToHex(JSON.stringify(vcData));
      const regulatorWallet = Wallet.fromSeed(regulatorSecret);

      // Create payment transaction with VC in memo
      const payment = {
        TransactionType: 'Payment',
        Account: regulatorWallet.address,
        Destination: regulatorWallet.address, // Self-payment
        Amount: '1', // Minimum amount
        Memos: [
          {
            Memo: {
              MemoType: convertStringToHex('bank_legitimacy_vc'),
              MemoData: memoData,
              MemoFormat: convertStringToHex('application/json')
            }
          }
        ]
      };

      // Submit transaction with robust sequence number handling
      let response;
      let txHash;
      let retries = 0;
      const maxRetries = 5;
      
      while (retries < maxRetries) {
        // Get FRESH account info on each attempt (especially important for retries)
        const accountInfo = await this.client.request({
          command: 'account_info',
          account: regulatorWallet.address,
          ledger_index: 'current',
          queue: true // Include pending transactions
        });
        
        // account_data.Sequence is the NEXT sequence number to use
        let currentSequence = accountInfo.result.account_data.Sequence;
        
        // Add pending transaction count (these are already using sequence numbers)
        const pendingTxCount = accountInfo.result.queue_data?.txn_count || 0;
        currentSequence = currentSequence + pendingTxCount;
        
        if (retries === 0) {
          console.log(`📊 Account sequence: ${accountInfo.result.account_data.Sequence}`);
          if (pendingTxCount > 0) {
            console.log(`📊 Found ${pendingTxCount} pending transactions`);
          }
          console.log(`📊 Using sequence: ${currentSequence}`);
        } else {
          console.log(`🔄 Retry ${retries}: Re-fetched account info, using sequence: ${currentSequence}`);
        }
        
        // Set sequence and prepare transaction
        payment.Sequence = currentSequence;
        const prepared = await this.client.autofill(payment);
        // Ensure sequence is correct after autofill (autofill might reset it)
        prepared.Sequence = currentSequence;
        
        // Sign the transaction
        const signed = regulatorWallet.sign(prepared);
        txHash = signed.hash;
        
        if (retries === 0) {
          console.log(`🔐 Transaction signed, hash: ${txHash}`);
        }
        
        // Submit the signed transaction blob
        response = await this.client.submit(signed.tx_blob);
        
        // Check if transaction was accepted
        const isAccepted = response.result.engine_result === 'tesSUCCESS';
        
        if (isAccepted) {
          console.log('✅ Bank Legitimacy VC submitted to XRPL:', txHash);
          console.log('   Status:', response.result.engine_result);
          break; // Success, exit retry loop
        } else if (response.result.engine_result === 'temREDUNDANT' && retries < maxRetries - 1) {
          // Sequence conflict - wait a bit and re-fetch account info for next retry
          retries++;
          console.warn(`⚠️ temREDUNDANT error (attempt ${retries}/${maxRetries}), re-fetching account info...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second for ledger to update
          continue; // Loop will re-fetch account info with updated sequence
        } else {
          // Other error or max retries reached
          console.warn('⚠️ Transaction not accepted:', response.result.engine_result_message || response.result.engine_result);
          break;
        }
      }
      
      return {
        success: true,
        vcId: vcData.id,
        txHash: txHash,
        vc: vcData,
        bankDid: bankDid,
        regulatorDid: regulatorDid,
        status: 'submitted', // Fast mode - submitted but not yet confirmed
        message: 'VC submitted to XRPL. Transaction will confirm in ~3-5 seconds.'
      };
    } catch (error) {
      console.error('❌ Error issuing Bank Legitimacy VC:', error);
      throw error;
    }
  }

  /**
   * Step 2: Bank issues User Payment History VC
   * 
   * Example: Bangalore Bank issues VC for user's 5 years of payment history
   * Links to Bank Legitimacy VC via chainOfTrust
   * 
   * @param {Object} params
   * @param {string} params.bankDid - DID of bank
   * @param {string} params.bankSecret - Bank's XRPL secret key
   * @param {string} params.userDid - DID of user (e.g., "did:xrpl:user:789")
   * @param {string} params.userAddress - User's wallet address
   * @param {Object} params.paymentHistory - Payment history data
   * @param {string} params.bankLegitimacyVCId - ID of bank's legitimacy VC (for chain)
   * 
   * @returns {Object} VC result with vcId and txHash
   */
  async issueUserPaymentHistoryVC({
    bankDid,
    bankSecret,
    userDid,
    userAddress,
    paymentHistory,
    bankLegitimacyVCId
  }) {
    try {
      await this.connect();

      // Create user payment history VC data
      const vcData = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: `vc:user:${userDid}:${Date.now()}`,
        type: ['VerifiableCredential', 'PaymentHistoryCredential'],
        issuer: { id: bankDid },
        issuanceDate: new Date().toISOString(),
        expirationDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months
        credentialSubject: {
          id: userDid,
          userAddress: userAddress,
          yearsOfHistory: paymentHistory.years || 0,
          onTimePayments: paymentHistory.onTimeCount || 0,
          totalPayments: paymentHistory.totalCount || 0,
          averageAmount: paymentHistory.averageAmount || 0,
          country: paymentHistory.country || 'Unknown',
          bankName: paymentHistory.bankName || 'Unknown'
        },
        proof: {
          type: 'Ed25519Signature2020',
          created: new Date().toISOString(),
          proofPurpose: 'assertionMethod',
          verificationMethod: `${bankDid}#keys-1`
        },
        chainOfTrust: bankLegitimacyVCId // Link to bank's legitimacy VC
      };

      // DEMO MODE: Store locally instead of XRPL
      if (this.useDemoMode) {
        const storage = loadDemoStorage();
        const txHash = generateDemoHash(vcData);
        
        // Store VC in demo storage
        storage.vcs.push({
          vcId: vcData.id,
          vc: vcData,
          txHash: txHash,
          type: 'PaymentHistoryCredential',
          issuerDid: bankDid,
          subjectDid: userDid,
          chainOfTrust: bankLegitimacyVCId,
          createdAt: new Date().toISOString()
        });
        
        storage.transactions.push({
          txHash: txHash,
          type: 'payment_history_vc',
          vcId: vcData.id,
          timestamp: new Date().toISOString()
        });
        
        saveDemoStorage(storage);
        
        console.log('✅ User Payment History VC issued (DEMO MODE):', txHash);
        console.log('   Stored locally, instantly confirmed');
        console.log('   Chain of Trust:', bankLegitimacyVCId);
        
        return {
          success: true,
          vcId: vcData.id,
          txHash: txHash,
          vc: vcData,
          userDid: userDid,
          bankDid: bankDid,
          chainOfTrust: bankLegitimacyVCId,
          status: 'confirmed',
          message: 'VC issued successfully (Demo Mode - stored locally)',
          demoMode: true
        };
      }

      // REAL XRPL MODE (if enabled)
      const { Wallet, convertStringToHex } = XRPL;
      const memoData = convertStringToHex(JSON.stringify(vcData));
      const bankWallet = Wallet.fromSeed(bankSecret);

      // Create payment transaction with VC in memo
      const payment = {
        TransactionType: 'Payment',
        Account: bankWallet.address,
        Destination: bankWallet.address, // Self-payment
        Amount: '1', // Minimum amount
        Memos: [
          {
            Memo: {
              MemoType: convertStringToHex('payment_history_vc'),
              MemoData: memoData,
              MemoFormat: convertStringToHex('application/json')
            }
          }
        ]
      };

      // Submit transaction with robust sequence number handling
      let response;
      let txHash;
      let retries = 0;
      const maxRetries = 5;
      
      while (retries < maxRetries) {
        // Get FRESH account info on each attempt (especially important for retries)
        const accountInfo = await this.client.request({
          command: 'account_info',
          account: bankWallet.address,
          ledger_index: 'current',
          queue: true // Include pending transactions
        });
        
        // account_data.Sequence is the NEXT sequence number to use
        let currentSequence = accountInfo.result.account_data.Sequence;
        
        // Add pending transaction count (these are already using sequence numbers)
        const pendingTxCount = accountInfo.result.queue_data?.txn_count || 0;
        currentSequence = currentSequence + pendingTxCount;
        
        if (retries === 0) {
          console.log(`📊 Account sequence: ${accountInfo.result.account_data.Sequence}`);
          if (pendingTxCount > 0) {
            console.log(`📊 Found ${pendingTxCount} pending transactions`);
          }
          console.log(`📊 Using sequence: ${currentSequence}`);
        } else {
          console.log(`🔄 Retry ${retries}: Re-fetched account info, using sequence: ${currentSequence}`);
        }
        
        // Set sequence and prepare transaction
        payment.Sequence = currentSequence;
        const prepared = await this.client.autofill(payment);
        // Ensure sequence is correct after autofill (autofill might reset it)
        prepared.Sequence = currentSequence;
        
        // Sign the transaction
        const signed = bankWallet.sign(prepared);
        txHash = signed.hash;
        
        if (retries === 0) {
          console.log(`🔐 Transaction signed, hash: ${txHash}`);
        }
        
        // Submit the signed transaction blob
        response = await this.client.submit(signed.tx_blob);
        
        // Check if transaction was accepted
        const isAccepted = response.result.engine_result === 'tesSUCCESS';
        
        if (isAccepted) {
          console.log('✅ User Payment History VC submitted to XRPL:', txHash);
          console.log('   Status:', response.result.engine_result);
          break; // Success, exit retry loop
        } else if (response.result.engine_result === 'temREDUNDANT' && retries < maxRetries - 1) {
          // Sequence conflict - wait a bit and re-fetch account info for next retry
          retries++;
          console.warn(`⚠️ temREDUNDANT error (attempt ${retries}/${maxRetries}), re-fetching account info...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second for ledger to update
          continue; // Loop will re-fetch account info with updated sequence
        } else {
          // Other error or max retries reached
          console.warn('⚠️ Transaction not accepted:', response.result.engine_result_message || response.result.engine_result);
          break;
        }
      }
      
      return {
        success: true,
        vcId: vcData.id,
        txHash: txHash,
        vc: vcData,
        userDid: userDid,
        bankDid: bankDid,
        chainOfTrust: bankLegitimacyVCId,
        status: 'submitted', // Fast mode - submitted but not yet confirmed
        message: 'VC submitted to XRPL. Transaction will confirm in ~3-5 seconds.'
      };
    } catch (error) {
      console.error('❌ Error issuing User Payment History VC:', error);
      throw error;
    }
  }

  /**
   * Step 3: Lender verifies VC Chain
   * 
   * Example: US lender verifies user's payment history by checking:
   * 1. User VC exists on XRPL
   * 2. Bank VC exists and is legitimate
   * 3. Regulator is trusted
   * 
   * @param {Object} params
   * @param {string} params.userVCId - ID of user's payment history VC
   * @param {Array<string>} params.trustedRegulators - List of trusted regulator DIDs
   * @param {string} params.verifierAddress - Address of verifier (lender)
   * 
   * @returns {Object} Verification result
   */
  async verifyVCChain({
    userVCId,
    trustedRegulators = [],
    verifierAddress
  }) {
    try {
      await this.connect();

      // DEMO MODE: Verify from local storage
      if (this.useDemoMode) {
        const storage = loadDemoStorage();
        
        // Find user VC
        const userVCData = storage.vcs.find(v => v.vcId === userVCId || v.vc.id === userVCId);
        if (!userVCData) {
          return {
            valid: false,
            reason: `User VC ${userVCId} not found (Demo Mode)`,
            chain: []
          };
        }

        const chain = [userVCData.vc];
        let currentVC = userVCData.vc;

        // Follow chain backwards
        while (currentVC.chainOfTrust && chain.length < 10) {
          const parentVCData = storage.vcs.find(v => 
            v.vcId === currentVC.chainOfTrust || v.vc.id === currentVC.chainOfTrust
          );
          if (!parentVCData) {
            return {
              valid: false,
              reason: `Parent VC ${currentVC.chainOfTrust} not found (Demo Mode)`,
              chain: chain
            };
          }
          chain.push(parentVCData.vc);
          currentVC = parentVCData.vc;
        }

        // Check if root issuer is trusted regulator
        const rootVC = chain[chain.length - 1];
        const rootIssuer = rootVC.issuer?.id || rootVC.issuer;
        
        const isTrusted = trustedRegulators.some(regulator => 
          regulator.toLowerCase() === rootIssuer.toLowerCase()
        );

        // Verify chain integrity
        let chainValid = true;
        for (let i = 0; i < chain.length - 1; i++) {
          const child = chain[i];
          const parent = chain[i + 1];
          if (child.chainOfTrust !== parent.id) {
            chainValid = false;
            break;
          }
        }

        const isValid = isTrusted && chainValid;

        console.log(`🔍 VC Chain Verification (DEMO MODE): ${isValid ? '✅ VALID' : '❌ INVALID'}`);
        console.log(`   Chain length: ${chain.length}`);
        console.log(`   Root issuer: ${rootIssuer}`);
        console.log(`   Trusted: ${isTrusted}`);
        console.log(`   Chain integrity: ${chainValid}`);

        return {
          valid: isValid,
          userVCId: userVCId,
          chain: chain.map(vc => ({
            id: vc.id,
            type: Array.isArray(vc.type) ? vc.type[1] : vc.type,
            issuer: vc.issuer?.id || vc.issuer,
            subject: vc.credentialSubject?.id,
            chainOfTrust: vc.chainOfTrust
          })),
          rootIssuer: rootIssuer,
          isTrusted: isTrusted,
          chainIntegrity: chainValid,
          verifiedBy: verifierAddress,
          verifiedAt: new Date().toISOString(),
          demoMode: true
        };
      }

      // REAL XRPL MODE
      // Step 1: Fetch user VC from XRPL
      const userVC = await this.fetchVCFromXRPL(userVCId);
      if (!userVC) {
        return {
          valid: false,
          reason: `User VC ${userVCId} not found on XRPL`,
          chain: []
        };
      }

      const chain = [userVC];
      let currentVC = userVC;

      // Step 2: Follow chain backwards
      while (currentVC.chainOfTrust && chain.length < 10) { // Max depth protection
        const parentVC = await this.fetchVCFromXRPL(currentVC.chainOfTrust);
        if (!parentVC) {
          return {
            valid: false,
            reason: `Parent VC ${currentVC.chainOfTrust} not found on XRPL`,
            chain: chain
          };
        }
        chain.push(parentVC);
        currentVC = parentVC;
      }

      // Step 3: Check if root issuer is trusted regulator
      const rootVC = chain[chain.length - 1];
      const rootIssuer = rootVC.issuer?.id || rootVC.issuer;
      
      const isTrusted = trustedRegulators.some(regulator => 
        regulator.toLowerCase() === rootIssuer.toLowerCase()
      );

      // Step 4: Verify chain integrity
      let chainValid = true;
      for (let i = 0; i < chain.length - 1; i++) {
        const child = chain[i];
        const parent = chain[i + 1];
        if (child.chainOfTrust !== parent.id) {
          chainValid = false;
          break;
        }
      }

      const isValid = isTrusted && chainValid;

      console.log(`🔍 VC Chain Verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      console.log(`   Chain length: ${chain.length}`);
      console.log(`   Root issuer: ${rootIssuer}`);
      console.log(`   Trusted: ${isTrusted}`);
      console.log(`   Chain integrity: ${chainValid}`);

      return {
        valid: isValid,
        userVCId: userVCId,
        chain: chain.map(vc => ({
          id: vc.id,
          type: Array.isArray(vc.type) ? vc.type[1] : vc.type,
          issuer: vc.issuer?.id || vc.issuer,
          subject: vc.credentialSubject?.id,
          chainOfTrust: vc.chainOfTrust
        })),
        rootIssuer: rootIssuer,
        isTrusted: isTrusted,
        chainIntegrity: chainValid,
        verifiedBy: verifierAddress,
        verifiedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error verifying VC chain:', error);
      throw error;
    }
  }

  /**
   * Fetch VC from XRPL by ID
   * 
   * @param {string} vcId - VC ID to fetch
   * @returns {Object|null} VC data or null if not found
   */
  async fetchVCFromXRPL(vcId) {
    try {
      await this.connect();

      // Get account transactions
      const transactions = await this.client.request({
        command: 'account_tx',
        account: this.accountAddress,
        limit: 1000
      });

      // Search for VC in transaction memos
      for (const tx of transactions.result.transactions) {
        if (tx.tx && tx.tx.Memos) {
          for (const memo of tx.tx.Memos) {
            try {
              const memoType = Buffer.from(memo.Memo.MemoType, 'hex').toString('utf8');
              
              if (memoType === 'bank_legitimacy_vc' || memoType === 'payment_history_vc' || memoType === 'vc') {
                const memoData = Buffer.from(memo.Memo.MemoData, 'hex').toString('utf8');
                const vcData = JSON.parse(memoData);

                // Check if this is the VC we're looking for
                if (vcData.id === vcId) {
                  return vcData;
                }
              }
            } catch (e) {
              // Skip invalid memos
              continue;
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error fetching VC from XRPL:', error);
      return null;
    }
  }

  /**
   * Get all VCs for a user
   * 
   * @param {string} userDid - User's DID
   * @returns {Array} Array of VCs
   */
  async getUserVCs(userDid) {
    try {
      await this.connect();

      // DEMO MODE: Fetch from local storage
      if (this.useDemoMode) {
        const storage = loadDemoStorage();
        const userVCs = storage.vcs.filter(v => {
          const subjectId = v.vc.credentialSubject?.id || v.vc.credentialSubject?.userAddress;
          return subjectId && subjectId.toLowerCase().includes(userDid.toLowerCase());
        });
        return userVCs.map(v => ({
          ...v.vc,
          txHash: v.txHash,
          date: v.createdAt
        }));
      }

      // REAL XRPL MODE
      const transactions = await this.client.request({
        command: 'account_tx',
        account: this.accountAddress,
        limit: 1000
      });

      const vcs = [];

      for (const tx of transactions.result.transactions) {
        if (tx.tx && tx.tx.Memos) {
          for (const memo of tx.tx.Memos) {
            try {
              const memoType = Buffer.from(memo.Memo.MemoType, 'hex').toString('utf8');
              
              if (memoType === 'payment_history_vc' || memoType === 'vc') {
                const memoData = Buffer.from(memo.Memo.MemoData, 'hex').toString('utf8');
                const vcData = JSON.parse(memoData);

                const subjectId = vcData.credentialSubject?.id || vcData.credentialSubject?.userAddress;
                if (subjectId && subjectId.toLowerCase().includes(userDid.toLowerCase())) {
                  vcs.push({
                    ...vcData,
                    txHash: tx.tx.hash,
                    date: new Date(tx.tx.date * 1000).toISOString()
                  });
                }
              }
            } catch (e) {
              continue;
            }
          }
        }
      }

      return vcs;
    } catch (error) {
      console.error('❌ Error fetching user VCs:', error);
      return [];
    }
  }
}

module.exports = XRPLCrossBorderService;

