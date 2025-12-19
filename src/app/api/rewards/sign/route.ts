/**
 * Sign Reward API - Generate signature for user to claim reward
 * POST /api/rewards/sign
 * Body: { fid: number, weekId: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { privateKeyToAccount } from 'viem/accounts'
import { keccak256, encodePacked, toHex } from 'viem'
import { WEEKLY_REWARDS, CLAIM_DEADLINE_DAYS } from '@/lib/contracts/geoxRewards'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Admin private key for signing (server-side only)
const ADMIN_PRIVATE_KEY = process.env.ADMIN_SIGNER_PRIVATE_KEY as `0x${string}`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fid, weekId } = body
    
    if (!fid || weekId === undefined) {
      return NextResponse.json({ error: 'fid and weekId are required' }, { status: 400 })
    }

    if (!ADMIN_PRIVATE_KEY) {
      return NextResponse.json({ error: 'Server not configured for signing' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get user's rank for the week from leaderboard
    const { data: leaderboard, error: lbError } = await supabase
      .from('leaderboard_weekly')
      .select('*')
      .eq('p_fid', fid)
      .single()

    if (lbError || !leaderboard) {
      return NextResponse.json({ error: 'User not found in weekly leaderboard' }, { status: 404 })
    }

    const rank = leaderboard.rank
    if (rank < 1 || rank > 10) {
      return NextResponse.json({ error: 'User not in top 10' }, { status: 400 })
    }

    // Check if current week has ended (claim only available after Sunday)
    const currentWeekId = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
    if (weekId >= currentWeekId) {
      // Calculate when claim will be available
      const weekEndDate = new Date((weekId + 1) * 7 * 24 * 60 * 60 * 1000)
      return NextResponse.json({ 
        error: 'Claim not available yet. Week must end first.',
        availableAt: weekEndDate.toISOString(),
        currentWeekId,
        requestedWeekId: weekId
      }, { status: 400 })
    }

    // Check if already has signature for this week
    const { data: existingReward } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('fid', fid)
      .eq('week_id', weekId)
      .single()

    if (existingReward?.signature) {
      // Return existing signature
      return NextResponse.json({
        signature: existingReward.signature,
        weekId,
        rank: existingReward.rank,
        points: existingReward.total_score,
        amount: WEEKLY_REWARDS[existingReward.rank],
        deadline: new Date(existingReward.claim_deadline).getTime() / 1000,
        username: leaderboard.p_player_name?.replace('@', '') || '',
        pfpUrl: leaderboard.p_pfp_url || '',
      })
    }

    // Calculate deadline (3 days from now)
    const deadline = Math.floor(Date.now() / 1000) + (CLAIM_DEADLINE_DAYS * 24 * 60 * 60)
    
    // Get user wallet address
    const walletAddress = leaderboard.p_player_username as `0x${string}`
    if (!walletAddress) {
      return NextResponse.json({ error: 'User wallet address not found' }, { status: 400 })
    }

    const username = leaderboard.p_player_name?.replace('@', '') || ''
    const pfpUrl = leaderboard.p_pfp_url || ''
    const points = leaderboard.p_score_value

    // Create message hash (must match contract)
    const messageHash = keccak256(
      encodePacked(
        ['address', 'uint256', 'uint256', 'uint256', 'string', 'string', 'uint256'],
        [walletAddress, BigInt(weekId), BigInt(rank), BigInt(points), username, pfpUrl, BigInt(deadline)]
      )
    )

    // Sign the message
    const account = privateKeyToAccount(ADMIN_PRIVATE_KEY)
    const signature = await account.signMessage({ message: { raw: messageHash } })

    // Store reward record
    const weekStart = new Date(weekId * 7 * 24 * 60 * 60 * 1000)
    const weekEnd = new Date((weekId + 1) * 7 * 24 * 60 * 60 * 1000 - 1)
    const claimDeadline = new Date(deadline * 1000)

    await supabase.from('user_rewards').upsert({
      fid,
      wallet_address: walletAddress,
      player_name: leaderboard.p_player_name,
      amount: WEEKLY_REWARDS[rank],
      week_id: weekId,
      week_start: weekStart.toISOString(),
      week_end: weekEnd.toISOString(),
      rank,
      total_score: points,
      claimed: false,
      claim_deadline: claimDeadline.toISOString(),
      signature,
    }, { onConflict: 'fid,week_id' })

    return NextResponse.json({
      signature,
      weekId,
      rank,
      points,
      amount: WEEKLY_REWARDS[rank],
      deadline,
      username,
      pfpUrl,
      walletAddress,
    })
  } catch (error) {
    console.error('[Sign API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
