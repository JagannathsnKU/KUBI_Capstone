/**
 * Issue XRPL VC
 * CLI script to issue a VC on XRPL
 */

import { XRPLVCManager, VerifiableCredential } from '../xrpl-vc-chain.js';

async function main() {
  const args = {};
  for (let i = 2; i < process.argv.length; i += 2) {
    const key = process.argv[i]?.replace(/^--/, '');
    const val = process.argv[i + 1];
    if (key && val) args[key] = val;
  }

  const type = args.type;
  const issuerDid = args.issuerDid;
  const subjectDid = args.subjectDid;
  const credentialSubject = JSON.parse(args.credentialSubject || '{}');
  const issuerSecret = args.issuerSecret;
  const parentVCId = args.parentVCId;

  if (!type || !issuerDid || !subjectDid) {
    console.error(JSON.stringify({
      success: false,
      error: 'Missing required fields: type, issuerDid, subjectDid'
    }));
    process.exit(1);
  }

  try {
    // DEMO MODE: Use demo issuance (no XRPL connection needed)
    console.log('📋 Running in DEMO MODE (no XRPL connection required)');
    
    const { issueDemoVC } = await import('../xrpl-vc-chain.js');
    
    const result = await issueDemoVC({
      type: type,
      issuerDid: issuerDid,
      subjectDid: subjectDid,
      credentialSubject: credentialSubject,
      chainOfTrust: parentVCId || null
    });
    
    console.log(JSON.stringify({
      success: true,
      vcId: result.vcId,
      txHash: result.txHash,
      vc: result.vc.toJSON()
    }));
    process.exit(0);
    
    /* REAL XRPL MODE (commented out for demo):
    const manager = new XRPLVCManager(
      'rIssuerAccountAddress',
      issuerSecret || 'sTestSecretKey'
    );
    await manager.connect();

    // Create VC
    const vc = new VerifiableCredential({
      id: `vc:${type}:${subjectDid}:${Date.now()}`,
      type: type,
      issuerDid: issuerDid,
      subjectDid: subjectDid,
      credentialSubject: credentialSubject,
      issuanceDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        proofPurpose: 'assertionMethod',
        verificationMethod: `${issuerDid}#keys-1`
      },
      chainOfTrust: parentVCId || null
    });

    const result = await manager.issueVC(vc, parentVCId);
    await manager.disconnect();
    */

  } catch (error) {
    console.error(JSON.stringify({
      success: false,
      error: error.message
    }));
    process.exit(1);
  }
}

main();

