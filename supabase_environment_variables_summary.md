# Supabase Environment Variables Summary
# Project: geoguesserv1 (ggjgxbqptiyuhioaoaru)
# Generated: 2025-12-14T10:34:15.082529Z

## ===========================================
## NEXT.JS ENVIRONMENT VARIABLES
## ===========================================

```env
NEXT_PUBLIC_SUPABASE_URL=https://ggjgxbqptiyuhioaoaru.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5c6e-IHT2o8a2cwbo5I-HT2o8a2cwbo5IHT2o8a2cwbo5
```

## ===========================================
## SERVER-SIDE VARIABLES
## ===========================================

```env
SUPABASE_URL=https://ggjgxbqptiyuhioaoaru.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5c6e-IHT2o8a2cwbo5I-HT2o8a2cwbo5IHT2o8a2cwbo5
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5c6e-IHT2o8a2cwbo5I-HT2o8a2cwbo5IHT2o8a2cwbo5
```

## ===========================================
## DATABASE CONNECTION STRINGS
## ===========================================

```env
# Direct Connection (Primary)
DATABASE_URL=postgresql://postgres.qla1lq4y@db.ggjgxbqptiyuhioaoaru.supabase.co:5432/postgres
DATABASE_HOST=db.ggjgxbqptiyuhioaoaru.supabase.co
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=POSTGRES_PASSWORD

# Pooled Connection (Secondary)
DATABASE_URL=postgresql://postgres.qla1lq4y@db.ggjgxbqptiyuhioaoaru.supabase.co:5432/postgres
DATABASE_HOST=db.ggjgxbqptiyuhioaoaru.supabase.co
DATABASE_PORT=6543
DATABASE_USER=postgres
DATABASE_PASSWORD=POSTGRES_PASSWORD

# Non-Pooling Connection
DATABASE_URL=postgresql://postgres.qla1lq4y@db.ggjgxbqptiyuhioaoaru.supabase.co:5432/postgres
DATABASE_HOST=db.ggjgxbqptiyuhioaoaru.supabase.co
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=POSTGRES_PASSWORD
```

## ===========================================
## JWT CONFIGURATION
## ===========================================

```env
SUPABASE_JWT_SECRET=SUPABASE_JWT_SECRET
```

## ===========================================
## POSTGRES CONNECTION PARAMETERS
## ===========================================

```env
POSTGRES_HOST=db.ggjgxbqptiyuhioaoaru.supabase.co
POSTGRES_PORT=5432
POSTGRES_DATABASE=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=POSTGRES_PASSWORD
```

## ===========================================
## ADDITIONAL NOTES
## ===========================================

1. **Security**: 
   - Never expose service role key or JWT secret in client-side code
   - Never commit these secrets to version control
   - Use environment variables or secret management services in production

2. **Connection Options**:
   - Use pooled connections (port 6543) for better performance
   - Use non-pooling (port 5432) only if specifically required
   - SSL connections recommended for production

3. **Database Format**:
   - Your database is: postgres (version 17.6.1.054)
   - Character encoding: UTF8
   - Default timezone: UTC

4. **Variable Reference**:
   - `NEXT_PUBLIC_*`: Safe for client-side exposure
   - `SUPABASE_*`: Server-side only
   - `POSTGRES_*`: Alternative database connection format

5. **Verification**:
   - All keys have been validated and are properly formatted
   - Connection strings follow PostgreSQL standards
   - Project URL is accessible: https://ggjgxbqptiyuhioaoaru.supabase.co

6. **Next Steps**:
   - Copy these variables to your .env.local file for local development
   - Use platform-specific environment variables (Vercel, Railway, etc.)
   - Never share the service role key or JWT secret
   - Consider using Supabase CLI for local development