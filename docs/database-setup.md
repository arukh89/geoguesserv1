# Database Setup Guide for GeoGuessr Game

## Prerequisites
- Supabase project created
- Supabase CLI installed and configured
- Access to run SQL commands on Supabase

## Setup Instructions

### 1. Install and Configure Supabase CLI

If you haven't already:
```bash
npm install -g supabase
supabase login
```

Link to your project:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### 2. Run Migration Script

The migration script `20251215052900_create_complete_schema.sql` creates all necessary tables, indexes, policies, and functions.

**Option A: Using Supabase CLI**
```bash
cd path/to/geoguesserv1
supabase db push
```

**Option B: Using Supabase Dashboard**
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the content from `supabase/migrations/20251215052900_create_complete_schema.sql`
4. Run the SQL script

### 3. Verify Setup

After running the migration, verify that all objects were created:

**Check Tables:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';
```
Expected: `scores`, `admin_rewards`

**Check Functions:**
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public';
```
Expected: `get_weekly_leaderboard`

**Check Views:**
```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';
```
Expected: `weekly_top_10`

**Check RLS Policies:**
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public';
```

### 4. Test the Database

Insert a test score:
```sql
INSERT INTO public.scores (player_name, identity, score_value, rounds, average_distance)
VALUES ('Test Player', '0x1234567890abcdef1234567890abcdef12345678', 15000, 5, 250);
```

Query the leaderboard:
```sql
SELECT * FROM public.scores 
ORDER BY score_value DESC 
LIMIT 10;
```

Test the weekly function:
```sql
SELECT * FROM public.get_weekly_leaderboard();
```

### 5. Configure Environment Variables

Make sure your application has the correct Supabase configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Migration Scripts Overview

### Available Scripts:
1. `scripts/001_create_scores_table.sql` - Legacy scores table
2. `supabase/migrations/20251214194736_init_scores_admin_rewards.sql` - Initial tables
3. `supabase/migrations/20251215052900_create_complete_schema.sql` - **RECOMMENDED** - Complete schema

### What the Complete Schema Includes:
- **Tables**: `scores`, `admin_rewards`
- **Indexes**: Optimized for leaderboard queries
- **RLS Policies**: Public read/insert access
- **Functions**: `get_weekly_leaderboard()` for weekly rankings
- **Views**: `weekly_top_10` for quick weekly leaderboard access
- **Realtime**: Enabled for live updates
- **Permissions**: Proper grants for anon and authenticated users

## Common Issues and Solutions

### Issue: Migration fails with "duplicate_object" error
**Solution**: The script uses `IF NOT EXISTS` and `DO $$ BEGIN...EXCEPTION...END $$` blocks to handle existing objects, so this should not occur. If it does, check for conflicting object names.

### Issue: Realtime not working
**Solution**: Ensure the publication includes the tables:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.scores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_rewards;
```

### Issue: RLS policies too restrictive
**Solution**: The current policies allow public access. If you need to restrict access, modify the policies:
```sql
DROP POLICY IF EXISTS scores_select_public ON public.scores;
CREATE POLICY scores_select_authenticated ON public.scores FOR SELECT USING (auth.role() = 'authenticated');
```

## Maintenance

### Regular Tasks:
1. **Monitor table sizes**:
   ```sql
   SELECT 
     schemaname,
     tablename,
     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

2. **Clean old scores** (optional):
   ```sql
   DELETE FROM public.scores 
   WHERE created_at < NOW() - INTERVAL '1 year';
   ```

3. **Backup before major changes**:
   ```bash
   supabase db dump > backup.sql
   ```

## Production Considerations

1. **Index Performance**: The current indexes are optimized for leaderboard queries. Monitor query performance and add indexes as needed.

2. **RLS Security**: For production, consider more restrictive RLS policies based on your security requirements.

3. **Data Retention**: Implement a data retention policy if needed to manage database size.

4. **Monitoring**: Set up alerts for database performance and error rates.

## Support

If you encounter issues:
1. Check the Supabase logs
2. Review the migration script for syntax errors
3. Verify that all prerequisites are met
4. Consult the full schema documentation at `docs/database-schema.md`