
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import shap
import matplotlib.pyplot as plt
import json
import os

# Try to load Plaid data if available
plaid_path = '../plaid_node/plaid_user_data.json'
if os.path.exists(plaid_path):
    with open(plaid_path, 'r') as f:
        plaid_data = json.load(f)
    # Extract features from Plaid data
    accounts = plaid_data.get('accounts', [])
    transactions = plaid_data.get('transactions', [])
    total_balance = sum(acc.get('balances', {}).get('current', 0) for acc in accounts)
    total_transactions = len(transactions)
    total_spent = sum(tx.get('amount', 0) for tx in transactions)
    # Use Plaid data for a single sample
    data = pd.DataFrame({
        'income': [5000],  # Placeholder, Plaid does not provide direct income
        'balance': [total_balance],
        'utilization': [0.5],  # Placeholder, can be calculated if available
        'account_age': [3],  # Placeholder, can be calculated from account open date
        'account_mix': [len(accounts)],
        'payment_history': [0.95],  # Placeholder, can be inferred from transactions
        'target': [1]
    })
    print('Using Plaid data for analysis.')
else:
    # Sample synthetic data for demonstration
    np.random.seed(42)
    data = pd.DataFrame({
        'income': np.random.normal(5000, 1500, 200),
        'balance': np.random.normal(2000, 800, 200),
        'utilization': np.random.uniform(0, 1, 200),
        'account_age': np.random.normal(5, 2, 200),
        'account_mix': np.random.randint(1, 5, 200),
        'payment_history': np.random.uniform(0.7, 1.0, 200),
        'target': np.random.binomial(1, 0.7, 200)
    })
    print('Using synthetic data for analysis.')

X = data.drop('target', axis=1)
y = data['target']

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Model: Random Forest for explainability
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Evaluate
print('Classification Report:')
print(classification_report(y_test, model.predict(X_test)))

# SHAP explainability
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)

# Show summary plot for class 1 (good credit)
shap.summary_plot(shap_values[1], X_test)

# Print reason codes for a single prediction
sample = X_test.iloc[[0]]
pred = model.predict(sample)[0]
shap_val = explainer.shap_values(sample)
print(f'Prediction: {"Good" if pred == 1 else "Bad"} credit')
for feature, value in zip(X.columns, shap_val[1][0]):
    print(f'{feature}: {value:+.2f} impact')
