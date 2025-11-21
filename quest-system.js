// Quest System - Island Building Missions
// Generates quests that build structures and heal the island

class QuestSystem {
    constructor() {
        this.activeQuests = [];
        this.completedQuests = [];
        this.tycoonRef = null; // Reference to FinancialTycoon instance
        this.structuresBuilt = new Set(); // Track which buildings exist
    }
    
    /**
     * Generate quests from XAI reason codes
     */
    generateQuests(analysisResults, financialData) {
        this.activeQuests = [];
        
        // ============================================
        // TYPE A: EXPLORATION QUESTS (Build Structures)
        // ============================================
        
        // QUEST 1: "Establish Your Bank" - Unlock Bank Building
        if (!this.structuresBuilt.has('bank')) {
            this.activeQuests.push({
                id: 'quest_foundation',
                type: 'exploration',
                title: '� Establish Your Bank',
                description: 'Every financial empire starts with a bank. Connect your bank account via Plaid to unlock the Bank Branch building. This will be the cornerstone of your credit city.',
                objective: 'Connect Plaid bank account',
                reward: '✅ Bank Branch building unlocked',
                rewardAction: 'unlockBank',
                impact: 'critical',
                status: 'active',
                icon: '🏦',
                progress: 0
            });
        }
        
        // QUEST 2: "Open Investment Office" - Unlock Investment Building
        if (!this.structuresBuilt.has('investment') && this.structuresBuilt.has('bank')) {
            this.activeQuests.push({
                id: 'quest_investment',
                type: 'exploration',
                title: '💼 Open Investment Office',
                description: 'Expand your financial empire with on-chain investments. Connect your crypto wallet to unlock the Investment Office - where your DeFi history becomes a towering monument to financial growth.',
                objective: 'Connect Web3 wallet (DeFi history)',
                reward: '✅ Investment Office unlocked',
                rewardAction: 'unlockInvestment',
                impact: 'high',
                status: 'locked',
                icon: '�',
                progress: 0
            });
        }
        
        // QUEST 3: "Construct Tech Factory" - Unlock Tech Factory
        if (!this.structuresBuilt.has('tech_factory') && this.structuresBuilt.has('investment')) {
            this.activeQuests.push({
                id: 'quest_factory',
                type: 'exploration',
                title: '🏭 Construct Tech Factory',
                description: 'Your professional skills are a powerful asset. Connect your GitHub profile to build the Tech Factory - a purple powerhouse that showcases your technical contributions to the world.',
                objective: 'Connect GitHub account',
                reward: '✅ Tech Factory unlocked',
                rewardAction: 'unlockFactory',
                impact: 'high',
                status: 'locked',
                icon: '�',
                progress: 0
            });
        }
        
        // ============================================
        // TYPE B: IMPROVEMENT QUESTS (Fix Problems)
        // ============================================
        
        // QUEST: "Survive the Debt Storm" - Clear storm weather
        if (analysisResults.utilization && analysisResults.utilization > 60) {
            this.activeQuests.push({
                id: 'quest_debtstorm',
                type: 'improvement',
                title: '⛈️ Survive the Debt Storm',
                description: `WARNING! A massive storm is brewing over your island. Your credit utilization is ${(analysisResults.utilization * 100).toFixed(0)}% - this negative pressure is causing dark clouds, rain, and your grass is turning brown and sickly.`,
                objective: 'Lower credit utilization below 30%',
                reward: '☀️ Storm clears → Sun returns',
                rewardAction: 'clearStorm',
                impact: 'critical',
                status: 'active',
                icon: '⚠️',
                progress: Math.max(0, 100 - analysisResults.utilization * 100)
            });
        }
        
        // QUEST: "Stabilize the Data-Quake" - Stop earthquake physics
        if (analysisResults.hasLiquidation || (analysisResults.stability && analysisResults.stability < 40)) {
            this.activeQuests.push({
                id: 'quest_earthquake',
                type: 'improvement',
                title: '🌋 Stabilize the Data-Quake',
                description: 'CRITICAL! Your island is physically shaking and wobbling. Recent DeFi liquidations or financial instability have destabilized the core. Your structures are at risk of collapse!',
                objective: 'Avoid liquidations for 30 days',
                reward: '✅ Earthquake stops → Island stabilizes',
                rewardAction: 'stopEarthquake',
                impact: 'critical',
                status: 'active',
                icon: '🚨',
                progress: 0
            });
        }
        
        console.log(`📋 Generated ${this.activeQuests.length} island-building quests`);
        return this.activeQuests;
    }
    
