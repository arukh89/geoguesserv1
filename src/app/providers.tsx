"use client"

import type React from "react"

import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { wagmiConfig } from "@/lib/web3/config"
import { MatrixProvider } from "@/components/matrix/MatrixProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <MatrixProvider>{children}</MatrixProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
