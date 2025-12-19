-- Migration: Add game_session_hash to prevent double claim
-- Created: 2024-12-19

-- Add game_session_hash column to scores table
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS game_session_hash TEXT;

-- Create unique index to prevent duplicate claims
CREATE UNIQUE INDEX IF NOT EXISTS idx_scores_game_session_hash 
ON public.scores(game_session_hash) 
WHERE game_session_hash IS NOT NULL;

-- Drop existing insert_score function
DROP FUNCTION IF EXISTS public.insert_score(TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, TEXT);

-- Create updated insert_score function with game_session_hash
CREATE OR REPLACE FUNCTION public.insert_score(
  p_player_name TEXT DEFAULT NULL,
  p_identity TEXT DEFAULT NULL,
  p_score_value INTEGER DEFAULT 0,
  p_rounds INTEGER DEFAULT 1,
  p_average_distance INTEGER DEFAULT 0,
  p_fid INTEGER DEFAULT NULL,
  p_pfp_url TEXT DEFAULT NULL,
  p_game_session_hash TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_score_id UUID;
  existing_id UUID;
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

  -- Check for duplicate game session (prevent double claim)
  IF p_game_session_hash IS NOT NULL THEN
    SELECT id INTO existing_id 
    FROM public.scores 
    WHERE game_session_hash = p_game_session_hash;
    
    IF existing_id IS NOT NULL THEN
      RAISE EXCEPTION 'Game session already claimed';
    END IF;
  END IF;
  
  -- Insert the score
  INSERT INTO public.scores (
    player_name, identity, score_value, rounds, average_distance, fid, pfp_url, game_session_hash
  ) VALUES (
    p_player_name, p_identity, p_score_value, p_rounds, p_average_distance, p_fid, p_pfp_url, p_game_session_hash
  ) RETURNING id INTO new_score_id;
  
  RETURN new_score_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.insert_score TO anon, authenticated;
