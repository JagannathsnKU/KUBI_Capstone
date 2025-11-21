/**
 * VC Issuance Integration for Plaid and Quest Completion
 * Issues VCs when:
 * 1. Plaid account is connected
 * 2. Quest is completed
 * 
 * Uses XRPL to store VCs on blockchain
 */

import { XRPLVCManager, VerifiableCredential } from './xrpl-vc-chain.js';
import { getXRPLConfig, isXRPLConfigured } from './xrpl-config.js';
import { issueDemoVC } from './xrpl-vc-chain.js';

// Global XRPL manager instance
let xrplManager = null;

/**
 * Initialize XRPL connection
 */
async function initXRPL() {
  // Browser detection - XRPLVCManager cannot be used in browser
  if (typeof window !== 'undefined') {
    console.log('🌐 Browser environment detected - using demo mode for VC issuance');
    return null;
  }
  
  if (xrplManager) return xrplManager;
  
  const config = getXRPLConfig();
  
  // Check if XRPL is configured
  if (!isXRPLConfigured()) {
    console.warn('⚠️ XRPL not configured - using demo mode. Get testnet account from: https://xrpl.org/xrp-testnet-faucet.html');
    return null;
  }
  
  try {
    xrplManager = new XRPLVCManager(config.accountAddress, config.accountSecret);
    await xrplManager.connect();
    console.log('✅ XRPL connected for VC storage');
    return xrplManager;
  } catch (error) {
    console.error('❌ Failed to connect to XRPL:', error);
    console.warn('⚠️ Falling back to demo mode');
    return null;
  }
}

/**
 * Issue VC when Plaid account is connected
 * Stores VC on XRPL blockchain for cross-border credit verification
 * 
 * Why XRPL? This VC proves the user has a bank account in their home country,
 * which can be verified by lenders in other countries (solving the "immigrant problem")
 */
async function issuePlaidConnectionVC(plaidMetadata) {
  // Browser environment - use demo mode directly
  if (typeof window !== 'undefined') {
    console.log('🌐 Browser environment - issuing Plaid Connection VC in demo mode');
    const result = await issueDemoVC({
      type: 'PlaidAccountConnection',
      issuerDid: 'did:demo:PlaidSandbox:001',
      subjectDid: 'did:demo:user:001',
      credentialSubject: {
        accountType: plaidMetadata?.institution?.name || 'Bank Account',
        institutionId: plaidMetadata?.institution?.institution_id || 'unknown',
        accountsLinked: plaidMetadata?.accounts?.length || 0,
        connectionDate: new Date().toISOString(),
        verified: true
      }
    });
    console.log('✅ Plaid Connection VC issued (DEMO MODE):', result.vcId);
    addVCToWalletFromXRPL(result);
    return result;
  }
  
  // Node.js environment - try XRPL
  const manager = await initXRPL();
  
  const vc = new VerifiableCredential({
    id: `vc:plaid:${Date.now()}`,
    type: 'PlaidAccountConnection',
    issuerDid: 'did:xrpl:PlaidSandbox:001',
    subjectDid: 'did:xrpl:user:001',
    credentialSubject: {
      accountType: plaidMetadata?.institution?.name || 'Bank Account',
      institutionId: plaidMetadata?.institution?.institution_id || 'unknown',
      accountsLinked: plaidMetadata?.accounts?.length || 0,
      connectionDate: new Date().toISOString(),
      verified: true
    },
    issuanceDate: new Date().toISOString(),
    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
    proof: {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      proofPurpose: 'assertionMethod',
      verificationMethod: 'did:xrpl:PlaidSandbox:001#keys-1'
    }
  });

  let result;
  
  // Try XRPL first, fallback to demo if not configured
  if (manager) {
    try {
      result = await manager.issueVC(vc);
      console.log('✅ Plaid Connection VC issued on XRPL:', result.txHash);
    } catch (error) {
      console.error('XRPL issuance failed, using demo mode:', error);
      result = await issueDemoVC({
        type: 'PlaidAccountConnection',
        issuerDid: 'did:demo:PlaidSandbox:001',
        subjectDid: 'did:demo:user:001',
        credentialSubject: vc.credentialSubject
      });
    }
  } else {
    // Demo mode
    result = await issueDemoVC({
      type: 'PlaidAccountConnection',
      issuerDid: 'did:demo:PlaidSandbox:001',
      subjectDid: 'did:demo:user:001',
      credentialSubject: vc.credentialSubject
    });
    console.log('✅ Plaid Connection VC issued (DEMO MODE):', result.vcId);
  }
  
  // Add to wallet
  addVCToWalletFromXRPL(result);
  
  return result;
}

