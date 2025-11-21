"""
XAI Analysis API - Returns analysis in dashboard format
This script runs XAI analysis and returns JSON for the frontend dashboard
"""

import json
import os
import sys

def load_plaid_data(plaid_path=None):
    """Load Plaid data from JSON file"""
    # If path provided as command line argument, use it
    if plaid_path:
        if os.path.exists(plaid_path):
            try:
                with open(plaid_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f'Error loading Plaid data from {plaid_path}: {e}', file=sys.stderr)
                return None
        else:
            print(f'Plaid data file not found: {plaid_path}', file=sys.stderr)
            return None
    
    # Try multiple possible paths (fallback for backwards compatibility)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)  # Go up from xai_engine to project root
    
    # Try relative path first (when run from xai_engine directory)
    plaid_path = os.path.join(project_root, 'plaid_node', 'plaid_user_data.json')
    
    # If not found, try alternative paths
    if not os.path.exists(plaid_path):
        # Try current working directory
        plaid_path = os.path.join(os.getcwd(), 'plaid_node', 'plaid_user_data.json')
    
    if not os.path.exists(plaid_path):
        # Try relative to current directory
        plaid_path = '../plaid_node/plaid_user_data.json'
        if not os.path.exists(plaid_path):
            return None
    
    try:
        with open(plaid_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f'Error loading Plaid data: {e}', file=sys.stderr)
        return None

def calculate_factors_from_plaid(plaid_data):
    """Calculate credit score factors from Plaid data"""
    accounts = plaid_data.get('accounts', [])
    transactions = plaid_data.get('transactions', [])
    
    # Calculate metrics
    total_balance = sum(acc.get('balances', {}).get('current', 0) for acc in accounts)
    credit_accounts = [acc for acc in accounts if acc.get('subtype') == 'credit card']
    total_credit_limit = sum(acc.get('balances', {}).get('limit', 0) for acc in credit_accounts)
    total_credit_used = sum(abs(acc.get('balances', {}).get('current', 0)) for acc in credit_accounts if acc.get('balances', {}).get('current', 0) < 0)
    
    # Payment History (35% weight)
    # Count on-time payments (no negative transactions in last 12 months)
    recent_txs = [tx for tx in transactions if tx.get('amount', 0) >= 0]
    payment_history_score = min(100, (len(recent_txs) / max(1, len(transactions))) * 100) if transactions else 50
    payment_history_impact = int((payment_history_score / 100) * 35)
    
    # Credit Utilization (30% weight)
    utilization = (total_credit_used / total_credit_limit * 100) if total_credit_limit > 0 else 0
    if utilization < 30:
        utilization_score = 100
        utilization_impact = 30
    elif utilization < 50:
        utilization_score = 80
        utilization_impact = 24
    elif utilization < 70:
        utilization_score = 60
        utilization_impact = 18
    else:
        utilization_score = 40
        utilization_impact = 12
    
    # Account Diversity (10% weight)
    account_types = set(acc.get('subtype', acc.get('type', '')) for acc in accounts)
    diversity_count = len(account_types)
    if diversity_count >= 4:
        diversity_score = 100
        diversity_impact = 10
    elif diversity_count == 3:
        diversity_score = 80
        diversity_impact = 8
    elif diversity_count == 2:
        diversity_score = 60
        diversity_impact = 6
    else:
        diversity_score = 40
        diversity_impact = 4
    
    # Income Stability (15% weight) - simplified
    income_txs = [tx for tx in transactions if 'income' in str(tx.get('category', '')).lower() or tx.get('amount', 0) > 1000]
    income_stability_score = 70 if len(income_txs) > 0 else 50
    income_stability_impact = int((income_stability_score / 100) * 15)
    
    # Account Age (10% weight) - simplified
    # Assume average account age based on transaction history
    if transactions:
        oldest_tx = min(tx.get('date', '') for tx in transactions if tx.get('date'))
        account_age_score = 70  # Placeholder
        account_age_impact = 7
    else:
        account_age_score = 50
        account_age_impact = 5
    
    # Calculate overall score
    overall_score = payment_history_impact + utilization_impact + diversity_impact + income_stability_impact + account_age_impact
    overall_score = int(overall_score * 10)  # Scale to 0-850 range
    
    # Build factors array
    factors = [
        {
            'name': 'Payment History',
            'impact': payment_history_impact,
            'percentage': int(payment_history_score),
            'positive': payment_history_impact >= 30,
            'explanation': f'You have {len(recent_txs)} positive transactions. {"Excellent consistency!" if payment_history_score >= 90 else "Good payment history."}'
        },
        {
            'name': 'Credit Utilization',
            'impact': utilization_impact - 30,  # Negative impact if below optimal
            'percentage': int(utilization) if utilization > 0 else 0,
            'positive': utilization < 30,
            'explanation': f'Using {int(utilization)}% of available credit. {"Excellent!" if utilization < 30 else "Reduce to 30% for optimal score." if utilization < 70 else "High utilization is hurting your score."}'
        },
        {
            'name': 'Account Diversity',
            'impact': diversity_impact - 10,  # Negative if low
            'percentage': int(diversity_score),
            'positive': diversity_count >= 3,
            'explanation': f'{diversity_count} account type{"s" if diversity_count != 1 else ""} active. {"Excellent diversity!" if diversity_count >= 4 else "Adding more account types would optimize this factor." if diversity_count < 3 else "Good account mix."}'
        },
        {
            'name': 'Income Stability',
            'impact': income_stability_impact - 15,  # Negative if unstable
            'percentage': int(income_stability_score),
            'positive': income_stability_score >= 70,
            'explanation': f'{"Consistent income detected." if income_stability_score >= 70 else "Income varies month-to-month. Consistent income improves creditworthiness."}'
        },
        {
            'name': 'Account Age',
            'impact': account_age_impact - 10,  # Negative if new
            'percentage': int(account_age_score),
            'positive': account_age_score >= 70,
            'explanation': f'{"Good credit history length." if account_age_score >= 70 else "Newer accounts. Building credit history takes time."}'
        }
    ]
    
    return {
        'score': overall_score,
        'factors': factors,
        'ficoEquivalent': int(overall_score * 0.85),  # Rough FICO equivalent
        'vcCount': 0,  # Will be updated by frontend
        'onChainScore': int(overall_score / 10)  # 0-100 scale
    }

