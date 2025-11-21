const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const execAsync = promisify(exec);

// Load environment variables from .env file (in root directory)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

process.on('uncaughtException', err => { console.error('Uncaught Exception:', err); });
process.on('unhandledRejection', err => { console.error('Unhandled Rejection:', err); });

/**
 * Load XRPL configuration from xrpl-config.js file
 * Handles ES6 export format: export const XRPL_CONFIG = { testnet: { accountAddress: '...', accountSecret: '...' } }
 * 
 * @returns {Object} { accountAddress, accountSecret } or { accountAddress: '', accountSecret: '' } if not found
 */
function loadXRPLConfig() {
  // Try environment variables first
  let accountAddress = process.env.XRPL_ACCOUNT_ADDRESS || '';
  let accountSecret = process.env.XRPL_ACCOUNT_SECRET || '';
  
  // If not in env, read from xrpl-config.js
  if (!accountAddress || !accountSecret) {
    try {
      const configPath = path.join(__dirname, '..', 'xrpl-config.js');
      if (fs.existsSync(configPath)) {
        const configFile = fs.readFileSync(configPath, 'utf8');
        
        // Try to parse ES6 export format: export const XRPL_CONFIG = { testnet: { accountAddress: '...', accountSecret: '...' } }
        // Look for nested structure in testnet object - use dotall flag to match across newlines
        // Improved regex to handle comments and whitespace better
        const testnetMatch = configFile.match(/testnet:\s*\{[\s\S]*?accountAddress:\s*['"]([^'"]+)['"][\s\S]*?accountSecret:\s*['"]([^'"]+)['"]/);
        if (testnetMatch && testnetMatch[1] && testnetMatch[2]) {
          accountAddress = testnetMatch[1].trim();
          accountSecret = testnetMatch[2].trim();
          console.log('✅ Loaded XRPL config from file (address first)');
        } else {
          // Try alternative order (secret first, then address)
          const testnetMatchAlt = configFile.match(/testnet:\s*\{[\s\S]*?accountSecret:\s*['"]([^'"]+)['"][\s\S]*?accountAddress:\s*['"]([^'"]+)['"]/);
          if (testnetMatchAlt && testnetMatchAlt[1] && testnetMatchAlt[2]) {
            accountSecret = testnetMatchAlt[1].trim();
            accountAddress = testnetMatchAlt[2].trim();
            console.log('✅ Loaded XRPL config from file (secret first)');
          } else {
            // Fallback: try simple format (for backwards compatibility) - look anywhere in file
            const addressMatch = configFile.match(/accountAddress:\s*['"]([^'"]+)['"]/);
            const secretMatch = configFile.match(/accountSecret:\s*['"]([^'"]+)['"]/);
            if (addressMatch && addressMatch[1]) {
              accountAddress = addressMatch[1].trim();
              console.log('✅ Loaded accountAddress from file (fallback)');
            }
            if (secretMatch && secretMatch[1]) {
              accountSecret = secretMatch[1].trim();
              console.log('✅ Loaded accountSecret from file (fallback)');
            }
          }
        }
        
        // Debug: log what we found
        if (!accountAddress || !accountSecret) {
          console.warn('⚠️ Could not parse XRPL config from file. Found:', {
            hasAddress: !!accountAddress,
            hasSecret: !!accountSecret,
            addressPreview: accountAddress ? accountAddress.substring(0, 10) + '...' : 'none',
            secretPreview: accountSecret ? accountSecret.substring(0, 10) + '...' : 'none'
          });
        }
      } else {
        console.warn('⚠️ xrpl-config.js file not found at:', configPath);
      }
    } catch (e) {
      console.warn('⚠️ Could not load XRPL config from file:', e.message);
      console.error(e);
    }
  } else {
    console.log('✅ Using XRPL config from environment variables');
  }
  
  return { accountAddress: accountAddress || '', accountSecret: accountSecret || '' };
}

/**
 * Check if XRPL is properly configured
 * 
 * @returns {boolean} true if XRPL is configured with valid credentials
 */
function isXRPLConfigured() {
  const { accountAddress, accountSecret } = loadXRPLConfig();
  return accountAddress && accountSecret && 
         accountAddress !== 'rYourTestnetAddress' && 
         accountSecret !== 'sYourTestnetSecret' &&
         accountAddress.startsWith('r') &&
         accountSecret.startsWith('s');
}

const app = express();
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Endpoint to generate ZKP proof for a quest
app.post('/zkp-proof', (req, res) => {
  const { questId } = req.body;
  // Simulate ZKP logic (replace with real ZKP implementation)
  // You would use the user's Plaid data and cryptographic proof libraries here
  let proofResult = false;
  let proofDetails = '';
  switch (questId) {
    case 'save-500':
      proofResult = true;
      proofDetails = 'ZKP: User has at least $500 in savings.';
      break;
    case 'no-overdraft':
      proofResult = true;
      proofDetails = 'ZKP: No overdraft fees in last 3 months.';
      break;
    // Add more cases for other quests
    default:
      proofResult = false;
      proofDetails = 'ZKP: Quest not recognized or not completed.';
  }
  res.json({ questId, proofResult, proofDetails });
});



app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Endpoint to serve Plaid user data for frontend (user-specific)
app.get('/plaid-data', (req, res) => {
  try {
    const walletAddress = req.query.walletAddress || req.headers['x-wallet-address'];
    
    if (!walletAddress) {
      // Fallback to old format for backwards compatibility
      const oldPath = path.join(__dirname, 'plaid_user_data.json');
      if (fs.existsSync(oldPath)) {
        const data = JSON.parse(fs.readFileSync(oldPath, 'utf8'));
        return res.json(data);
      }
      return res.status(400).json({ error: 'walletAddress is required' });
    }
    
    const userDataPath = path.join(__dirname, `plaid_user_data_${walletAddress}.json`);
    
    if (!fs.existsSync(userDataPath)) {
      return res.status(404).json({ error: 'Plaid user data not found. Please connect your bank account.' });
    }
    
    const data = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to generate custom ZKP quests based on Plaid data
app.get('/quests', (req, res) => {
  try {
    // For demo: use static file
    const data = JSON.parse(fs.readFileSync('plaid_user_data.json', 'utf8'));
    // For production: fetch live Plaid data (uncomment below)
    /*
    // Example: fetch live data using Plaid API
    // const access_token = ...; // Retrieve from user session or database
    const accountsResponse = await plaidClient.accountsGet({ access_token });
    const transactionsResponse = await plaidClient.transactionsGet({
      access_token,
      start_date: '2023-01-01',
      end_date: '2023-12-31',
    });
    const data = {
      accounts: accountsResponse.data.accounts,
      transactions: transactionsResponse.data.transactions,
    };
    */
    const quests = [];

    // Savings quest
    const savings = data.accounts?.find(acc => acc.subtype === 'savings');
    quests.push({
      id: 'save-500',
      completed: savings && savings.balances?.current >= 500,
      balance: savings?.balances?.current || 0
    });

    // No overdraft fees for 3 months
    const overdrafts = data.transactions?.filter(tx => tx.name?.toLowerCase().includes('overdraft'));
    quests.push({
      id: 'no-overdraft',
      completed: !overdrafts || overdrafts.length === 0,
      overdraftCount: overdrafts?.length || 0
    });

    // Rent paid on time for 6 months
    const rentTxs = data.transactions?.filter(tx => tx.name?.toLowerCase().includes('rent'));
    const lateRent = rentTxs?.filter(tx => tx.amount < 0 && tx.date && new Date(tx.date) > new Date(Date.now() - 180*24*60*60*1000));
    quests.push({
      id: 'rent-on-time',
      completed: rentTxs && rentTxs.length >= 6 && (!lateRent || lateRent.length === 0),
      rentTxCount: rentTxs?.length || 0,
      lateRentCount: lateRent?.length || 0
    });

    // Reduce credit card debt by $1,000
    const creditCards = data.accounts?.filter(acc => acc.subtype === 'credit card');
    const totalDebt = creditCards?.reduce((sum, acc) => sum + (acc.balances?.current || 0), 0) || 0;
    quests.push({
      id: 'reduce-debt',
      completed: totalDebt <= 1000,
      totalDebt
    });

    // Increase monthly income by $500
    const incomeTxs = data.transactions?.filter(tx => tx.category?.includes('Income'));
    const lastIncome = incomeTxs?.[incomeTxs.length-1]?.amount || 0;
    const prevIncome = incomeTxs?.[incomeTxs.length-2]?.amount || 0;
    quests.push({
      id: 'increase-income',
      completed: lastIncome - prevIncome >= 500,
      lastIncome,
      prevIncome
    });

    // Spend less than $200 on fast food
    const fastFoodTxs = data.transactions?.filter(tx => tx.category?.includes('Fast Food'));
    const fastFoodSpent = fastFoodTxs?.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) || 0;
    quests.push({
      id: 'fastfood-budget',
      completed: fastFoodSpent < 200,
      fastFoodSpent
    });

    // Donate to charity
    const charityTxs = data.transactions?.filter(tx => tx.category?.includes('Charity'));
    quests.push({
      id: 'donate-charity',
      completed: charityTxs && charityTxs.length > 0,
      charityTxCount: charityTxs?.length || 0
    });

    // Example: Maintain positive balance for 90 days
    const negativeBalances = data.accounts?.filter(acc => acc.balances?.current < 0);
    if (!negativeBalances || negativeBalances.length === 0) {
      quests.push({
        id: 'positive-balance',
        title: 'Maintain Positive Balance for 90 Days',
        description: 'Prove you maintained a positive balance in all accounts for 90 days.',
        zkp: 'positive balances',
        nft: 'Balance Keeper'
      });
    }

    // Example: Make 5+ local business purchases
    const localTxs = data.transactions?.filter(tx => tx.location?.city && tx.location.city !== '');
    if (localTxs && localTxs.length >= 5) {
      quests.push({
        id: 'local-purchases',
        title: 'Make 5+ Local Business Purchases',
        description: 'Prove you made at least 5 purchases at local businesses.',
        zkp: 'local business purchases',
        nft: 'Local Supporter'
      });
    }

    // Example: Diversify account types
    const accountTypes = new Set(data.accounts?.map(acc => acc.subtype));
    if (accountTypes.size >= 3) {
      quests.push({
        id: 'diversify-accounts',
        title: 'Diversify Account Types',
        description: 'Prove you own at least 3 different account types.',
        zkp: 'account diversity',
        nft: 'Financial Explorer'
      });
    }

    res.json({ quests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to create Plaid Link token (user-specific)
app.get('/create_link_token', async (req, res) => {
  try {
    const walletAddress = req.query.walletAddress || req.headers['x-wallet-address'];
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'walletAddress is required' });
    }

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: walletAddress }, // Use wallet address as unique user ID
      client_name: 'Worldwide Credit System',
      products: ['auth', 'transactions'],
      country_codes: ['US'],
      language: 'en',
    });
    res.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Replace with your Plaid credentials
const PLAID_CLIENT_ID = '690a7c8f1a623c001feb6692';
const PLAID_SECRET = 'b07cc4780c54453cd6cae925d46d0b';
const PLAID_ENV = 'sandbox'; // or 'development', 'production'

const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
    },
  },
});
const plaidClient = new PlaidApi(configuration);

// Endpoint to exchange public_token for access_token and fetch transactions (user-specific)
app.post('/fetch-transactions', async (req, res) => {
  const { public_token, start_date, end_date, walletAddress } = req.body;
  
  if (!walletAddress) {
    return res.status(400).json({ error: 'walletAddress is required' });
  }

  try {
    // Exchange public_token for access_token
    const tokenResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });
    const access_token = tokenResponse.data.access_token;
    const item_id = tokenResponse.data.item_id;

    // Fetch transactions
    const transactionsResponse = await plaidClient.transactionsGet({
      access_token,
      start_date,
      end_date,
    });
    
    // Store user-specific Plaid data
    const userData = {
      user_id: walletAddress,
      walletAddress: walletAddress,
      transactions: transactionsResponse.data.transactions,
      accounts: transactionsResponse.data.accounts,
      access_token: access_token, // Store for future use
      item_id: item_id,
      connectedAt: new Date().toISOString()
    };
    
    const userDataPath = path.join(__dirname, `plaid_user_data_${walletAddress}.json`);
    fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));
    
    // Update user profile with Plaid connection info
    const usersPath = path.join(__dirname, 'users.json');
    if (fs.existsSync(usersPath)) {
      const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      const userIndex = users.findIndex(u => 
        u.walletAddress.toLowerCase() === walletAddress.toLowerCase()
      );
      
      if (userIndex >= 0) {
        users[userIndex].plaidConnected = true;
        users[userIndex].plaidAccessToken = access_token;
        users[userIndex].plaidItemId = item_id;
        users[userIndex].plaidConnectedAt = new Date().toISOString();
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
      }
    }
    
    console.log(`✅ Plaid connected for user: ${walletAddress}`);
    res.json({ status: 'success', userData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// XAI Analysis Endpoint - Returns explainable AI analysis for dashboard (user-specific)
app.get('/xai-analysis', async (req, res) => {
  try {
    const walletAddress = req.query.walletAddress || req.headers['x-wallet-address'];
    
    // Get project root directory (parent of plaid_node)
    const projectRoot = require('path').resolve(__dirname, '..');
    const xaiScriptPath = require('path').join(projectRoot, 'xai_engine', 'get_analysis.py');
    
    // Determine which Plaid data file to use
    let plaidDataPath = path.join(__dirname, 'plaid_user_data.json'); // Fallback to old format
    if (walletAddress) {
      const userDataPath = path.join(__dirname, `plaid_user_data_${walletAddress}.json`);
      if (fs.existsSync(userDataPath)) {
        plaidDataPath = userDataPath;
      }
    }
    
    console.log('🔍 Running XAI analysis...');
    console.log('   Project root:', projectRoot);
    console.log('   Script path:', xaiScriptPath);
    console.log('   Plaid data path:', plaidDataPath);
    
    // Run Python XAI analysis script with user-specific data path
    const { stdout, stderr } = await execAsync(`python "${xaiScriptPath}" "${plaidDataPath}"`, {
      cwd: projectRoot,
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    
    // Log stderr (debug info) but don't treat it as error
    if (stderr && stderr.trim()) {
      console.log('📝 XAI script output:', stderr);
    }
    
    // Parse JSON output from Python script
    try {
      const analysis = JSON.parse(stdout.trim());
      res.json(analysis);
    } catch (parseError) {
      console.error('Error parsing XAI output:', parseError);
      console.error('Raw output:', stdout);
      // Return default analysis on error
      res.json({
        score: 685,
        factors: [
          {
            name: 'Payment History',
            impact: 35,
            percentage: 92,
            positive: true,
            explanation: 'Connect your bank account to see your payment history analysis.'
          },
          {
            name: 'Credit Utilization',
            impact: -20,
            percentage: 65,
            positive: false,
            explanation: 'Connect your bank account to see your credit utilization.'
          }
        ],
        creditScore: 72, // 1-100 scale (was 720 FICO)
        vcCount: 0,
        onChainScore: 85
      });
    }
  } catch (error) {
    console.error('Error running XAI analysis:', error);
    // Return default analysis on error
    res.json({
      score: 685,
      factors: [
        {
          name: 'Payment History',
          impact: 35,
          percentage: 92,
          positive: true,
          explanation: 'XAI analysis unavailable. Please ensure Python XAI engine is set up correctly.'
        },
        {
          name: 'Credit Utilization',
          impact: -20,
          percentage: 65,
          positive: false,
          explanation: 'XAI analysis unavailable. Please ensure Python XAI engine is set up correctly.'
        }
      ],
      ficoEquivalent: 720,
      vcCount: 0,
      onChainScore: 85,
      error: 'XAI analysis failed'
    });
  }
});

// Leaderboard Endpoints - Store and retrieve user rankings from XRPL
// GET /leaderboard - Get all users ranked by NFT count from XRPL
app.get('/leaderboard', async (req, res) => {
  try {
    // Get XRPL config using helper function
    const { accountAddress, accountSecret } = loadXRPLConfig();
    
    // Check if XRPL is configured
    if (!isXRPLConfigured()) {
      // XRPL not configured - use file fallback
      console.log('⚠️ XRPL not configured, using file storage');
      const fs = require('fs');
      const leaderboardPath = 'leaderboard_data.json';
      
      if (fs.existsSync(leaderboardPath)) {
        const data = JSON.parse(fs.readFileSync(leaderboardPath, 'utf8'));
        return res.json({ users: data.users || [] });
      }
      return res.json({ users: [] });
    }
    
    // XRPL is configured - query from blockchain
    console.log('🔍 Querying leaderboard from XRPL...');
    const leaderboardService = new XRPLLeaderboardService(accountAddress, accountSecret);
    
    try {
      const users = await leaderboardService.getAllUsers();
      await leaderboardService.disconnect();
      res.json({ users });
    } catch (xrplError) {
      console.error('❌ XRPL query failed, using file fallback:', xrplError);
      // Fallback to file
      const fs = require('fs');
      const leaderboardPath = 'leaderboard_data.json';
      if (fs.existsSync(leaderboardPath)) {
        const data = JSON.parse(fs.readFileSync(leaderboardPath, 'utf8'));
        res.json({ users: data.users || [] });
      } else {
        res.json({ users: [] });
      }
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.json({ users: [] });
  }
});

// POST /update-leaderboard - Update user's leaderboard entry on XRPL
app.post('/update-leaderboard', async (req, res) => {
  try {
    const user = req.body;
    
    // Get XRPL config using helper function
    const { accountAddress, accountSecret } = loadXRPLConfig();
    
    // Check if XRPL is configured
    if (!isXRPLConfigured()) {
      // XRPL not configured - use file fallback
      console.log('⚠️ XRPL not configured, using file storage');
      const fs = require('fs');
      const leaderboardPath = 'leaderboard_data.json';
      
      let leaderboard = { users: [] };
      if (fs.existsSync(leaderboardPath)) {
        leaderboard = JSON.parse(fs.readFileSync(leaderboardPath, 'utf8'));
      }
      
      const userIndex = leaderboard.users.findIndex(
        u => u.address.toLowerCase() === user.address.toLowerCase()
      );
      
      if (userIndex >= 0) {
        leaderboard.users[userIndex] = {
          ...leaderboard.users[userIndex],
          ...user,
          lastActive: new Date().toISOString()
        };
      } else {
        leaderboard.users.push({
          ...user,
          lastActive: new Date().toISOString()
        });
      }
      
      fs.writeFileSync(leaderboardPath, JSON.stringify(leaderboard, null, 2));
      return res.json({ status: 'success', user, storage: 'file' });
    }
    
    // XRPL is configured - store on blockchain
    console.log('🔍 Storing user entry on XRPL...');
    const XRPLLeaderboardService = require('./xrpl-leaderboard');
    const leaderboardService = new XRPLLeaderboardService(accountAddress, accountSecret);
    
    try {
      const result = await leaderboardService.storeUserEntry(user);
      await leaderboardService.disconnect();
      
      // Also save to file as backup
      const fs = require('fs');
      const leaderboardPath = 'leaderboard_data.json';
      let leaderboard = { users: [] };
      if (fs.existsSync(leaderboardPath)) {
        leaderboard = JSON.parse(fs.readFileSync(leaderboardPath, 'utf8'));
      }
      
      const userIndex = leaderboard.users.findIndex(
        u => u.address.toLowerCase() === user.address.toLowerCase()
      );
      
      if (userIndex >= 0) {
        leaderboard.users[userIndex] = { ...user, lastActive: new Date().toISOString() };
      } else {
        leaderboard.users.push({ ...user, lastActive: new Date().toISOString() });
      }
      
      fs.writeFileSync(leaderboardPath, JSON.stringify(leaderboard, null, 2));
      
      res.json({ 
        status: 'success', 
        user: result.userData, 
        txHash: result.txHash,
        storage: 'xrpl'
      });
    } catch (xrplError) {
      console.error('❌ XRPL storage failed, using file fallback:', xrplError);
      // Fallback to file
      const fs = require('fs');
      const leaderboardPath = 'leaderboard_data.json';
      let leaderboard = { users: [] };
      if (fs.existsSync(leaderboardPath)) {
        leaderboard = JSON.parse(fs.readFileSync(leaderboardPath, 'utf8'));
      }
      
      const userIndex = leaderboard.users.findIndex(
        u => u.address.toLowerCase() === user.address.toLowerCase()
      );
      
      if (userIndex >= 0) {
        leaderboard.users[userIndex] = { ...user, lastActive: new Date().toISOString() };
      } else {
        leaderboard.users.push({ ...user, lastActive: new Date().toISOString() });
      }
      
      fs.writeFileSync(leaderboardPath, JSON.stringify(leaderboard, null, 2));
      res.json({ status: 'success', user, storage: 'file_fallback' });
    }
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /user-nfts - Get NFTs for a specific user from XRPL
app.get('/user-nfts', async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ error: 'User address required' });
    }
    
    // Get XRPL config using helper function
    const { accountAddress, accountSecret } = loadXRPLConfig();
    
    // Check if XRPL is configured
    if (!isXRPLConfigured()) {
      // XRPL not configured - return empty (frontend will use localStorage)
      return res.json({ nfts: [] });
    }
    
    // XRPL is configured - query from blockchain
    console.log(`🔍 Querying NFTs for user ${address} from XRPL...`);
    const XRPLLeaderboardService = require('./xrpl-leaderboard');
    const leaderboardService = new XRPLLeaderboardService(accountAddress, accountSecret);
    
    try {
      const nfts = await leaderboardService.getUserNFTs(address);
      await leaderboardService.disconnect();
      res.json({ nfts });
    } catch (xrplError) {
      console.error('❌ XRPL NFT query failed:', xrplError);
      res.json({ nfts: [] }); // Frontend will use localStorage
    }
  } catch (error) {
    console.error('Error fetching user NFTs:', error);
    res.json({ nfts: [] });
  }
});

// ============================================
// CROSS-BORDER DOCUMENT VERIFICATION ENDPOINTS
// ============================================

// POST /cross-border/issue-bank-legitimacy
// Regulator issues Bank Legitimacy VC on XRPL
app.post('/cross-border/issue-bank-legitimacy', async (req, res) => {
  try {
    const {
      regulatorDid,
      regulatorSecret,
      bankDid,
      bankName,
      licenseNumber,
      jurisdiction
    } = req.body;

    // Validate required fields
    if (!regulatorDid || !regulatorSecret || !bankDid || !bankName || !jurisdiction) {
      return res.status(400).json({ 
        error: 'Missing required fields: regulatorDid, regulatorSecret, bankDid, bankName, jurisdiction' 
      });
    }

    // Get XRPL config using helper function
    const { accountAddress } = loadXRPLConfig();

    // Check if XRPL is configured
    if (!accountAddress || accountAddress === 'rYourTestnetAddress') {
      return res.status(400).json({ 
        error: 'XRPL not configured. Please set up XRPL testnet account in xrpl-config.js' 
      });
    }

    // Issue Bank Legitimacy VC on XRPL
    const XRPLCrossBorderService = require('./xrpl-cross-border');
    const service = new XRPLCrossBorderService(accountAddress, regulatorSecret);

    const result = await service.issueBankLegitimacyVC({
      regulatorDid,
      regulatorSecret,
      bankDid,
      bankName,
      licenseNumber: licenseNumber || `LIC-${Date.now()}`,
      jurisdiction
    });

    await service.disconnect();

    // Only show explorer link if we have a valid transaction hash (64 hex chars) AND not in demo mode
    const isValidHash = result.txHash && result.txHash.length === 64 && /^[0-9A-Fa-f]+$/.test(result.txHash);
    const isDemoMode = result.demoMode || false;
    
    res.json({
      success: true,
      message: result.message || 'Bank Legitimacy VC issued successfully',
      vcId: result.vcId,
      txHash: result.txHash,
      bankDid: result.bankDid,
      regulatorDid: result.regulatorDid,
      status: result.status || (isDemoMode ? 'confirmed' : 'submitted'),
      demoMode: isDemoMode,
      xrplExplorer: (!isDemoMode && isValidHash) ? `https://testnet.xrpl.org/transactions/${result.txHash}` : null,
      note: isDemoMode 
        ? '✅ VC stored locally (Demo Mode - instant confirmation)' 
        : (isValidHash ? 'View transaction on XRPL Explorer' : 'Transaction submitted, hash will be available once confirmed (~3-5 seconds)')
    });
  } catch (error) {
    console.error('Error issuing Bank Legitimacy VC:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to issue Bank Legitimacy VC on XRPL'
    });
  }
});

// POST /cross-border/issue-user-payment-history
// Bank issues User Payment History VC on XRPL (linked to Bank Legitimacy VC)
app.post('/cross-border/issue-user-payment-history', async (req, res) => {
  try {
    const {
      bankDid,
      bankSecret,
      userDid,
      userAddress,
      paymentHistory,
      bankLegitimacyVCId
    } = req.body;

    // Validate required fields
    if (!bankDid || !bankSecret || !userDid || !userAddress || !bankLegitimacyVCId) {
      return res.status(400).json({ 
        error: 'Missing required fields: bankDid, bankSecret, userDid, userAddress, bankLegitimacyVCId' 
      });
    }

    // Get XRPL config using helper function
    const { accountAddress } = loadXRPLConfig();

    // Check if XRPL is configured
    if (!accountAddress || accountAddress === 'rYourTestnetAddress') {
      return res.status(400).json({ 
        error: 'XRPL not configured. Please set up XRPL testnet account in xrpl-config.js' 
      });
    }

    // Issue User Payment History VC on XRPL
    const XRPLCrossBorderService = require('./xrpl-cross-border');
    const service = new XRPLCrossBorderService(accountAddress, bankSecret);

    const result = await service.issueUserPaymentHistoryVC({
      bankDid,
      bankSecret,
      userDid,
      userAddress,
      paymentHistory: paymentHistory || {
        years: 5,
        onTimeCount: 60,
        totalCount: 60,
        averageAmount: 1000,
        country: 'India',
        bankName: bankDid.split(':')[2] || 'Bank'
      },
      bankLegitimacyVCId
    });

    await service.disconnect();

    // Only show explorer link if we have a valid transaction hash (64 hex chars) AND not in demo mode
    const isValidHash = result.txHash && result.txHash.length === 64 && /^[0-9A-Fa-f]+$/.test(result.txHash);
    const isDemoMode = result.demoMode || false;
    
    res.json({
      success: true,
      message: result.message || 'User Payment History VC issued successfully',
      vcId: result.vcId,
      txHash: result.txHash,
      userDid: result.userDid,
      bankDid: result.bankDid,
      chainOfTrust: result.chainOfTrust,
      status: result.status || (isDemoMode ? 'confirmed' : 'submitted'),
      demoMode: isDemoMode,
      xrplExplorer: (!isDemoMode && isValidHash) ? `https://testnet.xrpl.org/transactions/${result.txHash}` : null,
      note: isDemoMode 
        ? '✅ VC stored locally (Demo Mode - instant confirmation)' 
        : (isValidHash ? 'View transaction on XRPL Explorer' : 'Transaction submitted, hash will be available once confirmed (~3-5 seconds)')
    });
  } catch (error) {
    console.error('Error issuing User Payment History VC:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to issue User Payment History VC on XRPL'
    });
  }
});

// POST /cross-border/verify-chain
// Lender verifies VC chain (Regulator → Bank → User)
app.post('/cross-border/verify-chain', async (req, res) => {
  try {
    const {
      userVCId,
      trustedRegulators,
      verifierAddress
    } = req.body;

    // Validate required fields
    if (!userVCId) {
      return res.status(400).json({ 
        error: 'Missing required field: userVCId' 
      });
    }

    // Get XRPL config using helper function
    const { accountAddress, accountSecret } = loadXRPLConfig();

    // Check if XRPL is configured
    if (!accountAddress || accountAddress === 'rYourTestnetAddress') {
      return res.status(400).json({ 
        error: 'XRPL not configured. Please set up XRPL testnet account in xrpl-config.js' 
      });
    }

    // Verify VC chain on XRPL
    const XRPLCrossBorderService = require('./xrpl-cross-border');
    const service = new XRPLCrossBorderService(accountAddress, accountSecret);

    const verification = await service.verifyVCChain({
      userVCId,
      trustedRegulators: trustedRegulators || [],
      verifierAddress: verifierAddress || 'Unknown'
    });

    await service.disconnect();

    res.json({
      success: verification.valid,
      verification: verification,
      message: verification.valid 
        ? '✅ VC Chain verified successfully - Cross-border credit approved!'
        : '❌ VC Chain verification failed - Credit not approved'
    });
  } catch (error) {
    console.error('Error verifying VC chain:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to verify VC chain on XRPL'
    });
  }
});

// GET /cross-border/user-vcs/:userDid
// Get all VCs for a user
app.get('/cross-border/user-vcs/:userDid', async (req, res) => {
  try {
    const { userDid } = req.params;

    // Get XRPL config using helper function
    const { accountAddress, accountSecret } = loadXRPLConfig();

    // Check if XRPL is configured
    if (!accountAddress || accountAddress === 'rYourTestnetAddress') {
      return res.json({ vcs: [] }); // Return empty if not configured
    }

    // Fetch user VCs from XRPL
    const XRPLCrossBorderService = require('./xrpl-cross-border');
    const service = new XRPLCrossBorderService(accountAddress, accountSecret);

    const vcs = await service.getUserVCs(userDid);

    await service.disconnect();

    res.json({ vcs });
  } catch (error) {
    console.error('Error fetching user VCs:', error);
    res.json({ vcs: [] });
  }
});

// POST /signup - User registration with immigrant detection
app.post('/signup', async (req, res) => {
  try {
    const {
      email,
      fullName,
      dateOfBirth,
      walletAddress,
      isImmigrant,
      isStudent,
      degreeType,
      institutionName,
      graduationYear
    } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!email || email.trim() === '') missingFields.push('email');
    if (!fullName || fullName.trim() === '') missingFields.push('fullName');
    if (!dateOfBirth || dateOfBirth.trim() === '') missingFields.push('dateOfBirth');
    if (!walletAddress || walletAddress.trim() === '') missingFields.push('walletAddress');
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Create user profile (no hardcoded credit score - will be calculated after Plaid connection)
    const userProfile = {
      email,
      fullName,
      dateOfBirth,
      walletAddress,
      isImmigrant: isImmigrant || false,
      isStudent: isStudent || false,
      createdAt: new Date().toISOString(),
      creditScore: 0, // 1-100 scale (replaces ficoPoints, will be calculated after Plaid connection)
      vcs: [],
      plaidConnected: false,
      plaidAccessToken: null,
      plaidItemId: null
    };

    // Add education VC if student
    if (isStudent && degreeType) {
      const educationVC = {
        id: `vc:education:${walletAddress}:${Date.now()}`,
        type: 'EducationDegree',
        issuerDid: 'did:xrpl:EducationIssuer:001',
        subjectDid: `did:xrpl:user:${walletAddress.slice(0, 10)}`,
        credentialSubject: {
          degreeType: degreeType,
          institutionName: institutionName || 'Unknown',
          graduationYear: graduationYear || new Date().getFullYear(),
          verified: true
        },
        issuanceDate: new Date().toISOString(),
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      };
      userProfile.vcs.push(educationVC);
    }

    // Store user profile (in production, use a database)
    const fs = require('fs');
    const usersPath = path.join(__dirname, 'users.json');
    let users = [];
    
    if (fs.existsSync(usersPath)) {
      users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    }

    // Check if user already exists
    const existingUser = users.find(u => 
      u.email === email || u.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email or wallet address'
      });
    }

    users.push(userProfile);
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

    console.log('✅ New user registered:', email);
    if (isImmigrant) {
      console.log('   🌍 Immigrant account - cross-border VC import available');
    }
    if (isStudent && degreeType) {
      console.log('   🎓 Education VC added:', degreeType);
    }

    res.json({
      success: true,
      user: userProfile,
      message: 'Account created successfully',
      nextSteps: {
        isImmigrant: isImmigrant,
        needsCrossBorderVC: isImmigrant,
        hasEducationVC: isStudent && degreeType
      }
    });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /user-profile/:walletAddress - Get user profile
app.get('/user-profile/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const fs = require('fs');
    const usersPath = path.join(__dirname, 'users.json');
    
    if (!fs.existsSync(usersPath)) {
      return res.json({ user: null });
    }

    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const user = users.find(u => 
      u.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );

    res.json({ user: user || null });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /issue-quest-vc - Issue Quest Completion VC on XRPL
app.post('/issue-quest-vc', async (req, res) => {
  try {
    const { questId, questTitle, txHash, tokenId, userAddress } = req.body;
    
    if (!questId || !questTitle || !userAddress) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: questId, questTitle, userAddress' 
      });
    }

    // Get XRPL config
    const { accountAddress, accountSecret } = loadXRPLConfig();
    
    // Debug logging
    console.log('🔍 XRPL Config Check:');
    console.log('   Account Address:', accountAddress ? `${accountAddress.substring(0, 10)}...` : 'NOT FOUND');
    console.log('   Account Secret:', accountSecret ? `${accountSecret.substring(0, 10)}...` : 'NOT FOUND');
    console.log('   Is Configured:', isXRPLConfigured());
    
    // Check if XRPL is configured
    if (!isXRPLConfigured()) {
      console.warn('⚠️ XRPL not configured - returning demo VC');
      // Return demo VC if XRPL not configured
      return res.json({
        success: true,
        demoMode: true,
        vcId: `vc:quest:${questId}:${Date.now()}`,
        vc: {
          type: ['VerifiableCredential', 'QuestCompletionCredential'],
          credentialSubject: {
            questId: questId,
            questTitle: questTitle,
            completionDate: new Date().toISOString(),
            transactionHash: txHash,
            nftTokenId: tokenId || null,
            verified: true,
            onChain: true
          }
        },
        message: 'XRPL not configured - VC issued in demo mode'
      });
    }
    
    console.log('✅ XRPL is configured - proceeding with XRPL issuance');

      // Helper function to check if transaction exists on ledger
    async function checkTransactionOnLedger(client, txHash) {
      try {
        const txResult = await client.request({
          command: 'tx',
          transaction: txHash
        });
        if (txResult.result && txResult.result.meta) {
          const isSuccess = txResult.result.meta.TransactionResult === 'tesSUCCESS';
          if (isSuccess) {
            console.log(`   ✅ Transaction ${txHash} found on ledger with status: tesSUCCESS`);
          } else {
            console.log(`   ⚠️ Transaction ${txHash} found on ledger but status is: ${txResult.result.meta.TransactionResult}`);
          }
          return isSuccess;
        }
        return false;
      } catch (error) {
        // Transaction not found - this is normal if it hasn't been validated yet
        if (error.message && error.message.includes('not found')) {
          console.log(`   ⏳ Transaction ${txHash} not found on ledger yet (may still be processing)`);
        } else {
          console.log(`   ⚠️ Error checking transaction ${txHash}:`, error.message);
        }
        return false;
      }
    }

    try {
      // Import XRPL directly (Node.js only)
      const { Client, Wallet, convertStringToHex } = require('xrpl');
      // Using XRPL Testnet (free testnet XRP, no real money)
      // WebSocket: wss://s.altnet.rippletest.net:51233
      // JSON-RPC: https://s.altnet.rippletest.net:51234
      const XRPL_TESTNET = 'wss://s.altnet.rippletest.net:51233';
      
      console.log('🔌 Connecting to XRPL Testnet (wss://s.altnet.rippletest.net:51233)...');
      // Create XRPL client and wallet
      const client = new Client(XRPL_TESTNET);
      await client.connect();
      console.log('✅ Connected to XRPL Testnet');
      
      const wallet = Wallet.fromSeed(accountSecret);
      console.log(`📝 Using testnet account: ${wallet.address}`);
      
      // Create VC data structure
      const vcData = {
        id: `vc:quest:${questId}:${Date.now()}`,
        type: 'QuestCompletionCredential',
        issuerDid: 'did:xrpl:PlaidQuestSystem:001',
        subjectDid: `did:xrpl:user:${userAddress.slice(2, 10)}`,
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
        expirationDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      // Store VC on XRPL using transaction memo
      // XRPL requires memo to be wrapped in a Memo field
      const memo = {
        Memo: {
          MemoType: convertStringToHex('VC'),
          MemoData: convertStringToHex(JSON.stringify({
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
          })),
          MemoFormat: convertStringToHex('application/json')
        }
      };
      
      // Helper function to get the actual next available sequence number
      async function getNextAvailableSequence(client, walletAddress, lastFailedSequence = null, consecutiveFailures = 0) {
        try {
          // Get account info with queue data
          const accountInfo = await client.request({
            command: 'account_info',
            account: walletAddress,
            ledger_index: 'current',
            queue: true
          });
          
          const baseSequence = accountInfo.result.account_data.Sequence;
          const pendingTxCount = accountInfo.result.queue_data?.txn_count || 0;
          
          // Check account balance
          const balance = parseFloat(accountInfo.result.account_data.Balance) / 1000000; // Convert drops to XRP
          if (balance < 0.01) {
            console.warn(`⚠️ Low XRP balance: ${balance} XRP. Transactions require ~0.000012 XRP.`);
          }
          
          // Get recent transactions to find the highest sequence actually used
          const accountTx = await client.request({
            command: 'account_tx',
            account: walletAddress,
            limit: 200 // Check last 200 transactions (increased to catch all pending)
          });
          
          let highestSequence = baseSequence - 1; // Start with base - 1
          let validatedHighestSequence = baseSequence - 1;
          
          // Find the highest sequence number from recent transactions
          if (accountTx.result.transactions && accountTx.result.transactions.length > 0) {
            for (const tx of accountTx.result.transactions) {
              if (tx.tx && tx.tx.Sequence && typeof tx.tx.Sequence === 'number') {
                const seq = tx.tx.Sequence;
                if (seq > highestSequence) {
                  highestSequence = seq;
                }
                // Track validated transactions separately
                if (tx.validated && seq > validatedHighestSequence) {
                  validatedHighestSequence = seq;
                }
              }
            }
            console.log(`   🔍 Transaction history: Found ${accountTx.result.transactions.length} transactions`);
            console.log(`   📊 Highest sequence in history: ${highestSequence}, Validated highest: ${validatedHighestSequence}`);
          } else {
            console.log(`   🔍 Transaction history: No transactions found`);
            // If no transactions found but baseSequence is high, there might be unconfirmed transactions
            // Use baseSequence but add a large buffer to account for unconfirmed ones
            if (baseSequence > 1000) {
              console.warn(`   ⚠️ WARNING: Account shows 0 transactions but sequence is ${baseSequence}.`);
              console.warn(`   ⚠️ This suggests ${baseSequence - 1} unconfirmed transactions. Using baseSequence with large buffer.`);
              // Set highestSequence to baseSequence - 1 (last used sequence)
              highestSequence = baseSequence - 1;
              validatedHighestSequence = baseSequence - 1;
            } else {
              // Fresh account - use baseSequence as-is
              highestSequence = baseSequence - 1;
              validatedHighestSequence = baseSequence - 1;
            }
          }
          
          // If we got temREDUNDANT with a specific sequence, that sequence is definitely taken
          // So we need to use at least that sequence + 1
          // If we've failed multiple times consecutively, skip ahead much more aggressively
          let minSequence = Math.max(baseSequence + pendingTxCount, highestSequence + 1);
          if (lastFailedSequence !== null) {
            // Skip ahead more aggressively if we've had multiple consecutive failures
            // This handles cases where many sequences are taken by pending transactions
            const skipAmount = Math.max(consecutiveFailures * 100, 100); // Skip at least 100, or 100 per failure
            minSequence = lastFailedSequence + skipAmount;
            console.log(`   ⚠️ Last failed sequence was ${lastFailedSequence}, skipping ahead by ${skipAmount} to ${minSequence} (${consecutiveFailures} consecutive failures)`);
          }
          
          // The next available sequence is the higher of:
          // 1. Base sequence + pending transactions
          // 2. Highest sequence from transactions + 1
          // 3. Last failed sequence + skip amount (if we got temREDUNDANT)
          // 4. Add a large safety buffer to account for transactions we can't see
          let nextSequence = minSequence;
          
          // Add a LARGE safety buffer - many sequences might be taken by pending transactions
          // This is especially important when there are many rapid transactions
          // If we found a high sequence in history but base sequence is lower, there are many pending
          const sequenceGap = highestSequence - baseSequence;
          
          // Special case: If account shows 0 transactions but baseSequence is very high,
          // there are likely many unconfirmed transactions. 
          // account_info.Sequence IS the next sequence to use, so we should use it directly
          // but add a buffer for any pending transactions we can't see
          let safetyBuffer;
          if (accountTx.result.transactions && accountTx.result.transactions.length === 0 && baseSequence > 1000) {
            // Account has 0 visible transactions but high sequence = many unconfirmed
            console.warn(`   🚨 CRITICAL: Account has 0 transactions but sequence ${baseSequence}.`);
            console.warn(`   🚨 This suggests ${baseSequence - 1} unconfirmed transactions exist.`);
            console.warn(`   🚨 account_info.Sequence (${baseSequence}) is the next to use, but adding buffer for unconfirmed.`);
            // Use baseSequence (which is the next available) but add buffer for unconfirmed
            safetyBuffer = 300; // Very large buffer for many unconfirmed transactions
            nextSequence = baseSequence + safetyBuffer;
            console.warn(`   🚨 Using sequence ${nextSequence} (base ${baseSequence} + buffer ${safetyBuffer})`);
          } else if (accountTx.result.transactions && accountTx.result.transactions.length === 0 && baseSequence <= 10) {
            // Fresh account with low sequence - use it directly
            console.log(`   ✅ Fresh account detected (sequence ${baseSequence}, 0 transactions)`);
            safetyBuffer = 0; // No buffer needed for fresh account
            nextSequence = baseSequence; // Use baseSequence directly
          } else {
            // Normal case: use calculated sequence with buffer
            safetyBuffer = Math.max(
              100, // Minimum 100 sequence buffer
              Math.max(consecutiveFailures * 50, 50), // 50 per failure
              sequenceGap > 50 ? sequenceGap + 50 : 0 // If gap is large, add extra buffer
            );
            nextSequence = nextSequence + safetyBuffer;
          }
          
          console.log(`   📊 Sequence gap (history vs base): ${sequenceGap}`);
          console.log(`   🛡️ Safety buffer: +${safetyBuffer}, Final sequence: ${nextSequence}`);
          
          console.log(`   📊 Base: ${baseSequence}, Pending: ${pendingTxCount}, Highest used: ${highestSequence}, Balance: ${balance.toFixed(6)} XRP`);
          console.log(`   🛡️ Safety buffer: +${safetyBuffer}, Final sequence: ${nextSequence}`);
          
          return nextSequence;
        } catch (error) {
          console.error('❌ Error getting next sequence:', error);
          // Fallback to account_info sequence
          const accountInfo = await client.request({
            command: 'account_info',
            account: walletAddress,
            ledger_index: 'current',
            queue: true
          });
          const baseSeq = accountInfo.result.account_data.Sequence;
          const pending = accountInfo.result.queue_data?.txn_count || 0;
          return baseSeq + pending;
        }
      }
      
      // Handle redundant transaction errors with retry logic
      let txHashResult;
      let submitResult;
      let retries = 0;
      const maxRetries = 8; // Increase max retries
      let lastFailedSequence = null;
      let consecutiveFailures = 0; // Track consecutive failures to skip ahead more aggressively
      
      // Initial wait to let any pending transactions clear
      if (retries === 0) {
        console.log('⏳ Waiting 3 seconds before first attempt to let pending transactions clear...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      while (retries < maxRetries) {
        // Get the actual next available sequence number
        // Pass lastFailedSequence so we can skip sequences that are definitely taken
        const currentSequence = await getNextAvailableSequence(client, wallet.address, lastFailedSequence, consecutiveFailures);
        
        // Validate sequence is reasonable (not 0 or 1 for an active account)
        if (currentSequence < 2 && retries === 0) {
          console.warn(`⚠️ Warning: Sequence number is very low (${currentSequence}). This might indicate a new account or an error.`);
        }
        
        // Final validation
        if (typeof currentSequence !== 'number' || isNaN(currentSequence) || currentSequence < 1) {
          console.error('❌ Invalid calculated sequence:', currentSequence);
          throw new Error(`Invalid calculated sequence number: ${currentSequence}`);
        }
        
        if (retries === 0) {
          console.log(`📊 Using sequence: ${currentSequence}`);
        } else {
          console.log(`🔄 Retry ${retries}: Using sequence: ${currentSequence}`);
        }
        
        // Create FRESH payment transaction on each retry (don't reuse objects)
        const payment = {
          TransactionType: 'Payment',
          Account: wallet.address,
          Destination: wallet.address, // Self-payment
          Amount: '1', // Minimum amount (1 drop = 0.000001 XRP)
          Memos: [memo],
          Sequence: currentSequence
        };
        
        // Autofill will set Fee and LastLedgerSequence, but we keep our Sequence
        const prepared = await client.autofill(payment);
        // Ensure sequence is correct after autofill (autofill might reset it)
        prepared.Sequence = currentSequence;
        
        // Sign the transaction
        const signed = wallet.sign(prepared);
        txHashResult = signed.hash;
        
        if (retries === 0) {
          console.log(`🔐 Transaction signed, hash: ${txHashResult}`);
        }
        
        // Submit the signed transaction blob
        submitResult = await client.submit(signed.tx_blob);
        
        // Check if transaction was accepted
        const isAccepted = submitResult.result.engine_result === 'tesSUCCESS';
        const isRedundant = submitResult.result.engine_result === 'temREDUNDANT';
        
        if (isAccepted) {
          console.log('✅ Quest Completion VC submitted to XRPL:', txHashResult);
          console.log('   Status:', submitResult.result.engine_result);
          break; // Success, exit retry loop
        } else if (isRedundant) {
          // temREDUNDANT means transaction with this sequence was already submitted
          // Check if it's on the ledger (succeeded)
          console.log(`   Checking if transaction ${txHashResult} succeeded on ledger...`);
          const txSucceeded = await checkTransactionOnLedger(client, txHashResult);
          if (txSucceeded) {
            console.log('✅ Transaction was already successful (temREDUNDANT but confirmed on ledger):', txHashResult);
            // Set engine_result to tesSUCCESS so final check passes
            submitResult.result.engine_result = 'tesSUCCESS';
            break; // Transaction succeeded, exit loop
          }
          
          // Transaction not found on ledger - this means the sequence number is already taken
          // by a different transaction. We need to increment the sequence and try again.
          console.log(`   Transaction ${txHashResult} not found on ledger. Sequence ${currentSequence} is already used.`);
          console.log(`   Will increment sequence and retry...`);
          
          // Track the failed sequence so we don't try it again
          // If we've failed multiple times, the account might have many pending transactions
          // So we'll skip ahead more aggressively
          lastFailedSequence = currentSequence;
          consecutiveFailures++; // Increment consecutive failures
          
          if (retries < maxRetries - 1) {
            // Sequence conflict - increment sequence and wait for ledger to update
            retries++;
            console.warn(`⚠️ temREDUNDANT error (attempt ${retries}/${maxRetries}). Sequence ${currentSequence} already used.`);
            console.warn(`   Many sequences appear to be taken (${consecutiveFailures} consecutive failures). Waiting longer and skipping ahead aggressively...`);
            // Wait longer - pending transactions might be processing
            // Increase wait time based on consecutive failures
            const waitTime = Math.min(6000 + (consecutiveFailures * 2000), 15000); // Max 15 seconds
            console.log(`   ⏳ Waiting ${waitTime/1000} seconds for ledger to update...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue; // Loop will re-fetch account info with updated sequence
          } else {
            // Max retries reached - try one more time with a fresh account info check
            console.warn('⚠️ Max retries reached for temREDUNDANT error');
            // Wait a bit longer and check one more time
            await new Promise(resolve => setTimeout(resolve, 5000));
            const finalCheck = await checkTransactionOnLedger(client, txHashResult);
            if (finalCheck) {
              console.log('✅ Transaction succeeded on final check:', txHashResult);
              submitResult.result.engine_result = 'tesSUCCESS';
              break;
            }
            // If still not found, the sequence was used by a different transaction
            // We should have incremented by now, but let's throw an error
            throw new Error(`Transaction with sequence ${currentSequence} was redundant and not found on ledger after ${maxRetries} retries. The sequence number may have been used by another transaction.`);
          }
        } else {
          // Other error
          console.warn('⚠️ Transaction not accepted:', submitResult.result.engine_result_message || submitResult.result.engine_result);
          break;
        }
      }
      
      // Check if transaction succeeded
      if (submitResult.result.engine_result === 'tesSUCCESS') {
        await client.disconnect();
        
        console.log('✅ Quest Completion VC issued on XRPL:', txHashResult);
        
        res.json({
          success: true,
          demoMode: false,
          vcId: vcData.id,
          txHash: txHashResult,
          vc: {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            id: vcData.id,
            type: ['VerifiableCredential', vcData.type],
            issuer: { id: vcData.issuerDid },
            issuanceDate: vcData.issuanceDate,
            expirationDate: vcData.expirationDate,
            credentialSubject: {
              id: vcData.subjectDid,
              ...vcData.credentialSubject
            }
          },
          xrplExplorer: `https://testnet.xrpl.org/transactions/${txHashResult}`
        });
      } else {
        await client.disconnect();
        throw new Error(`Transaction failed: ${submitResult.result.engine_result_message || submitResult.result.engine_result}`);
      }
    } catch (xrplError) {
      console.error('❌ XRPL VC issuance failed:', xrplError);
      // Fallback to demo mode
      res.json({
        success: true,
        demoMode: true,
        vcId: `vc:quest:${questId}:${Date.now()}`,
        vc: {
          type: ['VerifiableCredential', 'QuestCompletionCredential'],
          credentialSubject: {
            questId: questId,
            questTitle: questTitle,
            completionDate: new Date().toISOString(),
            transactionHash: txHash,
            nftTokenId: tokenId || null,
            verified: true,
            onChain: true
          }
        },
        error: xrplError.message,
        message: 'XRPL issuance failed - VC issued in demo mode'
      });
    }
  } catch (error) {
    console.error('Error issuing Quest VC:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      demoMode: true
    });
  }
});

// POST /issue-plaid-vc - Issue Plaid Connection VC on XRPL
app.post('/issue-plaid-vc', async (req, res) => {
  try {
    const { plaidMetadata, userAddress } = req.body;
    
    if (!plaidMetadata || !userAddress) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: plaidMetadata, userAddress' 
      });
    }

    // Get XRPL config
    const { accountAddress, accountSecret } = loadXRPLConfig();
    
    // Check if XRPL is configured
    if (!isXRPLConfigured()) {
      // Return demo VC if XRPL not configured
      return res.json({
        success: true,
        demoMode: true,
        vcId: `vc:plaid:${Date.now()}`,
        vc: {
          type: ['VerifiableCredential', 'PlaidAccountConnection'],
          credentialSubject: {
            accountType: plaidMetadata?.institution?.name || 'Bank Account',
            institutionId: plaidMetadata?.institution?.institution_id || 'unknown',
            accountsLinked: plaidMetadata?.accounts?.length || 0,
            connectionDate: new Date().toISOString(),
            verified: true
          }
        },
        message: 'XRPL not configured - VC issued in demo mode'
      });
    }

      // Helper function to check if transaction exists on ledger
    async function checkTransactionOnLedger(client, txHash) {
      try {
        const txResult = await client.request({
          command: 'tx',
          transaction: txHash
        });
        if (txResult.result && txResult.result.meta) {
          const isSuccess = txResult.result.meta.TransactionResult === 'tesSUCCESS';
          if (isSuccess) {
            console.log(`   ✅ Transaction ${txHash} found on ledger with status: tesSUCCESS`);
          } else {
            console.log(`   ⚠️ Transaction ${txHash} found on ledger but status is: ${txResult.result.meta.TransactionResult}`);
          }
          return isSuccess;
        }
        return false;
      } catch (error) {
        // Transaction not found - this is normal if it hasn't been validated yet
        if (error.message && error.message.includes('not found')) {
          console.log(`   ⏳ Transaction ${txHash} not found on ledger yet (may still be processing)`);
        } else {
          console.log(`   ⚠️ Error checking transaction ${txHash}:`, error.message);
        }
        return false;
      }
    }

    try {
      // Import XRPL directly (Node.js only)
      const { Client, Wallet, convertStringToHex } = require('xrpl');
      // Using XRPL Testnet (free testnet XRP, no real money)
      // WebSocket: wss://s.altnet.rippletest.net:51233
      // JSON-RPC: https://s.altnet.rippletest.net:51234
      const XRPL_TESTNET = 'wss://s.altnet.rippletest.net:51233';
      
      console.log('🔌 Connecting to XRPL Testnet (wss://s.altnet.rippletest.net:51233)...');
      // Create XRPL client and wallet
      const client = new Client(XRPL_TESTNET);
      await client.connect();
      console.log('✅ Connected to XRPL Testnet');
      
      const wallet = Wallet.fromSeed(accountSecret);
      console.log(`📝 Using testnet account: ${wallet.address}`);
      
      // Create VC data structure
      const vcData = {
        id: `vc:plaid:${Date.now()}`,
        type: 'PlaidAccountConnection',
        issuerDid: 'did:xrpl:PlaidSandbox:001',
        subjectDid: `did:xrpl:user:${userAddress.slice(2, 10)}`,
        credentialSubject: {
          accountType: plaidMetadata?.institution?.name || 'Bank Account',
          institutionId: plaidMetadata?.institution?.institution_id || 'unknown',
          accountsLinked: plaidMetadata?.accounts?.length || 0,
          connectionDate: new Date().toISOString(),
          verified: true
        },
        issuanceDate: new Date().toISOString(),
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      // Store VC on XRPL using transaction memo
      // XRPL requires memo to be wrapped in a Memo field
      const memo = {
        Memo: {
          MemoType: convertStringToHex('VC'),
          MemoData: convertStringToHex(JSON.stringify({
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
          })),
          MemoFormat: convertStringToHex('application/json')
        }
      };
      
      // Helper function to get the actual next available sequence number
      async function getNextAvailableSequence(client, walletAddress, lastFailedSequence = null, consecutiveFailures = 0) {
        try {
          // Get account info with queue data
          const accountInfo = await client.request({
            command: 'account_info',
            account: walletAddress,
            ledger_index: 'current',
            queue: true
          });
          
          const baseSequence = accountInfo.result.account_data.Sequence;
          const pendingTxCount = accountInfo.result.queue_data?.txn_count || 0;
          
          // Check account balance
          const balance = parseFloat(accountInfo.result.account_data.Balance) / 1000000; // Convert drops to XRP
          if (balance < 0.01) {
            console.warn(`⚠️ Low XRP balance: ${balance} XRP. Transactions require ~0.000012 XRP.`);
          }
          
          // Get recent transactions to find the highest sequence actually used
          const accountTx = await client.request({
            command: 'account_tx',
            account: walletAddress,
            limit: 200 // Check last 200 transactions (increased to catch all pending)
          });
          
          let highestSequence = baseSequence - 1; // Start with base - 1
          let validatedHighestSequence = baseSequence - 1;
          
          // Find the highest sequence number from recent transactions
          if (accountTx.result.transactions && accountTx.result.transactions.length > 0) {
            for (const tx of accountTx.result.transactions) {
              if (tx.tx && tx.tx.Sequence && typeof tx.tx.Sequence === 'number') {
                const seq = tx.tx.Sequence;
                if (seq > highestSequence) {
                  highestSequence = seq;
                }
                // Track validated transactions separately
                if (tx.validated && seq > validatedHighestSequence) {
                  validatedHighestSequence = seq;
                }
              }
            }
            console.log(`   🔍 Transaction history: Found ${accountTx.result.transactions.length} transactions`);
            console.log(`   📊 Highest sequence in history: ${highestSequence}, Validated highest: ${validatedHighestSequence}`);
          } else {
            console.log(`   🔍 Transaction history: No transactions found`);
            // If no transactions found but baseSequence is high, there might be unconfirmed transactions
            // Use baseSequence but add a large buffer to account for unconfirmed ones
            if (baseSequence > 1000) {
              console.warn(`   ⚠️ WARNING: Account shows 0 transactions but sequence is ${baseSequence}.`);
              console.warn(`   ⚠️ This suggests ${baseSequence - 1} unconfirmed transactions. Using baseSequence with large buffer.`);
              // Set highestSequence to baseSequence - 1 (last used sequence)
              highestSequence = baseSequence - 1;
              validatedHighestSequence = baseSequence - 1;
            } else {
              // Fresh account - use baseSequence as-is
              highestSequence = baseSequence - 1;
              validatedHighestSequence = baseSequence - 1;
            }
          }
          
          // If we got temREDUNDANT with a specific sequence, that sequence is definitely taken
          // So we need to use at least that sequence + 1
          // If we've failed multiple times consecutively, skip ahead much more aggressively
          let minSequence = Math.max(baseSequence + pendingTxCount, highestSequence + 1);
          if (lastFailedSequence !== null) {
            // Skip ahead more aggressively if we've had multiple consecutive failures
            // This handles cases where many sequences are taken by pending transactions
            const skipAmount = Math.max(consecutiveFailures * 100, 100); // Skip at least 100, or 100 per failure
            minSequence = lastFailedSequence + skipAmount;
            console.log(`   ⚠️ Last failed sequence was ${lastFailedSequence}, skipping ahead by ${skipAmount} to ${minSequence} (${consecutiveFailures} consecutive failures)`);
          }
          
          // The next available sequence is the higher of:
          // 1. Base sequence + pending transactions
          // 2. Highest sequence from transactions + 1
          // 3. Last failed sequence + skip amount (if we got temREDUNDANT)
          // 4. Add a large safety buffer to account for transactions we can't see
          let nextSequence = minSequence;
          
          // Add a LARGE safety buffer - many sequences might be taken by pending transactions
          // This is especially important when there are many rapid transactions
          // If we found a high sequence in history but base sequence is lower, there are many pending
          const sequenceGap = highestSequence - baseSequence;
          
          // Special case: If account shows 0 transactions but baseSequence is very high,
          // there are likely many unconfirmed transactions. 
          // account_info.Sequence IS the next sequence to use, so we should use it directly
          // but add a buffer for any pending transactions we can't see
          let safetyBuffer;
          if (accountTx.result.transactions && accountTx.result.transactions.length === 0 && baseSequence > 1000) {
            // Account has 0 visible transactions but high sequence = many unconfirmed
            console.warn(`   🚨 CRITICAL: Account has 0 transactions but sequence ${baseSequence}.`);
            console.warn(`   🚨 This suggests ${baseSequence - 1} unconfirmed transactions exist.`);
            console.warn(`   🚨 account_info.Sequence (${baseSequence}) is the next to use, but adding buffer for unconfirmed.`);
            // Use baseSequence (which is the next available) but add buffer for unconfirmed
            safetyBuffer = 300; // Very large buffer for many unconfirmed transactions
            nextSequence = baseSequence + safetyBuffer;
            console.warn(`   🚨 Using sequence ${nextSequence} (base ${baseSequence} + buffer ${safetyBuffer})`);
          } else if (accountTx.result.transactions && accountTx.result.transactions.length === 0 && baseSequence <= 10) {
            // Fresh account with low sequence - use it directly
            console.log(`   ✅ Fresh account detected (sequence ${baseSequence}, 0 transactions)`);
            safetyBuffer = 0; // No buffer needed for fresh account
            nextSequence = baseSequence; // Use baseSequence directly
          } else {
            // Normal case: use calculated sequence with buffer
            safetyBuffer = Math.max(
              100, // Minimum 100 sequence buffer
              Math.max(consecutiveFailures * 50, 50), // 50 per failure
              sequenceGap > 50 ? sequenceGap + 50 : 0 // If gap is large, add extra buffer
            );
            nextSequence = nextSequence + safetyBuffer;
          }
          
          console.log(`   📊 Sequence gap (history vs base): ${sequenceGap}`);
          console.log(`   🛡️ Safety buffer: +${safetyBuffer}, Final sequence: ${nextSequence}`);
          
          console.log(`   📊 Base: ${baseSequence}, Pending: ${pendingTxCount}, Highest used: ${highestSequence}, Balance: ${balance.toFixed(6)} XRP`);
          console.log(`   🛡️ Safety buffer: +${safetyBuffer}, Final sequence: ${nextSequence}`);
          
          return nextSequence;
        } catch (error) {
          console.error('❌ Error getting next sequence:', error);
          // Fallback to account_info sequence
          const accountInfo = await client.request({
            command: 'account_info',
            account: walletAddress,
            ledger_index: 'current',
            queue: true
          });
          const baseSeq = accountInfo.result.account_data.Sequence;
          const pending = accountInfo.result.queue_data?.txn_count || 0;
          return baseSeq + pending;
        }
      }
      
      // Handle redundant transaction errors with retry logic
      let txHash;
      let submitResult;
      let retries = 0;
      const maxRetries = 5;
      let lastFailedSequence = null;
      let consecutiveFailures = 0; // Track consecutive failures to skip ahead more aggressively
      
      while (retries < maxRetries) {
        // Get the actual next available sequence number
        // Pass lastFailedSequence so we can skip sequences that are definitely taken
        const currentSequence = await getNextAvailableSequence(client, wallet.address, lastFailedSequence, consecutiveFailures);
        
        // Validate sequence is reasonable (not 0 or 1 for an active account)
        if (currentSequence < 2 && retries === 0) {
          console.warn(`⚠️ Warning: Sequence number is very low (${currentSequence}). This might indicate a new account or an error.`);
        }
        
        // Final validation
        if (typeof currentSequence !== 'number' || isNaN(currentSequence) || currentSequence < 1) {
          console.error('❌ Invalid calculated sequence:', currentSequence);
          throw new Error(`Invalid calculated sequence number: ${currentSequence}`);
        }
        
        if (retries === 0) {
          console.log(`📊 Using sequence: ${currentSequence}`);
        } else {
          console.log(`🔄 Retry ${retries}: Using sequence: ${currentSequence}`);
        }
        
        // Create FRESH payment transaction on each retry (don't reuse objects)
        const payment = {
          TransactionType: 'Payment',
          Account: wallet.address,
          Destination: wallet.address, // Self-payment
          Amount: '1', // Minimum amount (1 drop = 0.000001 XRP)
          Memos: [memo],
          Sequence: currentSequence
        };
        
        // Autofill will set Fee and LastLedgerSequence, but we keep our Sequence
        const prepared = await client.autofill(payment);
        // Ensure sequence is correct after autofill (autofill might reset it)
        prepared.Sequence = currentSequence;
        
        // Sign the transaction
        const signed = wallet.sign(prepared);
        txHash = signed.hash;
        
        if (retries === 0) {
          console.log(`🔐 Transaction signed, hash: ${txHash}`);
        }
        
        // Submit the signed transaction blob
        submitResult = await client.submit(signed.tx_blob);
        
        // Check if transaction was accepted
        const isAccepted = submitResult.result.engine_result === 'tesSUCCESS';
        const isRedundant = submitResult.result.engine_result === 'temREDUNDANT';
        
        if (isAccepted) {
          console.log('✅ Plaid Connection VC submitted to XRPL:', txHash);
          console.log('   Status:', submitResult.result.engine_result);
          break; // Success, exit retry loop
        } else if (isRedundant) {
          // temREDUNDANT means transaction with this sequence was already submitted
          // Check if it's on the ledger (succeeded)
          console.log(`   Checking if transaction ${txHash} succeeded on ledger...`);
          const txSucceeded = await checkTransactionOnLedger(client, txHash);
          if (txSucceeded) {
            console.log('✅ Transaction was already successful (temREDUNDANT but confirmed on ledger):', txHash);
            // Set engine_result to tesSUCCESS so final check passes
            submitResult.result.engine_result = 'tesSUCCESS';
            break; // Transaction succeeded, exit loop
          }
          
          // Transaction not found on ledger - this means the sequence number is already taken
          // by a different transaction. We need to increment the sequence and try again.
          console.log(`   Transaction ${txHash} not found on ledger. Sequence ${currentSequence} is already used.`);
          console.log(`   Will increment sequence and retry...`);
          
          // Track the failed sequence so we don't try it again
          // If we've failed multiple times, the account might have many pending transactions
          // So we'll skip ahead more aggressively
          lastFailedSequence = currentSequence;
          consecutiveFailures++; // Increment consecutive failures
          
          if (retries < maxRetries - 1) {
            // Sequence conflict - increment sequence and wait for ledger to update
            retries++;
            console.warn(`⚠️ temREDUNDANT error (attempt ${retries}/${maxRetries}). Sequence ${currentSequence} already used.`);
            console.warn(`   Many sequences appear to be taken (${consecutiveFailures} consecutive failures). Waiting longer and skipping ahead aggressively...`);
            // Wait longer - pending transactions might be processing
            // Increase wait time based on consecutive failures
            const waitTime = Math.min(6000 + (consecutiveFailures * 2000), 15000); // Max 15 seconds
            console.log(`   ⏳ Waiting ${waitTime/1000} seconds for ledger to update...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue; // Loop will re-fetch account info with updated sequence
          } else {
            // Max retries reached - try one more time with a fresh account info check
            console.warn('⚠️ Max retries reached for temREDUNDANT error');
            // Wait a bit longer and check one more time
            await new Promise(resolve => setTimeout(resolve, 5000));
            const finalCheck = await checkTransactionOnLedger(client, txHash);
            if (finalCheck) {
              console.log('✅ Transaction succeeded on final check:', txHash);
              submitResult.result.engine_result = 'tesSUCCESS';
              break;
            }
            // If still not found, the sequence was used by a different transaction
            // We should have incremented by now, but let's throw an error
            throw new Error(`Transaction with sequence ${currentSequence} was redundant and not found on ledger after ${maxRetries} retries. The sequence number may have been used by another transaction.`);
          }
        } else {
          // Other error
          console.warn('⚠️ Transaction not accepted:', submitResult.result.engine_result_message || submitResult.result.engine_result);
          break;
        }
      }
      
      if (submitResult.result.engine_result === 'tesSUCCESS') {
        await client.disconnect();
        
        console.log('✅ Plaid Connection VC issued on XRPL:', txHash);
        
        res.json({
          success: true,
          demoMode: false,
          vcId: vcData.id,
          txHash: txHash,
          vc: {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            id: vcData.id,
            type: ['VerifiableCredential', vcData.type],
            issuer: { id: vcData.issuerDid },
            issuanceDate: vcData.issuanceDate,
            expirationDate: vcData.expirationDate,
            credentialSubject: {
              id: vcData.subjectDid,
              ...vcData.credentialSubject
            }
          },
          xrplExplorer: `https://testnet.xrpl.org/transactions/${txHash}`
        });
      } else {
        await client.disconnect();
        throw new Error(`Transaction failed: ${submitResult.result.engine_result_message}`);
      }
    } catch (xrplError) {
      console.error('❌ XRPL VC issuance failed:', xrplError);
      // Fallback to demo mode
      res.json({
        success: true,
        demoMode: true,
        vcId: `vc:plaid:${Date.now()}`,
        vc: {
          type: ['VerifiableCredential', 'PlaidAccountConnection'],
          credentialSubject: {
            accountType: plaidMetadata?.institution?.name || 'Bank Account',
            institutionId: plaidMetadata?.institution?.institution_id || 'unknown',
            accountsLinked: plaidMetadata?.accounts?.length || 0,
            connectionDate: new Date().toISOString(),
            verified: true
          }
        },
        error: xrplError.message,
        message: 'XRPL issuance failed - VC issued in demo mode'
      });
    }
  } catch (error) {
    console.error('Error issuing Plaid VC:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      demoMode: true
    });
  }
});

