/**
 * Detect wallet environment
 */

export type WalletEnvironment = 'farcaster' | 'coinbase' | 'browser'

/**
 * Detect current environment for wallet selection
 */
export function detectWalletEnvironment(): WalletEnvironment {
  if (typeof window === 'undefined') return 'browser'
  
  // Check if running in Farcaster miniapp (Warpcast)
  const isFarcasterMiniApp = 
    window.location.hostname.includes('warpcast') ||
    // @ts-ignore
    window.farcaster !== undefined ||
    // Check for Farcaster frame context
    document.referrer.includes('warpcast') ||
    // Check URL params
    new URLSearchParams(window.location.search).has('fc_frame')
  
  if (isFarcasterMiniApp) return 'farcaster'
  
  // Check if running in Coinbase Wallet browser
  // @ts-ignore
  const isCoinbaseWallet = window.ethereum?.isCoinbaseWallet || 
    navigator.userAgent.includes('CoinbaseWallet')
  
  if (isCoinbaseWallet) return 'coinbase'
  
  // Default to browser (injected wallet like MetaMask)
  return 'browser'
}

/**
 * Get connector name based on environment
 */
export function getPreferredConnectorName(env: WalletEnvironment): string {
  switch (env) {
    case 'farcaster':
      return 'Farcaster' // or 'farcasterMiniApp'
    case 'coinbase':
      return 'Coinbase Wallet'
    case 'browser':
    default:
      return 'Injected' // MetaMask, etc.
  }
}
