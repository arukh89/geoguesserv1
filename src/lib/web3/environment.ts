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
  // @ts-ignore - Farcaster SDK injects this
  const hasFarcasterSDK = window.farcaster !== undefined || window.Farcaster !== undefined
  
  // Check various Farcaster indicators
  const isFarcasterMiniApp = 
    hasFarcasterSDK ||
    window.location.hostname.includes('warpcast') ||
    document.referrer.includes('warpcast') ||
    document.referrer.includes('farcaster') ||
    new URLSearchParams(window.location.search).has('fc_frame') ||
    // Check for Farcaster frame embed
    window.self !== window.top && document.referrer.includes('warpcast')
  
  if (isFarcasterMiniApp) return 'farcaster'
  
  // Check if running in Coinbase Wallet browser or Base app
  // @ts-ignore
  const ethereum = window.ethereum
  const isCoinbaseWallet = 
    ethereum?.isCoinbaseWallet || 
    ethereum?.isCoinbaseBrowser ||
    navigator.userAgent.includes('CoinbaseWallet') ||
    navigator.userAgent.includes('Coinbase') ||
    // Base app uses Coinbase Wallet
    navigator.userAgent.includes('Base/')
  
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
      return 'Farcaster'
    case 'coinbase':
      return 'Coinbase'
    case 'browser':
    default:
      return 'Injected'
  }
}

/**
 * Check if we're in a mobile app context
 */
export function isMobileAppContext(): boolean {
  if (typeof window === 'undefined') return false
  
  const ua = navigator.userAgent
  return (
    ua.includes('Warpcast') ||
    ua.includes('CoinbaseWallet') ||
    ua.includes('Base/') ||
    // Generic mobile webview detection
    ua.includes('wv') ||
    ua.includes('WebView')
  )
}
