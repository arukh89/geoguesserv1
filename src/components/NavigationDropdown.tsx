"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { HomeIcon, Menu, Trophy, Shield, Wallet, User, RefreshCw } from "lucide-react"
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
import { useMemo } from "react"

function short(addr?: string) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : ""
}

export function NavigationDropdown() {
  const router = useRouter()
  const { user, loading, refresh } = useFarcasterUser()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { connectAsync, connectors, isPending } = useConnect()
  const { signMessageAsync } = useSignMessage()

  const isAdminUser = (user?.fid ? isAdmin(user.fid) : false) || (isConnected && address ? isAdminWallet(address) : false)

  // Refresh user data when wallet connects
  useEffect(() => {
    if (isConnected && address && !user) {
      refresh()
    }
  }, [isConnected, address, user, refresh])

  const preferred = useMemo(() => {
    const far = connectors.find((c) => /farcaster/i.test(c.name) || /mini.?app/i.test(c.name) || /warp/i.test(c.name))
    const inj = connectors.find((c) => /injected/i.test(c.id) || /injected/i.test(c.name) || /metamask/i.test(c.id))
    const cbw = connectors.find((c) => /coinbase/i.test(c.id) || /coinbase/i.test(c.name))
    return { far, inj, cbw }
  }, [connectors])

  async function handleFarcasterLogin() {
    if (!preferred.far) return
    try {
      await connectAsync({ connector: preferred.far })
      // Refresh to get Farcaster user data
      setTimeout(() => refresh(), 500)
    } catch (e) {
      console.warn('Farcaster login failed:', e)
    }
  }

  async function handleWalletLogin() {
    const c = preferred.inj || preferred.cbw || connectors.find(x => /injected/i.test(x.id))
    if (c) {
      try {
        await connectAsync({ connector: c })
        // Refresh to lookup FID from wallet address via Neynar
        setTimeout(() => refresh(), 500)
      } catch (e) {
        console.warn('Wallet login failed:', e)
        try {
          await (window as any)?.ethereum?.request?.({ method: "eth_requestAccounts" })
          setTimeout(() => refresh(), 500)
        } catch {}
      }
    }
  }

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  const handleDisconnect = () => {
    disconnect()
    // Clear stored user data
    try {
      localStorage.removeItem("fc_fid")
      localStorage.removeItem("fc_user")
    } catch {}
    window.location.reload()
  }

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
        <DropdownMenuContent align="end" className="w-64">
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
              <div className="px-3 py-2">
                {loading ? (
                  <div className="flex items-center gap-2 text-green-400/70">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : user ? (
                  <div className="flex items-center gap-3">
                    {user.pfpUrl ? (
                      <img 
                        src={user.pfpUrl} 
                        alt="Profile" 
                        className="w-10 h-10 rounded-full object-cover border-2 border-green-500/50"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500/50">
                        <User className="w-5 h-5 text-green-400" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-semibold text-green-300">
                        {user.username ? `@${user.username}` : user.displayName || "User"}
                      </span>
                      {user.fid && (
                        <span className="text-xs text-green-400/70 font-mono">FID: {user.fid}</span>
                      )}
                      {!user.fid && address && (
                        <span className="text-xs text-green-400/70 font-mono">{short(address)}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-300 font-mono">{short(address)}</span>
                  </div>
                )}
              </div>
              <DropdownMenuItem onClick={handleDisconnect} className="flex items-center gap-2 text-red-400 hover:text-red-300">
                Disconnect
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default NavigationDropdown
