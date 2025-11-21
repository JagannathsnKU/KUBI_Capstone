/**
 * XRPL Configuration
 * Set your XRPL testnet account here
 * Get free testnet account from: https://xrpl.org/xrp-testnet-faucet.html
 */

// XRPL Testnet Configuration
// ⬇️ UPDATE THESE VALUES WITH YOUR XRPL TESTNET ACCOUNT ⬇️
// Get free testnet account from: https://xrpl.org/xrp-testnet-faucet.html

export const XRPL_CONFIG = {
  // Testnet (for development)
  testnet: {
    url: 'wss://s.altnet.rippletest.net:51233',
    // ⬇️ UPDATE THESE TWO LINES ⬇️
    accountAddress: 'rEncMLTtu9TjzYPmuP48HLPNtqYWS66fC1',  // ⬅️ Replace with your XRPL testnet address
    accountSecret: 'sEdVJi2sfQtC8gRTy21Q4UEdwk7QuQQ'    // ⬅️ Replace with your XRPL testnet secret
  },
  
  useTestnet: true
};

export function getXRPLConfig() {
  return XRPL_CONFIG.useTestnet ? XRPL_CONFIG.testnet : XRPL_CONFIG.mainnet;
}
export function isXRPLConfigured() {
  const config = getXRPLConfig();
  return config.accountAddress !== 'rYourTestnetAddress' && 
         config.accountSecret !== 'sYourTestnetSecret' &&
         config.accountAddress.startsWith('r') &&
         config.accountSecret.startsWith('s');
}

