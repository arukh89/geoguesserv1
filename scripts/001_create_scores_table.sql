-- Create scores table for geoguesser leaderboard
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT NOT NULL,
  score_value INTEGER NOT NULL,
  rounds INTEGER NOT NULL,
  average_distance INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_scores_score_value ON public.scores(score_value DESC);
CREATE INDEX IF NOT EXISTS idx_scores_created_at ON public.scores(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read scores (public leaderboard)
CREATE POLICY "Allow public read access to scores"
  ON public.scores
  FOR SELECT
  USING (true);

-- Allow anyone to insert scores (anonymous game submissions)
CREATE POLICY "Allow public insert access to scores"
  ON public.scores
  FOR INSERT
  WITH CHECK (true);
