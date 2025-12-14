-- Supabase schema for geoguesserv1
-- Project ref: izfjddrrcrefvaujkiql

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

-- Helpful indexes
create index if not exists idx_scores_created_at on public.scores(created_at desc);
create index if not exists idx_scores_score_value on public.scores(score_value desc);

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

create index if not exists idx_admin_rewards_week_start on public.admin_rewards(week_start);
create index if not exists idx_admin_rewards_recipient_wallet on public.admin_rewards(recipient_wallet);

-- Turn on RLS
alter table public.scores enable row level security;
alter table public.admin_rewards enable row level security;

-- RLS policies: allow public read and inserts as used by the app UI
-- NOTE: If you want tighter controls later, restrict with auth and roles.
create policy if not exists scores_select_public on public.scores for select using (true);
create policy if not exists scores_insert_public on public.scores for insert with check (true);

create policy if not exists admin_rewards_select_public on public.admin_rewards for select using (true);
create policy if not exists admin_rewards_insert_public on public.admin_rewards for insert with check (true);-- Enable Realtime on these tables
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.scores;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_rewards;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
