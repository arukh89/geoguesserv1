"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi"

function short(addr?: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : ""
}

export default function LoginButton() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { connect, connectors, isPending } = useConnect()
  const { signMessageAsync } = useSignMessage()

  const preferred = useMemo(() => {
    // pick Farcaster if present, else injected, else coinbase
    const far = connectors.find((c) => /farcaster/i.test(c.name) || /mini.?app/i.test(c.name))
    const inj = connectors.find((c) => /Injected/i.test(c.name))
    const cbw = connectors.find((c) => /Coinbase/i.test(c.name))
    return { far, inj, cbw }
  }, [connectors])

  async function handleConnect() {
    const choice = preferred.far || preferred.inj || preferred.cbw || connectors[0]
    if (!choice) return

    await connect({ connector: choice })

    try {
      // Simple sign-in confirmation
      await signMessageAsync({ message: "Sign in to Farcaster Geo Explorer" })
    } catch {
      // user may reject – that's fine
    }
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-green-300 text-sm">{short(address)}</span>
        <Button size="md" variant="secondary" onClick={() => disconnect()}>Disconnect</Button>
      </div>
    )
  }

  return (
    <Button size="md" onClick={handleConnect} disabled={isPending}>
      {preferred.far ? "Login (Farcaster)" : preferred.inj ? "Login (Wallet)" : "Login"}
    </Button>
  )
}
