"use client"

import type React from "react"

import { MatrixProvider } from "@/components/matrix/MatrixProvider"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { wagmiConfig } from "@/lib/web3/config"
import { useState } from "react"

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
