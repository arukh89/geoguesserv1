/**
 * GEOX Rewards Contract Interface
 * Signature-based claim system with Dynamic NFT
 */

import { encodeFunctionData } from 'viem'

// GEOX Token on Base Mainnet
export const GEOX_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_GEOX_TOKEN_ADDRESS || '0x7B2823592942a18246499C41a0E31Ec7c0057c68') as `0x${string}`

// GEOX Rewards Contract (update after deploy)
export const GEOX_REWARDS_CONTRACT = (process.env.NEXT_PUBLIC_GEOX_REWARDS_CONTRACT || '') as `0x${string}`

// Admin signer
export const ADMIN_SIGNER = (process.env.NEXT_PUBLIC_ADMIN_SIGNER || '0x702AA27b8498EB3F9Ec0431BC5Fd258Bc19faf36') as `0x${string}`

export const GEOX_TOKEN_DECIMALS = 18
export const BASE_CHAIN_ID = 8453

// Claim deadline: 3 days
export const CLAIM_DEADLINE_DAYS = 3

// Weekly rewards distribution (GEOX tokens)
export const WEEKLY_REWARDS: Record<number, number> = {
  1: 937_500,
  2: 675_000,
  3: 487_500,
  4: 375_000,
  5: 300_000,
  6: 262_500,
  7: 225_000,
  8: 187_500,
  9: 150_000,
  10: 150_000,
}

// Contract ABI for claim function
export const GEOX_REWARDS_ABI = [
  {
    name: 'claimReward',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'weekId', type: 'uint256' },
      { name: 'rank', type: 'uint256' },
      { name: 'points', type: 'uint256' },
      { name: 'username', type: 'string' },
      { name: 'pfpUrl', type: 'string' },
      { name: 'deadline', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    name: 'hasClaimed',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'weekId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'canClaim',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'weekId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'getUserData',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'tokenId', type: 'uint256' },
          { name: 'username', type: 'string' },
          { name: 'pfpUrl', type: 'string' },
          { name: 'totalPoints', type: 'uint256' },
          { name: 'highestRank', type: 'uint256' },
          { name: 'totalClaims', type: 'uint256' },
          { name: 'lastClaimWeek', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'getCurrentWeekId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

// Reward data structure
export interface WeeklyReward {
  weekId: number
  rank: number
  points: number
  amount: number
  username: string
  pfpUrl: string
  deadline: number
  signature?: string
  claimed: boolean
  expired: boolean
}

// User NFT data from contract
export interface UserNFTData {
  tokenId: bigint
  username: string
  pfpUrl: string
  totalPoints: bigint
  highestRank: bigint
  totalClaims: bigint
  lastClaimWeek: bigint
}

/**
 * Get current week start (Monday 00:00 UTC) - matches PostgreSQL date_trunc('week', ...)
 */
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayOfWeek = d.getUTCDay() // 0 = Sunday, 1 = Monday, ...
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  d.setUTCDate(d.getUTCDate() - daysFromMonday)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

/**
 * Get current week ID (ISO week number style, consistent with PostgreSQL)
 * Week ID = number of weeks since a fixed epoch (2024-01-01 which was a Monday)
 */
export function getCurrentWeekId(): number {
  const epochStart = new Date('2024-01-01T00:00:00Z') // Monday
  const currentWeekStart = getWeekStart()
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  return Math.floor((currentWeekStart.getTime() - epochStart.getTime()) / msPerWeek)
}

/**
 * Get week start date from week ID
 */
export function getWeekStartDate(weekId: number): Date {
  const epochStart = new Date('2024-01-01T00:00:00Z') // Monday
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  return new Date(epochStart.getTime() + weekId * msPerWeek)
}

/**
 * Get week end date (Sunday 23:59:59 UTC)
 */
export function getWeekEndDate(weekId: number): Date {
  const weekStart = getWeekStartDate(weekId)
  const weekEnd = new Date(weekStart)
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6)
  weekEnd.setUTCHours(23, 59, 59, 999)
  return weekEnd
}

/**
 * Get claim deadline (3 days after week ends)
 */
export function getClaimDeadline(weekId: number): Date {
  const weekEnd = getWeekEndDate(weekId)
  weekEnd.setUTCDate(weekEnd.getUTCDate() + CLAIM_DEADLINE_DAYS)
  return weekEnd
}

/**
 * Check if claim is still valid
 */
export function isClaimValid(weekId: number): boolean {
  const deadline = getClaimDeadline(weekId)
  return new Date() < deadline
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
 * Encode claim function call
 */
export function encodeClaimData(
  weekId: number,
  rank: number,
  points: number,
  username: string,
  pfpUrl: string,
  deadline: number,
  signature: `0x${string}`
): `0x${string}` {
  return encodeFunctionData({
    abi: GEOX_REWARDS_ABI,
    functionName: 'claimReward',
    args: [BigInt(weekId), BigInt(rank), BigInt(points), username, pfpUrl, BigInt(deadline), signature],
  })
}
