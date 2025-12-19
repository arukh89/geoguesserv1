/**
 * Claim Rewards API - Mark reward as claimed after successful transaction
 * POST /api/rewards/claim
 * Body: { rewardId: string, txHash: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rewardId, txHash } = body
    
    if (!rewardId || !txHash) {
      return NextResponse.json(
        { error: 'rewardId and txHash are required' }, 
        { status: 400 }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Mark reward as claimed
    const { data, error } = await supabase
      .rpc('claim_reward', { 
        p_reward_id: rewardId, 
        p_tx_hash: txHash 
      })
    
    if (error) {
      console.error('[Claim API] Error claiming reward:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to claim reward' }, 
        { status: 400 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Claim API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
