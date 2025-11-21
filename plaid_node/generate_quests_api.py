import subprocess
import json
from flask import Flask, jsonify
import os
from flask import request
from flask_cors import CORS

app = Flask(__name__)
CORS(app, supports_credentials=True)
API_KEY = os.environ.get('API_KEY', 'changeme')

def require_api_key():
    key = request.headers.get('X-API-KEY')
    if key != API_KEY:
        return False
    return True

@app.route('/generate-quests', methods=['GET'])
def generate_quests():
    if not require_api_key():
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    # Step 1: Convert Plaid data to holistic format
    subprocess.run(['python', '../xai_engine/convert_plaid_to_holistic.py'])
    # Step 2: Run XAI engine and capture output
    result = subprocess.run(['python', '../xai_engine/train_and_generate_quests.py'], capture_output=True, text=True)
    # Step 3: Parse quests from output
    quests = []
    for line in result.stdout.splitlines():
        if line.startswith('- '):
            quests.append(line[2:])
    return jsonify({'quests': quests})


@app.route('/fulfill-quest', methods=['POST'])
def fulfill_quest():
    if not require_api_key():
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    data = request.get_json() or {}
    quest_id = data.get('questId')
    user_address = data.get('userAddress') or '0x3Dc88401919665Ee05159985656A139ecEb072bb'
    user_id = data.get('userId') or 'user_from_plaid'
    if not quest_id:
        return jsonify({'success': False, 'error': 'questId required'}), 400

    # Call node script to fulfill a single quest
    cmd = ['node', '.\\scripts\\oracleFulfillQuests.mjs', '--userAddress', user_address, '--userId', user_id, '--questId', quest_id]
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=project_root)
        stdout = result.stdout.strip()
        stderr = result.stderr.strip()
        if result.returncode == 0:
            # try parse JSON in stdout
            try:
                parsed = json.loads(stdout.splitlines()[-1])
                tx_hash = parsed.get('txHash')
                token_id = parsed.get('tokenId')
                if tx_hash:
                    response = {'success': True, 'txHash': tx_hash}
                    if token_id:
                        response['tokenId'] = token_id
                        response['nftAddress'] = f'0x{token_id}'  # For now, use tokenId as address
                    return jsonify(response)
                else:
                    return jsonify({'success': True, 'result': parsed})
            except Exception:
                return jsonify({'success': True, 'stdout': stdout, 'stderr': stderr})
        else:
            return jsonify({'success': False, 'stdout': stdout, 'stderr': stderr}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000)
