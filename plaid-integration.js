// Plaid Integration Module
// This module handles all Plaid Link integration and data fetching

class PlaidIntegration {
    constructor() {
        this.linkHandler = null;
        this.accessToken = null;
        this.publicToken = null;
        this.itemId = null;
        this.connected = false;
    }
    
    /**
     * Initialize Plaid Link
     * NOTE: In production, you need a backend server to:
     * 1. Create a link_token using Plaid API
     * 2. Exchange public_token for access_token
     * 
     * For this demo, we'll simulate the flow using Plaid Sandbox
     */
    async initializePlaidLink() {
        try {
            // In a real app, you would call your backend to get a link_token
            // const response = await fetch('/api/create_link_token');
            // const data = await response.json();
            // const linkToken = data.link_token;
            
            // For demo purposes, we'll use Plaid's Link in Sandbox mode
            // You'll need to set up a simple backend or use Plaid's demo token
            
            const linkToken = await this.createLinkToken();
            
            if (!linkToken) {
                console.error('Failed to create link token');
                this.showPlaidError();
                return;
            }
            
            this.linkHandler = Plaid.create({
                token: linkToken,
                onSuccess: (public_token, metadata) => {
                    console.log('Plaid Link Success!', metadata);
                    this.publicToken = public_token;
                    this.itemId = metadata.institution.institution_id;
                    this.handlePlaidSuccess(public_token, metadata);
                },
                onExit: (err, metadata) => {
                    console.log('Plaid Link Exit', err, metadata);
                    if (err) {
                        this.handlePlaidError(err);
                    }
                },
                onEvent: (eventName, metadata) => {
                    console.log('Plaid Event:', eventName, metadata);
                }
            });
            
            return this.linkHandler;
        } catch (error) {
            console.error('Error initializing Plaid Link:', error);
            this.showPlaidError();
        }
    }
    
    /**
     * Open Plaid Link dialog
     */
    openPlaidLink() {
        if (this.linkHandler) {
            this.linkHandler.open();
        } else {
            console.error('Plaid Link not initialized');
            this.showPlaidError();
        }
    }
    
    /**
     * Create Link Token (Backend simulation)
     * In production, this should be done on your backend server
     */
    async createLinkToken() {
        // IMPORTANT: Replace this with your actual backend endpoint
        // that creates a link_token using Plaid API
        
        // For demo purposes, you can use Plaid's Link Update mode
        // or implement a simple Node.js backend
        
        console.warn('⚠️ SETUP REQUIRED: You need to implement a backend to create link tokens');
        console.warn('Visit: https://plaid.com/docs/link/link-token-migration-guide/');
        
        // Return null for now - you'll need to implement this
        // Example backend code is provided in backend-example.js
        return null;
    }
    
    /**
     * Handle successful Plaid Link connection
     */
    async handlePlaidSuccess(publicToken, metadata) {
        try {
            console.log('Processing Plaid connection...');
            
            // In production, send public_token to your backend
            // Your backend will exchange it for an access_token
            // const response = await fetch('/api/exchange_public_token', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ public_token: publicToken })
            // });
            // const data = await response.json();
            // this.accessToken = data.access_token;
            
            // For demo: simulate successful connection
            this.accessToken = 'sandbox_access_token_' + Date.now();
            this.connected = true;
            
            // Update UI
            this.updateConnectionStatus(true, metadata);
            
            // Fetch and analyze data
            await this.fetchPlaidData();
            
        } catch (error) {
            console.error('Error handling Plaid success:', error);
            this.handlePlaidError(error);
        }
    }
    
    /**
     * Fetch data from Plaid (Transactions, Balance, Identity)
     */
    async fetchPlaidData() {
        try {
            if (!this.accessToken) {
                throw new Error('No access token available');
            }
            
            console.log('Fetching Plaid data...');
            
            // In production, call your backend endpoints
            // const [accounts, transactions, identity, liabilities] = await Promise.all([
            //     fetch('/api/accounts', { ... }),
            //     fetch('/api/transactions', { ... }),
            //     fetch('/api/identity', { ... }),
            //     fetch('/api/liabilities', { ... })
            // ]);
            
            // For demo: Use mock Sandbox data
            const mockData = this.generateMockPlaidData();
            
            console.log('Plaid Data Retrieved:', mockData);
            
            // Trigger AI Analysis
            if (window.aiAnalysis) {
                window.aiAnalysis.analyzePlaidData(mockData);
            }
            
            return mockData;
            
        } catch (error) {
            console.error('Error fetching Plaid data:', error);
            throw error;
        }
    }
    
