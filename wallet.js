// VC import logic with status and credit score (1-100 scale)
function importVC() {
    const vcs = getWalletVCs();
    // Hardcoded imported VC
    const importedVC = {
        type: 'Credit Score',
        issuer: 'DID:GlobalCredit:001',
        subject: 'User123',
        fact: 'Status: Good',
        signature: '0x' + Math.random().toString(16).slice(2) + Date.now(),
        status: 'good',
        creditScore: 78, // 1-100 scale (was 780 FICO)
        chainOfTrust: null, // No chain for this VC
        verified: false
    };
    vcs.push(importedVC);
    saveWalletVCs(vcs);
    renderVCs();
    showVCLog(importedVC);
}

function showVCLog(vc) {
    const logEl = document.createElement('div');
    logEl.style = 'background:#232b3e;color:#fff;padding:1em 1.5em;margin:1em 0;border-radius:8px;box-shadow:0 2px 8px #0002;';
    const signatureText = vc.signature ? `${vc.signature.slice(0,12)}...` : 'N/A';
    const statusColor = vc.status === 'good' ? '#10b981' : (vc.status === 'bad' ? '#f87171' : '#6b7280');
    const statusText = vc.status || 'unknown';
        const creditScoreText = (vc.status === 'good' && vc.creditScore) ? `<br><b>Credit Score Points:</b> +${vc.creditScore}` : '';
    logEl.innerHTML = `<b>VC ${vc.type || 'Event'}:</b> ${vc.issuer || 'System'}<br>${vc.fact ? `Fact: ${vc.fact}<br>` : ''}Status: <span style="color:${statusColor}">${statusText}</span><br>Signature: ${signatureText}${creditScoreText}`;
    const container = document.querySelector('.wallet-container');
    const vcList = document.getElementById('vc-list');
    if (container && vcList && vcList.parentNode) {
        try {
            container.insertBefore(logEl, vcList);
            setTimeout(() => {
                if (logEl.parentNode) {
                    logEl.remove();
                }
            }, 5000);
        } catch (e) {
            console.warn('Could not show VC log:', e);
        }
    }
}

window.importVC = importVC;
// Simple VC Wallet UI logic
const vcListEl = document.getElementById('vc-list');

function getWalletVCs() {
    // For demo, use localStorage. Replace with backend or blockchain for production.
    return JSON.parse(localStorage.getItem('vc_wallet') || '[]');
}

function saveWalletVCs(vcs) {
    localStorage.setItem('vc_wallet', JSON.stringify(vcs));
}

