const { createVerifiableCredentialJwt } = require('did-jwt-vc');
const { EdDSASigner } = require('did-jwt');

// Replace with your real issuer DID and private key
const issuerDid = 'did:example:issuer123';
const issuerPrivateKey = 'YOUR_PRIVATE_KEY'; // Use a secure key management solution in production

async function issuePlaidBalanceVC(userDid, balance, threshold) {
  const payload = {
    sub: userDid,
    nbf: Math.floor(Date.now() / 1000),
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'PlaidBalanceCredential'],
      credentialSubject: {
        id: userDid,
        balance: balance,
        threshold: threshold,
        meetsRequirement: balance >= threshold
      }
    }
  };

  const jwt = await createVerifiableCredentialJwt(payload, {
    did: issuerDid,
    signer: EdDSASigner(issuerPrivateKey)
  });

  return jwt;
}

// Example usage:
(async () => {
  const userDid = 'did:example:user456';
  const balance = 1200; // Replace with Plaid API result
  const threshold = 1000;
  const vcJwt = await issuePlaidBalanceVC(userDid, balance, threshold);
  console.log('VC JWT:', vcJwt);
})();
