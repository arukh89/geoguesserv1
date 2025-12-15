# Panduan Environment Variables untuk Project GeoGuesser

Dokumen ini menjelaskan cara mendapatkan dan mengkonfigurasi semua environment variables yang diperlukan untuk project GeoGuesser.

## Daftar Environment Variables

### 1. Supabase Configuration

#### Public Keys (Client-side)
- `NEXT_PUBLIC_SUPABASE_URL`: URL project Supabase Anda
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anonymous key untuk akses client-side

#### Server-side Keys
- `SUPABASE_URL`: URL project Supabase (server-side)
- `SUPABASE_ANON_KEY`: Anonymous key (server-side)
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key untuk akses penuh
- `SUPABASE_SECRET_KEY`: Secret key untuk autentikasi
- `SUPABASE_JWT_SECRET`: JWT secret untuk token validation

#### Database Connection Strings
- `POSTGRES_URL`: Connection string dengan pooling
- `POSTGRES_PRISMA_URL`: Connection string untuk Prisma
- `POSTGRES_URL_NON_POOLING`: Direct connection string
- `POSTGRES_USER`: Database username (biasanya "postgres")
- `POSTGRES_PASSWORD`: Database password
- `POSTGRES_HOST`: Database host
- `POSTGRES_DATABASE`: Database name (biasanya "postgres")

### 2. Mapillary API Configuration

- `MAPILLARY_SERVER_TOKEN`: Server token untuk API calls
- `NEXT_PUBLIC_MAPILLARY_TOKEN`: Client token untuk browser
- `MAPILLARY_CLIENT_SECRET`: Client secret untuk autentikasi

### 3. Farcaster & Neynar API

- `FARCASTER_API_KEY`: API key untuk Farcaster
- `NEYNAR_API_KEY`: API key untuk Neynar

### 4. Web3 / Blockchain Configuration

- `NEXT_PUBLIC_MOONSHOT_CONTRACT_ADDRESS`: Contract address di Base mainnet

### 5. Application Configuration

- `NEXT_PUBLIC_BASE_URL`: Base URL aplikasi Anda

## Cara Mendapatkan API Keys

### Supabase API Keys

