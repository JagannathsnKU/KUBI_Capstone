// Professional Mode JavaScript

// Quest Widget Functions - Make globally accessible (define early)
if (typeof window !== 'undefined') {
    window.openQuestWidget = function() {
        const modal = document.getElementById('quest-widget-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            if (typeof fetchAndDisplayQuests === 'function') {
                fetchAndDisplayQuests();
            }
        }
    };
    
    window.closeQuestWidget = function() {
        const modal = document.getElementById('quest-widget-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    };
}

// Radial Meter Animation for Score Overview
function drawScoreRadialMeter(score) {
    const canvas = document.getElementById('score-radial-meter');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);
    // Background circle
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2-10, 0, 2*Math.PI);
    ctx.strokeStyle = 'rgba(62,232,176,0.15)';
    ctx.lineWidth = 12;
    ctx.stroke();
    // Animated arc
    const endAngle = (score/100) * 2 * Math.PI; // 1-100 scale
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2-18, -Math.PI/2, endAngle-Math.PI/2);
    ctx.strokeStyle = 'url(#radial-gradient)';
    ctx.lineWidth = 14;
    // Gradient
    const grad = ctx.createLinearGradient(0,0,size,size);
    grad.addColorStop(0, '#3be8b0');
    grad.addColorStop(1, '#eebd89');
    ctx.strokeStyle = grad;
    ctx.shadowColor = '#eebd89';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Score text
    ctx.font = 'bold 2.2em Inter, Segoe UI, Arial';
    ctx.fillStyle = '#3be8b0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(score, size/2, size/2);
}

function animateScoreMeter(targetScore) {
    let current = 500;
    const step = () => {
        if (current < targetScore) {
            current += Math.ceil((targetScore-current)/18);
            if (current > targetScore) current = targetScore;
            drawScoreRadialMeter(current);
            requestAnimationFrame(step);
        } else {
            drawScoreRadialMeter(targetScore);
        }
    };
    step();
}

document.addEventListener('DOMContentLoaded', function() {
    // Animate radial score meter with prebuilt demo data
    const mainScoreEl = document.getElementById('main-score');
    if (mainScoreEl) {
        const score = parseInt(mainScoreEl.textContent || '68', 10); // 1-100 scale
        animateScoreMeter(score);
    }
    
    // Animate stat counters
    animateStatsCounters();
    
    // Load saved theme
    loadTheme();
    
    // Initialize simulator
    initializeSimulator();
    
    // Load financial data
    loadFinancialData();
    
    // Fetch Plaid data
    fetchPlaidData();
    
    // Refresh XAI analysis after Plaid data is loaded
    setTimeout(() => {
        loadFinancialData();
    }, 2000);
    
    // Plaid Link button event
    const plaidBtn = document.getElementById('plaid-link-btn');
    if (plaidBtn) {
        plaidBtn.addEventListener('click', () => {
            initializePlaidLink();
            // After Plaid link and data fetch, show personalized quests
            setTimeout(fetchAndDisplayQuests, 2000);
        });
    }
    
    // If Plaid data already exists, show quests immediately
    fetch('http://localhost:3003/plaid-data')
        .then(res => res.json())
        .then(data => {
            if (data && data.accounts) {
                fetchAndDisplayQuests();
            }
        })
        .catch(() => {
            // Plaid service not available - fail silently
        });
});

// Theme Toggle Functionality
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    
    if (body.classList.contains('dark-mode')) {
        // Switch to light mode
        body.classList.remove('dark-mode');
        if (themeIcon) themeIcon.textContent = '🌙';
        if (themeText) themeText.textContent = 'Dark';
        localStorage.setItem('theme', 'light');
    } else {
        // Switch to dark mode
        body.classList.add('dark-mode');
        if (themeIcon) themeIcon.textContent = '☀️';
        if (themeText) themeText.textContent = 'Light';
        localStorage.setItem('theme', 'dark');
    }
}

// Load saved theme on page load
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    
    if (themeToggle) {
        const themeIcon = document.getElementById('theme-icon');
        const themeText = document.getElementById('theme-text');
        
        if (savedTheme === 'dark') {
            body.classList.add('dark-mode');
            if (themeIcon) themeIcon.textContent = '☀️';
            if (themeText) themeText.textContent = 'Light';
        } else {
            body.classList.remove('dark-mode');
            if (themeIcon) themeIcon.textContent = '🌙';
            if (themeText) themeText.textContent = 'Dark';
        }
    }
}

// Call loadTheme on page load
document.addEventListener('DOMContentLoaded', loadTheme);

// Make toggleTheme available globally
window.toggleTheme = toggleTheme;

// Animate stat counter widgets
function animateStatsCounters() {
    const statValues = document.querySelectorAll('.stat-value[data-target]');
    
    statValues.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));
        const duration = 2000; // 2 seconds
        const increment = target / (duration / 16); // 60 FPS
        let current = 0;
        
        const counter = setInterval(() => {
            current += increment;
            if (current >= target) {
                stat.textContent = target;
                clearInterval(counter);
            } else {
                stat.textContent = Math.floor(current);
            }
        }, 16);
    });
}

let currentScore = 68; // 1-100 scale (was 685)
let projectedScore = 68; // 1-100 scale (was 685)

// Fetch Plaid data and display in dashboard
function fetchPlaidData() {
    // Use prebuilt demo data - fetch from default location
    fetch('http://localhost:3003/plaid-data')
        .then(res => res.json())
        .then(data => {
            if (data.accounts && Array.isArray(data.accounts)) {
                displayPlaidAccounts(data.accounts);
            }
            if (data.transactions && Array.isArray(data.transactions)) {
                displayPlaidTransactions(data.transactions);
            }
        })
        .catch(() => {
            // No Plaid data found or service not running - fail silently
            // (Comment out the console.log to avoid console clutter)
        });
}

