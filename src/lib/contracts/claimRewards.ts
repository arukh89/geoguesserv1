/**
 * Claim Rewards Contract Interface
 * 
 * This module handles the signature-based token claim system.
 * Users can claim their weekly rewards by submitting a signature from the admin.
 * 
 * Flow:
 * 1. Admin approves rewards for top 10 weekly players
 * 2. Backend generates EIP-712 signature for each eligible user
 * 3. User calls claim() with the signature to receive tokens
 * 4. Contract verifies signature and transfers tokens
 */

import { encodeFunctionData, parseUnits, keccak256, encodeAbiParameters, parseAbiParameters } from 'viem'

// GEOX token on Base Mainnet
export const GEO_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_GEOX_TOKEN_ADDRESS || '0x7B2823592942a18246499C41a0E31Ec7c0057c68') as `0x${string}`

// GEOX Rewards Contract (update after deploy)
export const GEO_REWARDS_CLAIM_CONTRACT = (process.env.NEXT_PUBLIC_GEOX_REWARDS_CONTRACT || '') as `0x${string}`
export const GEO_TOKEN_DECIMALS = 18
export const BASE_CHAIN_ID = 8453

// Weekly rewards distribution (3,750,000 GEOX total per week)
export const WEEKLY_REWARDS: Record<number, number> = {
  1: 937500,
  2: 675000,
  3: 487500,
  4: 375000,
  5: 300000,
  6: 262500,
  7: 225000,
  8: 187500,
  9: 150000,
  10: 150000,
}

// EIP-712 Domain for claim signatures
export const CLAIM_DOMAIN = {
  name: 'GeoExplorerRewards',
  version: '1',
  chainId: BASE_CHAIN_ID,
  // This will be the claim contract address once deployed
  // For now, we use a placeholder - admin signs with this domain
  verifyingContract: '0x0000000000000000000000000000000000000000' as `0x${string}`,
}

// EIP-712 Types for claim message
export const CLAIM_TYPES = {
  Claim: [
    { name: 'recipient', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'weekId', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const

// ERC20 Transfer ABI
export const ERC20_TRANSFER_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

// Claim message structure
export interface ClaimMessage {
  recipient: `0x${string}`
  amount: bigint
  weekId: bigint
  nonce: bigint
  deadline: bigint
}

// Reward data from database
export interface UserReward {
  id: string
  fid: number
  wallet_address: string
  amount: number
  week_id: number
  week_start: string
  week_end: string
  rank: number
  claimed: boolean
  claim_deadline: string
  signature?: string
  tx_hash?: string
}

/**
 * Calculate week ID from date (weeks since epoch)
 */
export function getWeekId(date: Date = new Date()): number {
  const epochStart = new Date('1970-01-01T00:00:00Z')
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  return Math.floor((date.getTime() - epochStart.getTime()) / msPerWeek)
}

/**
 * Get current week's start and end dates (Monday to Sunday UTC)
 */
export function getCurrentWeekRange(): { start: Date; end: Date } {
  const now = new Date()
  const dayOfWeek = now.getUTCDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  
  const start = new Date(now)
  start.setUTCDate(now.getUTCDate() - daysToMonday)
  start.setUTCHours(0, 0, 0, 0)
  
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 6)
  end.setUTCHours(23, 59, 59, 999)
  
  return { start, end }
}

/**
 * Get claim deadline (7 days from week end)
 */
export function getClaimDeadline(weekEnd: Date): Date {
  const deadline = new Date(weekEnd)
  deadline.setUTCDate(deadline.getUTCDate() + 7)
  return deadline
}

/**
 * Check if claim is still valid (before deadline)
 */
export function isClaimValid(deadline: string | Date): boolean {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline
  return new Date() < deadlineDate
}

/**
 * Format reward amount for display
 */
export function formatRewardAmount(amount: number): string {
  return amount.toLocaleString() + ' GEOX'
}

/**
 * Get reward amount by rank
 */
export function getRewardByRank(rank: number): number {
  return WEEKLY_REWARDS[rank] || 0
}

/**
 * Encode ERC20 transfer call data
 */
export function encodeTransferData(to: `0x${string}`, amount: bigint): `0x${string}` {
  return encodeFunctionData({
    abi: ERC20_TRANSFER_ABI,
    functionName: 'transfer',
    args: [to, amount],
  })
}

/**
 * Parse amount to token units
 */
export function parseTokenAmount(amount: number): bigint {
  return parseUnits(amount.toString(), GEO_TOKEN_DECIMALS)
}
