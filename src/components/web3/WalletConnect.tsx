"use client"

import React from "react"
import { useAccount, useConnect } from "wagmi"
import { Button } from "@/components/ui/button"
import { Wallet, CheckCircle2 } from "lucide-react"
import { useEffect } from "react"

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()

  // Auto-connect when component mounts in Farcaster miniapp
  useEffect(() => {
    if (!isConnected && connectors.length > 0) {
      connect({ connector: connectors[0] })
    }
  }, [isConnected, connectors, connect])

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <div className="text-sm font-medium">
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
      </div>
    )
  }

  return (
    <Button onClick={() => connectors[0] && connect({ connector: connectors[0] })} className="gap-2 w-full">
      <Wallet className="h-4 w-4" />
      Connect Warpcast Wallet
    </Button>
  )
}