function displayPlaidAccounts(accounts) {
    const container = document.getElementById('plaid-accounts');
    if (!container) return;
    container.innerHTML = `
        <h3 class="plaid-section-title">Linked Bank Accounts</h3>
        <div class="plaid-accounts-grid">
            ${accounts.map(acc => `
                <div class="plaid-account-card">
                    <div class="plaid-account-name">${acc.name || acc.official_name || 'Account'}</div>
                    <div class="plaid-account-type">Type: ${acc.type} (${acc.subtype})</div>
                    <div class="plaid-account-mask">Mask: <span class="plaid-mask-number">****${acc.mask}</span></div>
                    <div class="plaid-account-balance">Balance: $${acc.balances?.current ?? 'N/A'}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function displayPlaidTransactions(transactions) {
    // Instead of showing raw transactions, show ZK proof statements
    const zkpContainer = document.getElementById('zkp-proof-statements');
    if (!zkpContainer) return;
    // Simulate ZK proofs based on transactions
    let statements = [];
    // Find Plaid Cash Management account
    const cashMgmt = window.lastPlaidAccounts?.find(acc => acc.name?.toLowerCase().includes('cash management'));
    if (cashMgmt && cashMgmt.balances?.current > 10000) {
        statements.push(`<div class='zkp-proof-card' style='background:#232b3e;color:#fff;padding:1em 1.5em;margin-bottom:1em;border-radius:8px;box-shadow:0 2px 8px #0002;'>✅ ZK Proof: User can prove their Plaid Cash Management account balance is above $10,000 without revealing the exact amount.<br><span style='font-size:0.95em;color:#7dd3fc;'>This proof is generated by checking your Plaid Cash Management account balance and creating a privacy-preserving statement.</span></div>`);
    }
    const hasNoNegativeTx = transactions.every(tx => tx.amount >= 0);
    if (hasNoNegativeTx) {
        statements.push(`<div class='zkp-proof-card' style='background:#232b3e;color:#fff;padding:1em 1.5em;margin-bottom:1em;border-radius:8px;box-shadow:0 2px 8px #0002;'>✅ ZK Proof: User can prove no negative transactions in the last 10 shown.</div>`);
    }
    // Only display ZKP proofs if there are any, otherwise hide the container
    if (statements.length > 0) {
        zkpContainer.innerHTML = statements.join('');
        zkpContainer.style.display = 'block';
    } else {
        zkpContainer.innerHTML = '';
        zkpContainer.style.display = 'none';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeSimulator();
    loadFinancialData();
    fetchPlaidData();
});

/**
 * Switch to Explorer Mode
 */
function switchToExplorerMode() {
    // Only switch mode if user clicks, do not reload after Plaid Link
    window.location.href = 'index.html';
}

// Make function globally accessible
window.switchToExplorerMode = switchToExplorerMode;

/**
 * Initialize credit score simulator
 */
function initializeSimulator() {
    // Set initial values - check if elements exist
    const simDebtValue = document.getElementById('sim-debt-value');
    if (simDebtValue) simDebtValue.textContent = '$0';
    
    const simIncomeValue = document.getElementById('sim-income-value');
    if (simIncomeValue) simIncomeValue.textContent = '$0';
    
    const simAccountValue = document.getElementById('sim-account-value');
    if (simAccountValue) simAccountValue.textContent = 'None';
    
    const simVcValue = document.getElementById('sim-vc-value');
    if (simVcValue) simVcValue.textContent = 'None';
    
    // Set current score - use main score if available, otherwise use currentScore variable
    const mainScoreEl = document.getElementById('main-score');
    const mainScore = mainScoreEl ? parseInt(mainScoreEl.textContent || '68', 10) : currentScore;
    
    const simCurrentScore = document.getElementById('sim-current-score');
    if (simCurrentScore) simCurrentScore.textContent = mainScore;
    
    const simProjectedScore = document.getElementById('sim-projected-score');
    if (simProjectedScore) simProjectedScore.textContent = mainScore;
    
    // Update currentScore variable to match
    currentScore = mainScore;
}

/**
 * Update simulator when user changes values
 */
function updateSimulator() {
    console.log('🔄 updateSimulator() called');
    
    // Get elements - return if not found
    const simDebt = document.getElementById('sim-debt');
    const simIncome = document.getElementById('sim-income');
    const simAccount = document.getElementById('sim-account');
    const simVC = document.getElementById('sim-vc');
    
    if (!simDebt || !simIncome || !simAccount || !simVC) {
        console.error('❌ Simulator controls not found:', {
            simDebt: !!simDebt,
            simIncome: !!simIncome,
            simAccount: !!simAccount,
            simVC: !!simVC
        });
        return;
    }
    
    // Get current score from the main score display (to match the top score)
    const mainScoreEl = document.getElementById('main-score');
    const baseScore = mainScoreEl ? parseInt(mainScoreEl.textContent || '68', 10) : 68; // 1-100 scale
    
    const debtPaydown = parseInt(simDebt.value) || 0;
    const incomeIncrease = parseInt(simIncome.value) || 0;
    const newAccount = parseInt(simAccount.value) || 0;
    const newVC = parseInt(simVC.value) || 0;
    
    console.log('📊 Simulator values:', { debtPaydown, incomeIncrease, newAccount, newVC, baseScore });
    
    // Update display values
    const simDebtValue = document.getElementById('sim-debt-value');
    if (simDebtValue) {
        simDebtValue.textContent = `$${debtPaydown.toLocaleString()}`;
    }
    
    const simIncomeValue = document.getElementById('sim-income-value');
    if (simIncomeValue) {
        simIncomeValue.textContent = `$${incomeIncrease.toLocaleString()}`;
    }
    
    const simAccountValue = document.getElementById('sim-account-value');
    if (simAccountValue && simAccount) {
        simAccountValue.textContent = simAccount.selectedIndex > 0 ? 
            simAccount.options[simAccount.selectedIndex].text.split('(')[0].trim() : 'None';
    }
    
    const simVcValue = document.getElementById('sim-vc-value');
    if (simVcValue && simVC) {
        simVcValue.textContent = simVC.selectedIndex > 0 ? 
            simVC.options[simVC.selectedIndex].text.split('(')[0].trim() : 'None';
    }
    
    // Calculate projected score
    // All actions should INCREASE the credit score, so we add positive points
    let pointsGained = 0;
    
    // Debt paydown impact: Paying down debt INCREASES credit score
    // Max +3 pts at $5000 paydown - converted to 1-100 scale
    if (debtPaydown > 0) {
        const debtPoints = Math.floor((debtPaydown / 5000) * 3);
        pointsGained += debtPoints; // Positive impact - increases score
    }
    
    // Income increase impact: Higher income INCREASES credit score
    // Max +2 pts at $2000 increase - converted to 1-100 scale
    if (incomeIncrease > 0) {
        const incomePoints = Math.floor((incomeIncrease / 2000) * 2);
        pointsGained += incomePoints; // Positive impact - increases score
    }
    
    // New account impact: Opening new account types INCREASES credit score
    // 1-2 points - already in 1-100 scale
    if (newAccount > 0) {
        const accountPoints = Math.min(2, newAccount);
        pointsGained += accountPoints; // Positive impact - increases score
    }
    
    // New VC impact: Adding verifiable credentials INCREASES credit score
    // 1-3 points - already in 1-100 scale
    if (newVC > 0) {
        const vcPoints = Math.min(3, newVC);
        pointsGained += vcPoints; // Positive impact - increases score
    }
    
    // Calculate projected score by ADDING points to base score (clamped to 1-100)
    const newProjectedScore = baseScore + pointsGained;
    const finalProjectedScore = Math.max(1, Math.min(100, newProjectedScore)); // 1-100 scale (was 850)
    
    console.log('📈 Score calculation:', { baseScore, pointsGained, finalProjectedScore });
    
    // Update projected score display
    const simProjectedScoreEl = document.getElementById('sim-projected-score');
    if (simProjectedScoreEl) {
        simProjectedScoreEl.textContent = finalProjectedScore;
    }
    
    // Update change badge
    const changeBadge = document.getElementById('sim-change-badge');
    const changeText = document.getElementById('sim-change-text');
    
    if (changeBadge && changeText) {
        const change = finalProjectedScore - baseScore;
        if (change > 0) {
            changeBadge.className = 'glass-card px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30';
            changeText.textContent = `+${change} points projected`;
            changeText.className = 'text-emerald-400 font-semibold';
        } else if (change < 0) {
            changeBadge.className = 'glass-card px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/30';
            changeText.textContent = `${change} points projected`;
            changeText.className = 'text-red-400 font-semibold';
        } else {
            changeBadge.className = 'glass-card px-6 py-3 rounded-xl';
            changeText.textContent = 'Adjust sliders to simulate';
            changeText.className = 'text-[#cbd5e1] font-semibold';
        }
    }
    
    console.log('✅ Simulator updated successfully');
}

/**
 * Animate score change
 */
function animateScoreChange() {
    const projectedElement = document.getElementById('sim-projected-score');
    if (!projectedElement) return;
    
    projectedElement.style.transform = 'scale(1.1)';
    projectedElement.style.color = projectedScore > currentScore ? '#10b981' : '#3b82f6';
    
    setTimeout(() => {
        if (projectedElement) {
            projectedElement.style.transform = 'scale(1)';
            projectedElement.style.color = '#3b82f6';
        }
    }, 300);
}

/**
 * Load financial data from XAI analysis
 * Fetches real XAI analysis from backend API
 */
async function loadFinancialData() {
    try {
        // Use prebuilt demo data - no need to fetch user-specific data
        const response = await fetch('http://localhost:3003/xai-analysis');
        
        if (response.ok) {
            const analysis = await response.json();
            
            // Convert scores from old FICO scale (300-850) to new 1-100 scale
            if (analysis.score && analysis.score > 100) {
                // Convert: 300-850 range to 1-100 range
                analysis.score = Math.max(1, Math.min(100, Math.round((analysis.score - 300) / 5.5)));
            }
            
            // Convert ficoEquivalent to creditScore if present
            if (analysis.ficoEquivalent && !analysis.creditScore) {
                analysis.creditScore = Math.max(1, Math.min(100, Math.round((analysis.ficoEquivalent - 300) / 5.5)));
            }
            
            // Convert factor impact values (divide by ~10 for 1-100 scale)
            if (analysis.factors && Array.isArray(analysis.factors)) {
                analysis.factors = analysis.factors.map(factor => ({
                    ...factor,
                    impact: Math.round(factor.impact / 10) // Convert impact to 1-100 scale
                }));
            }
            
            // Get VC count from localStorage if available
            try {
                const vcs = JSON.parse(localStorage.getItem('vc_wallet') || '[]');
                analysis.vcCount = vcs.length;
            } catch (e) {
                analysis.vcCount = 0;
            }
            
            // Store analysis for future use
            localStorage.setItem('financialAnalysis', JSON.stringify(analysis));
            
            // Update dashboard with real XAI analysis
            updateDashboard(analysis);
            console.log('✅ XAI Analysis loaded from backend:', analysis);
        } else {
            throw new Error('Failed to fetch XAI analysis');
        }
    } catch (error) {
        console.warn('⚠️ XAI analysis unavailable, using cached or default data:', error);
        
        // Check if we have stored analysis results
        const storedAnalysis = localStorage.getItem('financialAnalysis');
        
        if (storedAnalysis) {
            try {
                const analysis = JSON.parse(storedAnalysis);
                
                // Convert cached scores if they're in old scale
                if (analysis.score && analysis.score > 100) {
                    analysis.score = Math.max(1, Math.min(100, Math.round((analysis.score - 300) / 5.5)));
                }
                if (analysis.ficoEquivalent && !analysis.creditScore) {
                    analysis.creditScore = Math.max(1, Math.min(100, Math.round((analysis.ficoEquivalent - 300) / 5.5)));
                }
                if (analysis.factors && Array.isArray(analysis.factors)) {
                    analysis.factors = analysis.factors.map(factor => ({
                        ...factor,
                        impact: Math.round(factor.impact / 10)
                    }));
                }
                
                updateDashboard(analysis);
                console.log('✅ Using cached analysis');
                return;
            } catch (e) {
                console.error('Error parsing stored analysis:', e);
            }
        }
        
        // Fallback to default/mock data if API fails - matches HTML structure
        const mockAnalysis = {
            score: 68, // 1-100 scale (was 685)
            factors: [
                {
                    name: 'Payment History',
                    impact: 35, // Keep original scale for display (will be converted if needed)
                    percentage: 92,
                    positive: true,
                    explanation: 'Excellent! You have 0 missed payments in the last 12 months. Keep it up!'
                },
                {
                    name: 'Credit Utilization',
                    impact: -20, // Keep original scale for display
                    percentage: 65,
                    positive: false,
                    explanation: 'Action Needed: Reduce to 30% for optimal score improvement.'
                },
                {
                    name: 'Account Diversity',
                    impact: 10, // Keep original scale for display
                    percentage: 60,
                    positive: true,
                    explanation: 'Good Progress: Adding 1 more account type would optimize this factor.'
                },
                {
                    name: 'Credit Age',
                    impact: 15, // Keep original scale for display
                    percentage: 75,
                    positive: true,
                    explanation: 'Growing: Your credit history is building steadily over time.'
                }
            ],
            creditScore: 72, // 1-100 scale (was 720 FICO)
            vcCount: 0,
            onChainScore: 85
        };
        
        updateDashboard(mockAnalysis);
    }
}

/**
 * Update dashboard with analysis data
 */
function updateDashboard(analysis) {
    // PRESERVE the HTML main-score value - do NOT override it with backend data
    // The HTML value (68) is the source of truth, backend should not change it
    const mainScoreEl = document.getElementById('main-score');
    let mainScoreValue = 68; // Default to 68
    
    if (mainScoreEl) {
        // Get the current value from HTML (preserve it, don't override)
        const htmlScore = parseInt(mainScoreEl.textContent || '68', 10);
        mainScoreValue = htmlScore;
        // DO NOT update mainScoreEl.textContent - keep the HTML value
    }
    
    // Also update pro-score if it exists (for compatibility) - but use HTML value
    const proScore = document.getElementById('pro-score');
    if (proScore) {
        proScore.textContent = mainScoreValue;
    }
    currentScore = mainScoreValue; // Use HTML value, not backend value
    
    // Always sync simulator scores with main-score element (the source of truth from HTML)
    // This ensures the simulator always matches what's displayed in the hero section
    const simCurrentScoreEl = document.getElementById('sim-current-score');
    if (simCurrentScoreEl) simCurrentScoreEl.textContent = mainScoreValue;
    
    const simProjectedScoreEl = document.getElementById('sim-projected-score');
    if (simProjectedScoreEl) simProjectedScoreEl.textContent = mainScoreValue;
    
    // Update other metrics - check if elements exist
    const proCreditScore = document.getElementById('pro-fico'); // Keep element ID for compatibility
    if (proCreditScore) {
        proCreditScore.textContent = analysis.creditScore || analysis.ficoEquivalent || 0; // Support both old and new
    }
    
    const proVcCount = document.getElementById('pro-vc-count');
    if (proVcCount) {
        proVcCount.textContent = analysis.vcCount;
    }
    
    const proOnchain = document.getElementById('pro-onchain');
    if (proOnchain) {
        proOnchain.textContent = `${analysis.onChainScore}/100`;
    }
    
    // Re-sync simulator to ensure it matches the preserved HTML main-score value
    // This ensures the simulator always shows the HTML value (68), not backend value
    setTimeout(() => {
        initializeSimulator();
    }, 100);
    
    // Update XAI factors - Use factor-card-modern structure to match HTML
    const factorsContainer = document.getElementById('xai-factors');
    if (factorsContainer && analysis.factors) {
        factorsContainer.innerHTML = analysis.factors.map(factor => {
            const impactSign = factor.impact > 0 ? '+' : '';
            const isPositive = factor.positive !== false;
            
            // Determine icon and colors based on factor type and positivity
            let icon = '✅';
            let iconGradient = 'from-emerald-500 to-cyan-500';
            let progressGradient = 'from-emerald-500 via-cyan-500 to-purple-500';
            let impactColor = 'text-emerald-400';
            let progressLabel = 'Score Impact';
            let progressValue = `${factor.percentage}%`;
            let explanationIcon = '💡';
            let explanationBg = 'bg-emerald-500/10';
            let explanationBorder = 'border-emerald-500/20';
            let explanationIconColor = 'text-emerald-400';
            let explanationStrongColor = 'text-emerald-400';
            
            // Customize based on factor name
            if (factor.name === 'Credit Utilization' || factor.name.toLowerCase().includes('utilization')) {
                icon = '⚠️';
                iconGradient = 'from-orange-500 to-red-500';
                progressGradient = 'from-red-500 to-orange-500';
                impactColor = 'text-red-400';
                progressLabel = 'Current Usage';
                explanationIcon = '📉';
                explanationBg = 'bg-red-500/10';
                explanationBorder = 'border-red-500/20';
                explanationIconColor = 'text-red-400';
                explanationStrongColor = 'text-red-400';
            } else if (factor.name === 'Account Diversity' || factor.name.toLowerCase().includes('diversity')) {
                icon = '📊';
                iconGradient = 'from-purple-500 to-pink-500';
                progressGradient = 'from-emerald-500 via-cyan-500 to-purple-500';
                impactColor = 'text-cyan-400';
                progressLabel = 'Account Types';
                progressValue = `${Math.floor(factor.percentage / 30)} Active`;
                explanationIcon = '💎';
                explanationBg = 'bg-cyan-500/10';
                explanationBorder = 'border-cyan-500/20';
                explanationIconColor = 'text-cyan-400';
                explanationStrongColor = 'text-cyan-400';
            } else if (factor.name === 'Credit Age' || factor.name.toLowerCase().includes('age')) {
                icon = '⏱️';
                iconGradient = 'from-blue-500 to-indigo-500';
                progressGradient = 'from-blue-500 to-indigo-500';
                impactColor = 'text-blue-400';
                progressLabel = 'Average Age';
                progressValue = `${(factor.percentage / 20).toFixed(1)} years`;
                explanationIcon = '📈';
                explanationBg = 'bg-blue-500/10';
                explanationBorder = 'border-blue-500/20';
                explanationIconColor = 'text-blue-400';
                explanationStrongColor = 'text-blue-400';
            }
            
            // Format explanation text
            let explanationText = factor.explanation || '';
            let strongText = '';
            if (isPositive) {
                if (explanationText.toLowerCase().includes('excellent')) {
                    strongText = 'Excellent!';
                } else if (explanationText.toLowerCase().includes('good')) {
                    strongText = 'Good Progress:';
                } else if (explanationText.toLowerCase().includes('growing')) {
                    strongText = 'Growing:';
                }
            } else {
                if (explanationText.toLowerCase().includes('action needed') || explanationText.toLowerCase().includes('reduce')) {
                    strongText = 'Action Needed:';
                }
            }
            
            return `
                <div class="factor-card-modern">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center gap-4">
                            <div class="factor-icon-container bg-gradient-to-br ${iconGradient}">
                                <span class="text-2xl relative z-10">${icon}</span>
                            </div>
                            <div>
                                <h3 class="font-bold text-lg text-[#f8fafc] mb-1">${factor.name}</h3>
                                <p class="text-xs text-[#94a3b8] uppercase tracking-wider">Credit Factor</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-black ${impactColor} mb-1">${impactSign}${Math.abs(factor.impact)}</div>
                            <div class="text-xs text-[#94a3b8] font-semibold">points</div>
                        </div>
                    </div>
                    <div class="mb-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm text-[#cbd5e1] font-semibold">${progressLabel}</span>
                            <span class="text-sm ${impactColor} font-bold">${progressValue}</span>
                        </div>
                        <div class="factor-progress-bar">
                            <div class="factor-progress-fill bg-gradient-to-r ${progressGradient}" style="width: ${factor.percentage}%;"></div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 p-3 ${explanationBg} rounded-xl ${explanationBorder}">
                        <span class="${explanationIconColor}">${explanationIcon}</span>
                        <p class="text-sm text-[#cbd5e1] flex-1">
                            ${strongText ? `<strong class="${explanationStrongColor}">${strongText}</strong> ` : ''}${explanationText.replace(/^(Excellent!|Good Progress:|Growing:|Action Needed:)\s*/i, '')}
                        </p>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Update simulator - check if elements exist (already updated above, skip duplicate)
}

// ZKP Proof Generation & Verification (API integration)


window.switchToExplorerMode = switchToExplorerMode;
window.updateSimulator = updateSimulator;



// Plaid Link Integration

function initializePlaidLink() {
    function launchPlaidLink() {
        // Get wallet address from localStorage or prompt user
        let walletAddress = localStorage.getItem('userWalletAddress');
        
        if (!walletAddress) {
            walletAddress = prompt('Enter your wallet address to link your bank account:');
            if (!walletAddress) {
                alert('Wallet address is required to link your bank account.');
                return;
            }
            localStorage.setItem('userWalletAddress', walletAddress);
        }
        
        fetch(`http://localhost:3003/create_link_token?walletAddress=${encodeURIComponent(walletAddress)}`)
            .then(res => res.json())
            .then(data => {
                if (data.link_token && window.Plaid) {
                    const handler = window.Plaid.create({
                        token: data.link_token,
                        onSuccess: function(public_token, metadata) {
                            // Save bank data by calling /fetch-transactions with a date range
                            const today = new Date();
                            const start_date = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
                                .toISOString().slice(0, 10);
                            const end_date = today.toISOString().slice(0, 10);
                            fetch('http://localhost:3003/fetch-transactions', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                    public_token, 
                                    start_date, 
                                    end_date,
                                    walletAddress: walletAddress 
                                })
                            }).then(res => res.json()).then(resp => {
                                if (resp.status === 'success') {
                                    fetchPlaidData();
                                    // Refresh XAI analysis with new Plaid data
                                    setTimeout(() => {
                                        loadFinancialData();
                                    }, 1500);
                                    // Try MetaMask XRPL Snap first, then backend, then demo
                                    if (typeof window.issuePlaidConnectionVC === 'function') {
                                        window.issuePlaidConnectionVC(metadata).then(result => {
                                            if (result && result.success) {
                                                // Show notification
                                                showVCLog({
                                                    type: 'Plaid Connection VC',
                                                    issuer: 'Plaid Sandbox',
                                                    fact: result.demoMode ? 'Bank account linked' : 'Bank account linked and VC issued on XRPL',
                                                    status: 'good',
                                                    creditScore: 3 // 1-100 scale (was 25 FICO)
                                                });
                                            }
                                        }).catch(err => {
                                            console.error('Error issuing Plaid VC:', err);
                                        });
                                    } else {
                                        // Fallback to backend API
                                        const userWalletAddress = localStorage.getItem('userWalletAddress') || '0x0000000000000000000000000000000000000000';
                                        fetch('http://localhost:3003/issue-plaid-vc', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                plaidMetadata: metadata,
                                                userAddress: userWalletAddress
                                            })
                                        }).then(res => res.json()).then(result => {
                                            if (result.success) {
                                                if (result.demoMode) {
                                                    console.log('✅ Plaid VC issued:', result.vcId);
                                                } else {
                                                    console.log('✅ Plaid Connection VC issued on XRPL:', result.txHash);
                                                    console.log('   View on XRPL Explorer:', result.xrplExplorer);
                                                }
                                                
                                                // Add VC to wallet using the helper function
                                                if (typeof window.addVCToWalletFromXRPL === 'function') {
                                                    window.addVCToWalletFromXRPL(result);
                                                }
                                                
                                                // Show notification
                                                showVCLog({
                                                    type: 'Plaid Connection VC',
                                                    issuer: 'Plaid Sandbox',
                                                    fact: result.demoMode ? 'Bank account linked' : 'Bank account linked and VC issued on XRPL',
                                                    status: 'good',
                                                    creditScore: 3 // 1-100 scale (was 25 FICO)
                                                });
                                            }
                                        }).catch(err => {
                                            console.error('Error issuing Plaid VC:', err);
                                        });
                                    }
                                } else {
                                    // Fallback to simple VC
                                    addVCToWallet({
                                        type: 'Bank Account Linked',
                                        issuer: 'Plaid Sandbox',
                                        subject: 'User',
                                        fact: 'Bank account successfully linked and verified.',
                                        signature: '0x' + Math.random().toString(16).slice(2) + Date.now(),
                                        chainOfTrust: null,
                                        verified: false
                                    });
                                }
                            });
                        },
                        onExit: function(err, metadata) {
                            if (err) {
                                alert('Plaid Link exited with error: ' + err.display_message);
                            }
                        }
                    });
                    // Add a VC to the wallet (localStorage)
                    function addVCToWallet(vc) {
                        let vcs = [];
                        try {
                            vcs = JSON.parse(localStorage.getItem('vc_wallet') || '[]');
                        } catch {}
                        vcs.push(vc);
                        localStorage.setItem('vc_wallet', JSON.stringify(vcs));
                    }
                    handler.open();
                } else {
                    alert('Error fetching Plaid link token or Plaid not loaded.');
                }
            });
    }

    // Load Plaid Link script if not already present
    if (!document.getElementById('plaid-link-script')) {
        const script = document.createElement('script');
        script.id = 'plaid-link-script';
        script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
        script.onload = launchPlaidLink;
        document.body.appendChild(script);
    } else {
        // Script already loaded, launch Plaid Link directly
        launchPlaidLink();
    }
}

