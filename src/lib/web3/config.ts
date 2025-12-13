import { http, createConfig } from "wagmi"
import { base } from "wagmi/chains"
import { injected, coinbaseWallet } from "wagmi/connectors"

let farcasterMiniApp: any = null

if (typeof window !== "undefined") {
  try {
    // Only try to import in browser environment
    import("@farcaster/miniapp-wagmi-connector")
      .then((module) => {
        farcasterMiniApp = module.farcasterMiniApp
      })
      .catch(() => {
        // Silently fail if not available
      })
  } catch (e) {
    // Not in miniapp context
  }
}

// Get WalletConnect project ID from environment
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ""

// Build connectors array - order matters for auto-connection
function getConnectors() {
  const connectors = []

  // Add Farcaster miniapp connector first if available (for Warpcast)
  if (farcasterMiniApp) {
    try {
      connectors.push(farcasterMiniApp())
    } catch (e) {
      console.log("Farcaster miniapp connector not initialized")
    }
  }

  // Coinbase Wallet for Base miniapp
  connectors.push(
    coinbaseWallet({
      appName: "Farcaster Geo Explorer",
      appLogoUrl: "https://geoguesser.example.com/logo.png",
    }),
  )

  // Injected wallet (MetaMask, etc)
  connectors.push(injected())

  return connectors
}

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: getConnectors(),
  transports: {
    [base.id]: http(),
  },
})

// Moonshot token contract on Base mainnet
export const MOONSHOT_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_MOONSHOT_CONTRACT_ADDRESS as `0x${string}`) || "0x9d7ff2e9ba89502776248acd6cbcb6734049fb07"

// Simple ERC20-like ABI for claiming tokens
export const MOONSHOT_ABI = [
  {
    name: "claim",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const
