# Konfigurasi Autentikasi untuk GeoGuesser v1

Dokumentasi ini menjelaskan konfigurasi autentikasi yang benar untuk aplikasi GeoGuesser v1, baik untuk Supabase maupun Farcaster Quick Auth.

## 1. Konfigurasi Supabase Auth

### 1.1 File Konfigurasi Lokal (supabase/config.toml)

Pastikan file `supabase/config.toml` memiliki konfigurasi berikut:

```toml
[auth]
enabled = true
site_url = "https://geoguesserv1.vercel.app"
additional_redirect_urls = [
  "https://geoguesserv1.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
]
```

**Penting:** 
- `site_url` harus menggunakan domain production: `https://geoguesserv1.vercel.app`
- `additional_redirect_urls` harus mencakup domain production dan URL lokal untuk development

### 1.2 Environment Variables

Pastikan environment variables berikut diatur dengan benar:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 2. Konfigurasi Farcaster Quick Auth

### 2.1 API Route (/api/auth/me)

File `src/app/api/auth/me/route.ts` harus dikonfigurasi dengan domain yang benar:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@farcaster/quick-auth";

const client = createClient();

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }
  const token = auth.slice(7);
  try {
    // Gunakan domain production untuk verifikasi
    const domain = process.env.NODE_ENV === "production" 
      ? "https://geoguesserv1.vercel.app" 
      : req.nextUrl.origin;
    
    const payload = await client.verifyJwt({ token, domain });
    return NextResponse.json({ fid: payload.sub });
  } catch (e) {
    console.error("JWT verification failed:", e);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
```

**Penting:**
- Domain yang digunakan untuk verifikasi JWT harus sesuai dengan environment:
  - Production: `https://geoguesserv1.vercel.app`
  - Development: `req.nextUrl.origin` (otomatis)

### 2.2 QuickAuth Hook

File `src/hooks/useQuickAuth.ts` menggunakan `@farcaster/miniapp-sdk` dan tidak memerlukan konfigurasi domain tambahan:

```typescript
"use client";

import { useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

export function useQuickAuth(isInFarcaster: boolean) {
  useEffect(() => {
    if (!isInFarcaster) return;
    let cancelled = false;
    (async () => {
      try {
        const { token } = await sdk.quickAuth.getToken();
        if (cancelled) return;
        await sdk.quickAuth.fetch("/api/auth/me");
      } catch (e) {
        console.error("QuickAuth failed", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isInFarcaster]);
}
```

## 3. Checklist Sebelum Deploy

### 3.1 Konfigurasi Supabase

- [ ] `site_url` di `supabase/config.toml` sudah diatur ke `https://geoguesserv1.vercel.app`
- [ ] `additional_redirect_urls` mencakup domain production
- [ ] Environment variables Supabase sudah diatur dengan benar
- [ ] Migrasi database sudah dijalankan

### 3.2 Konfigurasi Farcaster

- [ ] API route `/api/auth/me` menggunakan domain production yang benar
- [ ] JWT verification menggunakan domain yang sesuai dengan environment
- [ ] Error handling sudah diimplementasikan dengan baik

## 4. Troubleshooting

### 4.1 Error "Domain Not Matches"

Jika mengalami error "domain not matches", periksa:

1. **Supabase Config**: Pastikan `site_url` dan `additional_redirect_urls` sudah benar
2. **Farcaster JWT Verification**: Pastikan domain yang digunakan untuk verifikasi sama dengan domain saat token dibuat
3. **Environment Variables**: Pastikan `NODE_ENV` diatur dengan benar di production

### 4.2 Common Issues

- **Local Development**: Gunakan `http://localhost:3000` untuk development
- **Production**: Gunakan `https://geoguesserv1.vercel.app` untuk production
- **HTTPS vs HTTP**: Pastikan protocol (http/https) sesuai dengan environment

## 5. Best Practices

1. **Selalu gunakan environment variable** untuk konfigurasi yang berbeda antara development dan production
2. **Validasi domain** di kedua sisi (client dan server) untuk keamanan
3. **Error logging** yang baik untuk memudahkan troubleshooting
4. **Test di kedua environment** (development dan production) sebelum deploy
5. **Update konfigurasi** bersamaan saat mengubah domain deployment

## 6. Deployment Checklist

Sebelum deploy ke production:

- [ ] Update `supabase/config.toml` dengan domain production
- [ ] Pastikan environment variables production sudah diatur
- [ ] Test autentikasi di development environment
- [ ] Run `supabase db push` untuk menerapkan perubahan konfigurasi
- [ ] Verifikasi autentikasi berfungsi di production setelah deploy