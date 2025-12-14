"use client"

import { useState, useEffect } from "react"

export interface FarcasterUser {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
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
      // common reactive wrappers
      for (const k of ["value", "current", "val"]) {
        if (val[k] != null) {
          const n = coerceFidSafe(val[k])
          if (n) return n
        }
      }
      // last resort: extract first integer from toString()
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

export function useFarcasterUser() {
  const [user, setUser] = useState<FarcasterUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadUser() {
      let resolved: any = null
      try {
        if (typeof window === "undefined") {
          setLoading(false)
          return
        }

        const { sdk } = await import("@farcaster/miniapp-sdk")

        // Fast path: existing context
        if (sdk?.context?.user?.fid != null) {
          resolved = sdk.context.user
        }

        // Try to become ready, but don't hang forever
        const ready = await Promise.race([
          (async () => {
            try {
              await sdk.actions.ready()
              return true
            } catch {
              return false
            }
          })(),
          new Promise<boolean>((res) => setTimeout(() => res(false), 700)),
        ])

        if (!resolved && ready) {
          if (typeof (sdk.actions as any).getUser === "function") {
            try { resolved = await (sdk.actions as any).getUser() } catch {}
          }
          if (!resolved && sdk.context?.user) {
            resolved = sdk.context.user
          }
        }
      } catch {
        // Not in miniapp context
      }

      // Fallbacks: URL param, then localStorage
      if (!resolved) {
        const urlFid = readFidFromSearch()
        if (urlFid) {
          try { localStorage.setItem("fc_fid", String(urlFid)) } catch {}
          resolved = { fid: urlFid }
        } else {
          const storedFid = readFidFromStorage()
          if (storedFid) {
            resolved = { fid: storedFid }
          }
        }
      }

      if (!cancelled) {
        const fidNum = coerceFidSafe(resolved?.fid)
        if (fidNum) {
          setUser({
            fid: fidNum,
            username: resolved?.username,
            displayName: resolved?.displayName,
            pfpUrl: resolved?.pfpUrl,
          })
        }
        setLoading(false)
      }
    }

    loadUser()
    return () => { cancelled = true }
  }, [])

  return { user, loading }
}
