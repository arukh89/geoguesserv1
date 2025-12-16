-- Supabase schema for geoguesserv1
-- Project ref: izfjddrrcrefvaujkiql
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
  identity TEXT, -- wallet address or username
  score_value INTEGER NOT NULL,
  rounds INTEGER,
  average_distance INTEGER,
  fid INTEGER -- Farcaster user ID
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

-- Insert score function with FID parameter
CREATE OR REPLACE FUNCTION public.insert_score(
  p_player_name TEXT DEFAULT NULL,
  p_identity TEXT DEFAULT NULL,
  p_score_value INTEGER DEFAULT 0,
  p_rounds INTEGER DEFAULT 1,
  p_average_distance INTEGER DEFAULT 0,
  p_fid INTEGER DEFAULT NULL
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
    player_name, identity, score_value, rounds, average_distance, fid
  ) VALUES (
    p_player_name, p_identity, p_score_value, p_rounds, p_average_distance, p_fid
  ) RETURNING id INTO new_score_id;
  
  RETURN new_score_id;
END;
$ LANGUAGE plpgsql;

-- Get top leaderboard function with FID
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
  fid INTEGER
) AS $
BEGIN
  RETURN QUERY
  SELECT
    s.id, s.player_name, s.identity, s.score_value, s.rounds,
    s.average_distance, s.created_at,
    ROW_NUMBER() OVER (ORDER BY s.score_value DESC) as global_rank,
    s.fid
  FROM public.scores s
  WHERE s.score_value > 0
  ORDER BY s.score_value DESC
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

-- Weekly leaderboard view with FID
CREATE OR REPLACE VIEW public.leaderboard_weekly
WITH (security_invoker = true)
AS
SELECT 
  s.id,
  s.player_name as p_player_name,
  s.identity as p_player_username,
  s.score_value as p_score_value,
  s.rounds as p_rounds,
  s.average_distance as p_avg_distance,
  s.created_at::date as p_last_submit_date,
  s.fid as p_fid,
  ROW_NUMBER() OVER (ORDER BY s.score_value DESC) as rank
FROM public.scores s
WHERE s.created_at >= date_trunc('week', CURRENT_DATE)
  AND s.created_at < date_trunc('week', CURRENT_DATE) + interval '7 days'
ORDER BY s.score_value DESC;

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

GRANT SELECT ON public.leaderboard_weekly TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.insert_score TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_leaderboard TO anon, authenticated;

-- ============================================
-- CRON JOB (requires pg_cron extension)
-- ============================================
-- Schedule weekly cleanup every Monday at 00:00 UTC
-- SELECT cron.schedule('weekly-leaderboard-cleanup', '0 0 * * 1', $SELECT public.cleanup_weekly_scores()$);
-- 
-- To view scheduled jobs: SELECT * FROM cron.job;
-- To unschedule: SELECT cron.unschedule('weekly-leaderboard-cleanup');
