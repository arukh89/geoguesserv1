"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi"

function short(addr?: string) {
  return addr ? `${addr.slice(0, 6)}.${addr.slice(-4)}` : ""
}

export default function LoginButton() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { connect, connectAsync, connectors, isPending } = useConnect()
  const { signMessageAsync } = useSignMessage()

  const preferred = useMemo(() => {
    // pick Farcaster if present, else injected, else coinbase
    const far = connectors.find((c) => /farcaster/i.test(c.name) || /mini.?app/i.test(c.name) || /warp/i.test(c.name))
    const inj = connectors.find((c) => /injected/i.test(c.id) || /injected/i.test(c.name) || /metamask/i.test(c.id))
    const cbw = connectors.find((c) => /coinbase/i.test(c.id) || /coinbase/i.test(c.name))
    return { far, inj, cbw }
  }, [connectors])

  async function trySign() {
    try {
      await signMessageAsync({ message: "Sign in to Farcaster Geo Explorer" })
    } catch {}
  }

  async function handleConnect() {
    const choice = preferred.far || preferred.inj || preferred.cbw || connectors[0]
    if (!choice) return
    try {
      await connectAsync({ connector: choice })
    } catch {
      // fallback for injected wallets
      try { await (window as any)?.ethereum?.request?.({ method: "eth_requestAccounts" }) } catch {}
    }
    await trySign()
  }

  const btnClass = "flex items-center gap-2 px-4 py-2 rounded-lg bg-black/80 backdrop-blur-lg border-2 border-green-500/50 hover:bg-green-900/20 hover:border-green-400 transition-colors shadow-lg shadow-green-500/20 text-green-300 font-semibold hover:text-green-200"

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-green-300 text-sm">{short(address)}</span>
        <Button size="md" variant="secondary" onClick={() => disconnect()}>Disconnect</Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {preferred.far && (
        <Button size="md" className={btnClass} onClick={async () => { try { await connectAsync({ connector: preferred.far! }) } catch {}; await trySign() }}>
          Login (Farcaster)
        </Button>
      )}
      <Button size="md" className={btnClass} onClick={async () => { const c = preferred.inj || connectors.find(x=>/injected/i.test(x.id)); if (c) { try { await connectAsync({ connector: c }) } catch { try { await (window as any)?.ethereum?.request?.({ method: "eth_requestAccounts" }) } catch {} } await trySign() } }} disabled={isPending}>
        Login (Wallet)
      </Button>
    </div>
  )
}
