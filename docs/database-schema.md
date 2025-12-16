# Database Schema for GeoGuessr Game

## Overview
This document describes the database schema for the GeoGuessr game project, including all tables, indexes, policies, functions, and scheduled jobs.

## Tables

### 1. scores
Stores player scores for the leaderboard system.

**Columns:**
- `id` (uuid, primary key) - Unique identifier for each score record
- `created_at` (timestamptz) - Timestamp when the score was recorded
- `player_name` (text) - Name of the player (can be "You" for anonymous players)
- `identity` (text) - Wallet address or username for identified players
- `score_value` (integer) - The total score achieved
- `rounds` (integer) - Number of rounds played
- `average_distance` (integer) - Average distance from correct locations in kilometers
- `fid` (integer) - Farcaster user ID for identified players

**Indexes:**
- `idx_scores_created_at` - For querying scores by date
- `idx_scores_score_value` - For ordering scores by value (leaderboard)
- `idx_scores_fid` - For filtering by Farcaster ID

**Usage in Code:**
- `src/components/game/FinalResults.tsx` - Inserts new scores
- `src/components/game/Leaderboard.tsx` - Displays top 10 scores
- `src/components/game/WeeklyLeaderboard.tsx` - Calculates weekly rankings
- `src/components/admin/AdminPanel.tsx` - Admin uses for weekly rewards

### 2. admin_rewards
Records token payouts to weekly winners.

**Columns:**
- `id` (uuid, primary key) - Unique identifier for each reward record
- `created_at` (timestamptz) - Timestamp when the reward was recorded
- `admin_fid` (integer) - Farcaster ID of the admin who sent the reward
- `admin_wallet` (text) - Wallet address of the admin
- `recipient_wallet` (text) - Wallet address of the reward recipient
- `recipient_name` (text) - Name/identity of the recipient
- `amount` (numeric(20,8)) - Amount of tokens sent
- `week_start` (date) - Start date of the competition week
- `week_end` (date) - End date of the competition week
- `tx_hash` (text) - Blockchain transaction hash

**Indexes:**
- `idx_admin_rewards_week_start` - For filtering by competition week
- `idx_admin_rewards_recipient_wallet` - For tracking rewards to specific users

## Functions

### insert_score()
Inserts a new score with validation.

**Parameters:**
- `p_player_name` (text) - Player display name
- `p_identity` (text) - Wallet address or username
- `p_score_value` (integer) - Score achieved
- `p_rounds` (integer) - Number of rounds
- `p_average_distance` (integer) - Average distance in km
- `p_fid` (integer) - Farcaster user ID

**Returns:** UUID of the new score record

### get_top_leaderboard(limit_count)
Returns the top scores with global ranking.

**Parameters:**
- `limit_count` (integer, default 10) - Number of results to return

**Returns:** Table with id, player_name, identity, score_value, rounds, average_distance, created_at, global_rank, fid

### cleanup_weekly_scores()
Deletes scores older than the current week. Used by the weekly cron job.

## Views

### leaderboard_weekly
A view that returns all players for the current week with rankings.

**Columns:**
- `id` - Score ID
- `p_player_name` - Player name
- `p_player_username` - Player identity/username
- `p_score_value` - Score achieved
- `p_rounds` - Number of rounds
- `p_avg_distance` - Average distance
- `p_last_submit_date` - Date of submission
- `p_fid` - Farcaster ID
- `rank` - Weekly ranking position

## Scheduled Jobs (pg_cron)

### weekly-leaderboard-cleanup
Runs every Monday at 00:00 UTC to delete scores from previous weeks.

**Schedule:** `0 0 * * 1` (Every Monday at midnight UTC)
**Action:** Calls `cleanup_weekly_scores()` function

**Management Commands:**
```sql
-- View scheduled jobs
SELECT * FROM cron.job;

-- Manually run cleanup
SELECT public.cleanup_weekly_scores();

-- Unschedule the job
SELECT cron.unschedule('weekly-leaderboard-cleanup');
```

## Row Level Security (RLS)

Both tables have RLS enabled with the following policies:

**scores table:**
- `scores_select_public` - Anyone can read scores
- `scores_insert_public` - Anyone can insert scores

**admin_rewards table:**
- `admin_rewards_select_public` - Anyone can read reward records
- `admin_rewards_insert_public` - Anyone can insert reward records

## Realtime

Both tables are enabled for Supabase Realtime, allowing:
- Live leaderboard updates when new scores are added
- Real-time notification when rewards are distributed

## Migration Scripts

### Current Migrations:
1. `20251214194736_init_scores_admin_rewards.sql` - Initial scores and admin_rewards tables
2. `20251215052900_create_complete_schema.sql` - Complete schema with functions and views
3. `20251216000000_add_fid_to_scores.sql` - Added FID column and updated functions
4. `20251216010000_weekly_cleanup_cron.sql` - Weekly cleanup cron job

## Data Flow

1. **Game Completion**: When a player finishes a game, `FinalResults.tsx` inserts a new score with FID
2. **Leaderboard Display**: `Leaderboard.tsx` queries the top 10 scores showing username + FID
3. **Weekly Competition**: `WeeklyLeaderboard.tsx` shows weekly rankings with username + FID badge
4. **Reward Distribution**: `AdminPanel.tsx` allows admins to send tokens to winners
5. **Weekly Reset**: Every Monday at 00:00 UTC, old scores are automatically deleted

## Notes

- The `fid` field stores Farcaster user ID for social identity
- The `identity` field stores wallet address or username
- Anonymous players have `player_name` as "You" and `identity`/`fid` as null
- Weekly competitions reset every Monday at 00:00 UTC
- All timestamps are stored in UTC using `timestamptz`
