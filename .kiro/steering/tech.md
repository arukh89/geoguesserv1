# Tech Stack

## Frontend
- **Framework**: Next.js 16 (App Router, React 19)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4 with CSS variables
- **UI Components**: shadcn/ui (New York style), Radix UI primitives
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Web3
- **Wallet**: Wagmi 3 + Viem 2
- **Chain**: Base Mainnet
- **Connectors**: Farcaster MiniApp connector, Coinbase Wallet, Injected
- **Contracts**: Foundry (Solidity 0.8.24), OpenZeppelin 5.x

## Backend / Data
- **Database**: Supabase (PostgreSQL)
- **Auth**: Farcaster Quick Auth + MiniApp SDK
- **API**: Next.js API Routes

## Imagery
- **Provider**: Mapillary (street-level panoramas)
- **Viewer**: mapillary-js
- **Maps**: Leaflet + React-Leaflet

## Build & Deploy
- **Package Manager**: pnpm
- **Hosting**: Vercel
- **Analytics**: Vercel Analytics

## Common Commands

```bash
# Development
pnpm dev

# Build
pnpm build

# Lint
pnpm lint

# E2E Tests
pnpm test:e2e
pnpm test:e2e:headed
pnpm test:e2e:ui

# Foundry (smart contracts)
cd foundry-contracts
forge build
forge test
forge script script/Deploy.s.sol --rpc-url base --broadcast
```

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_MAPILLARY_CLIENT_ID`
- `NEXT_PUBLIC_GEOX_TOKEN_ADDRESS`
- `NEXT_PUBLIC_GEOX_REWARDS_CONTRACT`
- `NEXT_PUBLIC_ADMIN_SIGNER`
