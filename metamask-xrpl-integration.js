
function isMetaMaskInstalled() {
  return typeof window !== 'undefined' && 
         typeof window.ethereum !== 'undefined' && 
         window.ethereum.isMetaMask;
}

async function connectXRPLSnap() {
  try {
    
    const result = await window.ethereum.request({
      method: 'wallet_requestSnaps',
      params: {
        'npm:xrpl-snap': {}
      }
    });

    console.log('✅ XRPL Snap connected:', result);
    console.log('✅ MetaMask XRPL Ledger connection confirmed');
    
    // Show user-friendly confirmation
    if (typeof window.showToast === 'function') {
      window.showToast('✅ Connected to XRPL Ledger via MetaMask', 'success');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Failed to connect to XRPL Snap:', error);
    throw error;
  }
}
 
async function getXRPLAccount() {
  try {
    await connectXRPLSnap();
    
    
    const accountResult = await window.ethereum.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: 'npm:xrpl-snap',
        request: {
          method: 'xrpl_getAccount'
        }
      }
    });
    
    console.log('✅ XRPL account retrieved:', accountResult);
    return accountResult;
  } catch (error) {
    console.error('❌ Failed to get XRPL account:', error);
    // Don't throw - we can still proceed without explicit account
    // The Snap will derive it automatically from MetaMask account
    return { address: null };
  }
}

/**
 * Issue VC on XRPL using MetaMask XRPL Snap
 * @param {Object} vcData - Verifiable Credential data
 * @returns {Promise<Object>} Transaction result with txHash
 */
