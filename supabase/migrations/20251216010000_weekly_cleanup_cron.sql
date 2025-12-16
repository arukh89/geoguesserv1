-- Weekly Leaderboard Cleanup Cron Job
-- This migration enables pg_cron and schedules automatic cleanup of old scores

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create function to delete old weekly scores
CREATE OR REPLACE FUNCTION public.cleanup_weekly_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  week_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate the start of the current week (Monday UTC 0)
  week_start := date_trunc('week', NOW() AT TIME ZONE 'UTC');
  
  -- Delete scores older than the current week
  DELETE FROM public.scores
  WHERE created_at < week_start;
  
  RAISE NOTICE 'Cleaned up scores older than %', week_start;
END;
$$;

-- Schedule the cleanup job to run every Monday at 00:00 UTC
-- Cron expression: minute hour day month day_of_week
-- '0 0 * * 1' = At 00:00 on Monday
SELECT cron.schedule(
  'weekly-leaderboard-cleanup',
  '0 0 * * 1',
  $$SELECT public.cleanup_weekly_scores()$$
);

-- To manually run the cleanup (for testing):
-- SELECT public.cleanup_weekly_scores();

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule the job:
-- SELECT cron.unschedule('weekly-leaderboard-cleanup');
