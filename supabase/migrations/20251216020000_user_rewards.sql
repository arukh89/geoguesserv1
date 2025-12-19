-- Migration: Add user_rewards table for self-claim system
-- Created: 2024-12-16

-- ============================================
-- USER REWARDS TABLE
-- ============================================
-- Tracks claimable rewards for each user per week
-- Users can claim their rewards within 7 days of week end

CREATE TABLE IF NOT EXISTS public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- User identification
  fid INTEGER NOT NULL,
  wallet_address TEXT NOT NULL,
  player_name TEXT,
  
  -- Reward details
  amount NUMERIC(20,8) NOT NULL,
  week_id INTEGER NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  rank INTEGER NOT NULL,
  total_score INTEGER NOT NULL,
  
  -- Claim status
  claimed BOOLEAN NOT NULL DEFAULT false,
  claim_deadline TIMESTAMPTZ NOT NULL,
  signature TEXT, -- EIP-712 signature from admin
  tx_hash TEXT, -- Transaction hash when claimed
  claimed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT unique_user_week UNIQUE (fid, week_id),
  CONSTRAINT valid_rank CHECK (rank >= 1 AND rank <= 10),
  CONSTRAINT valid_amount CHECK (amount > 0)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_rewards_fid ON public.user_rewards(fid);
CREATE INDEX IF NOT EXISTS idx_user_rewards_wallet ON public.user_rewards(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_rewards_week_id ON public.user_rewards(week_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_claimed ON public.user_rewards(claimed);
CREATE INDEX IF NOT EXISTS idx_user_rewards_deadline ON public.user_rewards(claim_deadline);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- Allow public read (users can see their rewards)
CREATE POLICY user_rewards_select_public ON public.user_rewards 
  FOR SELECT USING (true);

-- Allow public insert (admin creates rewards via API)
CREATE POLICY user_rewards_insert_public ON public.user_rewards 
  FOR INSERT WITH CHECK (true);

-- Allow public update (for claiming)
CREATE POLICY user_rewards_update_public ON public.user_rewards 
  FOR UPDATE USING (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get user's claimable rewards
CREATE OR REPLACE FUNCTION public.get_user_rewards(
  p_fid INTEGER
) RETURNS TABLE (
  id UUID,
  fid INTEGER,
  wallet_address TEXT,
  player_name TEXT,
  amount NUMERIC,
  week_id INTEGER,
  week_start DATE,
  week_end DATE,
  rank INTEGER,
  total_score INTEGER,
  claimed BOOLEAN,
  claim_deadline TIMESTAMPTZ,
  signature TEXT,
  tx_hash TEXT,
  claimed_at TIMESTAMPTZ,
  is_expired BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.fid,
    r.wallet_address,
    r.player_name,
    r.amount,
    r.week_id,
    r.week_start,
    r.week_end,
    r.rank,
    r.total_score,
    r.claimed,
    r.claim_deadline,
    r.signature,
    r.tx_hash,
    r.claimed_at,
    (NOW() > r.claim_deadline) as is_expired
  FROM public.user_rewards r
  WHERE r.fid = p_fid
  ORDER BY r.week_id DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to mark reward as claimed
CREATE OR REPLACE FUNCTION public.claim_reward(
  p_reward_id UUID,
  p_tx_hash TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_claimed BOOLEAN;
  v_deadline TIMESTAMPTZ;
BEGIN
  -- Check if reward exists and is not already claimed
  SELECT claimed, claim_deadline INTO v_claimed, v_deadline
  FROM public.user_rewards
  WHERE id = p_reward_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reward not found';
  END IF;
  
  IF v_claimed THEN
    RAISE EXCEPTION 'Reward already claimed';
  END IF;
  
  IF NOW() > v_deadline THEN
    RAISE EXCEPTION 'Claim deadline has passed';
  END IF;
  
  -- Update reward as claimed
  UPDATE public.user_rewards
  SET 
    claimed = true,
    tx_hash = p_tx_hash,
    claimed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_reward_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to create weekly rewards for top 10 players
-- Called by admin after week ends
CREATE OR REPLACE FUNCTION public.create_weekly_rewards(
  p_week_id INTEGER,
  p_week_start DATE,
  p_week_end DATE
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_deadline TIMESTAMPTZ;
  v_rewards RECORD;
BEGIN
  -- Calculate claim deadline (3 days after week end)
  v_deadline := (p_week_end + INTERVAL '3 days')::TIMESTAMPTZ;
  
  -- Get top 10 players from weekly leaderboard and create rewards
  FOR v_rewards IN
    SELECT 
      p_fid as fid,
      p_player_username as wallet_address,
      p_player_name as player_name,
      p_score_value as total_score,
      rank
    FROM public.leaderboard_weekly
    WHERE rank <= 10
  LOOP
    -- Calculate reward amount based on rank
    DECLARE
      v_amount NUMERIC;
    BEGIN
      v_amount := CASE v_rewards.rank
        WHEN 1 THEN 937500
        WHEN 2 THEN 675000
        WHEN 3 THEN 487500
        WHEN 4 THEN 375000
        WHEN 5 THEN 300000
        WHEN 6 THEN 262500
        WHEN 7 THEN 225000
        WHEN 8 THEN 187500
        WHEN 9 THEN 150000
        WHEN 10 THEN 150000
        ELSE 0
      END;
      
      -- Insert reward (skip if already exists)
      INSERT INTO public.user_rewards (
        fid, wallet_address, player_name, amount, week_id, 
        week_start, week_end, rank, total_score, claim_deadline
      ) VALUES (
        v_rewards.fid, v_rewards.wallet_address, v_rewards.player_name, v_amount,
        p_week_id, p_week_start, p_week_end, v_rewards.rank, v_rewards.total_score, v_deadline
      )
      ON CONFLICT (fid, week_id) DO NOTHING;
      
      IF FOUND THEN
        v_count := v_count + 1;
      END IF;
    END;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PERMISSIONS
-- ============================================

GRANT SELECT ON public.user_rewards TO anon, authenticated;
GRANT INSERT, UPDATE ON public.user_rewards TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_rewards TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_reward TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_weekly_rewards TO anon, authenticated;

-- ============================================
-- REALTIME
-- ============================================

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_rewards;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
