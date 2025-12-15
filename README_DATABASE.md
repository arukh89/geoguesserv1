# Database Setup Summary for GeoGuessr Game

## 📋 Daftar Tabel yang Diperlukan

Project GeoGuessr ini memerlukan 2 tabel utama:

### 1. **scores**
- **Fungsi**: Menyimpan skor pemain untuk leaderboard
- **Kolom utama**: id, player_name, identity, score_value, rounds, average_distance, created_at
- **Penggunaan**: FinalResults.tsx, Leaderboard.tsx, WeeklyLeaderboard.tsx, AdminPanel.tsx

### 2. **admin_rewards** 
- **Fungsi**: Mencatat pembayaran token kepada pemenang mingguan
- **Kolom utama**: id, admin_fid, admin_wallet, recipient_wallet, amount, week_start, week_end, tx_hash
- **Penggunaan**: WeeklyLeaderboard.tsx, AdminPanel.tsx

## 📁 File SQL yang Tersedia

### Migration Scripts:
1. **`supabase/migrations/20251215052900_create_complete_schema.sql`** ⭐ **RECOMMENDED**
   - Schema lengkap dengan tabel, index, RLS policies, fungsi, dan views
   - Idempotent - bisa dijalankan berulang kali
   - Include: 
     - Tabel: scores, admin_rewards
     - Index yang dioptimalkan
     - Row Level Security policies
     - Fungsi: get_weekly_leaderboard()
     - View: weekly_top_10
     - Supabase Realtime enabled

2. **`scripts/001_create_scores_table.sql`** (Legacy)
   - Hanya tabel scores dasar
   - Untuk backward compatibility

3. **`supabase/migrations/20251214194736_init_scores_admin_rewards.sql`**
   - Tabel scores dan admin_rewards
   - Kurang lengkap dibandingkan versi baru

## 🚀 Cara Menjalankan

### Untuk Project Baru:
Gunakan script `20251215052900_create_complete_schema.sql`

```bash
# Via Supabase CLI
cd geoguesserv1
supabase link --project-ref YOUR_PROJECT_REF
supabase db push

# Atau via Dashboard:
# 1. Buka Supabase Dashboard
# 2. SQL Editor
# 3. Copy paste isi file 20251215052900_create_complete_schema.sql
# 4. Run
```

### Untuk Project Existing:
Script sudah idempotent, aman dijalankan ulang untuk update schema.

## ✅ Verifikasi Setup

Setelah menjalankan migration, pastikan:

```sql
-- Cek tabel
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Cek fungsi
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';

-- Cek view
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public';
```

Expected result:
- Tables: scores, admin_rewards
- Function: get_weekly_leaderboard
- View: weekly_top_10

## 📖 Dokumentasi Lengkap

- **Schema Detail**: [`docs/database-schema.md`](docs/database-schema.md)
- **Setup Guide**: [`docs/database-setup.md`](docs/database-setup.md)

## 🔧 Fitur yang Tersedia

1. **Live Leaderboard** - Real-time updates dengan Supabase Realtime
2. **Weekly Competition** - Perhitungan ranking mingguan otomatis
3. **Token Rewards** - Tracking pembayaran MOONSHOT token
4. **Optimized Queries** - Index untuk performa leaderboard

## 📝 Langkah Setup Project Baru

1. **Buat Supabase Project**
   ```bash
   # Di Supabase Dashboard: Create new project
   # Catat project URL dan anon key
   ```

2. **Configure Environment**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Run Migration**
   ```bash
   supabase db push
   ```

4. **Test Application**
   - Mainkan game
   - Cek leaderboard ter-update
   - Test admin panel untuk rewards

## 🚨 Catatan Penting

- Semua timestamp menggunakan UTC (timestamptz)
- RLS policies mengizinkan public access (sesuai kebutuhan game)
- Realtime enabled untuk live updates
- Script idempotent - aman dijalankan berulang kali

## ✨ Status: SIAP DIGUNAKAN

Semua SQL script sudah siap dan diuji untuk project Supabase baru:
- ✅ Tabel lengkap dengan struktur yang optimal
- ✅ Index untuk performa query
- ✅ RLS policies yang sesuai
- ✅ Fungsi dan view untuk weekly leaderboard
- ✅ Supabase Realtime enabled
- ✅ Idempotent migration script

**Gunakan `20251215052900_create_complete_schema.sql` untuk setup database project baru.**