/**
 * Issue VC when quest is completed
 * Stores VC on XRPL blockchain for cross-border credit verification
 * 
 * Why XRPL? This VC links the Polygon NFT achievement to the cross-border credit system.
 * Lenders in other countries can verify quest completions globally.
 * 
 * Note: The actual NFT is minted on Polygon (for achievement badges).
 * This XRPL VC proves the quest completion is verifiable globally.
 */
async function issueQuestCompletionVC(questId, questTitle, txHash, tokenId, userAddress) {
  // Browser environment - use demo mode directly
  if (typeof window !== 'undefined') {
    console.log('🌐 Browser environment - issuing Quest Completion VC in demo mode');
    const result = await issueDemoVC({
      type: 'QuestCompletionCredential',
      issuerDid: 'did:demo:PlaidQuestSystem:001',
      subjectDid: `did:demo:user:${userAddress?.slice(2, 10) || '001'}`,
      credentialSubject: {
        questId: questId,
        questTitle: questTitle,
        completionDate: new Date().toISOString(),
        transactionHash: txHash,
        nftTokenId: tokenId || null,
        verified: true,
        onChain: true
      }
    });
    console.log('✅ Quest Completion VC issued (DEMO MODE):', result.vcId);
    addVCToWalletFromXRPL(result);
    return result;
  }
  
  // Node.js environment - try XRPL
  const manager = await initXRPL();
  
  const vc = new VerifiableCredential({
    id: `vc:quest:${questId}:${Date.now()}`,
    type: 'QuestCompletionCredential',
    issuerDid: 'did:xrpl:PlaidQuestSystem:001',
    subjectDid: `did:xrpl:user:${userAddress?.slice(2, 10) || '001'}`,
    credentialSubject: {
      questId: questId,
      questTitle: questTitle,
      completionDate: new Date().toISOString(),
      transactionHash: txHash,
      nftTokenId: tokenId || null,
      verified: true,
      onChain: true
    },
    issuanceDate: new Date().toISOString(),
    expirationDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString(), // 2 years
    proof: {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      proofPurpose: 'assertionMethod',
      verificationMethod: 'did:xrpl:PlaidQuestSystem:001#keys-1'
    }
  });

  let result;
  
  // Try XRPL first, fallback to demo if not configured
  if (manager) {
    try {
      result = await manager.issueVC(vc);
      console.log('✅ Quest Completion VC issued on XRPL:', result.txHash);
    } catch (error) {
      console.error('XRPL issuance failed, using demo mode:', error);
      result = await issueDemoVC({
        type: 'QuestCompletionCredential',
        issuerDid: 'did:demo:PlaidQuestSystem:001',
        subjectDid: `did:demo:user:${userAddress?.slice(2, 10) || '001'}`,
        credentialSubject: vc.credentialSubject
      });
    }
  } else {
    // Demo mode
    result = await issueDemoVC({
      type: 'QuestCompletionCredential',
      issuerDid: 'did:demo:PlaidQuestSystem:001',
      subjectDid: `did:demo:user:${userAddress?.slice(2, 10) || '001'}`,
      credentialSubject: vc.credentialSubject
    });
    console.log('✅ Quest Completion VC issued (DEMO MODE):', result.vcId);
  }
  
  // Add to wallet
  addVCToWalletFromXRPL(result);
  
  return result;
}

/**
 * Add VC from XRPL/demo system to wallet
 * Handles both backend API responses and direct VC objects
 */