    /**
     * Complete a quest and trigger island reward
     */
    completeQuest(questId) {
        const questIndex = this.activeQuests.findIndex(q => q.id === questId);
        if (questIndex === -1) return;
        
        const quest = this.activeQuests[questIndex];
        quest.status = 'completed';
        quest.completedAt = new Date();
        
        this.completedQuests.push(quest);
        this.activeQuests.splice(questIndex, 1);
        
        // Trigger tycoon reward action
        if (this.tycoonRef && quest.rewardAction) {
            console.log(`�️ Executing reward: ${quest.rewardAction}`);
            
            switch (quest.rewardAction) {
                case 'unlockBank':
                    // Unlock Bank Branch building
                    this.tycoonRef.unlockBuilding('bank');
                    this.tycoonRef.placeBuilding(1, 0, 'bank');
                    this.structuresBuilt.add('bank');
                    console.log('� Bank Branch unlocked and placed!');
                    break;
                case 'unlockInvestment':
                    // Unlock Investment Office
                    this.tycoonRef.unlockBuilding('investment');
                    this.tycoonRef.placeBuilding(-1, 0, 'investment');
                    this.structuresBuilt.add('investment');
                    console.log('💼 Investment Office unlocked and placed!');
                    break;
                case 'unlockFactory':
                    // Unlock Tech Factory
                    this.tycoonRef.unlockBuilding('tech_factory');
                    this.tycoonRef.placeBuilding(0, 1, 'tech_factory');
                    this.structuresBuilt.add('tech_factory');
                    console.log('🏭 Tech Factory unlocked and placed!');
                    break;
                case 'clearStorm':
                    // Restore building health
                    this.tycoonRef.updateBuildingState('bank', 'healthy');
                    console.log('☀️ Storm cleared, buildings restored!');
                    break;
                case 'stopEarthquake':
                    // Stabilize all buildings
                    this.tycoonRef.updateBuildingState('investment', 'healthy');
                    console.log('🌍 Buildings stabilized!');
                    break;
            }
        }
        
        console.log(`✅ Quest completed: ${quest.title}`);
        
        // Update UI
        this.updateQuestUI();
        
        // Generate next set of quests
        if (window.lastAnalysis) {
            this.generateQuests(window.lastAnalysis.scores, { hasPlaidData: true });
            this.updateQuestUI();
        }
        
        return quest;
    }
    
    /**
     * Update quest UI panel
     */
    updateQuestUI() {
        const questPanel = document.getElementById('quest-list');
        if (!questPanel) return;
        
        if (this.activeQuests.length === 0) {
            questPanel.innerHTML = `
                <div class="no-quests">
                    <p>🎉 Your city is thriving!</p>
                    <p style="font-size: 0.9em; color: #b0b0b0; margin-top: 10px;">
                        All buildings unlocked. Keep monitoring your financial health!
                    </p>
                </div>
            `;
            return;
        }
        
        const questsHtml = this.activeQuests.map(quest => {
            const impactClass = quest.impact === 'critical' ? 'impact-critical' : 
                               quest.impact === 'high' ? 'impact-high' : 
                               quest.impact === 'medium' ? 'impact-medium' : 'impact-low';
            
            const isLocked = quest.status === 'locked';
            
            return `
                <div class="quest-card ${impactClass} ${isLocked ? 'locked' : ''}" data-quest-id="${quest.id}">
                    <div class="quest-header">
                        <span class="quest-icon">${quest.icon}</span>
                        <div class="quest-title-section">
                            <h4>${quest.title}</h4>
                            <span class="quest-type">${quest.type.toUpperCase()}</span>
                        </div>
                        ${isLocked ? '<span class="lock-icon">🔒</span>' : ''}
                    </div>
                    
                    <p class="quest-description">${quest.description}</p>
                    
                    <div class="quest-objective">
                        <strong>Objective:</strong> ${quest.objective}
                    </div>
                    
                    <div class="quest-reward">
                        <strong>Reward:</strong> ${quest.reward}
                    </div>
                    
                    ${!isLocked ? `
                        <button class="btn-quest-action" onclick="window.questSystem.startQuest('${quest.id}')">
                            ${quest.id.includes('plaid') ? '🔗 Connect Bank' : '▶️ Start Quest'}
                        </button>
                    ` : `
                        <div class="quest-locked-msg">
                            Complete previous quests to unlock
                        </div>
                    `}
                </div>
            `;
        }).join('');
        
        questPanel.innerHTML = questsHtml;
    }
    
    /**
     * Start a quest
     */
    startQuest(questId) {
        const quest = this.activeQuests.find(q => q.id === questId);
        if (!quest) return;
        
        console.log(`▶️ Starting quest: ${quest.title}`);
        
        // Handle different quest types
        if (quest.id.includes('plaid')) {
            // Trigger Plaid connection
            if (window.plaidIntegration) {
                window.plaidIntegration.initiatePlaidLink();
            }
        } else if (quest.id.includes('utilization')) {
            // Show simulator
            alert('💡 In production: Open credit card payment portal or use simulator to model paydown impact');
        } else if (quest.id.includes('vc')) {
            // Show VC upload modal
            alert('📝 In production: Open Verifiable Credential upload interface');
        } else if (quest.id.includes('onchain')) {
            // Show DAO list
            alert('🗳️ In production: Connect wallet and show DAO governance opportunities');
        } else {
            alert(`Quest "${quest.title}" started! This would open the relevant action interface.`);
        }
    }
    
    /**
     * Get quest statistics
     */
    getStats() {
        return {
            total: this.activeQuests.length + this.completedQuests.length,
            active: this.activeQuests.length,
            completed: this.completedQuests.length,
            pointsEarned: this.completedQuests.reduce((sum, q) => {
                const match = q.reward.match(/\+(\d+) points/);
                return sum + (match ? parseInt(match[1]) : 0);
            }, 0)
        };
    }
}

// Create global instance
window.questSystem = new QuestSystem();
