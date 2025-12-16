-- Add pfp_url column to scores table
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS pfp_url TEXT;

-- Update insert_score function to include pfp_url
DROP FUNCTION IF EXISTS public.insert_score(TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.insert_score(
  p_player_name TEXT DEFAULT NULL,
  p_identity TEXT DEFAULT NULL,
  p_score_value INTEGER DEFAULT 0,
  p_rounds INTEGER DEFAULT 1,
  p_average_distance INTEGER DEFAULT 0,
  p_fid INTEGER DEFAULT NULL,
  p_pfp_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
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
$$ LANGUAGE plpgsql;

-- Drop existing views
DROP VIEW IF EXISTS public.leaderboard_weekly;
DROP VIEW IF EXISTS public.leaderboard_daily;

-- Create view for daily leaderboard
CREATE VIEW public.leaderboard_daily
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
  s.pfp_url as p_pfp_url,
  ROW_NUMBER() OVER (ORDER BY s.score_value DESC) as rank
FROM public.scores s
WHERE s.created_at >= CURRENT_DATE
  AND s.created_at < CURRENT_DATE + interval '1 day'
ORDER BY s.score_value DESC;

-- Create view for weekly leaderboard with pfp_url
CREATE VIEW public.leaderboard_weekly
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
  s.pfp_url as p_pfp_url,
  ROW_NUMBER() OVER (ORDER BY s.score_value DESC) as rank
FROM public.scores s
WHERE s.created_at >= date_trunc('week', CURRENT_DATE)
  AND s.created_at < date_trunc('week', CURRENT_DATE) + interval '7 days'
ORDER BY s.score_value DESC;

GRANT SELECT ON public.leaderboard_daily TO anon, authenticated;
GRANT SELECT ON public.leaderboard_weekly TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.insert_score TO anon, authenticated;
