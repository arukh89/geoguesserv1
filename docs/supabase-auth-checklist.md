# Checklist Setup Auth di Supabase Dashboard

Checklist ini digunakan untuk memastikan konfigurasi autentikasi di Supabase Dashboard sudah diatur dengan benar untuk aplikasi GeoGuesser v1.

## 1. Konfigurasi Umum

### 1.1 Site URL
- [ ] Login ke [Supabase Dashboard](https://app.supabase.com)
- [ ] Pilih project yang sesuai
- [ ] Navigasi ke **Authentication** → **Settings**
- [ ] **Site URL** diatur ke: `https://geoguesserv1.vercel.app`

### 1.2 Redirect URLs
- [ ] Di bagian **Redirect URLs**, tambahkan URL berikut:
  - [ ] `https://geoguesserv1.vercel.app/**`
  - [ ] `http://localhost:3000/**` (untuk development)
  - [ ] `http://127.0.0.1:3000/**` (untuk development)

**Catatan:** Gunakan wildcard (`/**`) untuk mengizinkan semua path di domain tersebut.

## 2. Konfigurasi OAuth Providers

### 2.1 Jika menggunakan OAuth providers (opsional)
- [ ] Untuk setiap provider yang digunakan (Google, GitHub, dll.):
  - [ ] Enable provider
  - [ ] Konfigurasikan Client ID dan Client Secret
  - [ ] Tambahkan redirect URL yang sesuai di provider dashboard
  - [ ] Test autentikasi dengan provider tersebut

## 3. Konfigurasi Email

### 3.1 Email Settings
- [ ] Navigasi ke **Authentication** → **Email**
- [ ] **Enable email confirmations** disesuaikan dengan kebutuhan:
  - [ ] Enable (untuk production)
  - [ ] Disable (untuk development/testing)
- [ ] **Enable email change confirmations** disesuaikan dengan kebutuhan
- [ ] **Secure password change** disesuaikan dengan kebutuhan

### 3.2 Email Template (opsional)
- [ ] Review dan sesuaikan email template sesuai kebutuhan:
  - [ ] Confirmation template
  - [ ] Recovery template
  - [ ] Email change template
  - [ ] Re-authentication template

## 4. Konfigurasi Security

### 4.1 Password Policy
- [ ] Navigasi ke **Authentication** → **Settings**
- [ ] **Minimum password length** diatur ke minimal 6 karakter (recommended 8+)
- [ ] **Password requirements** disesuaikan dengan kebutuhan:
  - [ ] `letters_digits` (minimal)
  - [ ] `lower_upper_letters_digits` (recommended)
  - [ ] `lower_upper_letters_digits_symbols` (strongest)

### 4.2 Rate Limiting
- [ ] Review konfigurasi rate limiting:
  - [ ] **Email sent** rate limit disesuaikan
  - [ ] **SMS sent** rate limit disesuaikan
  - [ ] **Token refresh** rate limit disesuaikan
  - [ ] **Sign in/Sign up** rate limit disesuaikan

## 5. Konfigurasi JWT

### 5.1 JWT Settings
- [ ] Navigasi ke **Authentication** → **JWT**
- [ ] **JWT expiry** disesuaikan dengan kebutuhan:
  - [ ] Default: 3600 (1 jam)
  - [ ] Maximum: 604800 (1 minggu)
- [ ] **Refresh token rotation** di-enable untuk security
- [ ] **Refresh token reuse interval** diatur ke 10 detik (default)

### 5.2 JWT Issuer
- [ ] **JWT issuer** otomatis diisi oleh Supabase
- [ ] Verifikasi bahwa issuer URL sesuai dengan project URL

## 6. Konfigurasi Session

### 6.1 Session Settings
- [ ] Navigasi ke **Authentication** → **Settings**
- [ ] **Cookie settings** disesuaikan dengan kebutuhan:
  - [ ] Secure cookies enabled (untuk production)
  - [ ] SameSite policy disesuaikan
- [ ] **Session timeout** disesuaikan dengan kebutuhan:
  - [ ] **Timebox** (max session duration)
  - [ ] **Inactivity timeout** (auto logout)

## 7. Konfigurasi Multi-Factor Authentication (MFA) - Optional

### 7.1 MFA Settings
- [ ] Jika menggunakan MFA:
  - [ ] Enable MFA
  - [ ] Configure maximum enrolled factors
  - [ ] Enable TOTP verification
  - [ ] Enable Phone verification (jika diperlukan)

## 8. Konfigurasi External Auth

### 8.1 External Providers
- [ ] Jika menggunakan external providers (SAML, OIDC):
  - [ ] Configure provider settings
  - [ ] Test authentication flow
  - [ ] Review security settings

## 9. Konfigurasi Hooks

### 9.1 Auth Hooks
- [ ] Jika menggunakan auth hooks:
  - [ ] Configure **before_user_created** hook
  - [ ] Configure **custom_access_token** hook
  - [ ] Test hook functionality

## 10. Testing dan Verifikasi

### 10.1 Functional Testing
- [ ] Test registration flow
- [ ] Test login flow
- [ ] Test password recovery
- [ ] Test email confirmation
- [ ] Test logout functionality
- [ ] Test token refresh
- [ ] Test session expiration

### 10.2 Security Testing
- [ ] Verify rate limiting works
- [ ] Test invalid login attempts
- [ ] Test JWT validation
- [ ] Test session management
- [ ] Test secure cookies

## 11. Production Checklist

### 11.1 Sebelum Go-Live
- [ ] Semua production URLs sudah dikonfigurasi
- [ ] Email provider sudah dikonfigurasi dengan benar
- [ ] Rate limiting sudah diatur sesuai kebutuhan
- [ ] Password policy sudah dikonfigurasi
- [ ] JWT settings sudah dioptimasi
- [ ] Security settings sudah diperiksa
- [ ] Semua testing sudah dilakukan dan berhasil

### 11.2 Monitoring
- [ ] Siapkan monitoring untuk:
  - [ ] Failed login attempts
  - [ ] Registration success/failure
  - [ ] Token refresh issues
  - [ ] Email delivery issues
  - [ ] Rate limiting triggers

## 12. Troubleshooting Common Issues

### 12.1 Redirect URL Errors
- [ ] Pastikan redirect URL di Supabase Dashboard sama dengan yang digunakan di aplikasi
- [ ] Periksa protocol (http/https) pada URL
- [ ] Pastikan wildcard (`/**`) digunakan jika diperlukan

### 12.2 Email Issues
- [ ] Check email provider configuration
- [ ] Verify DNS records (SPF, DKIM, DMARC)
- [ ] Check email template content

### 12.3 JWT Issues
- [ ] Verify JWT secret configuration
- [ ] Check token expiration settings
- [ ] Verify issuer URL

---

**Catatan Penting:**
1. Simpan semua konfigurasi penting di version control
2. Dokumentasikan semua perubahan konfigurasi
3. Review konfigurasi security secara berkala
4. Monitor logs untuk aktivitas mencurigakan
5. Backup konfigurasi sebelum melakukan perubahan besar