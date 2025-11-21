/**
 * XRPL Leaderboard Service
 * Stores and retrieves leaderboard data on XRPL blockchain
 * Uses transaction memos to store user stats
 */

const { Client, Wallet, convertStringToHex } = require('xrpl');

// XRPL Testnet URL
const XRPL_TESTNET = 'wss://s.altnet.rippletest.net:51233';
// XRPL Mainnet (for production)
// const XRPL_MAINNET = 'wss://xrplcluster.com';

class XRPLLeaderboardService {
  constructor(accountAddress, accountSecret) {
    this.accountAddress = accountAddress;
    this.accountSecret = accountSecret;
    this.client = null;
    this.wallet = null;
  }

  /**
   * Connect to XRPL
   */
  async connect() {
    if (this.client && this.client.isConnected()) {
      return;
    }

    try {
      this.client = new Client(XRPL_TESTNET);
      await this.client.connect();
      console.log('✅ Connected to XRPL Testnet');

      // Create wallet from secret
      this.wallet = Wallet.fromSeed(this.accountSecret);
      console.log('✅ Wallet loaded:', this.wallet.address);
    } catch (error) {
      console.error('❌ XRPL connection error:', error);
      throw error;
    }
  }

  /**
   * Disconnect from XRPL
   */
  async disconnect() {
    if (this.client && this.client.isConnected()) {
      await this.client.disconnect();
      console.log('✅ Disconnected from XRPL');
    }
  }

  /**
   * Store user leaderboard entry on XRPL
   * Uses transaction memo to store JSON data
   */
  async storeUserEntry(user) {
    try {
      await this.connect();

      // Prepare user data as JSON
      const userData = {
        type: 'leaderboard_entry',
        address: user.address,
        displayName: user.displayName || this.generateDisplayName(user.address),
        nftCount: user.nftCount || 0,
        creditScore: user.creditScore || 0,
        lastActive: user.lastActive || new Date().toISOString(),
        timestamp: Date.now()
      };

      // Convert to hex string for memo
      const memoData = convertStringToHex(JSON.stringify(userData));

      // Create payment transaction (self-payment to store data)
      const payment = {
        TransactionType: 'Payment',
        Account: this.wallet.address,
        Destination: this.wallet.address, // Self-payment
        Amount: '1', // Minimum amount (1 drop = 0.000001 XRP)
        Memos: [
          {
            Memo: {
              MemoType: convertStringToHex('leaderboard'),
              MemoData: memoData
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
          account: this.wallet.address,
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
        const signed = this.wallet.sign(prepared);
        txHash = signed.hash;
        
        if (retries === 0) {
          console.log(`🔐 Transaction signed, hash: ${txHash}`);
        }
        
        // Submit the signed transaction blob
        response = await this.client.submit(signed.tx_blob);
        
        // Check if transaction was accepted
        const isAccepted = response.result.engine_result === 'tesSUCCESS';
        
        if (isAccepted) {
          console.log('✅ User entry submitted to XRPL:', txHash);
          console.log('   Status:', response.result.engine_result);
          console.log('   Accepted: Yes ✅');
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
          console.log('   Accepted: No ⚠️');
          if (response.result.engine_result === 'temREDUNDANT') {
            console.warn('⚠️ Sequence conflict - transaction may have been submitted already');
          }
          break;
        }
      }
      return {
        success: true,
        txHash: txHash,
        userData,
        status: 'submitted' // Fast mode - submitted but not yet confirmed
      };
    } catch (error) {
      console.error('❌ Error storing user entry:', error);
      throw error;
    }
  }

  /**
   * Query XRPL for all leaderboard entries
   * Searches account transactions for leaderboard memos
   */
  async getAllUsers() {
    try {
      await this.connect();

      // Get account transactions
      const transactions = await this.client.request({
        command: 'account_tx',
        account: this.accountAddress,
        limit: 1000 // Get last 1000 transactions
      });

      const users = new Map(); // Use Map to deduplicate by address

      // Parse transactions for leaderboard entries
      for (const tx of transactions.result.transactions) {
        if (tx.tx && tx.tx.Memos) {
          for (const memo of tx.tx.Memos) {
            try {
              const memoType = Buffer.from(memo.Memo.MemoType, 'hex').toString('utf8');
              
              if (memoType === 'leaderboard') {
                const memoData = Buffer.from(memo.Memo.MemoData, 'hex').toString('utf8');
                const userData = JSON.parse(memoData);

                if (userData.type === 'leaderboard_entry' && userData.address) {
                  // Keep the most recent entry for each user
                  const existing = users.get(userData.address);
                  if (!existing || userData.timestamp > existing.timestamp) {
                    users.set(userData.address, {
                      address: userData.address,
                      displayName: userData.displayName,
                      nftCount: userData.nftCount || 0,
                      creditScore: userData.creditScore || 0,
                      lastActive: userData.lastActive,
                      txHash: tx.tx.hash
                    });
                  }
                }
              }
            } catch (e) {
              // Skip invalid memos
              continue;
            }
          }
        }
      }

      // Convert Map to Array and sort by NFT count
      const usersArray = Array.from(users.values()).sort((a, b) => {
        if (b.nftCount !== a.nftCount) {
          return b.nftCount - a.nftCount;
        }
        return b.creditScore - a.creditScore;
      });

      console.log(`✅ Found ${usersArray.length} users on XRPL`);
      return usersArray;
    } catch (error) {
      console.error('❌ Error querying leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get NFTs for a specific user from XRPL
   * Searches for quest completion transactions
   */
  async getUserNFTs(userAddress) {
    try {
      await this.connect();

      // Get account transactions
      const transactions = await this.client.request({
        command: 'account_tx',
        account: this.accountAddress,
        limit: 1000
      });

      const nfts = [];

      // Parse transactions for quest completion NFTs
      for (const tx of transactions.result.transactions) {
        if (tx.tx && tx.tx.Memos) {
          for (const memo of tx.tx.Memos) {
            try {
              const memoType = Buffer.from(memo.Memo.MemoType, 'hex').toString('utf8');
              
              if (memoType === 'quest_completion' || memoType === 'vc') {
                const memoData = Buffer.from(memo.Memo.MemoData, 'hex').toString('utf8');
                const nftData = JSON.parse(memoData);

                if (nftData.userAddress && 
                    nftData.userAddress.toLowerCase() === userAddress.toLowerCase()) {
                  nfts.push({
                    questId: nftData.questId,
                    questTitle: nftData.questTitle || nftData.title,
                    nftAddress: nftData.nftAddress || tx.tx.hash,
                    userAddress: nftData.userAddress,
                    completedDate: nftData.completedDate || new Date(tx.tx.date * 1000).toISOString(),
                    txHash: tx.tx.hash
                  });
                }
              }
            } catch (e) {
              // Skip invalid memos
              continue;
            }
          }
        }
      }

      console.log(`✅ Found ${nfts.length} NFTs for user ${userAddress}`);
      return nfts;
    } catch (error) {
      console.error('❌ Error querying user NFTs:', error);
      throw error;
    }
  }

  /**
   * Generate display name from address
   */
  generateDisplayName(address) {
    const adjectives = ['Crypto', 'Quest', 'NFT', 'Credit', 'DeFi', 'Web3'];
    const nouns = ['Master', 'Hunter', 'Collector', 'Builder', 'Explorer', 'Champion'];
    const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const adj = adjectives[hash % adjectives.length];
    const noun = nouns[(hash * 7) % nouns.length];
    return adj + noun;
  }
}

module.exports = XRPLLeaderboardService;

