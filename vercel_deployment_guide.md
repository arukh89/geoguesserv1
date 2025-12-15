# Vercel Deployment Guide: Environment Variables

## Introduction

This guide will help you manually add all the required environment variables to your Vercel project for successful deployment. These credentials are essential for your application to connect with Supabase, Mapillary, Farcaster, and other services.

## ⚠️ IMPORTANT: Get PostgreSQL Password Before Deployment

Before proceeding with the environment variables setup, you must retrieve your actual PostgreSQL password from the Supabase dashboard:

1. Go to https://app.supabase.com
2. Select your project "geoguesserv1"
3. Navigate to **Settings → Database**
4. Look for the **"Connection string"** or **"Database Password"** section
5. Click **"Show"** or **"Reveal"** to see the actual password
6. Replace all instances of **"PASSWORD"** in the environment variables with this actual password

**⚠️ CRITICAL:** Failure to use the actual PostgreSQL password will prevent your application from connecting to the database and cause deployment failures.

## Step-by-Step Instructions

1. Navigate to your Vercel project dashboard
2. Go to **Project Settings** → **Environment Variables**
3. Add each environment variable listed below with its corresponding value
4. For sensitive variables, make sure to check the "Secret" box
5. Choose the appropriate environments (Production, Preview, Development) for each variable

## Environment Variables to Add

### Supabase Configuration

#### Client-side Variables (Available to all environments)
```
NEXT_PUBLIC_SUPABASE_URL=https://ggjgxbqptiyuhioaoaru.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6ZmpkZHJyY3JlZnZhdWpraXFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MTUzNTIsImV4cCI6MjA4MTI5MTM1Mn0.KT9vctAUeexwyw3NfvCQrWUANh9HW2V8VQLqGVidkms
```

#### Server-side Variables (Available to all environments, mark as Secret)
```
SUPABASE_URL=https://ggjgxbqptiyuhioaoaru.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6ZmpkZHJyY3JlZnZhdWpraXFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MTUzNTIsImV4cCI6MjA4MTI5MTM1Mn0.KT9vctAUeexwyw3NfvCQrWUANh9HW2V8VQLqGVidkms
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnY3Z1ZG1jemVhbmR1b2NocHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1ODgwOCwiZXhwIjoyMDgxMjM0ODA4fQ.IpDCXeWIO2SQmEJuyVTy_t3CxcbuJd1fyn5kfrdSdyA
SUPABASE_SECRET_KEY=sb_secret_HTQN-lHAhGAZEBrhdjceQA_29r1-4wE
SUPABASE_JWT_SECRET=3qdHeSD2hNnBs1BMuYV3Rsgj2jIrK+K8dLTvkdVpjxCJtz1Nicl+n0g43WB62ZZ3boOg7PH/MOofJJTOVyvjNg==
```

### PostgreSQL Database Configuration (Available to all environments, mark as Secret)

⚠️ **IMPORTANT**: You must replace the "PASSWORD" placeholder with your actual PostgreSQL password from the Supabase dashboard.

1. Go to your Supabase project dashboard
2. Navigate to Settings → Database
3. Find the connection string or password information
4. Replace "PASSWORD" in the variables below with your actual password

```
POSTGRES_URL=postgresql://postgres:PASSWORD@db.ggjgxbqptiyuhioaoaru.supabase.co:5432/postgres
POSTGRES_PRISMA_URL=postgresql://postgres:PASSWORD@db.ggjgxbqptiyuhioaoaru.supabase.co:5432/postgres?pgbouncer=true&connect_timeout=15
POSTGRES_URL_NON_POOLING=postgresql://postgres:PASSWORD@db.ggjgxbqptiyuhioaoaru.supabase.co:5432/postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=PASSWORD
POSTGRES_HOST=db.ggjgxbqptiyuhioaoaru.supabase.co
POSTGRES_DATABASE=postgres
```

### Mapillary API Configuration

#### Client-side Variables (Available to all environments)
```
NEXT_PUBLIC_MAPILLARY_TOKEN=MLY|26076414925278553|cabaa59e54c22e36f987eabae633df89
```

#### Server-side Variables (Available to all environments, mark as Secret)
```
MAPILLARY_SERVER_TOKEN=MLY|26076414925278553|9c1536fe1708aa39daf9437e233a95e3
MAPILLARY_CLIENT_SECRET=MLY|26076414925278553|cabaa59e54c22e36f987eabae633df89
MAPILLARY_CLIENT_ID=25246864601630618
```

### Farcaster API Configuration (Available to all environments, mark as Secret)
```
FARCASTER_API_KEY=wc_secret_13ae99f53a4f0874277616da7b10bddf6d01a2ea5eac4d8c6380e877_9b6b2830
```

### Neynar API Configuration (Available to all environments, mark as Secret)
```
NEYNAR_API_KEY=643049C2-0132-4043-995C-55F749670AD5
```

### Web3/Smart Contract Configuration (Available to all environments)
```
NEXT_PUBLIC_MOONSHOT_CONTRACT_ADDRESS=0x9d7ff2e9ba89502776248acd6cbcb6734049fb07
```

### Application URLs (Available to all environments)
```
NEXT_PUBLIC_BASE_URL=https://geoguesserv1.vercel.app
```

## Summary of Variables to Mark as "Secret"

These variables contain sensitive information and should be marked as "Secret" in Vercel:

- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_SECRET_KEY
- SUPABASE_JWT_SECRET
- POSTGRES_URL
- POSTGRES_PRISMA_URL
- POSTGRES_URL_NON_POOLING
- POSTGRES_PASSWORD
- MAPILLARY_SERVER_TOKEN
- MAPILLARY_CLIENT_SECRET
- MAPILLARY_CLIENT_ID
- FARCASTER_API_KEY
- NEYNAR_API_KEY

## Additional Notes

1. **Environment Selection**: For most cases, you should make these variables available to all environments (Production, Preview, Development) to ensure consistency across deployments.

2. **Password Replacement**: Remember to replace the "PASSWORD" placeholder with your actual PostgreSQL password from Supabase before deployment.

3. **Security**: Always double-check that sensitive variables are marked as "Secret" in Vercel to prevent exposure in logs or client-side code.

4. **Deployment**: After adding all environment variables, you may need to redeploy your application for the changes to take effect.

5. **Verification**: After deployment, verify that your application can successfully connect to all external services.

6. **Variable Naming**: Ensure exact matching of variable names, including case sensitivity, as shown above.