-- Supabase schema for geoguesserv1
-- Project ref: ggjgxbqptiyuhioaoaru
-- Last updated: 2024-12-16

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- TABLES
-- ============================================

-- scores table: stores public leaderboard scores
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  player_name TEXT,
  identity TEXT, -- wallet address for token rewards
  score_value INTEGER NOT NULL,
  rounds INTEGER,
  average_distance INTEGER,
  fid INTEGER, -- Farcaster user ID
  pfp_url TEXT -- Profile picture URL
);

-- admin_rewards table: records token payouts to winners
CREATE TABLE IF NOT EXISTS public.admin_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  admin_fid INTEGER,
  admin_wallet TEXT,
  recipient_wallet TEXT NOT NULL,
  recipient_name TEXT,
  amount NUMERIC(20,8) NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  tx_hash TEXT
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_scores_created_at ON public.scores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scores_score_value ON public.scores(score_value DESC);
CREATE INDEX IF NOT EXISTS idx_scores_fid ON public.scores(fid);
CREATE INDEX IF NOT EXISTS idx_admin_rewards_week_start ON public.admin_rewards(week_start);
CREATE INDEX IF NOT EXISTS idx_admin_rewards_recipient_wallet ON public.admin_rewards(recipient_wallet);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_rewards ENABLE ROW LEVEL SECURITY;

-- RLS policies: allow public read, inserts, and deletes
CREATE POLICY IF NOT EXISTS scores_select_public ON public.scores FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS scores_insert_public ON public.scores FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS scores_delete_public ON public.scores FOR DELETE USING (true);
CREATE POLICY IF NOT EXISTS admin_rewards_select_public ON public.admin_rewards FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS admin_rewards_insert_public ON public.admin_rewards FOR INSERT WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Insert score function with FID and PFP
CREATE OR REPLACE FUNCTION public.insert_score(
  p_player_name TEXT DEFAULT NULL,
  p_identity TEXT DEFAULT NULL,
  p_score_value INTEGER DEFAULT 0,
  p_rounds INTEGER DEFAULT 1,
  p_average_distance INTEGER DEFAULT 0,
  p_fid INTEGER DEFAULT NULL,
  p_pfp_url TEXT DEFAULT NULL
) RETURNS UUID AS $
DECLARE
  new_score_id UUID;
BEGIN
  IF p_score_value < 0 THEN
    RAISE EXCEPTION 'Score cannot be negative';
  END IF;
  
  IF p_rounds <= 0 THEN
    RAISE EXCEPTION 'Rounds must be positive';
  END IF;
  
  IF p_average_distance < 0 THEN
    RAISE EXCEPTION 'Average distance cannot be negative';
  END IF;
  
  INSERT INTO public.scores (
    player_name, identity, score_value, rounds, average_distance, fid, pfp_url
  ) VALUES (
    p_player_name, p_identity, p_score_value, p_rounds, p_average_distance, p_fid, p_pfp_url
  ) RETURNING id INTO new_score_id;
  
  RETURN new_score_id;
END;
$ LANGUAGE plpgsql;

-- Get top leaderboard function: aggregate total score per user (FID)
CREATE OR REPLACE FUNCTION public.get_top_leaderboard(
  limit_count INTEGER DEFAULT 10
) RETURNS TABLE (
  id UUID,
  player_name TEXT,
  identity TEXT,
  score_value INTEGER,
  rounds INTEGER,
  average_distance INTEGER,
  created_at TIMESTAMPTZ,
  global_rank BIGINT,
  fid INTEGER,
  pfp_url TEXT
) AS $
BEGIN
  RETURN QUERY
  SELECT
    (array_agg(s.id ORDER BY s.created_at DESC))[1] as id,
    MAX(s.player_name) as player_name,
    MAX(s.identity) as identity,
    SUM(s.score_value)::INTEGER as score_value,
    SUM(s.rounds)::INTEGER as rounds,
    AVG(s.average_distance)::INTEGER as average_distance,
    MAX(s.created_at) as created_at,
    ROW_NUMBER() OVER (ORDER BY SUM(s.score_value) DESC) as global_rank,
    s.fid,
    MAX(s.pfp_url) as pfp_url
  FROM public.scores s
  WHERE s.score_value > 0
    AND s.fid IS NOT NULL
  GROUP BY s.fid
  ORDER BY score_value DESC
  LIMIT limit_count;
END;
$ LANGUAGE plpgsql;

-- Cleanup weekly scores function (for cron job)
CREATE OR REPLACE FUNCTION public.cleanup_weekly_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
  week_start TIMESTAMP WITH TIME ZONE;
BEGIN
  week_start := date_trunc('week', NOW() AT TIME ZONE 'UTC');
  DELETE FROM public.scores WHERE created_at < week_start;
  RAISE NOTICE 'Cleaned up scores older than %', week_start;
END;
$;

-- ============================================
-- VIEWS
-- ============================================

-- Daily leaderboard view: aggregate total score per FID
CREATE OR REPLACE VIEW public.leaderboard_daily
WITH (security_invoker = true)
AS
SELECT 
  (array_agg(s.id ORDER BY s.created_at DESC))[1] as id,
  MAX(s.player_name) as p_player_name,
  MAX(s.identity) as p_player_username,
  SUM(s.score_value)::INTEGER as p_score_value,
  SUM(s.rounds)::INTEGER as p_rounds,
  AVG(s.average_distance)::INTEGER as p_avg_distance,
  MAX(s.created_at)::date as p_last_submit_date,
  s.fid as p_fid,
  MAX(s.pfp_url) as p_pfp_url,
  ROW_NUMBER() OVER (ORDER BY SUM(s.score_value) DESC) as rank
