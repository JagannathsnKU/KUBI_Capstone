// Leaderboard System - Compare users' NFT achievements
// Uses XRPL for decentralized leaderboard storage

class LeaderboardSystem {
    constructor() {
        this.currentViewingUser = null;
        this.users = [];
        this.init();
    }

    async init() {
        // Setup event listeners
        const leaderboardBtn = document.getElementById('leaderboard-btn');
        const closeBtn = document.getElementById('close-leaderboard');
        const modal = document.getElementById('leaderboard-modal');

        if (leaderboardBtn) {
            leaderboardBtn.addEventListener('click', () => this.openLeaderboard());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeLeaderboard());
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal && !e.target.closest('.glass-card')) {
                    this.closeLeaderboard();
                }
            });
        }

        // Load leaderboard data
        await this.loadLeaderboard();
    }

    async openLeaderboard() {
        const modal = document.getElementById('leaderboard-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            await this.refreshLeaderboard();
        }
    }
    
    closeLeaderboard() {
        const modal = document.getElementById('leaderboard-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    async loadLeaderboard() {
        try {
            // Try to fetch from XRPL first
            const xrplData = await this.fetchLeaderboardFromXRPL();
            if (xrplData && xrplData.length > 0) {
                this.users = xrplData;
                return;
            }
        } catch (error) {
            console.warn('⚠️ XRPL leaderboard fetch failed, using local data:', error);
        }

        // Fallback to localStorage (demo mode)
        this.users = this.loadLeaderboardFromLocal();
    }

    async fetchLeaderboardFromXRPL() {
        try {
            // Check if XRPL is configured
            if (typeof window.isXRPLConfigured === 'function' && !window.isXRPLConfigured()) {
                return null;
            }

            // Fetch leaderboard data from XRPL
            // This would query XRPL transactions for leaderboard entries
            // For now, return null to use local storage
            const response = await fetch('http://localhost:3003/leaderboard');
            if (response.ok) {
                const data = await response.json();
                return data.users || [];
            }
        } catch (error) {
            console.warn('XRPL leaderboard fetch error:', error);
        }
        return null;
    }

    loadLeaderboardFromLocal() {
        // Load from localStorage (demo mode)
        const stored = localStorage.getItem('leaderboard_users');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Error parsing leaderboard data:', e);
            }
        }

        // Generate demo users if none exist
        return this.generateDemoUsers();
    }

    generateDemoUsers() {
        // Generate some demo users for testing
        // NOTE: These are DEMO users with fake addresses - not stored on XRPL
        // Real users will appear here once they complete quests and their data is stored
        const demoUsers = [
            {
                address: '0x1234567890abcdef1234567890abcdef12345678',
                displayName: 'CryptoMaster',
                nftCount: 15,
                creditScore: 780,
                lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                isDemo: true // Mark as demo user
            },
            {
                address: '0xabcdef1234567890abcdef1234567890abcdef12',
                displayName: 'QuestHunter',
                nftCount: 12,
                creditScore: 750,
                lastActive: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                isDemo: true
            },
            {
                address: '0x9876543210fedcba9876543210fedcba98765432',
                displayName: 'NFTCollector',
                nftCount: 8,
                creditScore: 720,
                lastActive: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                isDemo: true
            }
        ];

        // Save demo users
        localStorage.setItem('leaderboard_users', JSON.stringify(demoUsers));
        console.log('📝 Generated demo users (not stored on XRPL - for testing only)');
        return demoUsers;
    }

    async refreshLeaderboard() {
        await this.loadLeaderboard();
        this.renderLeaderboard();
    }

    renderLeaderboard() {
        const content = document.getElementById('leaderboard-content');
        if (!content) return;

        // Sort users by NFT count (descending)
        const sortedUsers = [...this.users].sort((a, b) => {
            if (b.nftCount !== a.nftCount) {
                return b.nftCount - a.nftCount;
            }
            return b.creditScore - a.creditScore;
        });

        // Get current user's address if available
        const currentUserAddress = this.getCurrentUserAddress();

        let html = `
            <div style="margin-bottom:20px;padding:15px;background:rgba(139,92,246,0.1);border-radius:12px;border:2px solid rgba(139,92,246,0.3);">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                    <span style="font-size:1.5em;">📊</span>
                    <div style="flex:1;">
                        <div style="font-weight:600;font-size:1.1em;">Compare Your Progress</div>
                        <div style="font-size:0.85em;color:#94a3b8;margin-top:4px;">See how others are building their credit through achievements</div>
                        <div style="font-size:0.75em;color:#f59e0b;margin-top:6px;padding:6px;background:rgba(245,158,11,0.1);border-radius:6px;">
                            ⚠️ Demo users shown for testing. Real users appear when they complete quests!
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (sortedUsers.length === 0) {
            html += `
                <div style="text-align:center;padding:60px;color:#94a3b8;">
                    <div style="font-size:3em;margin-bottom:20px;">🌳</div>
                    <div style="font-size:1.2em;margin-bottom:10px;">No users yet</div>
                    <div style="font-size:0.9em;">Be the first to complete quests and appear on the leaderboard!</div>
                </div>
            `;
        } else {
            html += `
                <div style="display:grid;gap:12px;">
                    ${sortedUsers.map((user, index) => {
                        const rank = index + 1;
                        const isCurrentUser = user.address === currentUserAddress;
                        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
                        const timeAgo = this.getTimeAgo(new Date(user.lastActive));
                        
                        return `
                            <div style="
                                display:flex;
                                align-items:center;
                                gap:20px;
                                padding:20px;
                                background:${isCurrentUser ? 'rgba(139,92,246,0.2)' : 'rgba(30,41,59,0.6)'};
                                border-radius:12px;
                                border:2px solid ${isCurrentUser ? 'rgba(139,92,246,0.5)' : 'rgba(100,116,139,0.3)'};
                                cursor:pointer;
                                transition:all 0.3s ease;
                                ${isCurrentUser ? 'box-shadow:0 0 20px rgba(139,92,246,0.4);' : ''}
                            " 
                            onmouseover="this.style.transform='scale(1.02)';this.style.background='${isCurrentUser ? 'rgba(139,92,246,0.3)' : 'rgba(51,65,85,0.8)'}'"
                            onmouseout="this.style.transform='scale(1)';this.style.background='${isCurrentUser ? 'rgba(139,92,246,0.2)' : 'rgba(30,41,59,0.6)'}'"
                            onclick="window.leaderboardSystem.viewUserTree('${user.address}')">
                                <!-- Rank -->
                                <div style="
                                    font-size:2em;
                                    font-weight:700;
                                    min-width:60px;
                                    text-align:center;
                                    color:${rank <= 3 ? '#fbbf24' : '#94a3b8'};
                                ">${medal}</div>
                                
                                <!-- User Info -->
                                <div style="flex:1;">
                                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                                        <div style="font-weight:700;font-size:1.2em;color:#fff;">
                                            ${user.displayName || this.formatAddress(user.address)}
                                        </div>
                                        ${isCurrentUser ? '<span style="background:#8b5cf6;color:#fff;padding:4px 8px;border-radius:6px;font-size:0.75em;font-weight:600;">YOU</span>' : ''}
                                    </div>
                                    <div style="font-family:'Courier New',monospace;font-size:0.85em;color:#7dd3fc;margin-bottom:8px;">
                                        ${this.formatAddress(user.address)}
                                    </div>
                                    <div style="display:flex;gap:20px;font-size:0.9em;color:#94a3b8;">
                                        <span>🕒 ${timeAgo}</span>
                                    </div>
                                </div>
                                
                                <!-- Stats -->
                                <div style="display:flex;gap:30px;align-items:center;">
                                    <div style="text-align:center;">
                                        <div style="font-size:0.85em;color:#94a3b8;margin-bottom:4px;">NFTs</div>
                                        <div style="font-size:1.5em;font-weight:700;color:#10b981;">${user.nftCount}</div>
                                    </div>
                                    <div style="text-align:center;">
                                        <div style="font-size:0.85em;color:#94a3b8;margin-bottom:4px;">Score</div>
                                        <div style="font-size:1.5em;font-weight:700;color:#3b82f6;">${user.creditScore}</div>
                                    </div>
                                    <div style="display:flex;gap:8px;">
                                        <button onclick="window.leaderboardSystem.viewUserTree('${user.address}')" style="padding:10px 20px;background:rgba(139,92,246,0.2);border-radius:8px;border:1px solid rgba(139,92,246,0.4);cursor:pointer;transition:all 0.3s;" onmouseover="this.style.background='rgba(139,92,246,0.3)'" onmouseout="this.style.background='rgba(139,92,246,0.2)'">
                                            <div style="font-size:0.85em;color:#a78bfa;margin-bottom:4px;">View Tree</div>
                                            <div style="font-size:1.2em;">🌳</div>
                                        </button>
                                        ${isCurrentUser ? `
                                        <button onclick="window.leaderboardSystem.shareMyTree()" style="padding:10px 20px;background:rgba(16,185,129,0.2);border-radius:8px;border:1px solid rgba(16,185,129,0.4);cursor:pointer;transition:all 0.3s;" onmouseover="this.style.background='rgba(16,185,129,0.3)'" onmouseout="this.style.background='rgba(16,185,129,0.2)'">
                                            <div style="font-size:0.85em;color:#10b981;margin-bottom:4px;">Share</div>
                                            <div style="font-size:1.2em;">📸</div>
                                        </button>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        content.innerHTML = html;
    }

    formatAddress(address) {
        if (!address) return 'Unknown';
        if (address.length <= 12) return address;
        return address.slice(0, 6) + '...' + address.slice(-4);
    }

    getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    }

    getCurrentUserAddress() {
        // Try to get current user's wallet address
        // Check localStorage for recent quest completions
        const treeNFTs = JSON.parse(localStorage.getItem('treeNFTs') || '[]');
        if (treeNFTs.length > 0 && treeNFTs[0].userData && treeNFTs[0].userData.userAddress) {
            return treeNFTs[0].userData.userAddress;
        }
        return null;
    }

    async viewUserTree(userAddress) {
        console.log('🌳 Viewing tree for user:', userAddress);
        
        // Store the user we're viewing
        this.currentViewingUser = userAddress;
        
        // Close leaderboard
        this.closeLeaderboard();
        
        // Call tree world's visitUserTree method if available
        if (window.treeWorld && typeof window.treeWorld.visitUserTree === 'function') {
            await window.treeWorld.visitUserTree(userAddress);
        }
        
        // Load user's NFTs
        await this.loadUserNFTs(userAddress);
        
        // Show notification
        this.showNotification(`🌳 Now viewing ${this.getUserDisplayName(userAddress)}'s tree`, 'info');
    }

    getUserDisplayName(address) {
        const user = this.users.find(u => u.address === address);
        return user ? user.displayName : this.formatAddress(address);
    }

    async loadUserNFTs(userAddress) {
        try {
            // Try to fetch from XRPL
            const xrplNFTs = await this.fetchUserNFTsFromXRPL(userAddress);
            if (xrplNFTs && xrplNFTs.length > 0) {
                this.displayUserTree(xrplNFTs);
                return;
            }
        } catch (error) {
            console.warn('XRPL NFT fetch failed, using local data:', error);
        }

        // Fallback to localStorage
        const localNFTs = this.loadUserNFTsFromLocal(userAddress);
        this.displayUserTree(localNFTs);
    }

    async fetchUserNFTsFromXRPL(userAddress) {
        try {
            const response = await fetch(`http://localhost:3003/user-nfts?address=${encodeURIComponent(userAddress)}`);
            if (response.ok) {
                const data = await response.json();
                return data.nfts || [];
            }
        } catch (error) {
            console.warn('XRPL NFT fetch error:', error);
        }
        return null;
    }

    loadUserNFTsFromLocal(userAddress) {
        // Load NFTs from localStorage filtered by user address
        const allNFTs = JSON.parse(localStorage.getItem('treeNFTs') || '[]');
        const userNFTs = allNFTs.filter(nft => 
            nft.userData && 
            nft.userData.userAddress && 
            nft.userData.userAddress.toLowerCase() === userAddress.toLowerCase()
        );
        
        // If no NFTs found and this is a demo user, generate demo NFTs
        if (userNFTs.length === 0 && this.isDemoUser(userAddress)) {
            return this.generateDemoNFTsForUser(userAddress);
        }
        
        return userNFTs;
    }
    
    isDemoUser(userAddress) {
        // Check if this is one of the demo users
        const demoAddresses = [
            '0x1234567890abcdef1234567890abcdef12345678',
            '0xabcdef1234567890abcdef1234567890abcdef12',
            '0x9876543210fedcba9876543210fedcba98765432'
        ];
        return demoAddresses.some(addr => addr.toLowerCase() === userAddress.toLowerCase());
    }
    
    generateDemoNFTsForUser(userAddress) {
        // Generate demo NFTs based on user's NFT count from leaderboard
        const user = this.users.find(u => u.address.toLowerCase() === userAddress.toLowerCase());
        const nftCount = user ? user.nftCount : 5;
        
        const questTitles = [
            'Save $500 Emergency Fund',
            'No Overdraft Fees for 3 Months',
            'Pay Rent On Time',
            'Reduce Debt by $1000',
            'Increase Income by $500',
            'Donate to Charity',
            'Maintain Positive Balance',
            'Build Credit History',
            'Complete Financial Education',
            'Achieve Savings Goal',
            'Pay Bills On Time',
            'Reduce Credit Utilization',
            'Open New Account',
            'Complete Budget Challenge',
            'Emergency Fund Milestone'
        ];
        
        const colors = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
        
        const demoNFTs = [];
        for (let i = 0; i < nftCount; i++) {
            const questTitle = questTitles[i % questTitles.length];
            const daysAgo = Math.floor(Math.random() * 30) + 1;
            const completedDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
            
            demoNFTs.push({
                userData: {
                    questId: `demo-quest-${i}`,
                    questTitle: questTitle,
                    completedDate: completedDate.toISOString(),
                    nftAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
                    userAddress: userAddress
                },
                color: colors[i % colors.length],
                position: {
                    x: (Math.random() - 0.5) * 2,
                    y: Math.random() * 3 + 1,
                    z: (Math.random() - 0.5) * 2
                }
            });
        }
        
        console.log(`🎨 Generated ${demoNFTs.length} demo NFTs for user ${userAddress}`);
        return demoNFTs;
    }

    displayUserTree(nftData) {
        // Clear current tree
        if (window.treeWorld) {
            window.treeWorld.clearAllNFTs();
        }

        // Add user's NFTs to tree
        if (window.treeWorld && nftData.length > 0) {
            console.log(`🌳 Displaying ${nftData.length} NFTs for user's tree`);
            nftData.forEach((nft, index) => {
                // Use setTimeout to stagger NFT additions for visual effect
                setTimeout(() => {
                    if (window.treeWorld) {
                        window.treeWorld.addNFTBall({
                            questId: nft.userData?.questId || `nft-${index}`,
                            title: nft.userData?.questTitle || nft.userData?.questTitle || 'Quest NFT',
                            date: nft.userData?.completedDate || new Date().toISOString(),
                            nftAddress: nft.userData?.nftAddress || nft.nftAddress || 'Unknown',
                            userAddress: nft.userData?.userAddress || 'Unknown',
                            color: nft.color || '#10b981'
                        });
                    }
                }, index * 100); // Stagger by 100ms each
            });
        } else {
            console.warn('⚠️ No NFTs to display for this user');
        }

        // Update UI to show we're viewing another user's tree
        this.updateViewingIndicator();
    }

    updateViewingIndicator() {
        // Add indicator showing which user's tree we're viewing
        let indicator = document.getElementById('viewing-user-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'viewing-user-indicator';
            indicator.style.cssText = `
                position:fixed;
                top:70px;
                left:200px;
                z-index:1001;
                padding:12px 20px;
                background:linear-gradient(135deg, #8b5cf6, #6366f1);
                color:#fff;
                border-radius:8px;
                box-shadow:0 4px 12px rgba(0,0,0,0.3);
                font-weight:600;
                display:flex;
                align-items:center;
                gap:10px;
            `;
            document.body.appendChild(indicator);
        }

        if (this.currentViewingUser) {
            const userName = this.getUserDisplayName(this.currentViewingUser);
            indicator.innerHTML = `
                <span>👁️</span>
                <span>Viewing: ${userName}</span>
                <button onclick="window.leaderboardSystem.viewMyTree()" style="
                    margin-left:15px;
                    padding:6px 12px;
                    background:rgba(255,255,255,0.2);
                    border:1px solid rgba(255,255,255,0.3);
                    border-radius:6px;
                    color:#fff;
                    cursor:pointer;
                    font-size:0.85em;
                ">View My Tree</button>
            `;
            indicator.style.display = 'flex';
        } else {
            indicator.style.display = 'none';
        }
    }

    viewMyTree() {
        this.currentViewingUser = null;
        
        // Clear tree
        if (window.treeWorld) {
            window.treeWorld.clearAllNFTs();
        }

        // Reload current user's NFTs
        if (window.treeWorld) {
            window.treeWorld.loadNFTsFromStorage();
        }

        // Update indicator
        this.updateViewingIndicator();
        
        this.showNotification('🌳 Now viewing your tree');
    }

    showNotification(message, type = 'info') {
        // Create temporary notification
        const colors = {
            info: { bg: 'rgba(59, 130, 246, 0.9)', border: 'rgba(59, 130, 246, 0.5)' },
            success: { bg: 'rgba(16, 185, 129, 0.9)', border: 'rgba(16, 185, 129, 0.5)' },
            error: { bg: 'rgba(239, 68, 68, 0.9)', border: 'rgba(239, 68, 68, 0.5)' }
        };
        const color = colors[type] || colors.info;
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${color.bg};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            font-size: 1em;
            font-weight: 600;
            z-index: 10001;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            border: 2px solid ${color.border};
            animation: slideInRight 0.3s ease-out;
        `;
        notification.textContent = message;
        
        // Add animation
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transition = 'all 0.3s ease-out';
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Share my tree screenshot
    shareMyTree() {
        if (window.treeWorld && typeof window.treeWorld.shareTreeScreenshot === 'function') {
            window.treeWorld.shareTreeScreenshot();
            this.showNotification('📸 Tree screenshot saved!', 'success');
        } else {
            this.showNotification('⚠️ Tree world not available', 'error');
        }
    }

    // Update user's leaderboard entry when they complete a quest
    async updateUserStats(userAddress, nftCount, creditScore) {
        // Find or create user entry
        let user = this.users.find(u => u.address.toLowerCase() === userAddress.toLowerCase());
        
        if (!user) {
            user = {
                address: userAddress,
                displayName: this.generateDisplayName(userAddress),
                nftCount: 0,
                creditScore: 0,
                lastActive: new Date().toISOString()
            };
            this.users.push(user);
        }

        // Update stats
        user.nftCount = nftCount;
        user.creditScore = creditScore;
        user.lastActive = new Date().toISOString();

        // Save to localStorage
        localStorage.setItem('leaderboard_users', JSON.stringify(this.users));

        // Try to save to XRPL
        await this.saveUserToXRPL(user);
    }

    generateDisplayName(address) {
        // Generate a display name from address
        const adjectives = ['Crypto', 'Quest', 'NFT', 'Credit', 'DeFi', 'Web3'];
        const nouns = ['Master', 'Hunter', 'Collector', 'Builder', 'Explorer', 'Champion'];
        const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const adj = adjectives[hash % adjectives.length];
        const noun = nouns[(hash * 7) % nouns.length];
        return adj + noun;
    }

    async saveUserToXRPL(user) {
        try {
            // Save user stats to XRPL via backend
            await fetch('http://localhost:3003/update-leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });
        } catch (error) {
            console.warn('Failed to save to XRPL leaderboard:', error);
        }
    }
}

// Initialize leaderboard system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.leaderboardSystem = new LeaderboardSystem();
    console.log('🏆 Leaderboard system initialized');
});

