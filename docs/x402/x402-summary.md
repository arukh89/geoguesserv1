# x402 Protocol Summary

## Apa itu x402?

x402 adalah **open standard untuk pembayaran internet-native** yang dibangun di atas HTTP status code `402 Payment Required`. Memungkinkan service untuk charge akses ke API/content secara programmatic tanpa accounts, sessions, atau credential management.

## Konsep Utama

### 1. HTTP 402 Flow
1. Client request resource
2. Server respond `402 Payment Required` + payment instructions (header `PAYMENT-REQUIRED`)
3. Client buat payment payload berdasarkan scheme & network
4. Client kirim request dengan header `PAYMENT-SIGNATURE`
5. Server verify via facilitator `/verify`
6. Server settle via facilitator `/settle`
7. Server return resource + `PAYMENT-RESPONSE` header

### 2. Komponen
- **Client (Buyer)**: Entity yang mau bayar untuk resource
- **Resource Server (Seller)**: HTTP server yang provide API/resource
- **Facilitator**: Server yang verify & settle payments (optional tapi recommended)

### 3. Schemes
- `exact`: Transfer amount yang spesifik (e.g., $0.01 per request)
- Extensible untuk scheme lain (e.g., `upto` untuk usage-based)

### 4. Networks (CAIP-2 Format)
- Base Mainnet: `eip155:8453`
- Base Sepolia: `eip155:84532`
- Solana Mainnet: `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp`

## Packages

### Server (Seller)
```bash
npm install @x402/express @x402/core @x402/evm
# atau @x402/next, @x402/hono
```

### Client (Buyer)
```bash
npm install @x402/fetch @x402/evm
# atau @x402/axios
```

## Contoh Server (Express)

```typescript
import express from "express";
import { paymentMiddleware } from "@x402/express";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";

const app = express();
const payTo = "0xYourAddress";

const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://api.cdp.coinbase.com/platform/v2/x402" // mainnet
});

const server = new x402ResourceServer(facilitatorClient);
registerExactEvmScheme(server);

app.use(
  paymentMiddleware(
    {
      "GET /api/data": {
        accepts: [
          {
            scheme: "exact",
            price: "$0.01",
            network: "eip155:8453", // Base mainnet
            payTo,
          },
        ],
        description: "Get premium data",
        mimeType: "application/json",
      },
    },
    server,
  ),
);

app.get("/api/data", (req, res) => {
  res.json({ data: "premium content" });
});
```

## Contoh Client (Fetch)

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
const response = await fetchWithPayment("https://api.example.com/api/data");
const data = await response.json();
```

## Facilitators

1. **CDP (Coinbase)**: `https://api.cdp.coinbase.com/platform/v2/x402`
   - Fee-free USDC settlement on Base mainnet
   
2. **PayAI**: `https://facilitator.payai.network`
   - Solana, Base, Polygon, dll

## Use Cases untuk Geo Explorer

x402 bisa digunakan untuk:
1. **Pay-per-play**: Charge per game session
2. **Premium features**: Unlock special game modes
3. **API monetization**: Charge untuk location/imagery API
4. **Micropayments**: Small fees per round

## Resources

- GitHub: https://github.com/coinbase/x402
- Docs: https://x402.gitbook.io/x402
- Discord: https://discord.gg/invite/cdp