1. **Login ke Dashboard Supabase**
   - Kunjungi [https://app.supabase.com](https://app.supabase.com)
   - Login dengan akun Anda

2. **Pilih Project**
   - Pilih project yang ingin Anda gunakan
   - Jika belum ada, create new project

3. **Dapatkan API Keys**
   - Go to Settings → API
   - Anda akan menemukan:
     - **Project URL**: `https://your-project-id.supabase.co`
     - **anon public**: Public key untuk client-side
     - **service_role**: Service role key (RAHASIA - hanya server-side)

4. **Dapatkan JWT Secret**
   - Di halaman API yang sama, scroll ke bawah
   - Anda akan menemukan **JWT Secret**
   - Copy dan simpan dengan aman

5. **Database Credentials**
   - Go to Settings → Database
   - Scroll ke "Connection string"
   - Pilih "URI" atau "Connection pooling"
   - Anda akan mendapatkan connection string lengkap
   - Format: `postgres://postgres:[password]@db.[project-id].supabase.co:5432/postgres`

6. **Database Password**
   - Go to Settings → Database
   - Scroll ke "Database password"
   - Klik "Reset database password" jika lupa

### Mapillary API Keys

1. **Buat Akun Developer**
   - Kunjungi [https://www.mapillary.com/developer](https://www.mapillary.com/developer)
   - Login atau buat akun baru

2. **Create Application**
   - Klik "Create application" atau "Register new app"
   - Isi form:
     - Application name: "GeoGuesser"
     - Description: "Geolocation guessing game"
     - Website: URL aplikasi Anda

3. **Dapatkan Credentials**
   - Setelah approval, Anda akan mendapatkan:
     - **Client ID**: Format numeric (sudah hardcoded di `src/lib/mapillary.config.ts`)
     - **Access Token**: Untuk server-side (`MAPILLARY_SERVER_TOKEN`)
     - **Client Token**: Untuk client-side (`NEXT_PUBLIC_MAPILLARY_TOKEN`)

4. **Generate Client Secret**
   - Di dashboard Mapillary, cari opsi untuk generate client secret
   - Gunakan untuk `MAPILLARY_CLIENT_SECRET`

### Farcaster API Key

1. **Login ke Farcaster Developer**
   - Kunjungi [Farcaster Developer Portal](https://docs.farcaster.xyz/learn/getting-started)
   - Login dengan akun Farcaster Anda

2. **Create Application**
   - Buat aplikasi baru di developer portal
   - Set permissions yang diperlukan

3. **Dapatkan API Key**
   - Anda akan mendapatkan API key dengan format:
     - `wc_secret_[long_string]`

### Neynar API Key

1. **Sign Up ke Neynar**
   - Kunjungi [https://docs.neynar.com/](https://docs.neynar.com/)
   - Sign up untuk developer account

2. **Get API Key**
   - Login ke dashboard Neynar
   - Create new application
   - Anda akan mendapatkan API key dengan format alphanumeric

### Web3 Contract Address

Untuk Moonshot contract:
- Contract address sudah diketahui: `0x9d7ff2e9ba89502776248acd6cbcb6734049fb07`
- Ini adalah address di Base mainnet

## Konfigurasi di Development

1. **Copy .env.example**
   ```bash
   cp .env.example .env.local
   ```

2. **Isi dengan nilai aktual**
   - Buka `.env.local`
   - Ganti placeholder dengan nilai yang Anda dapatkan

3. **Restart Development Server**
   ```bash
   npm run dev
   # atau
   pnpm dev
   ```

## Konfigurasi di Vercel (Production)

1. **Go to Vercel Dashboard**
   - Buka project Anda di Vercel
   - Go to Settings → Environment Variables

2. **Add Environment Variables**
   - Gunakan template dari `vercel.env.template`
   - Add each variable dengan nilai aktual:
     - **Production**: Untuk production deployment
     - **Preview**: Untuk preview deployments
     - **Development**: Untuk local development

3. **Special Cases**
   - Supabase integration bisa otomatis:
     - Go to Integrations → Supabase
     - Connect project Supabase Anda
     - Vercel akan otomatis menambahkan database variables

4. **Redeploy**
   - Setelah menambah environment variables
   - Redeploy project untuk apply changes

## Security Best Practices

### ✅ Do:
- Simpan API keys yang sensitif di server-side only
- Gunakan environment variables untuk semua credentials
- Rotate API keys secara berkala
- Gunakan different keys untuk development dan production

### ❌ Don't:
- Commit API keys ke version control
- Expose service role keys di client-side
- Gunakan production keys di development
- Share API keys di public repositories

## Troubleshooting

### Common Issues

1. **Missing Supabase Variables**
   - Error: "Missing Supabase environment variables"
   - Solution: Pastikan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` ter-set

2. **Mapillary Token Invalid**
   - Error: "Missing Mapillary token"
   - Solution: Check `MAPILLARY_SERVER_TOKEN` di environment variables

3. **Database Connection Failed**
   - Error: "Connection refused"
   - Solution: Verifikasi database URL dan password di POSTGRES_ variables

4. **Farcaster API Not Working**
   - Error: "Unauthorized"
   - Solution: Check `FARCASTER_API_KEY` format dan validity

### Testing Environment Variables

Untuk testing environment variables di development:

```bash
# Print semua environment variables
printenv | grep -E "(SUPABASE|MAPILLARY|FARCASTER|NEYNAR)"

# Test database connection
psql $POSTGRES_URL -c "SELECT version();"
```

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Mapillary Developer Documentation](https://www.mapillary.com/developer)
- [Farcaster Documentation](https://docs.farcaster.xyz/)
- [Neynar Documentation](https://docs.neynar.com/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)