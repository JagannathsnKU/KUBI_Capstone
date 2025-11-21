import json
import numpy as np

# Load Plaid user data
with open('../plaid_node/plaid_user_data.json') as f:
    plaid = json.load(f)

user_id = plaid.get('user_id', 'unknown')
transactions = plaid.get('transactions', [])
accounts = plaid.get('accounts', [])

# Feature extraction
income = sum(t['amount'] for t in transactions if t.get('personal_finance_category', {}).get('primary') == 'INCOME')
balance = sum(acc['balances']['current'] for acc in accounts if 'balances' in acc)
utilization = 0.0  # Placeholder, can be calculated if credit limit info is available
account_age = 12   # Placeholder, can be calculated if account open date info is available
avg_account_age = 12  # Placeholder
credit_accounts = sum(1 for acc in accounts if acc.get('subtype') == 'credit card')
loan_accounts = sum(1 for acc in accounts if acc.get('subtype') == 'loan')
new_accounts = sum(1 for acc in accounts if acc.get('type') == 'depository')
payment_history = 1.0  # Placeholder, can be calculated from transactions
fast_food_spend = sum(t['amount'] for t in transactions if t.get('personal_finance_category', {}).get('detailed', '').lower().find('fast_food') != -1)
rent_paid_late = 0     # Placeholder, can be set if rent transactions have late info
is_student = 0         # Placeholder, can be set from Plaid or user profile

test_scores = []       # Placeholder, not available in Plaid
github_commits = 0     # Placeholder, not available in Plaid
dao_member = 0         # Placeholder, not available in Plaid
crypto_income = 0      # Placeholder, not available in Plaid
nft_income = 0         # Placeholder, not available in Plaid

holistic = {
    'income': income,
    'balance': balance,
    'utilization': utilization,
    'account_age': account_age,
    'avg_account_age': avg_account_age,
    'credit_accounts': credit_accounts,
    'loan_accounts': loan_accounts,
    'new_accounts': new_accounts,
    'payment_history': payment_history,
    'fast_food_spend': fast_food_spend,
    'rent_paid_late': rent_paid_late,
    'is_student': is_student,
    'test_scores': test_scores,
    'github_commits': github_commits,
    'dao_member': dao_member,
    'crypto_income': crypto_income,
    'nft_income': nft_income,
    'transactions': transactions
}

with open(f'holistic_user_data_{user_id}.json', 'w') as f:
    json.dump(holistic, f, indent=2)

print(f'Holistic user data generated for {user_id}')
