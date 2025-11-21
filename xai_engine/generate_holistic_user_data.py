import json
import random
from datetime import datetime, timedelta

categories = ['Fast Food', 'Groceries', 'Rent', 'Utilities', 'Shopping', 'Travel', 'Entertainment']
vendors = {
    'Fast Food': ['McDonalds', 'KFC', 'Subway'],
    'Groceries': ['Walmart', 'Whole Foods'],
    'Rent': ['Landlord'],
    'Utilities': ['Electric Co', 'Water Works'],
    'Shopping': ['Amazon', 'Target'],
    'Travel': ['Uber', 'Lyft'],
    'Entertainment': ['Netflix', 'Spotify']
}

def random_transaction():
    cat = random.choice(categories)
    vendor = random.choice(vendors[cat])
    amount = round(random.uniform(5, 1500) if cat != 'Rent' else random.uniform(500, 2000), 2)
    date = (datetime.now() - timedelta(days=random.randint(0, 30))).strftime('%Y-%m-%d')
    late = cat == 'Rent' and random.random() < 0.2
    return {
        'date': date,
        'category': cat,
        'vendor': vendor,
        'amount': amount,
        'paid_late': late
    }

def random_user(user_id):
    is_student = random.random() < 0.3
    test_scores = [random.randint(60, 100) for _ in range(3)] if is_student else []
    github_commits = random.randint(0, 100) if is_student else random.randint(0, 50)
    dao_member = random.random() < 0.2
    crypto_income = round(random.uniform(0, 2000), 2)
    nft_income = round(random.uniform(0, 1000), 2)
    credit_accounts = random.randint(1, 6)
    loan_accounts = random.randint(0, 3)
    new_accounts = random.randint(0, 2)
    account_age = round(random.uniform(1, 10), 2)
    avg_account_age = round(random.uniform(1, account_age), 2)
    payment_history = round(random.uniform(0.7, 1.0), 2)
    utilization = round(random.uniform(0, 1), 2)
    transactions = [random_transaction() for _ in range(30)]
    return {
        'user_id': user_id,
        'is_student': is_student,
        'test_scores': test_scores,
        'github_commits': github_commits,
        'dao_member': dao_member,
        'crypto_income': crypto_income,
        'nft_income': nft_income,
        'income': round(random.uniform(3000, 8000), 2),
        'balance': round(random.uniform(500, 5000), 2),
        'credit_accounts': credit_accounts,
        'loan_accounts': loan_accounts,
        'new_accounts': new_accounts,
        'account_age': account_age,
        'avg_account_age': avg_account_age,
        'payment_history': payment_history,
        'utilization': utilization,
        'transactions': transactions
    }

users = [random_user(f'user{i+1}') for i in range(20)]

for user in users:
    with open(f'holistic_user_data_{user["user_id"]}.json', 'w') as f:
        json.dump(user, f, indent=2)