async function issueVCOnXRPL(vcData) {
  try {
    // Connect to XRPL Snap
    await connectXRPLSnap();

    // Create VC data structure
    const vc = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      id: vcData.id,
      type: ['VerifiableCredential', vcData.type],
      issuer: { id: vcData.issuerDid },
      issuanceDate: vcData.issuanceDate,
      expirationDate: vcData.expirationDate,
      credentialSubject: {
        id: vcData.subjectDid,
        ...vcData.credentialSubject
      },
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        proofPurpose: 'assertionMethod',
        verificationMethod: `${vcData.issuerDid}#keys-1`
      }
    };

    // Helper to convert string to hex (XRPL requires hex-encoded strings)
    function stringToHex(str) {
      return Array.from(str)
        .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('');
    }

    // Convert VC JSON to hex for memo
    const vcJson = JSON.stringify(vc);
    const vcHex = stringToHex(vcJson);

    // Get account address first (required for self-payment Destination)
    // XRPL Snap will derive from MetaMask account, but we need it for self-payment
    let accountAddress = null;
    try {
      const accountResult = await getXRPLAccount();
      // The result might be a string (address) or an object with address/account field
      accountAddress = typeof accountResult === 'string' 
        ? accountResult 
        : (accountResult?.address || accountResult?.account || accountResult);
      console.log('✅ Got XRPL account address:', accountAddress);
      
      // Validate account address format (should start with 'r')
      if (!accountAddress || typeof accountAddress !== 'string' || !accountAddress.startsWith('r')) {
        throw new Error('Invalid account address format');
      }
      
      // Check account info to see if there are pending transactions
      try {
        const accountInfo = await window.ethereum.request({
          method: 'wallet_invokeSnap',
          params: {
            snapId: 'npm:xrpl-snap',
            request: {
              method: 'xrpl_request',
              params: {
                command: 'account_info',
                account: accountAddress,
                queue: true
              }
            }
          }
        });
        
        const pendingCount = accountInfo?.result?.queue_data?.txn_count || 0;
        const currentSequence = accountInfo?.result?.account_data?.Sequence || 0;
        
        console.log('📊 MetaMask XRPL Account Info:', {
          address: accountAddress,
          currentSequence: currentSequence,
          pendingTransactions: pendingCount,
          balance: accountInfo?.result?.account_data?.Balance ? 
            (parseFloat(accountInfo.result.account_data.Balance) / 1000000).toFixed(6) + ' XRP' : 'unknown'
        });
        
        if (pendingCount > 0) {
          console.warn(`⚠️ Account has ${pendingCount} pending transactions. This may cause sequence conflicts.`);
          console.warn(`⚠️ Consider waiting ${pendingCount * 3} seconds for transactions to clear.`);
        }
      } catch (infoError) {
        console.warn('⚠️ Could not get account info:', infoError.message);
      }
    } catch (e) {
      console.error('❌ Failed to get account address:', e);
      throw new Error('Cannot proceed without XRPL account address. Please ensure MetaMask XRPL Snap is properly connected.');
    }

    // Create payment transaction with VC in memo
    // XRPL Snap handles sequence numbers, fees, and LastLedgerSequence automatically!
    // For self-payment, we need the same account as source and destination
    // Note: Transaction params go directly in params, not wrapped in a transaction object
    // Amount must be a string in drops (1 drop = 0.000001 XRP)
    const transactionParams = {
      TransactionType: 'Payment',
      Account: accountAddress, // Required - source account
      Destination: accountAddress, // Self-payment - same account as destination
      Amount: '1', // Minimum amount in drops (1 drop = 0.000001 XRP)
      Memos: [
        {
          Memo: {
            MemoType: stringToHex('VC'),
            MemoData: vcHex,
            MemoFormat: stringToHex('application/json')
          }
        }
      ]
    };
    
    console.log('📝 Transaction params:', {
      ...transactionParams,
      Memos: transactionParams.Memos.map(m => ({
        ...m,
        Memo: {
          ...m.Memo,
          MemoData: `[${m.Memo.MemoData.length} bytes]` // Don't log full VC data
        }
      }))
    });

    // Sign and submit transaction via XRPL Snap
    // Use the correct API method: xrpl_signAndSubmit
    // Transaction params go directly in params, not wrapped
    console.log('🔷 Signing and submitting transaction via XRPL Snap...');
    
    let result;
    try {
      result = await window.ethereum.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId: 'npm:xrpl-snap',
          request: {
            method: 'xrpl_signAndSubmit',
            params: transactionParams
          }
        }
      });
      
      console.log('✅ Transaction submitted successfully:', result);
    } catch (autofillError) {
      // If autofill fails, it might be due to:
      // 1. Network connection issue
      // 2. Account not activated on XRPL (needs initial funding with XRP)
      // 3. Invalid transaction structure
      // 4. Missing required fields
      // 5. XRPL Snap network connectivity issues
      
      console.error('❌ Autofill failed:', autofillError);
      
      // Provide helpful error message
      const errorMessage = autofillError.message || 'Unknown error';
      const errorCode = autofillError.code;
      
      if (errorMessage.includes('autofill') || errorCode === -32603) {
        console.log('💡 Autofill error detected - common causes:');
        console.log('   1. XRPL account not activated (needs initial funding with XRP)');
        console.log('   2. XRPL Snap cannot connect to XRPL network');
        console.log('   3. Network configuration issue');
        console.log('   4. Insufficient XRP balance for transaction fee');
        
        // Check if we can get network info
        try {
          const networkInfo = await window.ethereum.request({
            method: 'wallet_invokeSnap',
            params: {
              snapId: 'npm:xrpl-snap',
              request: {
                method: 'xrpl_getActiveNetwork'
              }
            }
          });
          console.log('📡 Active network:', networkInfo);
        } catch (e) {
          console.log('⚠️ Could not get network info');
        }
        
        // Create a more descriptive error
        const enhancedError = new Error(
          `XRPL transaction autofill failed. This usually means your XRPL account needs to be activated with XRP, or there's a network connectivity issue. ` +
          `Error: ${errorMessage}. ` +
          `Please ensure your XRPL account is funded or use the backend API fallback.`
        );
        enhancedError.code = errorCode;
        enhancedError.originalError = autofillError;
        enhancedError.canFallback = true; // Flag to indicate fallback is possible
        
        throw enhancedError;
      }
      
      throw autofillError;
    }

    console.log('✅ Transaction submitted successfully:', result);
    console.log('📋 Full result structure:', JSON.stringify(result, null, 2));
    
    // Check if transaction was actually applied
    const txResult = result?.result || result;
    const engineResult = txResult?.engine_result;
    const applied = txResult?.applied;
    const broadcast = txResult?.broadcast;
    
    console.log('📊 Transaction status:', {
      engineResult: engineResult,
      applied: applied,
      broadcast: broadcast,
      status: txResult?.status
    });
    
    // Handle temREDUNDANT error (sequence number already used)
    // No retries - immediately fall back to backend API
    if (engineResult === 'temREDUNDANT') {
      console.warn('⚠️ Transaction rejected: temREDUNDANT (sequence number already used)');
      console.log('💡 MetaMask XRPL Snap cannot handle sequence numbers reliably.');
      console.log('💡 Falling back to backend API which has better sequence management.');
      throw new Error('Transaction redundant. Falling back to backend API.');
    }
    
    // Check if transaction was actually applied
    if (!applied && engineResult !== 'tesSUCCESS') {
      console.error('❌ Transaction was not applied:', {
        engineResult: engineResult,
        message: txResult?.engine_result_message,
        applied: applied
      });
      throw new Error(`Transaction failed: ${engineResult} - ${txResult?.engine_result_message || 'Unknown error'}`);
    }
    
    // Extract transaction hash from result
    // The XRPL Snap result structure may vary, so try multiple possible fields
    const txHash = txResult?.tx_json?.hash ||
                   txResult?.hash || 
                   result?.txHash || 
                   result?.id || 
                   result?.result?.hash ||
                   result?.result?.tx_json?.hash;
    
    if (!txHash) {
      console.warn('⚠️ Could not extract transaction hash from result:', result);
      console.log('💡 The transaction may have been submitted but hash format is unexpected');
    } else {
      console.log('✅ Transaction hash extracted:', txHash);
      
      // If transaction was applied, verify it's on ledger
      if (applied) {
        console.log('✅ Transaction was applied to ledger!');
        
        // Wait a bit for confirmation
        console.log('⏳ Waiting 3 seconds for transaction to be confirmed...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Try to verify transaction using xrpl_request
        try {
          const txInfo = await window.ethereum.request({
            method: 'wallet_invokeSnap',
            params: {
              snapId: 'npm:xrpl-snap',
              request: {
                method: 'xrpl_request',
                params: {
                  command: 'tx',
                  transaction: txHash
                }
              }
            }
          });
          
          if (txInfo?.result && txInfo.result.validated) {
            console.log('✅ Transaction verified on ledger!');
            console.log('   Ledger Index:', txInfo.result.ledger_index);
            console.log('   Status:', txInfo.result.meta?.TransactionResult || 'tesSUCCESS');
          } else {
            console.warn('⚠️ Transaction not yet validated on ledger (may need more time)');
          }
        } catch (verifyError) {
          console.warn('⚠️ Could not verify transaction immediately:', verifyError.message);
          console.log('💡 Transaction may still be pending. Check explorer in a few seconds.');
        }
      } else {
        console.warn('⚠️ Transaction hash exists but transaction was not applied');
        console.log('💡 This might be a pending transaction. Check explorer in a few seconds.');
      }
    }
    
    // Only return success if transaction was actually applied
    if (!applied) {
      throw new Error(`Transaction was not applied to ledger. Engine result: ${engineResult}. Please try again or use backend API.`);
    }
    
    return {
      success: true,
      txHash: txHash,
      vcId: vcData.id,
      vc: vc,
      xrplExplorer: txHash ? `https://testnet.xrpl.org/transactions/${txHash}` : null,
      demoMode: false,
      rawResult: result, // Include raw result for debugging
      note: txHash ? 'Transaction submitted and applied. It may take a few seconds to appear on the explorer.' : 'Transaction applied but hash could not be extracted.'
    };
  } catch (error) {
    console.error('❌ Failed to issue VC on XRPL:', error);
    throw error;
  }
}

