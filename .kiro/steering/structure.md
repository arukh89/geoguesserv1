# Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── imagery/       # Mapillary proxy
│   │   ├── location/      # Random location fetching
│   │   └── rewards/       # Reward signing & claiming
│   ├── admin/             # Admin panel page
│   ├── leaderboard/       # Leaderboard page
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home (game entry)
│   └── providers.tsx      # Wagmi, React Query, Matrix providers
│
├── components/
│   ├── game/              # Game UI components
│   │   ├── GamePage.tsx   # Main game state machine
│   │   ├── PanoramaViewer.tsx
│   │   ├── WorldMap.tsx
│   │   ├── ClaimRewards.tsx
│   │   └── ...
│   ├── ui/                # shadcn/ui components
│   ├── admin/             # Admin panel components
│   ├── auth/              # Login button
│   ├── matrix/            # Matrix rain visual effects
│   └── web3/              # Wallet connection
│
├── hooks/                 # Custom React hooks
│   ├── useFarcasterUser.ts
│   ├── useIsInFarcaster.ts
│   └── useQuickAuth.ts
│
├── lib/
│   ├── contracts/         # Contract ABIs & helpers
│   ├── game/              # Game logic (scoring, types, locations)
│   ├── supabase/          # Supabase client (browser & server)
│   ├── web3/              # Wagmi config & hooks
│   └── utils.ts           # cn() helper
│
└── styles/
    └── globals.css        # Tailwind + custom CSS

foundry-contracts/         # Solidity smart contracts
├── src/
│   └── GEOXRewards.sol   # Main rewards + NFT contract
├── script/
│   └── Deploy.s.sol      # Deployment script
└── lib/                   # OpenZeppelin dependencies

supabase/
├── migrations/            # SQL migrations
└── schema.sql            # Full schema reference

contracts/                 # Legacy/reference Solidity files
```

## Key Patterns

- **Game State**: Managed in `GamePage.tsx` with sessionStorage persistence
- **Auth**: FID-based via Farcaster SDK, wallet via Wagmi
- **API Routes**: Server-side Supabase calls use service role key
- **Rewards**: Admin signs claim data → user submits signature to contract
- **Components**: Use `"use client"` directive for client components
- **Imports**: Use `@/` alias for src directory
