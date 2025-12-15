"use client"

import React, { useMemo } from "react"
import { useRouter } from "next/navigation"
import { HomeIcon, Menu, Trophy, Shield, Wallet, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown"
import { useFarcasterUser } from "@/hooks/useFarcasterUser"
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi"
import { isAdmin, isAdminWallet } from "@/lib/admin/config"
import { formatUsernameForDisplay } from "@/lib/utils/formatUsernameFarcaster"

function short(addr?: string) {
  return addr ? `${addr.slice(0, 6)}.${addr.slice(-4)}` : ""
}

export function NavigationDropdown() {
  const router = useRouter()
  const { user } = useFarcasterUser()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { connectAsync, connectors, isPending } = useConnect()
  const { signMessageAsync } = useSignMessage()
  const { user: farcasterUser } = useFarcasterUser()

  const isAdminUser = (user?.fid ? isAdmin(user.fid) : false) || (isConnected && address ? isAdminWallet(address) : false)

  const preferred = useMemo(() => {
    const far = connectors.find((c) => /farcaster/i.test(c.name) || /mini.?app/i.test(c.name) || /warp/i.test(c.name))
    const inj = connectors.find((c) => /injected/i.test(c.id) || /injected/i.test(c.name) || /metamask/i.test(c.id))
    const cbw = connectors.find((c) => /coinbase/i.test(c.id) || /coinbase/i.test(c.name))
    return { far, inj, cbw }
  }, [connectors])

  async function trySign() {
    try { await signMessageAsync({ message: "Sign in to Farcaster Geo Explorer" }) } catch {}
  }

  async function handleFarcasterLogin() {
    if (!preferred.far) return
    try { await connectAsync({ connector: preferred.far }) } catch {}
    await trySign()
  }

  async function handleWalletLogin() {
    const c = preferred.inj || connectors.find(x => /injected/i.test(x.id))
    if (c) {
      try { await connectAsync({ connector: c }) } catch {
        try { await (window as any)?.ethereum?.request?.({ method: "eth_requestAccounts" }) } catch {}
      }
      await trySign()
    }
  }

  const handleNavigation = (path: string) => router.push(path)

  const triggerButtonClass = "flex items-center gap-2 px-4 py-2 rounded-lg bg-black/80 backdrop-blur-lg border-2 border-green-500/50 hover:bg-green-900/20 hover:border-green-400 transition-colors shadow-lg shadow-green-500/20 text-green-300 font-semibold hover:text-green-200"

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="md" className={triggerButtonClass} aria-label="Menu">
            <Menu className="w-4 h-4" />
            Menu
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => handleNavigation("/")} className="flex items-center gap-2">
            <HomeIcon className="w-4 h-4" />
            Home
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleNavigation("/leaderboard")} className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Leaderboard
          </DropdownMenuItem>

          {isAdminUser && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleNavigation("/admin")} className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Admin
              </DropdownMenuItem>
            </>
          )}

          {!isConnected && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleFarcasterLogin} className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Login Farcaster
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleWalletLogin} disabled={isPending} className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Login Wallet
              </DropdownMenuItem>
            </>
          )}

          {isConnected && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-sm text-green-300">
                {farcasterUser ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold">
                      {farcasterUser.username ? `@${farcasterUser.username}` : farcasterUser.displayName || "User"}
                    </span>
                    {farcasterUser.fid && (
                      <span className="text-xs text-green-400/70 font-mono">FID: {farcasterUser.fid}</span>
                    )}
                  </div>
                ) : (
                  <span>{short(address)}</span>
                )}
              </div>
              <DropdownMenuItem onClick={() => disconnect()} className="flex items-center gap-2">
                Disconnect
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {user && (
        <div className="px-2 py-1 rounded-md border border-green-500/40 text-green-300 text-xs font-mono bg-black/60 flex items-center gap-1.5">
          <span>{user.username ? `@${user.username}` : `FID: ${user.fid}`}</span>
          {user.username && user.fid && (
            <span className="text-green-400/60 text-[10px]">#{user.fid}</span>
          )}
        </div>
      )}
    </div>
  )
}

export default NavigationDropdown
