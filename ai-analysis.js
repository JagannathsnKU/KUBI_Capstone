// AI Analysis Module
// This module contains the "mock AI" logic that analyzes Plaid data
// and triggers visual effects in the 3D constellation

class AIAnalysis {
    constructor() {
        this.currentAnalysis = null;
        this.tycoonRef = null; // Will be set by FinancialTycoon instance
    }
    
    /**
     * Main analysis function - analyzes Plaid data and triggers visuals
     */
    analyzePlaidData(plaidData) {
        console.log('🤖 AI Analysis Starting...', plaidData);
        
        try {
            // Extract key metrics
            const metrics = this.extractMetrics(plaidData);
            
            // Calculate scores
            const scores = this.calculateScores(metrics);
            
            // Determine constellation state
            const state = this.determineConstellationState(metrics, scores);
            
            // Store analysis
            this.currentAnalysis = {
                metrics,
                scores,
                state,
                timestamp: Date.now()
            };
            
            // Trigger visual effects
            this.triggerVisualEffects(state);
            
            // Show success message in controls-info
            const controlsInfo = document.getElementById('controls-info');
            if (controlsInfo) {
                controlsInfo.innerHTML = `
                    <p style="color: #10b981; font-weight: 600;">✅ City Updated!</p>
                    <p style="font-size: 0.9em;">Credit Score: <span style="color: ${this.getScoreColor(scores.overall)}">${scores.overall}</span></p>
                    <p style="font-size: 0.9em;">Watch your buildings respond!</p>
                `;
            }
            
            console.log('✅ AI Analysis Complete:', this.currentAnalysis);
            
            return this.currentAnalysis;
            
        } catch (error) {
            console.error('Error in AI analysis:', error);
            return null;
        }
    }    /**
     * Extract key metrics from Plaid data
     */
    extractMetrics(plaidData) {
        const income = plaidData.income?.amount || 0;
        const utilization = plaidData.liabilities?.utilization || 0;
        const balance = plaidData.accounts?.[0]?.balances?.available || 0;
        const transactionCount = plaidData.transactions?.length || 0;
        
        // Calculate additional metrics
        const avgTransactionAmount = transactionCount > 0
            ? plaidData.transactions.reduce((sum, t) => sum + t.amount, 0) / transactionCount
            : 0;
        
        return {
            income,
            utilization,
            balance,
            transactionCount,
            avgTransactionAmount,
            currency: plaidData.income?.currency || 'USD'
        };
    }
    
    /**
     * Calculate various scores based on metrics
     */
    calculateScores(metrics) {
        const { income, utilization, balance, transactionCount } = metrics;
        
        // Income Score (0-100)
        let incomeScore = 0;
        if (income < CONFIG.ANALYSIS.INCOME.LOW_THRESHOLD) {
            incomeScore = 20;
        } else if (income < CONFIG.ANALYSIS.INCOME.MEDIUM_THRESHOLD) {
            incomeScore = 50;
        } else if (income < CONFIG.ANALYSIS.INCOME.HIGH_THRESHOLD) {
            incomeScore = 75;
        } else {
            incomeScore = 100;
        }
        
        // Utilization Score (0-100) - Lower is better
        let utilizationScore = 0;
        if (utilization < CONFIG.ANALYSIS.UTILIZATION.HEALTHY) {
            utilizationScore = 100;
        } else if (utilization < CONFIG.ANALYSIS.UTILIZATION.WARNING) {
            utilizationScore = 70;
        } else if (utilization < CONFIG.ANALYSIS.UTILIZATION.DANGER) {
            utilizationScore = 40;
        } else {
            utilizationScore = 10;
        }
        
        // Balance Score (0-100)
        let balanceScore = 0;
        if (balance < CONFIG.ANALYSIS.BALANCE.LOW_THRESHOLD) {
            balanceScore = 20;
        } else if (balance < CONFIG.ANALYSIS.BALANCE.MEDIUM_THRESHOLD) {
            balanceScore = 50;
        } else if (balance < CONFIG.ANALYSIS.BALANCE.HIGH_THRESHOLD) {
            balanceScore = 75;
        } else {
            balanceScore = 100;
        }
        
        // Activity Score (0-100)
        let activityScore = 0;
        if (transactionCount < CONFIG.ANALYSIS.TRANSACTION_COUNT.LOW) {
            activityScore = 30;
        } else if (transactionCount < CONFIG.ANALYSIS.TRANSACTION_COUNT.MEDIUM) {
            activityScore = 60;
        } else if (transactionCount < CONFIG.ANALYSIS.TRANSACTION_COUNT.HIGH) {
            activityScore = 85;
        } else {
            activityScore = 100;
        }
        
        // Overall Credit Score (weighted average)
        const overallScore = Math.round(
            incomeScore * 0.3 +
            utilizationScore * 0.35 +
            balanceScore * 0.25 +
            activityScore * 0.1
        );
        
        return {
            income: incomeScore,
            utilization: utilizationScore,
            balance: balanceScore,
            activity: activityScore,
            overall: overallScore
        };
    }
    