function renderVCs() {
    const vcs = getWalletVCs();
    vcListEl.innerHTML = vcs.length === 0 ? '<p>No credentials yet.</p>' : vcs.map(vc => {
        const chainBadge = vc.chainOfTrust 
            ? `<span style="background:#3b82f6;color:#fff;padding:2px 8px;border-radius:4px;font-size:0.8em;margin-left:8px;">🔗 Chained</span>`
            : '';
        
        const verifiedBadge = vc.verified
            ? `<span style="background:#10b981;color:#fff;padding:2px 8px;border-radius:4px;font-size:0.8em;margin-left:8px;">✅ Verified</span>`
            : vc.chainOfTrust
            ? `<span style="background:#f59e0b;color:#fff;padding:2px 8px;border-radius:4px;font-size:0.8em;margin-left:8px;">⏳ Pending</span>`
            : '';

        const chainInfo = vc.chainOfTrust
            ? `<div style="margin-top:0.5em;padding:0.5em;background:#1e293b;border-radius:4px;font-size:0.9em;">
                 <b>Chain:</b> Linked to parent VC<br>
                 <span style="color:#7dd3fc;font-size:0.85em;">${vc.chainOfTrust && typeof vc.chainOfTrust === 'string' ? vc.chainOfTrust.slice(0, 20) + '...' : 'N/A'}</span>
                 ${vc.verificationChain && vc.verificationChain.length > 0 
                   ? `<br><span style="color:#10b981;">✓ Chain verified (${vc.verificationChain.length} links)</span>`
                   : ''
                 }
               </div>`
            : '';

        const signature = vc.signature || 'N/A';
        const signatureDisplay = typeof signature === 'string' && signature.length > 12 ? signature.slice(0, 12) + '...' : signature;
        const xrplTxDisplay = vc.xrplTxHash && typeof vc.xrplTxHash === 'string' ? vc.xrplTxHash.slice(0, 16) + '...' : 'N/A';

        return `
        <div class="vc-card" style="border-left: ${vc.verified ? '4px solid #10b981' : vc.chainOfTrust ? '4px solid #3b82f6' : '4px solid #6b7280'};">
            <div class="vc-header">${vc.type || 'Unknown'} VC ${chainBadge} ${verifiedBadge}</div>
            <div class="vc-issuer">Issuer: ${vc.issuer || 'Unknown'}</div>
            <div>Subject: ${vc.subject || 'Unknown'}</div>
            <div>Fact: ${vc.fact || 'No details'}</div>
            <div class="vc-signature">Signature: ${signatureDisplay}</div>
            ${vc.creditScore ? `<div style='color:#10b981;font-weight:bold;'>Credit Score: +${vc.creditScore} points</div>` : ''}
            ${chainInfo}
            ${vc.xrplTxHash ? `<div style="color:#7dd3fc;font-size:0.85em;margin-top:0.5em;">XRPL TX: ${xrplTxDisplay}</div>` : ''}
            <div class="vc-actions" style="margin-top:0.7em;">
                ${(vc.chainOfTrust && typeof vc.chainOfTrust === 'string' && vc.chainOfTrust.trim() !== '' && !vc.verified && signature !== 'N/A') ? `<button class="btn" onclick="verifyVCChain('${signature}')" style="background:#3b82f6;margin-right:0.5em;">Verify Chain</button>` : ''}
                ${signature !== 'N/A' ? `<button class="btn" onclick="removeVC('${signature}')" style="background:#ef4444;">Remove</button>` : ''}
            </div>
        </div>
    `;
    }).join('');
}

function addDemoVC() {
    const vcs = getWalletVCs();
    const demoVC = {
        type: 'Payment History',
        issuer: 'DID:BangaloreBank:123',
        subject: 'User123',
        fact: '5 years on-time payments',
        signature: '0x' + Math.random().toString(16).slice(2) + Date.now(),
        chainOfTrust: null,
        verified: false
    };
    vcs.push(demoVC);
    saveWalletVCs(vcs);
    renderVCs();
}

// Add chained VC example (Bank → User chain)
function addChainedVCExample() {
    const vcs = getWalletVCs();
    
    // Step 1: Bank Legitimacy VC (issued by regulator)
    const bankVC = {
        type: 'Bank Legitimacy',
        issuer: 'did:xrpl:IndianRegulator:456',
        subject: 'did:xrpl:BangaloreBank:123',
        fact: 'Licensed bank in India',
        signature: '0x' + Math.random().toString(16).slice(2) + Date.now(),
        chainOfTrust: null, // Root of chain
        verified: true, // Regulator is trusted
        verificationChain: []
    };
    vcs.push(bankVC);
    
    // Step 2: User Payment History VC (linked to bank VC)
    setTimeout(() => {
        const userVC = {
            type: 'Payment History',
            issuer: 'did:xrpl:BangaloreBank:123',
            subject: 'did:xrpl:user:789',
            fact: '5 years on-time payments',
            signature: '0x' + Math.random().toString(16).slice(2) + Date.now(),
            chainOfTrust: bankVC.signature, // Link to bank VC
            verified: false, // Needs verification
            verificationChain: []
        };
        vcs.push(userVC);
        saveWalletVCs(vcs);
        renderVCs();
        
        // Show info about chain
        showVCLog({
            type: 'Chain Created',
            issuer: 'System',
            fact: `User VC linked to Bank VC (${bankVC.signature.slice(0, 12)}...)`
        });
    }, 500);
    
    saveWalletVCs(vcs);
    renderVCs();
}

