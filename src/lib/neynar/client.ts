"use client"

/**
 * Neynar API client for Farcaster user lookups
 * Docs: https://docs.neynar.com/docs/getting-started-with-neynar
 */

// For client-side usage, we need NEXT_PUBLIC_ prefix
// Fallback to NEYNAR_API_DOCS for development (limited rate)
const NEYNAR_API_KEY = process.env.NEXT_PUBLIC_NEYNAR_API_KEY || 'NEYNAR_API_DOCS'
const NEYNAR_BASE_URL = 'https://api.neynar.com/v2/farcaster'

// Neynar API response types
export interface VerifiedAddressInfo {
  eth_addresses: string[]
  sol_addresses: string[]
  primary?: {
    eth_address?: string
    sol_address?: string
  }
}

export interface NeynarUser {
  fid: number
  username: string
  display_name: string
  pfp_url: string
  custody_address: string
  verified_addresses: VerifiedAddressInfo
  // Warplet/Farcaster wallet info (newer API field)
  verified_accounts?: Array<{
    platform: string
    address: string
    protocol?: string
  }>
  follower_count: number
  following_count: number
}

export interface FarcasterUserData {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  custodyAddress: string
  verifiedAddresses: string[]
  primaryEthAddress?: string // Primary/Warplet address
}

/**
 * Extract primary/Warplet ETH address from Neynar user data
 * Priority: primary.eth_address > verified_addresses[0] with "Primary" tag > first eth_address
 */
function extractPrimaryEthAddress(user: NeynarUser): string | undefined {
  // 1. Check if primary address is explicitly set
  if (user.verified_addresses?.primary?.eth_address) {
    return user.verified_addresses.primary.eth_address
  }
  
  // 2. Fallback to first verified ETH address (usually the primary/Warplet)
  // Note: In Neynar API, the address marked as "Primary" and "Farcaster Wallet" 
  // is typically returned in the verified_addresses array
  const ethAddresses = user.verified_addresses?.eth_addresses || []
  
  // The Warplet/Farcaster Wallet is usually the one that's marked as primary
  // In the API response, this is often the second address if custody is first
  // But we should prefer the one that matches the primary field if available
  if (ethAddresses.length > 0) {
    // Return first verified address as primary (Neynar typically puts primary first)
    return ethAddresses[0]
  }
  
  return undefined
}

/**
 * Fetch user by FID from Neynar API
 */
export async function fetchUserByFid(fid: number): Promise<FarcasterUserData | null> {
  try {
    const response = await fetch(`${NEYNAR_BASE_URL}/user/bulk?fids=${fid}`, {
      headers: {
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY
      }
    })
    
    if (!response.ok) {
      console.warn('Neynar API request failed:', response.status)
      return null
    }
    
    const data = await response.json()
    console.log('[Neynar] Raw user data for FID', fid, ':', JSON.stringify(data?.users?.[0]?.verified_addresses, null, 2))
    
    const user = data?.users?.[0] as NeynarUser | undefined
    
    if (user) {
      const primaryEthAddress = extractPrimaryEthAddress(user)
      console.log('[Neynar] Primary ETH address for FID', fid, ':', primaryEthAddress)
      
      return {
        fid: user.fid,
        username: user.username,
        displayName: user.display_name,
        pfpUrl: user.pfp_url,
        custodyAddress: user.custody_address,
        verifiedAddresses: user.verified_addresses?.eth_addresses || [],
        primaryEthAddress
      }
    }
  } catch (error) {
    console.warn('Failed to fetch user by FID from Neynar:', error)
  }
  return null
}

/**
 * Fetch user by wallet/custody address from Neynar API
 * This is the key function to get FID from wallet address!
 */
export async function fetchUserByAddress(address: string): Promise<FarcasterUserData | null> {
  try {
    // Neynar API endpoint to lookup user by verified address
    const response = await fetch(`${NEYNAR_BASE_URL}/user/bulk-by-address?addresses=${address.toLowerCase()}`, {
      headers: {
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY
      }
    })
    
    if (!response.ok) {
      console.warn('Neynar API bulk-by-address failed:', response.status)
      return null
    }
    
    const data = await response.json()
    // Response format: { [address]: [users] }
    const users = data?.[address.toLowerCase()] as NeynarUser[] | undefined
    const user = users?.[0]
    
    if (user) {
      return {
        fid: user.fid,
        username: user.username,
        displayName: user.display_name,
        pfpUrl: user.pfp_url,
        custodyAddress: user.custody_address,
        verifiedAddresses: user.verified_addresses?.eth_addresses || [],
        primaryEthAddress: extractPrimaryEthAddress(user)
      }
    }
  } catch (error) {
    console.warn('Failed to fetch user by address from Neynar:', error)
  }
  return null
}

/**
 * Search users by username
 */
export async function searchUsersByUsername(query: string, limit = 5): Promise<FarcasterUserData[]> {
  try {
    const response = await fetch(`${NEYNAR_BASE_URL}/user/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
      headers: {
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY
      }
    })
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    const users = data?.result?.users as NeynarUser[] | undefined
    
    return (users || []).map(user => ({
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
      custodyAddress: user.custody_address,
      verifiedAddresses: user.verified_addresses?.eth_addresses || [],
      primaryEthAddress: extractPrimaryEthAddress(user)
    }))
  } catch (error) {
    console.warn('Failed to search users:', error)
    return []
  }
}
