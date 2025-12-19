---
inclusion: manual
---

# x402 Protocol Integration Guide

## Apa itu x402?

x402 adalah **open standard untuk pembayaran internet-native** dari Coinbase yang dibangun di atas HTTP status code `402 Payment Required`. Memungkinkan service untuk charge akses ke API/content secara programmatic tanpa accounts, sessions, atau credential management.

## Konsep Utama

### HTTP 402 Flow
1. Client request resource
2. Server respond `402 Payment Required` + payment instructions (header `PAYMENT-REQUIRED`)
3. Client buat payment payload berdasarkan scheme & network
4. Client kirim request dengan header `PAYMENT-SIGNATURE`
5. Server verify via facilitator `/verify`
6. Server settle via facilitator `/settle`
7. Server return resource + `PAYMENT-RESPONSE` header

### Komponen
- **Client (Buyer)**: Entity yang mau bayar untuk resource
- **Resource Server (Seller)**: HTTP server yang provide API/resource
- **Facilitator**: Server yang verify & settle payments (CDP atau PayAI)

### Networks (CAIP-2 Format)
- Base Mainnet: `eip155:8453`
- Base Sepolia: `eip155:84532`
- Solana Mainnet: `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp`

## Packages

### Server (Next.js)
```bash
pnpm add @x402/next @x402/core @x402/evm
```

### Client
```bash
pnpm add @x402/fetch @x402/evm
```

## Server Integration (Next.js Middleware)

```typescript
// middleware.ts
import { paymentProxy } from "@x402/next";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";

const payTo = process.env.PAYMENT_WALLET_ADDRESS!;

const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://api.cdp.coinbase.com/platform/v2/x402" // mainnet
});

const server = new x402ResourceServer(facilitatorClient);
registerExactEvmScheme(server);

export const middleware = paymentProxy(
  {
    "/api/premium-endpoint": {
      accepts: [
        {
          scheme: "exact",
          price: "$0.01", // USDC
          network: "eip155:8453", // Base mainnet
          payTo,
        },
      ],
      description: "Premium API access",
      mimeType: "application/json",
    },
  },
  server,
);

export const config = {
  matcher: ["/api/premium-endpoint/:path*"],
};
```

## Client Integration

```typescript
import { wrapFetchWithPayment } from "@x402/fetch";
import { x402Client } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

const signer = privateKeyToAccount(process.env.EVM_PRIVATE_KEY as `0x${string}`);

const client = new x402Client();
registerExactEvmScheme(client, { signer });

const fetchWithPayment = wrapFetchWithPayment(fetch, client);

// Payment handled automatically!
const response = await fetchWithPayment("https://api.example.com/api/premium");
```

## Facilitators

| Provider | URL | Networks |
|----------|-----|----------|
| CDP (Coinbase) | `https://api.cdp.coinbase.com/platform/v2/x402` | Base mainnet (fee-free USDC) |
| PayAI | `https://facilitator.payai.network` | Solana, Base, Polygon |

## Use Cases untuk Geo Explorer

1. **Pay-per-play**: Charge per game session
2. **Premium game modes**: Unlock special modes dengan payment
3. **API monetization**: Charge untuk location/imagery API
4. **Micropayments**: Small fees per round atau per hint

## Resources

- GitHub: https://github.com/coinbase/x402
- Docs: https://x402.gitbook.io/x402
- CDP Docs: https://docs.cdp.coinbase.com/x402/welcome
- Discord: https://discord.gg/invite/cdp

## Local Documentation

Dokumentasi lengkap tersimpan di `docs/x402/`:
- `README.md` - Overview
- `quickstart-sellers.md` - Server integration
- `quickstart-buyers.md` - Client integration
- `facilitator.md` - Facilitator concept
