import json
from credit_xai import analyze_credit_data  # Assuming this function exists in your XAI engine

# Load Plaid user data
with open('../plaid_node/plaid_user_data.json', 'r') as f:
    plaid_data = json.load(f)

# Example: Extract relevant features for XAI engine
accounts = plaid_data.get('accounts', [])
transactions = plaid_data.get('transactions', [])

# You may want to aggregate balances, transaction amounts, etc.
total_balance = sum(acc.get('balances', {}).get('current', 0) for acc in accounts)
total_transactions = len(transactions)
total_spent = sum(tx.get('amount', 0) for tx in transactions)

# Prepare features for XAI engine
features = {
    'total_balance': total_balance,
    'total_transactions': total_transactions,
    'total_spent': total_spent,
    # Add more features as needed
}

# Run XAI analysis (replace with your actual function)
results = analyze_credit_data(features)

print('XAI Credit Analysis Results:')
print(results)
