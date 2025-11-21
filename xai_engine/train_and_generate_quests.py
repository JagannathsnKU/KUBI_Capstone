import pandas as pd
import glob
import json
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import shap

# Load all holistic user data files
def load_user_data():
    files = glob.glob('holistic_user_data_user*.json')
    rows = []
    for file in files:
        with open(file) as f:
            data = json.load(f)
            fast_food = sum(t['amount'] for t in data['transactions'] if t['category'] == 'Fast Food')
            rent_late = any(t['category'] == 'Rent' and t.get('paid_late', False) for t in data['transactions'])
            features = {
                'income': data['income'],
                'balance': data['balance'],
                'utilization': data['utilization'],
                'account_age': data['account_age'],
                'avg_account_age': data['avg_account_age'],
                'credit_accounts': data['credit_accounts'],
                'loan_accounts': data['loan_accounts'],
                'new_accounts': data['new_accounts'],
                'payment_history': data['payment_history'],
                'fast_food_spend': fast_food,
                'rent_paid_late': int(rent_late),
                'is_student': int(data['is_student']),
                'test_score_avg': np.mean(data['test_scores']) if data['test_scores'] else 0,
                'github_commits': data['github_commits'],
                'dao_member': int(data['dao_member']),
                'crypto_income': data['crypto_income'],
                'nft_income': data['nft_income'],
                'target': int(data['payment_history'] > 0.85 and data['utilization'] < 0.5) # simple label
            }
            rows.append(features)
    return pd.DataFrame(rows)

def generate_quests(user_row):
    quests = []
    if user_row['fast_food_spend'] > 200:
        quests.append('Reduce fast food spending below $200/month')
    if user_row['rent_paid_late']:
        quests.append('Pay rent on time for 3 months')
    if user_row['utilization'] > 0.3:
        quests.append('Reduce credit utilization below 30%')
    if user_row['payment_history'] < 0.9:
        quests.append('Improve payment history above 90%')
    if user_row['is_student'] and user_row['test_score_avg'] < 80:
        quests.append('Increase test score average above 80')
    if user_row['github_commits'] < 10:
        quests.append('Connect GitHub and increase commits')
    if not user_row['dao_member']:
        quests.append('Join a DAO for financial diversity')
    if user_row['crypto_income'] < 500:
        quests.append('Increase crypto income above $500')
    if user_row['nft_income'] < 200:
        quests.append('Increase NFT income above $200')
    return quests

def main():
    df = load_user_data()
    if len(df) == 1:
        sample = df.iloc[0]
        print('\nSample user features:')
        print(sample)
        print('\nRecommended quests:')
        quests = generate_quests(sample)
        for q in quests:
            print('-', q)
        # Commented out model training for single user
        # X = df.drop('target', axis=1)
        # y = df['target']
        # X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        # model = RandomForestClassifier(n_estimators=100, random_state=42)
        # model.fit(X_train, y_train)
        # print('Classification Report:')
        # print(classification_report(y_test, model.predict(X_test)))
        # explainer = shap.TreeExplainer(model)
        # shap_values = explainer.shap_values(X_test)
        # shap.summary_plot(shap_values[1], X_test)
    else:
        X = df.drop('target', axis=1)
        y = df['target']
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        print('Classification Report:')
        print(classification_report(y_test, model.predict(X_test)))
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_test)
        shap.summary_plot(shap_values[1], X_test)
        # Generate quests for a sample user
        sample = X_test.iloc[[0]]
        print('\nSample user features:')
        print(sample)
        print('\nRecommended quests:')
        quests = generate_quests(sample.iloc[0])
        for q in quests:
            print('-', q)

if __name__ == '__main__':
    main()
