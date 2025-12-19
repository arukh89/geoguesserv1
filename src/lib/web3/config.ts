import { http, createConfig } from "wagmi"
import { base } from "wagmi/chains"
import { injected, coinbaseWallet } from "wagmi/connectors"

// Build connectors array in a predictable order
export function createWagmiConfig(farcasterFactory?: () => any) {
  const connectors: any[] = []

  // Farcaster miniapp (Warpcast)
  if (typeof window !== "undefined" && farcasterFactory) {
    try {
      connectors.push(farcasterFactory())
    } catch {
      // ignore
    }
  }

  // Coinbase Wallet (Base)
  connectors.push(
    coinbaseWallet({
      appName: "Farcaster Geo Explorer",
    }),
  )

  // Injected (MetaMask, etc.)
  connectors.push(injected())

  return createConfig({
    chains: [base],
    connectors,
    transports: {
      [base.id]: http(),
    },
  })
}