// Quest Widget Functions are already defined at the top of the file

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('quest-widget-modal');
    if (modal && e.target === modal && !e.target.closest('.glass-card')) {
        closeQuestWidget();
    }
});

// Display personalized ZKP quests in the widget
function fetchAndDisplayQuests() {
    fetch('http://localhost:3003/quests')
        .then(res => res.json())
        .then(data => {
            const questList = document.getElementById('quest-widget-list');
            if (!questList) return;
            // Update stats
            const totalQuests = data.quests?.length || 0;
            const completedQuests = data.quests?.filter(q => q.completed).length || 0;
            const nftsEarned = parseInt(localStorage.getItem('nftsEarned') || '0');
            const scorePoints = completedQuests * 2; // 2 points per quest (1-100 scale)
            
            document.getElementById('quest-total').textContent = totalQuests;
            document.getElementById('quest-completed').textContent = completedQuests;
            document.getElementById('quest-nfts').textContent = nftsEarned;
            document.getElementById('quest-points').textContent = `+${scorePoints}`;
            
            if (!data.quests || data.quests.length === 0) {
                questList.innerHTML = `
                    <div class="quest-card-gamified" style="text-align:center;padding:4em 2em;">
                        <div style="font-size:4em;margin-bottom:1em;">🎯</div>
                        <h3 style="font-size:1.5em;margin-bottom:0.5em;">No quests available yet</h3>
                        <p style="color:var(--text-secondary);">Complete more actions to unlock new quests!</p>
                    </div>
                `;
                return;
            }
            
            questList.innerHTML = data.quests.map((q, i) => {
                // Use id and completed fields from backend
                let impact = i === 0 ? 'HIGH' : i === 1 ? 'MEDIUM' : 'LOW';
                let impactClass = i === 0 ? 'high' : i === 1 ? 'medium' : 'low';
                let title = q.id ? q.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Quest';
                let desc = '';
                if (typeof q.balance !== 'undefined') desc += `Current Balance: $${q.balance}. `;
                if (typeof q.totalDebt !== 'undefined') desc += `Total Debt: $${q.totalDebt}. `;
                if (typeof q.fastFoodSpent !== 'undefined') desc += `Fast Food Spend: $${q.fastFoodSpent}. `;
                if (typeof q.rentTxCount !== 'undefined') desc += `Rent Transactions: ${q.rentTxCount}. `;
                if (typeof q.charityTxCount !== 'undefined') desc += `Charity Transactions: ${q.charityTxCount}. `;
                if (typeof q.overdraftCount !== 'undefined') desc += `Overdrafts: ${q.overdraftCount}. `;
                if (typeof q.lastIncome !== 'undefined') desc += `Last Income: $${q.lastIncome}. `;
                
                const isCompleted = q.completed;
                const questIcons = ['⚔️', '🎯', '💪', '🔥', '⭐', '🏆', '🎖️', '💎'];
                const questIcon = questIcons[i % questIcons.length];
                
                return `
                <div class="quest-card-modern hover-scale mb-4" style="animation-delay:${i * 0.1}s;">
                    <div class="flex items-start gap-4 mb-4">
                        <div class="text-4xl">${questIcon}</div>
                        <div class="flex-1">
                            <div class="flex items-center justify-between mb-2">
                                <h3 class="text-xl font-bold text-white">${i + 1}. ${title}</h3>
                                <div class="flex gap-2">
                                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${impactClass === 'high' ? 'bg-red-500/20 text-red-400' : impactClass === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}">${impact} IMPACT</span>
                                    ${isCompleted ? '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">✅ COMPLETED</span>' : ''}
                                </div>
                            </div>
                            <p class="text-gray-400 text-sm">${desc || 'Complete this quest to earn rewards and boost your credit score!'}</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="glass-card p-3 rounded-xl text-center">
                            <div class="text-2xl mb-1">💎</div>
                            <div class="text-xs text-gray-400 mb-1">NFT Reward</div>
                            <div class="text-sm font-semibold text-white">${title.replace(/ /g, '')} NFT</div>
                        </div>
                        <div class="glass-card p-3 rounded-xl text-center">
                            <div class="text-2xl mb-1">📈</div>
                            <div class="text-xs text-gray-400 mb-1">Score Boost</div>
                            <div class="text-sm font-semibold text-white">+2 Points</div>
                        </div>
                    </div>
                    <div class="flex items-center justify-between">
                        <div class="text-sm ${isCompleted ? 'text-green-400' : 'text-gray-400'}">
                            ${isCompleted ? '✅ Completed' : '⏳ Pending'}
                        </div>
                        <button class="btn-modern text-sm px-6 py-2 start-quest-btn" data-quest-id="${q.id}" ${isCompleted ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
                            ${isCompleted ? '✅ Completed' : '⚔️ Start Quest'}
                        </button>
                    </div>
                </div>
                `;
            }).join('');

            // Attach click listeners to new buttons (in widget)
            setTimeout(() => {
                document.querySelectorAll('#quest-widget-list .start-quest-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const questId = btn.getAttribute('data-quest-id');
                        const questCard = btn.closest('.quest-card-gamified');
                        const questTitle = questCard?.querySelector('.quest-card-title')?.textContent || questId;
                        // obtain user wallet address via MetaMask if available
                        let userAddress = null;
                        if (window.ethereum) {
                            try {
                                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                                userAddress = accounts[0];
                            } catch (err) {
                                console.error('Wallet access denied', err);
                            }
                        }
                        if (!userAddress) {
                            userAddress = prompt('Enter your wallet address to record quest completion on-chain:');
                        }
                        if (!userAddress) return alert('Wallet address required');
                        btn.disabled = true;
                        btn.textContent = 'Starting...';
                        // Check for test mode (stored in localStorage)
                        const testMode = localStorage.getItem('nft_test_mode') === 'true';
                        if (testMode) {
                            console.log('🧪 TEST MODE: NFT minting will be simulated (no POL spent)');
                        }
                        
                        try {
                            const res = await fetch('http://localhost:3003/fulfill-quest', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                    questId, 
                                    userAddress, 
                                    userId: 'user_from_plaid',
                                    testMode: testMode // Pass test mode flag
                                })
                            });
                            const data = await res.json();
                            if (data.success) {
                                btn.textContent = 'Pending...';
                                btn.style.background = '#f59e42';
                                if (data.txHash) {
                                    showToastWithTxLink(data.txHash, btn, data.tokenId, data.nftAddress, questId, questTitle, userAddress);
                                    pollTxConfirmation(data.txHash, btn, data.tokenId, data.nftAddress);
                                } else {
                                    btn.textContent = 'Completed';
                                    btn.style.background = '#10b981';
                                }
                            } else {
                                btn.textContent = 'Error';
                                btn.disabled = false;
                                alert('Error fulfilling quest: ' + (data.error || JSON.stringify(data)));
                            }
                        // Poll blockchain explorer for transaction confirmation
                        function pollTxConfirmation(txHash, btn, tokenId, nftAddress) {
                            // Detect blockchain type
                            const isXRPL = txHash && txHash.length === 64 && /^[0-9A-Fa-f]+$/.test(txHash);
                            const isPolygon = txHash && txHash.startsWith('0x') && txHash.length === 66;
                            
                            // For XRPL, we'll check via backend API instead of polling
                            if (isXRPL) {
                                // XRPL transactions are confirmed quickly, just wait a bit
                                setTimeout(() => {
                                    btn.textContent = '✅ Complete!';
                                    btn.style.background = '#10b981';
                                    btn.disabled = true;
                                }, 3000);
                                return;
                            }
                            
                            // For Polygon, poll PolygonScan API
                            const explorerApi = `https://api-amoy.polygonscan.com/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}`;
                            let attempts = 0;
                            let maxAttempts = 40; // Increased attempts for slower testnet
                            let interval = setInterval(async () => {
                                attempts++;
                                try {
                                    const res = await fetch(explorerApi);
                                    const data = await res.json();
                                    if ((data.status === '1' && data.result && data.result.status === '1') || (data.result && data.result.status === '1')) {
                                        // Quest is complete! Remove from list and add NFT to tree
                                        const completedQuestCard = btn.closest('.quest-card-gamified');
                                        const finalQuestTitle = completedQuestCard?.querySelector('.quest-card-title')?.textContent || questTitle || questId;
                                        
                                        // Update button to show completion
                                        btn.textContent = '✅ Complete!';
                                        btn.style.background = '#10b981'; // Green for completed
                                        btn.disabled = true;
                                        
                                        // Increment NFT count (only once per quest completion)
                                        const currentNFTs = parseInt(localStorage.getItem('nftsEarned') || '0');
                                        localStorage.setItem('nftsEarned', (currentNFTs + 1).toString());
                                        
                                        // Show completion toast
                                        showCompletionToast(finalQuestTitle, txHash, tokenId);
                                        
                                        // Add NFT ball to tree in explore mode
                                        if (window.treeWorld && typeof window.treeWorld.addQuestNFT === 'function') {
                                            const nftAddr = nftAddress || (tokenId ? `Token #${tokenId}` : txHash);
                                            
                                            window.treeWorld.addQuestNFT(
                                                questId,
                                                finalQuestTitle,
                                                nftAddr,
                                                userAddress
                                            );
                                            console.log('🌳 NFT added to tree visualization!', { tokenId, nftAddress: nftAddr, questTitle: finalQuestTitle });
                                        } else {
                                            console.warn('⚠️ treeWorld not available, storing NFT for later...');
                                            // Store NFT data to add when tree is loaded
                                            const pendingNFTs = JSON.parse(localStorage.getItem('pendingNFTs') || '[]');
                                            pendingNFTs.push({
                                                questId,
                                                title: finalQuestTitle,
                                                nftAddress: nftAddress || (tokenId ? `Token #${tokenId}` : txHash),
                                                userAddress,
                                                txHash,
                                                tokenId
                                            });
                                            localStorage.setItem('pendingNFTs', JSON.stringify(pendingNFTs));
                                        }
                                        
                                        // Use MetaMask XRPL Snap (no backend XRPL calls)
                                        if (typeof window.issueQuestCompletionVC === 'function') {
                                            window.issueQuestCompletionVC(questId, finalQuestTitle, txHash, tokenId, userAddress).then(result => {
                                                if (result) {
                                                    console.log('✅ Quest Completion VC issued:', result.demoMode ? `(MetaMask connected): ${result.vcId}` : `on XRPL: ${result.txHash}`);
                                                    if (result.xrplExplorer) {
                                                        console.log('   View on XRPL Explorer:', result.xrplExplorer);
                                                    }
                                                    // Add VC to wallet
                                                    if (typeof window.addVCToWalletFromXRPL === 'function') {
                                                        window.addVCToWalletFromXRPL(result);
                                                    }
                                                }
                                            }).catch(err => {
                                                console.error('⚠️ MetaMask VC issuance failed:', err);
                                                console.log('💡 VC issuance skipped - will be handled by MetaMask on next attempt');
                                            });
                                        } else {
                                            console.warn('⚠️ window.issueQuestCompletionVC not available - VC issuance skipped');
                                        }
                                        
                                        // Update leaderboard stats
                                        if (userAddress && window.leaderboardSystem) {
                                            const nftCount = parseInt(localStorage.getItem('nftsEarned') || '0');
                                            const creditScore = parseInt(document.getElementById('current-score')?.textContent || '68'); // 1-100 scale
                                            window.leaderboardSystem.updateUserStats(userAddress, nftCount, creditScore);
                                        }
                                        
                                        // Update quest card to show completed
                                        if (completedQuestCard) {
                                            // Add completed badge
                                            const badgesContainer = completedQuestCard.querySelector('.quest-card-badges');
                                            if (badgesContainer && !badgesContainer.querySelector('[style*="COMPLETED"]')) {
                                                const completedBadge = document.createElement('span');
                                                completedBadge.className = 'quest-badge';
                                                completedBadge.style.cssText = 'background:rgba(16,185,129,0.1);color:#10b981;border-color:#10b981;';
                                                completedBadge.textContent = '✅ COMPLETED';
                                                badgesContainer.appendChild(completedBadge);
                                            }
                                            
                                            // Update status
                                            const statusEl = completedQuestCard.querySelector('.quest-card-status');
                                            if (statusEl) {
                                                statusEl.innerHTML = '<span style="color:#10b981;">✅ Completed</span>';
                                            }
                                            
                                            // Remove quest from list with animation
                                            setTimeout(() => {
                                                completedQuestCard.style.transition = 'opacity 0.3s, transform 0.3s';
                                                completedQuestCard.style.opacity = '0';
                                                completedQuestCard.style.transform = 'translateX(-20px)';
                                                setTimeout(() => {
                                                    completedQuestCard.remove();
                                                    // Reorder remaining quests and update stats
                                                    reorderQuestList();
                                                    updateQuestStats();
                                                }, 300);
                                            }, 1500); // Wait 1.5s to show completion message
                                        }
                                        
                                        clearInterval(interval);
                                    }
                                } catch {}
                                if (attempts >= maxAttempts) {
                                    btn.textContent = 'Completed (unconfirmed)';
                                    btn.style.background = '#f59e42';
                                    btn.disabled = true;
                                    clearInterval(interval);
                                }
                            }, 5000); // Poll every 5 seconds
                        }
                        // Toast notification for txHash (submission)
                        function showToastWithTxLink(txHash, btn, tokenId, nftAddress, questId, questTitle, userAddress) {
                            // Detect which blockchain: XRPL hashes are 64 hex chars, Polygon hashes are 66 chars with 0x
                            const isXRPL = txHash && txHash.length === 64 && /^[0-9A-Fa-f]+$/.test(txHash);
                            const isPolygon = txHash && txHash.startsWith('0x') && txHash.length === 66;
                            
                            let explorerUrl;
                            let explorerName;
                            
                            if (isPolygon) {
                                explorerUrl = `https://amoy.polygonscan.com/tx/${txHash}`;
                                explorerName = 'PolygonScan';
                            } else if (isXRPL) {
                                explorerUrl = `https://testnet.xrpl.org/transactions/${txHash}`;
                                explorerName = 'XRPL Explorer';
                            } else {
                                // Default to Polygon if uncertain (for backwards compatibility)
                                explorerUrl = `https://amoy.polygonscan.com/tx/${txHash}`;
                                explorerName = 'PolygonScan';
                            }
                            let toast = document.createElement('div');
                            toast.className = 'tx-toast';
                            toast.style.position = 'fixed';
                            toast.style.bottom = '32px';
                            toast.style.right = '32px';
                            toast.style.background = '#181f2a';
                            toast.style.color = '#fff';
                            toast.style.padding = '1em 1.5em';
                            toast.style.borderRadius = '8px';
                            toast.style.boxShadow = '0 2px 12px #0006';
                            toast.style.zIndex = 9999;
                            
                            // Create confirm button
                            const confirmBtn = document.createElement('button');
                            confirmBtn.textContent = '✅ Confirm Complete';
                            confirmBtn.style.cssText = 'margin-top:0.8em;padding:0.6em 1.2em;background:#10b981;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:0.9em;width:100%;transition:all 0.2s;';
                            confirmBtn.onmouseover = () => confirmBtn.style.background = '#059669';
                            confirmBtn.onmouseout = () => confirmBtn.style.background = '#10b981';
                            
                            // When confirm button is clicked, trigger completion
                            confirmBtn.onclick = () => {
                                toast.remove();
                                // Trigger the completion flow manually
                                const confirmQuestCard = btn.closest('.quest-card-gamified');
                                const confirmQuestTitle = confirmQuestCard?.querySelector('.quest-card-title')?.textContent || questTitle || questId;
                                
                                // Update button to show completion
                                btn.textContent = '✅ Complete!';
                                btn.style.background = '#10b981';
                                btn.disabled = true;
                                
                                // Increment NFT count (only once per quest completion)
                                const currentNFTs = parseInt(localStorage.getItem('nftsEarned') || '0');
                                localStorage.setItem('nftsEarned', (currentNFTs + 1).toString());
                                
                                // Show completion toast
                                showCompletionToast(confirmQuestTitle, txHash, tokenId);
                                
                                // Add NFT ball to tree in explore mode
                                if (window.treeWorld && typeof window.treeWorld.addQuestNFT === 'function') {
                                    const nftAddr = nftAddress || (tokenId ? `Token #${tokenId}` : txHash);
                                    window.treeWorld.addQuestNFT(
                                        questId,
                                        confirmQuestTitle,
                                        nftAddr,
                                        userAddress
                                    );
                                    console.log('🌳 NFT added to tree visualization!', { tokenId, nftAddress: nftAddr, questTitle: confirmQuestTitle });
                                } else {
                                    console.warn('⚠️ treeWorld not available, storing NFT for later...');
                                    const pendingNFTs = JSON.parse(localStorage.getItem('pendingNFTs') || '[]');
                                    pendingNFTs.push({
                                        questId,
                                        title: confirmQuestTitle,
                                        nftAddress: nftAddress || (tokenId ? `Token #${tokenId}` : txHash),
                                        userAddress,
                                        txHash,
                                        tokenId
                                    });
                                    localStorage.setItem('pendingNFTs', JSON.stringify(pendingNFTs));
                                }
                                
                                // Use MetaMask XRPL Snap → demo mode (no backend XRPL calls)
                                if (typeof window.issueQuestCompletionVC === 'function') {
                                    window.issueQuestCompletionVC(questId, confirmQuestTitle, txHash, tokenId, userAddress).then(result => {
                                        if (result) {
                                            console.log('✅ Quest Completion VC issued:', result.demoMode ? `(MetaMask connected): ${result.vcId}` : `on XRPL: ${result.txHash}`);
                                            if (result.xrplExplorer) {
                                                console.log('   View on XRPL Explorer:', result.xrplExplorer);
                                            }
                                            // Add VC to wallet
                                            if (typeof window.addVCToWalletFromXRPL === 'function') {
                                                window.addVCToWalletFromXRPL(result);
                                            }
                                        }
                                        
                                        // Update leaderboard stats
                                        if (userAddress && window.leaderboardSystem) {
                                            const nftCount = parseInt(localStorage.getItem('nftsEarned') || '0');
                                            const creditScore = parseInt(document.getElementById('current-score')?.textContent || '68'); // 1-100 scale
                                            window.leaderboardSystem.updateUserStats(userAddress, nftCount, creditScore);
                                        }
                                    }).catch(err => {
                                        console.error('⚠️ MetaMask VC issuance failed:', err);
                                        console.log('💡 VC issuance skipped - will be handled by MetaMask on next attempt');
                                    });
                                } else {
                                    console.warn('⚠️ window.issueQuestCompletionVC not available - VC issuance skipped');
                                }
                                
                                // Update quest card to show completed
                                if (confirmQuestCard) {
                                    // Add completed badge
                                    const badgesContainer = confirmQuestCard.querySelector('.quest-card-badges');
                                    if (badgesContainer && !badgesContainer.querySelector('[style*="COMPLETED"]')) {
                                        const completedBadge = document.createElement('span');
                                        completedBadge.className = 'quest-badge';
                                        completedBadge.style.cssText = 'background:rgba(16,185,129,0.1);color:#10b981;border-color:#10b981;';
                                        completedBadge.textContent = '✅ COMPLETED';
                                        badgesContainer.appendChild(completedBadge);
                                    }
                                    
                                    // Update status
                                    const statusEl = confirmQuestCard.querySelector('.quest-card-status');
                                    if (statusEl) {
                                        statusEl.innerHTML = '<span style="color:#10b981;">✅ Completed</span>';
                                    }
                                    
                                    // Remove quest from list with animation
                                    setTimeout(() => {
                                        confirmQuestCard.style.transition = 'opacity 0.3s, transform 0.3s';
                                        confirmQuestCard.style.opacity = '0';
                                        confirmQuestCard.style.transform = 'translateX(-20px)';
                                        setTimeout(() => {
                                            confirmQuestCard.remove();
                                            // Reorder remaining quests and update stats
                                            reorderQuestList();
                                            updateQuestStats();
                                        }, 300);
                                    }, 1500);
                                }
                            };
                            
                            toast.innerHTML = `
                                <b>⏳ Quest submitted on-chain!</b><br>
                                Waiting for confirmation...<br>
                                Tx: <a href='${explorerUrl}' target='_blank' style='color:#7dd3fc;text-decoration:underline;'>View on ${explorerName}</a>
                            `;
                            toast.appendChild(confirmBtn);
                            document.body.appendChild(toast);
                            setTimeout(() => { toast.remove(); }, 30000); // Keep longer since there's a button
                        }
                        
                        // Toast notification for completion
                        function showCompletionToast(questTitle, txHash, tokenId) {
                            // Detect which blockchain
                            const isXRPL = txHash && txHash.length === 64 && /^[0-9A-Fa-f]+$/.test(txHash);
                            const isPolygon = txHash && txHash.startsWith('0x') && txHash.length === 66;
                            
                            let explorerUrl;
                            let explorerName;
                            
                            if (isPolygon) {
                                explorerUrl = `https://amoy.polygonscan.com/tx/${txHash}`;
                                explorerName = 'PolygonScan';
                            } else if (isXRPL) {
                                explorerUrl = `https://testnet.xrpl.org/transactions/${txHash}`;
                                explorerName = 'XRPL Explorer';
                            } else {
                                explorerUrl = `https://amoy.polygonscan.com/tx/${txHash}`;
                                explorerName = 'PolygonScan';
                            }
                            let toast = document.createElement('div');
                            toast.className = 'completion-toast';
                            toast.style.position = 'fixed';
                            toast.style.bottom = '32px';
                            toast.style.right = '32px';
                            toast.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                            toast.style.color = '#fff';
                            toast.style.padding = '1.2em 1.8em';
                            toast.style.borderRadius = '12px';
                            toast.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.4)';
                            toast.style.zIndex = 10000;
                            toast.style.animation = 'slideInRight 0.3s ease-out';
                            toast.innerHTML = `
                                <div style="font-size:1.2em;font-weight:bold;margin-bottom:0.5em;">✅ Quest Complete!</div>
                                <div style="margin-bottom:0.5em;">${questTitle}</div>
                                ${tokenId ? `<div style="font-size:0.9em;opacity:0.9;">NFT Token #${tokenId} minted</div>` : ''}
                                <div style="margin-top:0.8em;font-size:0.85em;">
                                    <a href='${explorerUrl}' target='_blank' style='color:#fff;text-decoration:underline;font-weight:bold;'>View on ${explorerName} →</a>
                                </div>
                            `;
                            document.body.appendChild(toast);
                            setTimeout(() => { 
                                toast.style.animation = 'slideOutRight 0.3s ease-in';
                                setTimeout(() => toast.remove(), 300);
                            }, 8000);
                        }
                        
                        // Reorder quest list after removal
                        function reorderQuestList() {
                            const questList = document.getElementById('quest-widget-list');
                            if (!questList) return;
                            
                            const remainingCards = Array.from(questList.querySelectorAll('.quest-card-gamified'));
                            remainingCards.forEach((card, index) => {
                                const titleEl = card.querySelector('.quest-card-title');
                                if (titleEl) {
                                    const currentText = titleEl.textContent;
                                    // Update number in title
                                    const newText = currentText.replace(/^\d+\./, `${index + 1}.`);
                                    titleEl.textContent = newText;
                                }
                                
                                // Update impact badge based on new position
                                const impactBadge = card.querySelector('.quest-badge:not([style*="COMPLETED"])');
                                if (impactBadge) {
                                    let impact = 'LOW';
                                    let impactClass = 'low';
                                    if (index === 0) {
                                        impact = 'HIGH';
                                        impactClass = 'high';
                                    } else if (index === 1) {
                                        impact = 'MEDIUM';
                                        impactClass = 'medium';
                                    }
                                    impactBadge.textContent = `${impact} IMPACT`;
                                    impactBadge.className = `quest-badge ${impactClass}`;
                                    
                                    // Update card class
                                    card.className = `quest-card-gamified ${impactClass}-impact`;
                                }
                            });
                            
                            // If no quests left, show message
                            if (remainingCards.length === 0) {
                                questList.innerHTML = `
                                    <div class="quest-card-gamified" style="text-align:center;padding:4em 2em;">
                                        <div style="font-size:4em;margin-bottom:1em;">🎉</div>
                                        <h3 style="font-size:1.5em;margin-bottom:0.5em;">All quests completed!</h3>
                                        <p style="color:var(--text-secondary);">Check back later for new quests!</p>
                                    </div>
                                `;
                            }
                        }
                        
                        // Update quest stats
                        function updateQuestStats() {
                            // Fetch fresh quest data from backend to get accurate counts
                            fetch('http://localhost:3003/quests')
                                .then(res => res.json())
                                .then(data => {
                                    const questList = document.getElementById('quest-widget-list');
                                    if (!questList) return;
                                    
                                    const totalQuests = data.quests?.length || 0;
                                    const completedQuests = data.quests?.filter(q => q.completed).length || 0;
                                    const nftsEarned = parseInt(localStorage.getItem('nftsEarned') || '0');
                                    const scorePoints = completedQuests * 2; // 2 points per quest (1-100 scale)
                                    
                                    // Animate stat updates
                                    animateStatUpdate('quest-total', totalQuests);
                                    animateStatUpdate('quest-completed', completedQuests);
                                    animateStatUpdate('quest-nfts', nftsEarned);
                                    animateStatUpdate('quest-points', scorePoints, true);
                                })
                                .catch(() => {
                                    // Fallback to DOM-based counting if API fails
                                    const questList = document.getElementById('quest-widget-list');
                                    if (!questList) return;
                                    
                                    const totalCards = questList.querySelectorAll('.quest-card-gamified').length;
                                    const completedCards = questList.querySelectorAll('.quest-card-gamified .quest-badge[style*="COMPLETED"]').length;
                                    const nftsEarned = parseInt(localStorage.getItem('nftsEarned') || '0');
                                    const scorePoints = completedCards * 2; // 2 points per quest (1-100 scale)
                                    
                                    // Animate stat updates
                                    animateStatUpdate('quest-total', totalCards);
                                    animateStatUpdate('quest-completed', completedCards);
                                    animateStatUpdate('quest-nfts', nftsEarned);
                                    animateStatUpdate('quest-points', scorePoints, true);
                                });
                        }
                        
                        // Animate stat value updates
                        function animateStatUpdate(elementId, targetValue, isPoints = false) {
                            const element = document.getElementById(elementId);
                            if (!element) return;
                            
                            // Parse current value - handle points format (+90) or regular numbers
                            let currentValue = 0;
                            const currentText = element.textContent.trim();
                            if (isPoints) {
                                // For points, extract number from string like "+90" or "+90-1-1-1-"
                                const match = currentText.match(/\+?(\d+)/);
                                currentValue = match ? parseInt(match[1]) : 0;
                            } else {
                                currentValue = parseInt(currentText) || 0;
                            }
                            
                            const target = typeof targetValue === 'number' ? targetValue : parseInt(targetValue) || 0;
                            
                            // If values are the same, just update immediately
                            if (currentValue === target) {
                                element.textContent = isPoints ? `+${target}` : target;
                                return;
                            }
                            
                            const increment = target > currentValue ? 1 : -1;
                            const duration = 500;
                            const steps = Math.abs(target - currentValue);
                            const stepDuration = steps > 0 ? Math.max(16, duration / steps) : 16; // Minimum 16ms per step
                            
                            let current = currentValue;
                            const interval = setInterval(() => {
                                current += increment;
                                if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
                                    element.textContent = isPoints ? `+${target}` : target;
                                    clearInterval(interval);
                                } else {
                                    element.textContent = isPoints ? `+${current}` : current;
                                }
                            }, stepDuration);
                        }
                        } catch (err) {
                            btn.textContent = 'Error';
                            btn.disabled = false;
                            alert('Network error: ' + err);
                        }
                    });
                });
            }, 100);
        });
}

// Show VC log notification
function showVCLog(vc) {
    const logEl = document.createElement('div');
    logEl.style = 'background:#232b3e;color:#fff;padding:1em 1.5em;margin:1em 0;border-radius:8px;box-shadow:0 2px 8px #0002;position:fixed;top:20px;right:20px;z-index:10000;max-width:400px;';
    logEl.innerHTML = `<b>✅ VC Issued:</b> ${vc.type}<br>Issuer: ${vc.issuer}<br>${vc.fact ? `Fact: ${vc.fact}<br>` : ''}${vc.creditScore ? `<b style="color:#10b981;">Credit Score: +${vc.creditScore} points</b>` : (vc.fico ? `<b style="color:#10b981;">Credit Score: +${Math.floor(vc.fico / 10)} points</b>` : '')}`;
    document.body.appendChild(logEl);
    setTimeout(() => logEl.remove(), 5000);
}

// Consolidated in the main DOMContentLoaded listener above

// Ensure all functions are globally accessible (redundant but safe)
if (typeof window !== 'undefined') {
    if (typeof switchToExplorerMode === 'function') {
        window.switchToExplorerMode = switchToExplorerMode;
    }
    if (typeof updateSimulator === 'function') {
        window.updateSimulator = updateSimulator;
    }
}

console.log('✅ Professional Mode initialized');
console.log('✅ Button functions available:', {
    switchToExplorerMode: typeof window.switchToExplorerMode !== 'undefined' ? '✅' : '❌',
    updateSimulator: typeof window.updateSimulator !== 'undefined' ? '✅' : '❌',
    openQuestWidget: typeof window.openQuestWidget !== 'undefined' ? '✅' : '❌',
    closeQuestWidget: typeof window.closeQuestWidget !== 'undefined' ? '✅' : '❌'
});
