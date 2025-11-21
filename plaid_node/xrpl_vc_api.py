"""
XRPL VC Chain of Trust API
Backend endpoint for verifying VC chains on XRPL
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import json
import os

app = Flask(__name__)
CORS(app, supports_credentials=True)

API_KEY = os.environ.get('API_KEY', 'changeme')

def require_api_key():
    key = request.headers.get('X-API-KEY')
    return key == API_KEY

@app.route('/verify-vc-chain', methods=['POST'])
def verify_vc_chain():
    """Verify VC chain of trust on XRPL"""
    if not require_api_key():
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    data = request.get_json() or {}
    vc_id = data.get('vcId')
    chain_of_trust = data.get('chainOfTrust')
    trusted_regulators = data.get('trustedRegulators', [
        'did:xrpl:IndianRegulator:456',
        'did:xrpl:USRegulator:789',
        'did:xrpl:EuropeanRegulator:101'
    ])
    
    if not vc_id:
        return jsonify({'success': False, 'error': 'vcId required'}), 400
    
    # Call Node.js script to verify chain on XRPL
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    script_path = os.path.join(project_root, 'scripts', 'verify-xrpl-vc-chain.mjs')
    
    cmd = [
        'node',
        script_path,
        '--vcId', vc_id,
        '--chainOfTrust', chain_of_trust or '',
        '--trustedRegulators', json.dumps(trusted_regulators)
    ]
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=project_root
        )
        
        if result.returncode == 0:
            try:
                # Parse JSON output
                output = result.stdout.strip()
                parsed = json.loads(output.splitlines()[-1])
                
                return jsonify({
                    'success': True,
                    'valid': parsed.get('valid', False),
                    'reason': parsed.get('reason', ''),
                    'chain': parsed.get('chain', []),
                    'vcId': vc_id
                })
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': f'Failed to parse result: {str(e)}',
                    'stdout': result.stdout,
                    'stderr': result.stderr
                }), 500
        else:
            return jsonify({
                'success': False,
                'error': 'Verification failed',
                'stdout': result.stdout,
                'stderr': result.stderr
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/issue-vc', methods=['POST'])
def issue_vc():
    """Issue a VC on XRPL"""
    if not require_api_key():
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    data = request.get_json() or {}
    vc_type = data.get('type')
    issuer_did = data.get('issuerDid')
    subject_did = data.get('subjectDid')
    credential_subject = data.get('credentialSubject', {})
    parent_vc_id = data.get('parentVCId')
    issuer_secret = data.get('issuerSecret')  # In production, use secure key management
    
    if not all([vc_type, issuer_did, subject_did]):
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400
    
    # Call Node.js script to issue VC on XRPL
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    script_path = os.path.join(project_root, 'scripts', 'issue-xrpl-vc.mjs')
    
    cmd = [
        'node',
        script_path,
        '--type', vc_type,
        '--issuerDid', issuer_did,
        '--subjectDid', subject_did,
        '--credentialSubject', json.dumps(credential_subject),
        '--issuerSecret', issuer_secret or '',
        '--parentVCId', parent_vc_id or ''
    ]
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=project_root
        )
        
        if result.returncode == 0:
            try:
                output = result.stdout.strip()
                parsed = json.loads(output.splitlines()[-1])
                
                return jsonify({
                    'success': True,
                    'vcId': parsed.get('vcId'),
                    'txHash': parsed.get('txHash'),
                    'vc': parsed.get('vc')
                })
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': f'Failed to parse result: {str(e)}',
                    'stdout': result.stdout
                }), 500
        else:
            return jsonify({
                'success': False,
                'error': 'VC issuance failed',
                'stdout': result.stdout,
                'stderr': result.stderr
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(port=5001)  # Different port from generate_quests_api.py