// Verify VC chain of trust
async function verifyVCChain(vcSignature) {
    const vcs = getWalletVCs();
    const vc = vcs.find(v => v.signature === vcSignature);
    
    if (!vc || !vc.chainOfTrust) {
        // Show inline message instead of alert
        console.warn('VC has no chain of trust to verify');
        return;
    }

    // Update button to show loading state
    const verifyButton = document.querySelector(`button[onclick="verifyVCChain('${vcSignature}')"]`);
    if (verifyButton) {
        verifyButton.disabled = true;
        verifyButton.textContent = '⏳ Verifying...';
    }

    try {
        // Call backend API to verify chain (using cross-border endpoint)
        const response = await fetch('http://localhost:3003/cross-border/verify-chain', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userVCId: vc.vcId || vc.signature,
                trustedRegulators: ['did:xrpl:IndianRegulator:456'],
                verifierAddress: 'Wallet System'
            })
        });

        const result = await response.json();
        
        if (result.verification && result.verification.valid) {
            // Update VC with verification status
            vc.verified = true;
            vc.verificationChain = result.verification.chain || [];
            saveWalletVCs(vcs);
            renderVCs();
            
            // Update button to show success
            if (verifyButton) {
                verifyButton.textContent = '✅ Verified';
                verifyButton.style.background = 'rgba(16, 185, 129, 0.2)';
                verifyButton.style.borderColor = 'rgba(16, 185, 129, 0.4)';
            }
            
            console.log('✅ Chain verified successfully');
        } else {
            vc.verified = false;
            saveWalletVCs(vcs);
            renderVCs();
            
            // Update button to show failure
            if (verifyButton) {
                verifyButton.textContent = '❌ Verification Failed';
                verifyButton.style.background = 'rgba(239, 68, 68, 0.2)';
                verifyButton.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            }
            
            console.warn('Chain verification failed:', result.verification?.reason || 'Unknown error');
        }
    } catch (error) {
        console.error('Error verifying VC chain:', error);
        
        // Update button to show error
        if (verifyButton) {
            verifyButton.disabled = false;
            verifyButton.textContent = '⚠️ Retry Verification';
            verifyButton.style.background = 'rgba(239, 68, 68, 0.2)';
        }
        
        // If backend is not available, mark as verified locally (demo mode)
        if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
            console.log('💡 Backend unavailable, marking as verified locally (demo mode)');
            vc.verified = true;
            vc.verificationChain = [];
            saveWalletVCs(vcs);
            renderVCs();
            
            if (verifyButton) {
                verifyButton.textContent = '✅ Verified (Demo)';
                verifyButton.style.background = 'rgba(139, 92, 246, 0.2)';
                verifyButton.style.borderColor = 'rgba(139, 92, 246, 0.4)';
            }
        }
    }
}

function removeVC(signature) {
    if (!signature || signature === 'N/A') {
        console.warn('Cannot remove VC: invalid signature');
        return;
    }
    let vcs = getWalletVCs();
    const beforeCount = vcs.length;
    vcs = vcs.filter(vc => vc.signature !== signature);
    const afterCount = vcs.length;
    if (beforeCount === afterCount) {
        console.warn('VC not found with signature:', signature);
        return;
    }
    saveWalletVCs(vcs);
    renderVCs();
}

// Remove all VCs from wallet
function removeAllVCs() {
    const vcs = getWalletVCs();
    if (vcs.length === 0) {
        console.log('Wallet is already empty');
        return;
    }
    
    // Confirm before removing all
    if (confirm(`Are you sure you want to remove all ${vcs.length} VC(s) from your wallet? This action cannot be undone.`)) {
        saveWalletVCs([]);
        renderVCs();
        console.log('✅ All VCs removed from wallet');
        
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.style.cssText = 'margin-top: 20px; padding: 16px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; color: #ef4444; text-align: center;';
        successMsg.textContent = '✅ All VCs removed from wallet';
        const container = document.querySelector('.wallet-container');
        if (container) {
            container.insertBefore(successMsg, container.firstChild);
            setTimeout(() => {
                if (successMsg.parentNode) {
                    successMsg.remove();
                }
            }, 3000);
        }
    }
}

window.addDemoVC = addDemoVC;
window.removeVC = removeVC;
window.removeAllVCs = removeAllVCs;
window.addChainedVCExample = addChainedVCExample;
window.verifyVCChain = verifyVCChain;

renderVCs();
