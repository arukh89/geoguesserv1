# Product Overview

Farcaster Geo Explorer is a GeoGuessr-style geography game built as a Farcaster MiniApp. Players are shown street-level panoramic imagery and must guess the location on a world map.

## Core Features

- **Geography Game**: 5-round games using Mapillary street imagery
- **Game Modes**: Classic, No-Move (restricted panning), Time Attack
- **Scoring**: Distance-based scoring system (closer guess = higher score)
- **Leaderboards**: Daily and weekly leaderboards aggregated by Farcaster FID
- **Token Rewards**: Top 10 weekly players can claim GEOX tokens via smart contract
- **Dynamic NFT**: Players receive/update an on-chain badge NFT when claiming rewards

## Platform Integration

- Runs as a Farcaster MiniApp (embedded in Warpcast)
- Uses Farcaster authentication (FID-based identity)
- Wallet connection via Farcaster MiniApp SDK + Wagmi
- Share results directly to Farcaster feed

## Target Chain

- Base Mainnet (Chain ID: 8453)
- GEOX ERC-20 token for rewards
- GEOXRewards contract for signature-based claims + Dynamic NFT
