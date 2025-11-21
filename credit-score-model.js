/**
 * credit-score-model.js
 * 
 * This file contains the logic for calculating a realistic, simulated credit score
 * based on financial data, intended to be sourced from Plaid. The model is a
 * simplified version of real-world credit scoring systems like FICO.
 */

const SCORE_WEIGHTS = {
    PAYMENT_HISTORY: 0.35,
    CREDIT_UTILIZATION: 0.30,
    CREDIT_HISTORY_LENGTH: 0.15,
    CREDIT_MIX: 0.10,
    NEW_CREDIT: 0.10,
};

/**
 * Calculates a simulated credit score between 300 and 850.
 * @param {object} plaidData - An object containing user's financial data from Plaid.
 * @returns {number} The calculated credit score.
 */
function calculateCreditScore(plaidData = {}) {
    const { accounts = [], transactions = [], liabilities = [] } = plaidData;

    // 1. Calculate the score for each component.
    // These functions will return a value between 0 and 1, representing the "health" of that component.
    const paymentHistoryFactor = calculatePaymentHistoryScore(transactions);
    const utilizationFactor = calculateCreditUtilizationScore(liabilities);
    const historyLengthFactor = calculateCreditHistoryLengthScore(accounts, transactions);
    const creditMixFactor = calculateCreditMixScore(accounts);
    const newCreditFactor = calculateNewCreditScore(accounts);

    // 2. Apply weights to each factor.
    const weightedScore =
        (paymentHistoryFactor * SCORE_WEIGHTS.PAYMENT_HISTORY) +
        (utilizationFactor * SCORE_WEIGHTS.CREDIT_UTILIZATION) +
        (historyLengthFactor * SCORE_WEIGHTS.CREDIT_HISTORY_LENGTH) +
        (creditMixFactor * SCORE_WEIGHTS.CREDIT_MIX) +
        (newCreditFactor * SCORE_WEIGHTS.NEW_CREDIT);

    // 3. Scale the result to the standard credit score range (300-850).
    // The range is 550 points (850 - 300).
    const finalScore = 300 + Math.round(weightedScore * 550);

    return finalScore;
}

// --- Component Calculation Functions (Placeholders) ---

function calculatePaymentHistoryScore(transactions) {
    // TODO: Analyze transactions for late fees, overdrafts, or returned payments.
    // For now, we assume a good history if data is present.
    console.log("Analyzing payment history...");
    return transactions.length > 0 ? 0.9 : 0.5; // Return a high score if transactions exist, medium otherwise.
}

function calculateCreditUtilizationScore(liabilities) {
    // TODO: Get total debt and total credit limits from liability accounts.
    // Utilization = (Total Balances / Total Credit Limits). Lower is better.
    console.log("Analyzing credit utilization...");
    return 0.8; // Placeholder value
}

function calculateCreditHistoryLengthScore(accounts, transactions) {
    // TODO: Estimate account age by finding the earliest transaction date.
    // Older average account age is better.
    console.log("Analyzing credit history length...");
    return 0.7; // Placeholder value
}

function calculateCreditMixScore(accounts) {
    // TODO: Analyze the variety of account types (e.g., credit card, loan, mortgage).
    // A diverse mix is generally better.
    console.log("Analyzing credit mix...");
    return 0.75; // Placeholder value
}

function calculateNewCreditScore(accounts) {
    // TODO: Check for recently opened accounts.
    // Fewer new accounts is better.
    console.log("Analyzing new credit inquiries...");
    return 0.85; // Placeholder value
}