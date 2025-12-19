"use client"

import type React from "react"
import { useEffect, useMemo, useState, useCallback } from "react"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MatrixProvider } from "@/components/matrix/MatrixProvider"
import { createWagmiConfig } from "@/lib/web3/config"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [config, setConfig] = useState(() => createWagmiConfig())
  const [isReady, setIsReady] = useState(false)

  // Load Farcaster connector on mount
  useEffect(() => {
    let mounted = true
    
    const initFarcasterConnector = async () => {
      try {
        // Import Farcaster miniapp connector
        const mod = await import("@farcaster/miniapp-wagmi-connector")
        
        if (mounted && mod?.farcasterMiniApp) {
          // Create config with Farcaster connector as first priority
          const newConfig = createWagmiConfig(mod.farcasterMiniApp)
          setConfig(newConfig)
          console.log("[Providers] Farcaster connector loaded")
        }
      } catch (e) {
        // Not in miniapp context or connector not available
        console.log("[Providers] Using default connectors (no Farcaster)")
      } finally {
        if (mounted) {
          setIsReady(true)
        }
      }
    }

    initFarcasterConnector()
    
    return () => { mounted = false }
  }, [])

  const memoChildren = useMemo(() => children, [children])

  // Show nothing until config is ready to prevent hydration issues
  if (!isReady) {
    return null
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <MatrixProvider>{memoChildren}</MatrixProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
