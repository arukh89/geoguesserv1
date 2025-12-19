import { http, createConfig } from "wagmi"
import { base } from "wagmi/chains"
import { injected, coinbaseWallet } from "wagmi/connectors"

// Build connectors array - Farcaster connector FIRST for miniapp priority
export function createWagmiConfig(farcasterConnector?: () => any) {
  const connectors: any[] = []

  // Farcaster miniapp connector (MUST be first for auto-connect in miniapp)
  if (farcasterConnector) {
    try {
      const connector = farcasterConnector()
      if (connector) {
        connectors.push(connector)
      }
    } catch (e) {
      console.warn("[Wagmi] Failed to initialize Farcaster connector:", e)
    }
  }

  // Coinbase Wallet (for Base app)
  connectors.push(
    coinbaseWallet({
      appName: "Farcaster Geo Explorer",
    }),
  )

  // Injected wallet (MetaMask, etc. for browser)
  connectors.push(injected())

  return createConfig({
    chains: [base],
    connectors,
    transports: {
      [base.id]: http(),
    },
  })
}


