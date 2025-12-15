# Database Schema for GeoGuessr Game

## Overview
This document describes the database schema for the GeoGuessr game project, including all tables, indexes, policies, and functions needed for the application to function properly.

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

**Indexes:**
- `idx_scores_created_at` - For querying scores by date
- `idx_scores_score_value` - For ordering scores by value (leaderboard)
- `idx_scores_identity` - For filtering by player identity

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
- `idx_admin_rewards_tx_hash` - For transaction lookup

**Usage in Code:**
- `src/components/game/WeeklyLeaderboard.tsx` - Checks if rewards were sent
- `src/components/admin/AdminPanel.tsx` - Inserts new reward records

## Functions

### get_weekly_leaderboard(week_start_date date)
Returns the leaderboard for a specific week with rankings.

**Parameters:**
- `week_start_date` (optional) - Start date of the week (defaults to current week)

**Returns:**
Table with columns: id, identity, score_value, weekly_rank, week_start, week_end

## Views

### weekly_top_10
A view that returns the top 10 players for the current week.

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
1. `scripts/001_create_scores_table.sql` - Basic scores table (legacy)
2. `supabase/migrations/20251214194736_init_scores_admin_rewards.sql` - Scores and admin_rewards tables
3. `supabase/migrations/20251215052900_create_complete_schema.sql` - Complete schema with functions and views

### Recommended Migration Order:
1. Run `20251215052900_create_complete_schema.sql` for new installations
2. This script is idempotent and can be run on existing installations

## Data Flow

1. **Game Completion**: When a player finishes a game, `FinalResults.tsx` inserts a new score
2. **Leaderboard Display**: `Leaderboard.tsx` queries the top 10 scores of all time
3. **Weekly Competition**: `WeeklyLeaderboard.tsx` calculates weekly rankings
4. **Reward Distribution**: `AdminPanel.tsx` allows admins to send tokens to winners
5. **Reward Tracking**: Rewards are recorded in `admin_rewards` table

## Notes

- The `identity` field in `scores` table is used to connect scores to wallet addresses
- Anonymous players have `player_name` as "You" and `identity` as null
- Weekly competitions run from Sunday to Saturday
- All timestamps are stored in UTC using `timestamptz`
- The schema supports both anonymous and identified players