function addVCToWalletFromXRPL(xrplResult) {
  // Handle backend API response format
  const vc = xrplResult.vc || xrplResult;
  const vcType = Array.isArray(vc.type) ? (vc.type[1] || vc.type[0]) : vc.type;
  const credentialSubject = vc.credentialSubject || {};
  const issuer = vc.issuer?.id || vc.issuer || 'Unknown';
  const subject = credentialSubject.id || vc.subjectDid || 'Unknown';
  
  const walletVC = {
    type: vcType,
    issuer: issuer,
    subject: subject,
    fact: formatVCFact(credentialSubject),
    signature: xrplResult.vcId || xrplResult.id || 'unknown',
    chainOfTrust: vc.chainOfTrust || null,
    verified: !xrplResult.demoMode, // Real XRPL VCs are verified, demo ones are auto-verified
    verificationChain: [],
    xrplTxHash: xrplResult.txHash || null,
    xrplExplorer: xrplResult.xrplExplorer || null,
    creditScore: calculateCreditScore(vcType, credentialSubject) // Award credit score points (1-100 scale)
  };

  // Add to wallet
  let vcs = [];
  try {
    vcs = JSON.parse(localStorage.getItem('vc_wallet') || '[]');
  } catch {}
  
  vcs.push(walletVC);
  localStorage.setItem('vc_wallet', JSON.stringify(vcs));
  
  // Trigger wallet refresh if on wallet page
  if (typeof renderVCs === 'function') {
    renderVCs();
  }
  
  return walletVC;
}

/**
 * Format VC credential subject as readable fact
 */
function formatVCFact(credentialSubject) {
  if (!credentialSubject) return 'No details';
  
  const facts = [];
  
  if (credentialSubject.accountType) {
    facts.push(`Account: ${credentialSubject.accountType}`);
  }
  if (credentialSubject.questTitle) {
    facts.push(`Quest: ${credentialSubject.questTitle}`);
  }
  if (credentialSubject.yearsOfHistory) {
    facts.push(`${credentialSubject.yearsOfHistory} years history`);
  }
  if (credentialSubject.onTimePayments) {
    facts.push(`${credentialSubject.onTimePayments} on-time payments`);
  }
  if (credentialSubject.verified) {
    facts.push('Verified');
  }
  if (credentialSubject.onChain) {
    facts.push('On-chain');
  }
  
  return facts.length > 0 ? facts.join(', ') : 'Credential issued';
}

/**
 * Calculate credit score points for VC type (1-100 scale)
 * Supports both financial and non-financial credentials
 * Includes cross-border VCs with dynamic point calculation
 * 
 * Conversion: Old FICO points (0-50 range) → New Credit Score (1-10 range)
 * The score is cumulative and contributes to overall 1-100 credit score
 */
function calculateCreditScore(vcType, credentialSubject = null) {
  const pointsMap = {
    // Financial VCs (converted to 1-10 scale)
    'PlaidAccountConnection': 3,      // was 25
    'QuestCompletionCredential': 3,  // was 30
    'PaymentHistoryCredential': 5,    // was 50
    'RentPaymentHistory': 3,          // was 30
    'EmploymentLetter': 4,             // was 35
    'BankLegitimacyCredential': 0,    // No points for bank legitimacy
    
    // Cross-Border VCs (dynamic calculation)
    'UserPaymentHistoryCredential': 0, // Calculated dynamically below
    'CrossBorderPaymentHistory': 0,    // Calculated dynamically below
    
    // Education & Skills VCs
    'EducationDegree': 3,              // was 25
    'ProfessionalCertification': 2,    // was 20
    'OnlineCourseCompletion': 2,       // was 15
    'LanguageProficiency': 2,          // was 18
    
    // Tech & Development VCs
    'GitHubVerifiedDev': 2,            // was 20
    'OpenSourceContributions': 2,       // was 22
    'BlockchainDeveloper': 2,           // was 18
    
    // Community & Social Impact VCs
    'DAOMembership': 3,                // was 25
    'CommunityService': 2,              // was 20
    'SocialImpactProject': 2,            // was 22
    'VolunteerWork': 2,                 // was 15
    
    // Creative & Portfolio VCs
    'CreativePortfolio': 2,             // was 18
    'PublishedContent': 2,              // was 15
    'ArtDesignWork': 2,                 // was 20
    
    // Health & Wellness VCs
    'FitnessAchievement': 2,            // was 15
    'HealthCertification': 1,           // was 12
    
    // Reputation & Trust VCs
    'VerifiedIdentity': 2,              // was 20
    'ReputationScore': 2,               // was 18
    'TrustBadge': 3                     // was 25
  };
  
  // Special handling for cross-border payment history VCs
  if (vcType === 'UserPaymentHistoryCredential' || vcType === 'CrossBorderPaymentHistory' || 
      vcType === 'PaymentHistoryCredential' && credentialSubject) {
    return calculateCrossBorderCreditScore(credentialSubject);
  }
  
  // Try exact match first
  if (pointsMap[vcType]) {
    return pointsMap[vcType];
  }
  
  // Try case-insensitive match
  const lowerType = vcType.toLowerCase();
  for (const [key, value] of Object.entries(pointsMap)) {
    if (key.toLowerCase() === lowerType) {
      return value;
    }
  }
  
  // Default for unknown types (1 point minimum)
  return 1;
}

