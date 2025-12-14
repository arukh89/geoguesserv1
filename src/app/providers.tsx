"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MatrixProvider } from "@/components/matrix/MatrixProvider"
import { createWagmiConfig } from "@/lib/web3/config"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [config, setConfig] = useState(() => createWagmiConfig())

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const mod = await import("@farcaster/miniapp-wagmi-connector")
        if (mounted && mod?.farcasterMiniApp) {
          setConfig(createWagmiConfig(mod.farcasterMiniApp))
        }
      } catch {
        // ignore if not available
      }
    })()
    return () => { mounted = false }
  }, [])

  const memoChildren = useMemo(() => children, [children])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <MatrixProvider>{memoChildren}</MatrixProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
