/**
 * Rewards API - Get user's claimable rewards
 * GET /api/rewards?fid=123
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fid = searchParams.get('fid')
    
    if (!fid) {
      return NextResponse.json({ error: 'FID is required' }, { status: 400 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get user's rewards
    const { data, error } = await supabase
      .rpc('get_user_rewards', { p_fid: parseInt(fid) })
    
    if (error) {
      console.error('[Rewards API] Error fetching rewards:', error)
      return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 })
    }
    
    return NextResponse.json({
      rewards: data || [],
      claimable: (data || []).filter((r: any) => !r.claimed && !r.is_expired),
      claimed: (data || []).filter((r: any) => r.claimed),
      expired: (data || []).filter((r: any) => !r.claimed && r.is_expired),
    })
  } catch (error) {
    console.error('[Rewards API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