// POST /import-cross-border-vc - Import cross-border VC for immigrant
app.post('/import-cross-border-vc', async (req, res) => {
  try {
    const {
      walletAddress,
      vcId,
      vcType,
      creditScore // 1-100 scale (replaces ficoPoints)
    } = req.body;

    if (!walletAddress || !vcId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: walletAddress, vcId'
      });
    }

    // Load user profile
    const fs = require('fs');
    const usersPath = path.join(__dirname, 'users.json');
    
    if (!fs.existsSync(usersPath)) {
      return res.status(404).json({
        success: false,
        error: 'User not found. Please sign up first.'
      });
    }

    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const userIndex = users.findIndex(u => 
      u.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Fetch VC from cross-border system
    const XRPLCrossBorderService = require('./xrpl-cross-border');
    const { accountAddress, accountSecret } = loadXRPLConfig();
    const service = new XRPLCrossBorderService(accountAddress, accountSecret);
    
    const vc = await service.fetchVCFromXRPL(vcId);
    await service.disconnect();

    if (!vc) {
      return res.status(404).json({
        success: false,
        error: 'VC not found'
      });
    }

    // Add VC to user profile
    users[userIndex].vcs.push({
      ...vc,
      importedAt: new Date().toISOString(),
      source: 'cross-border'
    });

    // Calculate credit score points from cross-border VC (1-100 scale)
    const pointsToAdd = calculateCrossBorderCreditScore(vc, vcType);
    users[userIndex].creditScore = Math.min(100, Math.max(1, (users[userIndex].creditScore || 0) + pointsToAdd));

    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

    console.log(`✅ Cross-border VC imported for ${walletAddress}: +${pointsToAdd} credit score points`);

    res.json({
      success: true,
      vc: vc,
      creditScoreAdded: pointsToAdd,
      newCreditScore: users[userIndex].creditScore,
      message: `Cross-border VC imported! +${pointsToAdd} credit score points added.`
    });
  } catch (error) {
    console.error('Error importing cross-border VC:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to calculate credit score points from cross-border VCs (1-100 scale)
// Returns value between 1-10 that contributes to overall credit score
function calculateCrossBorderCreditScore(vc, vcType) {
  let points = 0;

  if (vcType === 'PaymentHistoryCredential' || vc.credentialSubject?.yearsOfHistory) {
    // Payment history points - converted to 1-10 scale
    const years = vc.credentialSubject.yearsOfHistory || 0;
    const onTimeRate = (vc.credentialSubject.onTimePayments || 0) / (vc.credentialSubject.totalPayments || 1);
    
    // Base points for payment history
    points += Math.min(5, Math.floor(years * 0.5)); // Up to 5 points for years (was 50)
    
    // On-time payment bonus
    if (onTimeRate >= 0.95) {
      points += 3; // Excellent payment history (was 30)
    } else if (onTimeRate >= 0.90) {
      points += 2; // Good payment history (was 20)
    } else if (onTimeRate >= 0.80) {
      points += 1; // Fair payment history (was 10)
    }
  }

  // Rent payment history (if available in VC) - converted to 1-10 scale
  if (vc.credentialSubject?.rentPayments) {
    const rentPayments = vc.credentialSubject.rentPayments;
    if (rentPayments.onTimeCount >= 24) {
      points += 3; // 2 years of on-time rent (was 25)
    } else if (rentPayments.onTimeCount >= 12) {
      points += 2; // 1 year of on-time rent (was 25)
    }
  }

  // Account age bonus - converted to 1-10 scale
  if (vc.credentialSubject?.accountAgeMonths) {
    const months = vc.credentialSubject.accountAgeMonths;
    if (months >= 24) {
      points += 2; // 2+ years account age (was 15)
    } else if (months >= 12) {
      points += 1; // 1 year account age
    }
  }

  // Clamp between 1-10 points (contributing to 1-100 overall credit score)
  return Math.max(1, Math.min(10, points));
}

// POST /fulfill-quest - Mint NFT on Polygon and issue VC on XRPL
app.post('/fulfill-quest', async (req, res) => {
  try {
    const { questId, userAddress, userId } = req.body;
    
    if (!questId || !userAddress) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: questId, userAddress' 
      });
    }

    // Check for test mode (simulates minting without spending POL)
    const TEST_MODE = process.env.TEST_MODE === 'true' || req.body.testMode === true;
    
    if (TEST_MODE) {
      console.log('🧪 TEST MODE: Simulating NFT minting (no actual transaction)');
      // Simulate a successful mint
      const mockTokenId = Math.floor(Math.random() * 1000000) + 1;
      const mockTxHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
      
      return res.json({
        success: true,
        tokenId: mockTokenId.toString(),
        txHash: mockTxHash,
        nftAddress: process.env.POLYGON_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
        polygonExplorer: `https://amoy.polygonscan.com/tx/${mockTxHash}`,
        testMode: true,
        note: 'This is a test transaction - no POL was spent. Set TEST_MODE=false in .env to enable real minting.'
      });
    }

    // Check if Polygon contract is configured
    const contractAddress = process.env.POLYGON_CONTRACT_ADDRESS;
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!contractAddress || !privateKey) {
      return res.status(400).json({
        success: false,
        error: 'Polygon contract not configured. Please deploy contract and set POLYGON_CONTRACT_ADDRESS and PRIVATE_KEY in .env'
      });
    }

    try {
      // Import ethers (CommonJS require for v5)
      const ethers = require('ethers');
      
      // Connect to Polygon Amoy testnet (ethers v5 syntax)
      const provider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology/');
      const wallet = new ethers.Wallet(privateKey, provider);
      
      // Load contract ABI (simplified - just the mintQuestNFT function)
      const contractABI = [
        "function mintQuestNFT(address to, string memory questId, string memory metadataURI) external returns (uint256)",
        "function getQuestTokenId(address user, string memory questId) external view returns (uint256)",
        "event QuestNFTMinted(address indexed user, string questId, uint256 tokenId)"
      ];
      
      const contract = new ethers.Contract(contractAddress, contractABI, wallet);
      
      // Check if NFT already exists
      let tokenId;
      try {
        tokenId = await contract.getQuestTokenId(userAddress, questId);
        if (tokenId && tokenId.toString() !== '0') {
          console.log(`✅ NFT already exists for quest ${questId}: Token #${tokenId}`);
          // Get transaction hash from recent events
          const filter = contract.filters.QuestNFTMinted(userAddress, questId);
          const events = await contract.queryFilter(filter);
          const txHash = events.length > 0 ? events[events.length - 1].transactionHash : null;
          
          return res.json({
            success: true,
            tokenId: tokenId.toString(),
            txHash: txHash,
            nftAddress: contractAddress,
            message: 'NFT already minted for this quest'
          });
        }
      } catch (e) {
        // NFT doesn't exist yet, proceed to mint
      }
      
      // Create metadata URI
      const metadataURI = `https://api.plaidquest.com/nft/${questId}`;
      
      console.log(`🔨 Minting NFT for quest ${questId} to ${userAddress}...`);
      
      // Get current gas prices and set minimums for Polygon Amoy
      const feeData = await provider.getFeeData();
      const minPriorityFee = ethers.utils.parseUnits('30', 'gwei'); // 30 gwei minimum (above 25 gwei requirement)
      const minMaxFee = ethers.utils.parseUnits('50', 'gwei'); // 50 gwei for max fee
      
      // Use higher of current or minimum gas prices
      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas && feeData.maxPriorityFeePerGas.gt(minPriorityFee) 
        ? feeData.maxPriorityFeePerGas 
        : minPriorityFee;
      const maxFeePerGas = feeData.maxFeePerGas && feeData.maxFeePerGas.gt(minMaxFee)
        ? feeData.maxFeePerGas
        : minMaxFee;
      
      console.log(`⛽ Gas prices - Priority: ${ethers.utils.formatUnits(maxPriorityFeePerGas, 'gwei')} gwei, Max: ${ethers.utils.formatUnits(maxFeePerGas, 'gwei')} gwei`);
      
      // Mint NFT with explicit gas prices
      const tx = await contract.mintQuestNFT(userAddress, questId, metadataURI, {
        maxPriorityFeePerGas: maxPriorityFeePerGas,
        maxFeePerGas: maxFeePerGas
      });
      console.log(`⏳ Transaction submitted: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`✅ Transaction confirmed! Tx: ${tx.hash}`);
      
      // Get token ID from event (ethers v5 syntax)
      let mintedTokenId = null;
      const mintEvent = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed && parsed.name === 'QuestNFTMinted';
        } catch (e) {
          return false;
        }
      });
      
      if (mintEvent) {
        try {
          const parsed = contract.interface.parseLog(mintEvent);
          mintedTokenId = parsed.args.tokenId.toString();
          console.log(`✅ NFT minted! Token ID: ${mintedTokenId}`);
        } catch (e) {
          console.warn('⚠️ Could not parse event, querying contract...', e.message);
          // Fallback: query the contract
          mintedTokenId = await contract.getQuestTokenId(userAddress, questId);
          console.log(`✅ NFT minted! Token ID: ${mintedTokenId} (queried from contract)`);
        }
      } else {
        // Fallback: query the contract
        mintedTokenId = await contract.getQuestTokenId(userAddress, questId);
        console.log(`✅ NFT minted! Token ID: ${mintedTokenId} (queried from contract)`);
      }
      
      tokenId = mintedTokenId;
      
      // VC issuance is handled by frontend via MetaMask → demo mode
      // Backend only mints NFT on Polygon, frontend handles VC issuance
      console.log('✅ NFT minted successfully. VC issuance will be handled by frontend via MetaMask.');
      
      res.json({
        success: true,
        tokenId: tokenId.toString(),
        txHash: tx.hash,
        nftAddress: contractAddress,
        polygonExplorer: `https://amoy.polygonscan.com/tx/${tx.hash}`,
        note: 'VC issuance will be handled by frontend via MetaMask XRPL Snap → demo mode'
      });
      
    } catch (error) {
      console.error('❌ Error minting NFT on Polygon:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to mint NFT on Polygon'
      });
    }
    
  } catch (error) {
    console.error('Error in fulfill-quest endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(3003, () => {
  console.log('Plaid Node.js integration server running on port 3003');
  console.log('XAI Analysis endpoint available at: http://localhost:3003/xai-analysis');
  console.log('Leaderboard endpoint available at: http://localhost:3003/leaderboard');
  console.log('Sign-up endpoint available at: http://localhost:3003/signup');
  console.log('VC Issuance endpoints:');
  console.log('  - POST /issue-quest-vc (Issue Quest Completion VC on XRPL)');
  console.log('  - POST /issue-plaid-vc (Issue Plaid Connection VC on XRPL)');
  console.log('NFT Minting endpoints:');
  console.log('  - POST /fulfill-quest (Mint NFT on Polygon + Issue VC on XRPL)');
  console.log('Cross-Border Verification endpoints:');
  console.log('  - POST /cross-border/issue-bank-legitimacy');
  console.log('  - POST /cross-border/issue-user-payment-history');
  console.log('  - POST /cross-border/verify-chain');
  console.log('  - GET /cross-border/user-vcs/:userDid');
});
