-- Complete schema for GeoGuessr game project
-- This migration creates all necessary tables for the game to function properly

-- Enable required extensions (safe if already enabled)
create extension if not exists pgcrypto;

-- scores table: stores public leaderboard scores
create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  player_name text,
  identity text, -- wallet address or username
  score_value integer not null,
  rounds integer,
  average_distance integer
);

-- Helpful indexes for scores table
create index if not exists idx_scores_created_at on public.scores(created_at desc);
create index if not exists idx_scores_score_value on public.scores(score_value desc);
create index if not exists idx_scores_identity on public.scores(identity);

-- admin_rewards table: records token payouts to winners
create table if not exists public.admin_rewards (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  admin_fid integer,
  admin_wallet text,
  recipient_wallet text not null,
  recipient_name text,
  amount numeric(20,8) not null,
  week_start date not null,
  week_end date not null,
  tx_hash text
);

-- Indexes for admin_rewards table
create index if not exists idx_admin_rewards_week_start on public.admin_rewards(week_start);
create index if not exists idx_admin_rewards_recipient_wallet on public.admin_rewards(recipient_wallet);
create index if not exists idx_admin_rewards_tx_hash on public.admin_rewards(tx_hash);

-- Enable Row Level Security
alter table public.scores enable row level security;
alter table public.admin_rewards enable row level security;

-- RLS policies for scores table
create policy if not exists scores_select_public on public.scores for select using (true);
create policy if not exists scores_insert_public on public.scores for insert with check (true);

-- RLS policies for admin_rewards table
create policy if not exists admin_rewards_select_public on public.admin_rewards for select using (true);
create policy if not exists admin_rewards_insert_public on public.admin_rewards for insert with check (true);

-- Enable Realtime on these tables
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.scores;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_rewards;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create a function to get weekly leaderboard
CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard(week_start_date date default null)
RETURNS TABLE (
  id uuid,
  identity text,
  score_value integer,
  weekly_rank bigint,
  week_start date,
  week_end date
) AS $$
DECLARE
  start_date date;
  end_date date;
BEGIN
  -- If no date provided, use current week
  IF week_start_date IS NULL THEN
    start_date := date_trunc('week', CURRENT_DATE);
  ELSE
    start_date := week_start_date;
  END IF;
  
  end_date := start_date + interval '6 days';
  
  RETURN QUERY
  SELECT 
    s.id,
    s.identity,
    s.score_value,
    ROW_NUMBER() OVER (ORDER BY s.score_value DESC) as weekly_rank,
    start_date as week_start,
    end_date as week_end
  FROM public.scores s
  WHERE s.created_at >= start_date 
    AND s.created_at <= end_date + interval '23:59:59'
    AND s.identity IS NOT NULL
  ORDER BY s.score_value DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a view for weekly top 10 players
CREATE OR REPLACE VIEW public.weekly_top_10 AS
SELECT * FROM public.get_weekly_leaderboard()
LIMIT 10;

-- Grant usage permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.scores TO anon, authenticated;
GRANT ALL ON public.admin_rewards TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_leaderboard TO anon, authenticated;
GRANT SELECT ON public.weekly_top_10 TO anon, authenticated;

-- Additional database functions for GeoGuessr game

-- Function to insert score with validation
CREATE OR REPLACE FUNCTION public.insert_score(
  p_player_name TEXT DEFAULT NULL,
  p_identity TEXT DEFAULT NULL,
  p_score_value INTEGER,
  p_rounds INTEGER,
  p_average_distance INTEGER
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
  
  -- Insert the score
  INSERT INTO public.scores (
    player_name,
    identity,
    score_value,
    rounds,
    average_distance
  ) VALUES (
    p_player_name,
    p_identity,
    p_score_value,
    p_rounds,
    p_average_distance
  ) RETURNING id INTO new_score_id;
  
  RETURN new_score_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get top leaderboard (all-time)
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
  global_rank BIGINT
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
    ROW_NUMBER() OVER (ORDER BY s.score_value DESC) as global_rank
  FROM public.scores s
  WHERE s.score_value > 0
  ORDER BY s.score_value DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get weekly rewards for a specific week
CREATE OR REPLACE FUNCTION public.get_weekly_rewards(
  week_start_date DATE DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  recipient_wallet TEXT,
  recipient_name TEXT,
  amount NUMERIC(20,8),
  week_start DATE,
  week_end DATE,
  tx_hash TEXT,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  start_date DATE;
BEGIN
  -- If no date provided, use current week
  IF week_start_date IS NULL THEN
    start_date := date_trunc('week', CURRENT_DATE);
  ELSE
    start_date := week_start_date;
  END IF;
  
  RETURN QUERY
  SELECT
    ar.id,
    ar.recipient_wallet,
    ar.recipient_name,
    ar.amount,
    ar.week_start,
    ar.week_end,
    ar.tx_hash,
    ar.created_at
  FROM public.admin_rewards ar
  WHERE ar.week_start = start_date
  ORDER BY ar.amount DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to update or insert admin reward
CREATE OR REPLACE FUNCTION public.update_admin_reward(
  p_admin_fid INTEGER DEFAULT NULL,
  p_admin_wallet TEXT DEFAULT NULL,
  p_recipient_wallet TEXT,
  p_recipient_name TEXT DEFAULT NULL,
  p_amount NUMERIC(20,8),
  p_week_start DATE DEFAULT NULL,
  p_tx_hash TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  start_date DATE;
  end_date DATE;
  existing_reward_id UUID;
  new_reward_id UUID;
BEGIN
  -- If no week_start provided, use current week
  IF p_week_start IS NULL THEN
    start_date := date_trunc('week', CURRENT_DATE);
  ELSE
    start_date := p_week_start;
  END IF;
  
  end_date := start_date + interval '6 days';
  
  -- Check if reward already exists for this wallet and week
  SELECT id INTO existing_reward_id
  FROM public.admin_rewards
  WHERE recipient_wallet = p_recipient_wallet
    AND week_start = start_date;
  
  IF existing_reward_id IS NOT NULL THEN
    -- Update existing reward
    UPDATE public.admin_rewards SET
      admin_fid = p_admin_fid,
      admin_wallet = p_admin_wallet,
      recipient_name = p_recipient_name,
      amount = p_amount,
      week_end = end_date,
      tx_hash = p_tx_hash
    WHERE id = existing_reward_id;
    
    RETURN existing_reward_id;
  ELSE
    -- Insert new reward
    INSERT INTO public.admin_rewards (
      admin_fid,
      admin_wallet,
      recipient_wallet,
      recipient_name,
      amount,
      week_start,
      week_end,
      tx_hash
    ) VALUES (
      p_admin_fid,
      p_admin_wallet,
      p_recipient_wallet,
      p_recipient_name,
      p_amount,
      start_date,
      end_date,
      p_tx_hash
    ) RETURNING id INTO new_reward_id;
    
    RETURN new_reward_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION public.insert_score TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_leaderboard TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_rewards TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_admin_reward TO anon, authenticated;