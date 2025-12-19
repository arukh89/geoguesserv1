# GeoRewardsClaim Contract Deployment Guide

## Overview
Contract untuk user claim GEO token rewards dari Farcaster Geo Explorer.

## Contract Details
- **Network:** Base Mainnet (Chain ID: 8453)
- **GEO Token:** `0x19E426b33E21e4C3Bd555de40599C4f68d48630b`

## Cara Deploy (Remix IDE)

### Step 1: Buka Remix IDE
1. Buka https://remix.ethereum.org
2. Buat file baru: `GeoRewardsClaim.sol`
3. Copy paste code dari `contracts/GeoRewardsClaim.sol`

### Step 2: Install OpenZeppelin
Di Remix, buat file `remappings.txt`:
```
@openzeppelin/contracts/=https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/
```

Atau gunakan import langsung:
```solidity
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/token/ERC20/IERC20.sol";
// ... dst
```

### Step 3: Compile
1. Klik tab "Solidity Compiler" (icon S)
2. Pilih compiler version: `0.8.20`
3. Klik "Compile GeoRewardsClaim.sol"

### Step 4: Deploy
1. Klik tab "Deploy & Run Transactions" (icon dengan panah)
2. Environment: "Injected Provider - MetaMask"
3. Pastikan MetaMask terhubung ke **Base Mainnet**
4. Pilih contract: `GeoRewardsClaim`
5. Isi constructor parameters:
   - `_geoToken`: `0x19E426b33E21e4C3Bd555de40599C4f68d48630b`
   - `_signer`: `<WALLET_ADDRESS_KAMU>` (yang akan sign rewards)
   - `_owner`: `<WALLET_ADDRESS_KAMU>` (owner contract)
6. Klik "Deploy"
7. Confirm di MetaMask

### Step 5: Transfer GEO Token ke Contract
Setelah deploy, transfer 1.5M GEO token ke alamat contract:
1. Buka wallet kamu
2. Kirim 1,500,000 GEO ke alamat contract yang baru di-deploy

### Step 6: Catat Alamat Contract
Setelah deploy berhasil, catat alamat contract dan update di:
- `src/lib/contracts/claimRewards.ts`
- `src/components/game/ClaimRewards.tsx`

---

## Alternative: Deploy via Foundry

### Install Foundry
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Deploy
```bash
# Set environment variables
export PRIVATE_KEY=<your_private_key>
export RPC_URL=https://mainnet.base.org

# Deploy
forge create contracts/GeoRewardsClaim.sol:GeoRewardsClaim \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args \
    0x19E426b33E21e4C3Bd555de40599C4f68d48630b \
    <SIGNER_ADDRESS> \
    <OWNER_ADDRESS>
```

---

## Setelah Deploy

1. **Update contract address** di codebase
2. **Transfer GEO tokens** ke contract (1.5M untuk 4 minggu)
3. **Test claim** dengan signature dari admin

## Security Notes
- Hanya owner yang bisa withdraw tokens
- Signer address bisa diupdate oleh owner
- Setiap (fid, weekId) hanya bisa claim sekali
- Signature punya deadline untuk keamanan
