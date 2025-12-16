"use client"

import { useState, useEffect, useCallback } from "react"
import { useAccount } from "wagmi"
import { fetchUserByFid, fetchUserByAddress, type FarcasterUserData } from "@/lib/neynar/client"

export interface FarcasterUser {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
  custodyAddress?: string
  verifiedAddresses?: string[]
}

function coerceFidSafe(val: any): number | null {
  try {
    if (val == null) return null
    const t = typeof val
    if (t === "number" && Number.isFinite(val)) return Math.trunc(val)
    if (t === "bigint") {
      const n = Number(val)
      return Number.isFinite(n) ? Math.trunc(n) : null
    }
    if (t === "string") {
      const n = parseInt(val, 10)
      return Number.isFinite(n) ? n : null
    }
    if (t === "object") {
      for (const k of ["value", "current", "val"]) {
        if (val[k] != null) {
          const n = coerceFidSafe(val[k])
          if (n) return n
        }
      }
      try {
        const s = String(val)
        const m = s.match(/\d{2,}/)
        if (m) return parseInt(m[0], 10)
      } catch {}
    }
  } catch {}
  return null
}

function readFidFromSearch(): number | null {
  try {
    const sp = new URLSearchParams(window.location.search)
    for (const key of ["fid", "adminFid", "fc_fid"]) {
      const v = sp.get(key)
      const n = v != null ? coerceFidSafe(v) : null
      if (n) return n
    }
  } catch {}
  return null
}

function readFidFromStorage(): number | null {
  try {
    for (const key of ["fc_fid", "adminFidOverride"]) {
      const v = localStorage.getItem(key)
      const n = v != null ? coerceFidSafe(v) : null
      if (n) return n
    }
  } catch {}
  return null
}

function saveUserToStorage(user: FarcasterUser) {
  try {
    localStorage.setItem("fc_fid", String(user.fid))
    localStorage.setItem("fc_user", JSON.stringify(user))
  } catch {}
}

function readUserFromStorage(): FarcasterUser | null {
  try {
    const stored = localStorage.getItem("fc_user")
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed?.fid) return parsed
    }
  } catch {}
  return null
}

export function useFarcasterUser() {
  const [user, setUser] = useState<FarcasterUser | null>(null)
  const [loading, setLoading] = useState(true)
  const { address, isConnected } = useAccount()

  const loadUser = useCallback(async () => {
    let resolved: FarcasterUser | null = null
    
    try {
      if (typeof window === "undefined") {
        setLoading(false)
        return
      }

      // 1. Try Farcaster MiniApp SDK first (for Warpcast)
      try {
        const { sdk } = await import("@farcaster/miniapp-sdk")
        
        if (sdk?.context?.user?.fid != null) {
          const sdkUser = sdk.context.user
          resolved = {
            fid: sdkUser.fid,
            username: sdkUser.username,
            displayName: sdkUser.displayName,
            pfpUrl: sdkUser.pfpUrl,
          }
        }

        // Try to become ready
        const ready = await Promise.race([
          (async () => {
            try {
              await sdk.actions.ready()
              return true
            } catch { return false }
          })(),
          new Promise<boolean>((res) => setTimeout(() => res(false), 1000)),
        ])

        if (!resolved && ready && sdk.context?.user) {
          const sdkUser = sdk.context.user
          resolved = {
            fid: sdkUser.fid,
            username: sdkUser.username,
            displayName: sdkUser.displayName,
            pfpUrl: sdkUser.pfpUrl,
          }
        }
      } catch {
        // Not in miniapp context
      }

      // 2. If connected wallet, lookup FID from Neynar by address
      if (!resolved && isConnected && address) {
        console.log('[useFarcasterUser] Looking up user by wallet address:', address)
        const neynarUser = await fetchUserByAddress(address)
        if (neynarUser) {
          console.log('[useFarcasterUser] Found user from Neynar:', neynarUser)
          resolved = {
            fid: neynarUser.fid,
            username: neynarUser.username,
            displayName: neynarUser.displayName,
            pfpUrl: neynarUser.pfpUrl,
            custodyAddress: neynarUser.custodyAddress,
            verifiedAddresses: neynarUser.verifiedAddresses,
          }
        }
      }

      // 3. Try URL params
      if (!resolved) {
        const urlFid = readFidFromSearch()
        if (urlFid) {
          const neynarUser = await fetchUserByFid(urlFid)
          if (neynarUser) {
            resolved = {
              fid: neynarUser.fid,
              username: neynarUser.username,
              displayName: neynarUser.displayName,
              pfpUrl: neynarUser.pfpUrl,
              custodyAddress: neynarUser.custodyAddress,
              verifiedAddresses: neynarUser.verifiedAddresses,
            }
          } else {
            resolved = { fid: urlFid }
          }
        }
      }

      // 4. Try localStorage
      if (!resolved) {
        const storedUser = readUserFromStorage()
        if (storedUser) {
          resolved = storedUser
        } else {
          const storedFid = readFidFromStorage()
          if (storedFid) {
            const neynarUser = await fetchUserByFid(storedFid)
            if (neynarUser) {
              resolved = {
                fid: neynarUser.fid,
                username: neynarUser.username,
                displayName: neynarUser.displayName,
                pfpUrl: neynarUser.pfpUrl,
              }
            } else {
              resolved = { fid: storedFid }
            }
          }
        }
      }

      // 5. If we have FID but missing data, fetch from Neynar
      if (resolved?.fid && (!resolved.username || !resolved.pfpUrl)) {
        const neynarUser = await fetchUserByFid(resolved.fid)
        if (neynarUser) {
          resolved = {
            ...resolved,
            username: resolved.username || neynarUser.username,
            displayName: resolved.displayName || neynarUser.displayName,
            pfpUrl: resolved.pfpUrl || neynarUser.pfpUrl,
            custodyAddress: neynarUser.custodyAddress,
            verifiedAddresses: neynarUser.verifiedAddresses,
          }
        }
      }

      // Save to storage if we have a user
      if (resolved) {
        saveUserToStorage(resolved)
      }

      setUser(resolved)
    } catch (error) {
      console.error('[useFarcasterUser] Error loading user:', error)
    } finally {
      setLoading(false)
    }
  }, [address, isConnected])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  // Refresh user data
  const refresh = useCallback(() => {
    setLoading(true)
    loadUser()
  }, [loadUser])

  return { user, loading, refresh }
}