    /**
     * Determine the constellation state based on analysis
     */
    determineConstellationState(metrics, scores) {
        const { income, utilization } = metrics;
        const { overall } = scores;
        
        const state = {
            stability: 'stable',
            color: 'default',
            effects: []
        };
        
        // Check for critical conditions
        if (income < CONFIG.ANALYSIS.INCOME.LOW_THRESHOLD) {
            state.effects.push('low_income');
            state.color = 'blue_dwarf';
            console.log('🔵 Triggering Blue Dwarf visual (Low Income)');
        }
        
        if (utilization > CONFIG.ANALYSIS.UTILIZATION.DANGER) {
            state.effects.push('high_utilization');
            state.color = 'red_giant';
            console.log('🔴 Triggering Red Giant visual (High Utilization)');
        }
        
        // Determine stability
        if (overall < 40) {
            state.stability = 'critical';
            state.effects.push('unstable');
            console.log('💥 Triggering Unstable physics (Critical score)');
        } else if (overall < 60) {
            state.stability = 'warning';
            state.effects.push('wobble');
            console.log('⚠️ Triggering Wobble effect (Warning score)');
        } else if (overall >= 80) {
            state.stability = 'excellent';
            state.color = 'stable';
            console.log('✨ Triggering Stable visual (Excellent score)');
        } else {
            state.stability = 'good';
            console.log('✅ Constellation is stable');
        }
        
        return state;
    }
    
    /**
     * Trigger visual effects in the island
     */
    triggerVisualEffects(state) {
        if (!this.tycoonRef) {
            console.warn('Tycoon reference not set');
            return;
        }
        
        const tycoon = this.tycoonRef;
        
        // Store analysis for other modes
        window.lastAnalysis = this.currentAnalysis;
        
        // Generate quests based on analysis
        if (window.questSystem && this.currentAnalysis) {
            const quests = window.questSystem.generateQuests(
                this.currentAnalysis.scores, 
                { hasPlaidData: true }
            );
            window.questSystem.updateQuestUI();
            console.log(`📋 Generated ${quests.length} quests`);
        }
        
        // Financial Tycoon visual effects
        console.log('�️ Triggering tycoon building effects:', {
            utilization: this.currentAnalysis.metrics.utilization,
            overallScore: this.currentAnalysis.scores.overall,
            state: state.stability
        });
        
        // Update credit score display
        tycoon.creditScore = this.currentAnalysis.scores.overall;
        const scoreDisplay = document.getElementById('credit-score-display');
        if (scoreDisplay) {
            scoreDisplay.textContent = tycoon.creditScore;
            scoreDisplay.style.color = this.getScoreColor(tycoon.creditScore);
        }
        
        // High utilization (>60%) - Bank building in danger
        if (this.currentAnalysis.metrics.utilization > 0.6) {
            console.log('⚠️ High utilization - Bank building in danger!');
            tycoon.updateBuildingState('bank', 'danger');
        } else if (this.currentAnalysis.metrics.utilization > 0.3) {
            console.log('⚠️ Moderate utilization - Bank building warning');
            tycoon.updateBuildingState('bank', 'warning');
        } else {
            tycoon.updateBuildingState('bank', 'healthy');
        }
        
        // Good overall score (>700) - Credit Bureau healthy
        if (this.currentAnalysis.scores.overall >= 700) {
            console.log('🎉 Excellent credit - Credit Bureau thriving!');
            tycoon.updateBuildingState('credit_bureau', 'healthy');
        } else if (this.currentAnalysis.scores.overall >= 600) {
            tycoon.updateBuildingState('credit_bureau', 'warning');
        } else {
            tycoon.updateBuildingState('credit_bureau', 'danger');
        }
        
        // Low income - Retail shop affected
        if (this.currentAnalysis.metrics.income < 30000) {
            console.log('⚠️ Low income - Retail shop struggling');
            tycoon.updateBuildingState('retail_shop', 'warning');
        } else {
            tycoon.updateBuildingState('retail_shop', 'healthy');
        }
        
        // Update city health
        tycoon.cityHealth = this.currentAnalysis.scores.overall;
        const healthBar = document.getElementById('city-health-bar');
        const healthValue = document.getElementById('city-health-value');
        if (healthBar) {
            healthBar.style.width = `${tycoon.cityHealth}%`;
        }
        if (healthValue) {
            healthValue.textContent = `${Math.round(tycoon.cityHealth)}%`;
            healthValue.style.color = this.getScoreColor(tycoon.cityHealth);
        }
    }

    
    getStabilityText(stability) {
        switch(stability) {
            case 'excellent': return 'Excellent';
            case 'good': return 'Good';
            case 'warning': return 'Warning';
            case 'critical': return 'Critical';
            default: return 'Unknown';
        }
    }
    
    getStabilityColor(stability) {
        switch(stability) {
            case 'excellent': return '#81c784';
            case 'good': return '#64b5f6';
            case 'warning': return '#ffb74d';
            case 'critical': return '#e57373';
            default: return '#b0b0b0';
        }
    }
    
    getScoreColor(score) {
        if (score >= 80) return '#81c784';
        if (score >= 60) return '#64b5f6';
        if (score >= 40) return '#ffb74d';
        return '#e57373';
    }
}

window.aiAnalysis = new AIAnalysis();