FROM public.scores s
WHERE s.created_at >= CURRENT_DATE
  AND s.created_at < CURRENT_DATE + interval '1 day'
  AND s.fid IS NOT NULL
GROUP BY s.fid
ORDER BY p_score_value DESC;

-- Weekly leaderboard view: aggregate total score per FID
CREATE OR REPLACE VIEW public.leaderboard_weekly
WITH (security_invoker = true)
AS
SELECT 
  (array_agg(s.id ORDER BY s.created_at DESC))[1] as id,
  MAX(s.player_name) as p_player_name,
  MAX(s.identity) as p_player_username,
  SUM(s.score_value)::INTEGER as p_score_value,
  SUM(s.rounds)::INTEGER as p_rounds,
  AVG(s.average_distance)::INTEGER as p_avg_distance,
  MAX(s.created_at)::date as p_last_submit_date,
  s.fid as p_fid,
  MAX(s.pfp_url) as p_pfp_url,
  ROW_NUMBER() OVER (ORDER BY SUM(s.score_value) DESC) as rank
FROM public.scores s
WHERE s.created_at >= date_trunc('week', CURRENT_DATE)
  AND s.created_at < date_trunc('week', CURRENT_DATE) + interval '7 days'
  AND s.fid IS NOT NULL
GROUP BY s.fid
ORDER BY p_score_value DESC;

-- ============================================
-- REALTIME
-- ============================================

DO $ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.scores;
EXCEPTION WHEN duplicate_object THEN NULL; END $;

DO $ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_rewards;
EXCEPTION WHEN duplicate_object THEN NULL; END $;

-- ============================================
-- PERMISSIONS
-- ============================================

GRANT SELECT ON public.leaderboard_daily TO anon, authenticated;
GRANT SELECT ON public.leaderboard_weekly TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.insert_score TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_leaderboard TO anon, authenticated;

-- ============================================
-- USER REWARDS TABLE (for token claim system)
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  fid INTEGER NOT NULL,
  wallet_address TEXT NOT NULL,
  player_name TEXT,
  amount NUMERIC(20,8) NOT NULL,
  week_id INTEGER NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  rank INTEGER NOT NULL,
  total_score INTEGER NOT NULL,
  claimed BOOLEAN NOT NULL DEFAULT false,
  claim_deadline TIMESTAMPTZ NOT NULL,
  signature TEXT,
  tx_hash TEXT,
  claimed_at TIMESTAMPTZ,
  CONSTRAINT unique_user_week UNIQUE (fid, week_id),
  CONSTRAINT valid_rank CHECK (rank >= 1 AND rank <= 10),
  CONSTRAINT valid_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_user_rewards_fid ON public.user_rewards(fid);
CREATE INDEX IF NOT EXISTS idx_user_rewards_wallet ON public.user_rewards(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_rewards_week_id ON public.user_rewards(week_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_claimed ON public.user_rewards(claimed);

ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS user_rewards_select_public ON public.user_rewards FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS user_rewards_insert_public ON public.user_rewards FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS user_rewards_update_public ON public.user_rewards FOR UPDATE USING (true);

-- Function to get user's claimable rewards
CREATE OR REPLACE FUNCTION public.get_user_rewards(p_fid INTEGER)
RETURNS TABLE (
  id UUID, fid INTEGER, wallet_address TEXT, player_name TEXT,
  amount NUMERIC, week_id INTEGER, week_start DATE, week_end DATE,
  rank INTEGER, total_score INTEGER, claimed BOOLEAN,
  claim_deadline TIMESTAMPTZ, signature TEXT, tx_hash TEXT,
  claimed_at TIMESTAMPTZ, is_expired BOOLEAN
) AS $
BEGIN
  RETURN QUERY
  SELECT r.id, r.fid, r.wallet_address, r.player_name, r.amount,
    r.week_id, r.week_start, r.week_end, r.rank, r.total_score,
    r.claimed, r.claim_deadline, r.signature, r.tx_hash, r.claimed_at,
    (NOW() > r.claim_deadline) as is_expired
  FROM public.user_rewards r WHERE r.fid = p_fid ORDER BY r.week_id DESC;
END;
$ LANGUAGE plpgsql;

-- Function to mark reward as claimed
CREATE OR REPLACE FUNCTION public.claim_reward(p_reward_id UUID, p_tx_hash TEXT)
RETURNS BOOLEAN AS $
DECLARE v_claimed BOOLEAN; v_deadline TIMESTAMPTZ;
BEGIN
  SELECT claimed, claim_deadline INTO v_claimed, v_deadline
  FROM public.user_rewards WHERE id = p_reward_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reward not found'; END IF;
  IF v_claimed THEN RAISE EXCEPTION 'Reward already claimed'; END IF;
  IF NOW() > v_deadline THEN RAISE EXCEPTION 'Claim deadline has passed'; END IF;
  UPDATE public.user_rewards SET claimed = true, tx_hash = p_tx_hash,
    claimed_at = NOW(), updated_at = NOW() WHERE id = p_reward_id;
  RETURN true;
END;
$ LANGUAGE plpgsql;

GRANT SELECT, INSERT, UPDATE ON public.user_rewards TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_rewards TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_reward TO anon, authenticated;

-- ============================================
-- CRON JOB (requires pg_cron extension)
-- ============================================
-- Schedule weekly cleanup every Monday at 00:00 UTC
-- SELECT cron.schedule('weekly-leaderboard-cleanup', '0 0 * * 1', $SELECT public.cleanup_weekly_scores()$);
-- 
-- To view scheduled jobs: SELECT * FROM cron.job;
-- To unschedule: SELECT cron.unschedule('weekly-leaderboard-cleanup');
