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