    /**
     * Generate mock Plaid Sandbox data
     * This simulates what you would get from the Plaid API
     */
    generateMockPlaidData() {
        // You can change these values to test different scenarios
        const scenarios = {
            good: {
                income: { amount: 5000, currency: 'USD' },
                utilization: 0.25,
                balance: 3500,
                transactionCount: 45
            },
            warning: {
                income: { amount: 2000, currency: 'USD' },
                utilization: 0.65,
                balance: 500,
                transactionCount: 30
            },
            poor: {
                income: { amount: 800, currency: 'USD' },
                utilization: 0.85,
                balance: 50,
                transactionCount: 15
            }
        };
        
        // Use 'good' scenario by default - change to 'warning' or 'poor' to test
        const scenario = scenarios.good;
        
        return {
            accounts: [
                {
                    account_id: 'mock_account_1',
                    balances: {
                        available: scenario.balance,
                        current: scenario.balance,
                        limit: scenario.balance * 4,
                        currency: 'USD'
                    },
                    name: 'Checking Account',
                    type: 'depository',
                    subtype: 'checking'
                }
            ],
            income: {
                amount: scenario.income.amount,
                currency: scenario.income.currency,
                last_updated: new Date().toISOString()
            },
            liabilities: {
                utilization: scenario.utilization,
                total_debt: scenario.balance * scenario.utilization,
                total_credit_limit: scenario.balance * 4
            },
            transactions: this.generateMockTransactions(scenario.transactionCount),
            identity: {
                names: ['Test User'],
                emails: ['test@example.com'],
                phone_numbers: ['+1234567890']
            }
        };
    }
    
    /**
     * Alias for generateMockPlaidData (for consistency)
     */
    generateMockData() {
        return this.generateMockPlaidData();
    }
    
    /**
     * Generate mock transaction data
     */
    generateMockTransactions(count) {
        const transactions = [];
        const categories = ['Food', 'Shopping', 'Transportation', 'Bills', 'Entertainment'];
        
        for (let i = 0; i < count; i++) {
            transactions.push({
                transaction_id: `mock_txn_${i}`,
                amount: Math.random() * 100 + 10,
                date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                name: categories[Math.floor(Math.random() * categories.length)],
                category: [categories[Math.floor(Math.random() * categories.length)]]
            });
        }
        
        return transactions;
    }
    
    /**
     * Update connection status in UI
     */
    updateConnectionStatus(connected, metadata = null) {
        const statusValue = document.getElementById('stability-value');
        const starsValue = document.getElementById('stars-value');
        
        if (connected) {
            statusValue.textContent = 'Analyzing...';
            statusValue.style.color = '#81c784';
            starsValue.textContent = '1/5';
            
            // Show success message
            this.showSuccessMessage(metadata);
        } else {
            statusValue.textContent = 'Not Connected';
            statusValue.style.color = '#ff6b6b';
        }
    }
    
    /**
     * Show success message
     */
    showSuccessMessage(metadata) {
        const questContent = document.getElementById('quest-content');
        const successMessage = document.createElement('div');
        successMessage.className = 'quest-card';
        successMessage.style.background = 'linear-gradient(135deg, rgba(129, 199, 132, 0.2), rgba(100, 181, 246, 0.2))';
        successMessage.innerHTML = `
            <h3>✅ Quest Complete!</h3>
            <p>Successfully connected to ${metadata ? metadata.institution.name : 'your bank'}!</p>
            <p>Your constellation is now being analyzed...</p>
        `;
        
        questContent.innerHTML = '';
        questContent.appendChild(successMessage);
    }
    
    /**
     * Handle Plaid errors
     */
    handlePlaidError(error) {
        console.error('Plaid Error:', error);
        alert('There was an error connecting to Plaid. Please check the console for details.');
    }
    
    /**
     * Show Plaid setup error message
     */
    showPlaidError() {
        const questContent = document.getElementById('quest-content');
        
        // Check if element exists before trying to modify it
        if (!questContent) {
            console.warn('Quest content element not found, skipping error display');
            return;
        }
        
        const errorMessage = document.createElement('div');
        errorMessage.className = 'quest-card';
        errorMessage.style.background = 'linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 68, 68, 0.2))';
        errorMessage.innerHTML = `
            <h3>⚠️ Setup Required</h3>
            <p>To use Plaid Link, you need to:</p>
            <ol style="text-align: left; padding-left: 20px; margin: 15px 0;">
                <li>Sign up for a free Plaid account at <a href="https://dashboard.plaid.com/signup" target="_blank" style="color: #64b5f6;">dashboard.plaid.com</a></li>
                <li>Get your API keys (client_id and secret)</li>
                <li>Set up a backend server to create link tokens</li>
                <li>Update the configuration in this app</li>
            </ol>
            <p style="font-size: 0.9em; color: #b0b0b0;">See README.md for detailed instructions.</p>
            <button onclick="useMockData()" class="btn-secondary">
                🧪 Use Mock Data Instead
            </button>
        `;
        
        questContent.innerHTML = '';
        questContent.appendChild(errorMessage);
    }
}

// Create global instance
window.plaidIntegration = new PlaidIntegration();
