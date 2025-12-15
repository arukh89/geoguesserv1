# Environment Variables Usage Guide

## Overview

This project uses multiple environment variable files for different purposes. Here's how to use them properly:

## File Descriptions

### 1. `.env.local` (For Development)
- **Purpose**: Used during local development
- **Scope**: Only loaded when running the application locally
- **Security**: Never committed to version control (listed in .gitignore)

### 2. `vercel.env.local` (For Production Reference)
- **Purpose**: Reference file for Vercel production environment variables
- **Scope**: Used to copy values to Vercel dashboard
- **Security**: Never committed to version control (listed in .gitignore)

## How to Use

### Development Environment

1. Make sure you have the `.env.local` file in your project root
2. Update the `POSTGRES_PASSWORD` with your actual database password
3. Run your development server with:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

### Production Deployment to Vercel

1. Open `vercel.env.local` file in your editor
2. Replace `POSTGRES_PASSWORD` with your actual database password
3. Copy all environment variables from `vercel.env.local`
4. Go to your Vercel Dashboard > Project Settings > Environment Variables
5. Add each variable with the correct value
6. Make sure to select the appropriate environment (Production, Preview, Development)
7. Redeploy your application

### Important Environment Variables

#### Supabase Configuration
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public key for client-side access
- `SUPABASE_SERVICE_ROLE_KEY`: Server-side key with elevated privileges
- `SUPABASE_JWT_SECRET`: Secret for JWT token verification

#### Database Connection
- `POSTGRES_URL`: Full PostgreSQL connection string
- `POSTGRES_PRISMA_URL`: Connection string optimized for Prisma
- `POSTGRES_URL_NON_POOLING`: Direct connection without pooling
- `POSTGRES_PASSWORD`: Your database password (NEVER use default values)

#### API Keys
- `MAPILLARY_SERVER_TOKEN`: Mapillary API server token
- `NEXT_PUBLIC_MAPILLARY_TOKEN`: Mapillary client-side token
- `MAPILLARY_CLIENT_SECRET`: Mapillary client secret
- `FARCASTER_API_KEY`: Farcaster API key
- `NEYNAR_API_KEY`: Neynar API key

## Security Best Practices

1. **Never commit environment files**: All `.env*` files are in .gitignore
2. **Use different passwords**: Use different passwords for development and production
3. **Rotate keys regularly**: Update API keys periodically
4. **Limit access**: Only give necessary permissions to team members
5. **Use secrets management**: Consider using Vercel's environment variable encryption

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check if `POSTGRES_PASSWORD` is correct
   - Verify database host and port
   - Ensure SSL is properly configured

2. **API authentication failures**
   - Verify API keys are correct and active
   - Check if tokens have expired
   - Ensure proper environment is selected in Vercel

3. **Environment variable not found**
   - Verify variable names are spelled correctly
   - Check if variables are set in the correct environment
   - Restart your development server after changing .env.local

## File Structure

```
project-root/
├── .env.local                    # Development environment variables
├── vercel.env.local              # Production environment variables reference
├── .gitignore                    # Contains .env* and vercel.env.local
└── docs/
    └── environment-variables-usage.md  # This file
```

## Next Steps

1. Update your local `.env.local` with the correct database password
2. Set up your Vercel environment variables using `vercel.env.local` as reference
3. Test your application in both development and production
4. Regularly review and update your environment variables for security

## Additional Resources

- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Environment Variables Guide](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)