/**
 * Issue Plaid Connection VC using MetaMask XRPL Snap
 * After MetaMask connects, VC is issued
 */
async function issuePlaidConnectionVCWithMetaMask(plaidMetadata) {
  try {
    // Connect to MetaMask XRPL Snap first (for confirmation)
    await connectXRPLSnap();
    
    // Issue VC after connection
    console.log('🌐 Issuing VC (MetaMask XRPL connected)');
    
    // Import VC function
    const { issueDemoVC } = await import('./xrpl-vc-chain.js');
    
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
    
    console.log('✅ Plaid Connection VC issued (MetaMask XRPL connected):', result.vcId);
    return {
      ...result,
      demoMode: true,
      metamaskConnected: true,
      note: 'VC issued after MetaMask XRPL connection'
    };
  } catch (error) {
    console.error('❌ Failed to issue Plaid VC:', error);
    throw error;
  }
}

/**
 * Issue Quest Completion VC using MetaMask XRPL Snap
 * After MetaMask connects, VC is issued
 */
async function issueQuestCompletionVCWithMetaMask(questId, questTitle, txHash, tokenId, userAddress) {
  try {
    // Connect to MetaMask XRPL Snap first - THIS TRIGGERS THE POPUP
    console.log('🔷 Requesting MetaMask XRPL Snap connection...');
    const snapResult = await connectXRPLSnap();
    console.log('✅ MetaMask XRPL Snap connected:', snapResult);
    
    // Issue VC after connection
    console.log('🌐 Issuing VC (MetaMask XRPL connected)');
    
    // Import VC function
    const { issueDemoVC } = await import('./xrpl-vc-chain.js');
    
    const result = await issueDemoVC({
      type: 'QuestCompletionCredential',
      issuerDid: 'did:demo:PlaidQuestSystem:001',
      subjectDid: `did:demo:user:${userAddress?.slice(2, 10) || '001'}`,
      credentialSubject: {
        questId: questId,
        questTitle: questTitle,
        polygonTxHash: txHash,
        polygonTokenId: tokenId,
        completionDate: new Date().toISOString(),
        verified: true,
        onChain: true
      }
    });
    
    console.log('✅ Quest Completion VC issued (MetaMask XRPL connected):', result.vcId);
    return {
      ...result,
      demoMode: true,
      metamaskConnected: true,
      note: 'VC issued after MetaMask XRPL connection'
    };
  } catch (error) {
    console.error('❌ Failed to issue Quest VC:', error);
    // Don't retry - just throw (0 retries)
    throw error;
  }
}

// Export functions
export {
  isMetaMaskInstalled,
  connectXRPLSnap,
  getXRPLAccount,
  issueVCOnXRPL,
  issuePlaidConnectionVCWithMetaMask,
  issueQuestCompletionVCWithMetaMask
};

// Make available globally
if (typeof window !== 'undefined') {
  window.metamaskXRPL = {
    isMetaMaskInstalled,
    connectXRPLSnap,
    getXRPLAccount,
    issueVCOnXRPL,
    issuePlaidConnectionVCWithMetaMask,
    issueQuestCompletionVCWithMetaMask
  };
}