def main():
    """Main function to generate XAI analysis"""
    try:
        # Get Plaid data path from command line argument if provided
        plaid_path = sys.argv[1] if len(sys.argv) > 1 else None
        # Load Plaid data
        plaid_data = load_plaid_data(plaid_path)
        
        if not plaid_data:
            # Return default analysis if no Plaid data
            # Note: This will be sent to stderr so it doesn't interfere with JSON output
            print('No Plaid data found. Using default analysis.', file=sys.stderr)
            default_analysis = {
                'score': 674,  # FICO scale: converts to 68 in 1-100 scale ((674-300)/5.5 = 68)
                'factors': [
                    {
                        'name': 'Payment History',
                        'impact': 35,
                        'percentage': 92,
                        'positive': True,
                        'explanation': 'Connect your bank account via Plaid to see your real payment history analysis powered by XAI.'
                    },
                    {
                        'name': 'Credit Utilization',
                        'impact': -20,
                        'percentage': 65,
                        'positive': False,
                        'explanation': 'Connect your bank account via Plaid to see your real credit utilization analysis powered by XAI.'
                    },
                    {
                        'name': 'Account Diversity',
                        'impact': 10,
                        'percentage': 60,
                        'positive': True,
                        'explanation': 'Connect your bank account via Plaid to see your account diversity analysis powered by XAI.'
                    },
                    {
                        'name': 'Income Stability',
                        'impact': -10,
                        'percentage': 55,
                        'positive': False,
                        'explanation': 'Connect your bank account via Plaid to see your income stability analysis powered by XAI.'
                    },
                    {
                        'name': 'Account Age',
                        'impact': 15,
                        'percentage': 70,
                        'positive': True,
                        'explanation': 'Connect your bank account via Plaid to see your account age analysis powered by XAI.'
                    }
                ],
                'ficoEquivalent': 720,
                'vcCount': 0,
                'onChainScore': 68  # Changed from 85 to match main score
            }
            print(json.dumps(default_analysis))
            return
        
        # Calculate factors from real Plaid data
        analysis = calculate_factors_from_plaid(plaid_data)
        
        # Output JSON for API (only JSON to stdout, errors to stderr)
        print(json.dumps(analysis))
        
    except Exception as e:
        # Log error to stderr, return JSON to stdout
        error_msg = f'Error in XAI analysis: {str(e)}'
        print(error_msg, file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        
        # Return error in JSON format
        error_response = {
            'error': str(e),
            'score': 674,  # FICO scale: converts to 68 in 1-100 scale
            'factors': [
                {
                    'name': 'Payment History',
                    'impact': 35,
                    'percentage': 92,
                    'positive': True,
                    'explanation': f'XAI analysis error: {str(e)}. Please check server logs.'
                }
            ],
            'ficoEquivalent': 720,
            'vcCount': 0,
            'onChainScore': 68  # Changed from 85 to match main score
        }
        print(json.dumps(error_response))
        sys.exit(1)

if __name__ == '__main__':
    main()

