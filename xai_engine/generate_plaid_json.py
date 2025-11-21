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
    return {
        'date': date,
        'category': cat,
        'vendor': vendor,
        'amount': amount
    }

# Generate random transactions
transactions = [random_transaction() for _ in range(30)]

plaid_json = {
    'user_id': 'user123',
    'transactions': transactions,
    'income': round(random.uniform(3000, 8000), 2),
    'balance': round(random.uniform(500, 5000), 2)
}

with open('plaid_user_data.json', 'w') as f:
    json.dump(plaid_json, f, indent=2)
