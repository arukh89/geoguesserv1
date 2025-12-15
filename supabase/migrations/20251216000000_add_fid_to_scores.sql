-- Add FID column to scores table for Farcaster user identification
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS fid INTEGER;

-- Create index for FID lookups
CREATE INDEX IF NOT EXISTS idx_scores_fid ON public.scores(fid);

-- Update insert_score function to accept FID parameter
CREATE OR REPLACE FUNCTION public.insert_score(
  p_player_name TEXT DEFAULT NULL,
  p_identity TEXT DEFAULT NULL,
  p_score_value INTEGER,
  p_rounds INTEGER,
  p_average_distance INTEGER,
  p_fid INTEGER DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_score_id UUID;
BEGIN
  -- Validate input
  IF p_score_value < 0 THEN
    RAISE EXCEPTION 'Score cannot be negative';
  END IF;
  
  IF p_rounds <= 0 THEN
    RAISE EXCEPTION 'Rounds must be positive';
  END IF;
  
  IF p_average_distance < 0 THEN
    RAISE EXCEPTION 'Average distance cannot be negative';
  END IF;
  
  -- Insert the score with FID
  INSERT INTO public.scores (
    player_name,
    identity,
    score_value,
    rounds,
    average_distance,
    fid
  ) VALUES (
    p_player_name,
    p_identity,
    p_score_value,
    p_rounds,
    p_average_distance,
    p_fid
  ) RETURNING id INTO new_score_id;
  
  RETURN new_score_id;
END;
$$ LANGUAGE plpgsql;

-- Create view for weekly leaderboard with FID
CREATE OR REPLACE VIEW public.leaderboard_weekly AS
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

-- Update get_top_leaderboard function to include FID
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
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.player_name,
    s.identity,
    s.score_value,
    s.rounds,
    s.average_distance,
    s.created_at,
    ROW_NUMBER() OVER (ORDER BY s.score_value DESC) as global_rank,
    s.fid
  FROM public.scores s
  WHERE s.score_value > 0
  ORDER BY s.score_value DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON public.leaderboard_weekly TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.insert_score TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_leaderboard TO anon, authenticated;