/**
 * Calculate credit score points from cross-border VC credential subject (1-100 scale)
 * Awards points based on payment history, rent payments, and account age
 * Returns value between 1-10 that contributes to overall credit score
 */
function calculateCrossBorderCreditScore(credentialSubject) {
  if (!credentialSubject) return 5; // Default for payment history (1-100 scale: 5 points)
  
  let points = 0;
  
  // Payment history points (years of history) - converted to 1-10 scale
  const years = credentialSubject.yearsOfHistory || 
                credentialSubject.years || 
                (credentialSubject.paymentHistory?.years) || 0;
  points += Math.min(5, Math.floor(years * 0.5)); // Up to 5 points for years (was 50)
  
  // On-time payment rate
  const onTimeCount = credentialSubject.onTimeCount || 
                      credentialSubject.onTimePayments || 
                      (credentialSubject.paymentHistory?.onTimeCount) || 0;
  const totalCount = credentialSubject.totalCount || 
                     credentialSubject.totalPayments || 
                     (credentialSubject.paymentHistory?.totalCount) || 1;
  const onTimeRate = onTimeCount / totalCount;
  
  // On-time payment bonus (converted to 1-10 scale)
  if (onTimeRate >= 0.95) {
    points += 3; // Excellent payment history (was 30)
  } else if (onTimeRate >= 0.90) {
    points += 2; // Good payment history (was 20)
  } else if (onTimeRate >= 0.80) {
    points += 1; // Fair payment history (was 10)
  }
  
  // Rent payment history (if available) - converted to 1-10 scale
  const rentPayments = credentialSubject.rentPayments || 
                       credentialSubject.paymentHistory?.rentPayments;
  if (rentPayments) {
    const rentOnTime = rentPayments.onTimeCount || rentPayments.onTime || 0;
    if (rentOnTime >= 24) {
      points += 3; // 2+ years of on-time rent (was 25)
    } else if (rentOnTime >= 12) {
      points += 2; // 1 year of on-time rent (was 15)
    } else if (rentOnTime >= 6) {
      points += 1; // 6 months of on-time rent (was 10)
    }
  }
  
  // Account age bonus - converted to 1-10 scale
  const accountAgeMonths = credentialSubject.accountAgeMonths || 
                          credentialSubject.accountAge || 
                          (credentialSubject.paymentHistory?.accountAgeMonths) || 0;
  if (accountAgeMonths >= 24) {
    points += 2; // 2+ years account age (was 15)
  } else if (accountAgeMonths >= 12) {
    points += 1; // 1 year account age (was 10)
  }
  
  // Average payment amount (stability indicator) - converted to 1-10 scale
  const avgAmount = credentialSubject.averageAmount || 
                    credentialSubject.averagePaymentAmount || 
                    (credentialSubject.paymentHistory?.averageAmount) || 0;
  if (avgAmount > 0) {
    points += Math.min(1, Math.floor(avgAmount / 1000)); // Up to 1 point for payment size (was 10)
  }
  
  // Clamp between 1-10 points (contributing to 1-100 overall credit score)
  return Math.max(1, Math.min(10, points));
}

// Export functions
export {
  issuePlaidConnectionVC,
  issueQuestCompletionVC,
  addVCToWalletFromXRPL
};

// Make available globally for use in professional-mode.js
if (typeof window !== 'undefined') {
  window.issuePlaidConnectionVC = issuePlaidConnectionVC;
  window.issueQuestCompletionVC = issueQuestCompletionVC;
  window.addVCToWalletFromXRPL = addVCToWalletFromXRPL;
}

