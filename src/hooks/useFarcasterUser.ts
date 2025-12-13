"use client"

import { useState, useEffect } from "react"

export interface FarcasterUser {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
}

export function useFarcasterUser() {
  const [user, setUser] = useState<FarcasterUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      try {
        if (typeof window === "undefined") {
          setLoading(false)
          return
        }

        const { sdk } = await import("@farcaster/miniapp-sdk")

        await sdk.actions.ready()

        let u: any = null
        if (typeof sdk.actions.getUser === 'function') {
          try { u = await (sdk.actions as any).getUser() } catch {}
        }
        if (!u && sdk.context?.user) u = sdk.context.user

        if (u?.fid != null) {
          const fidNum = Number(u.fid)
          setUser({
            fid: isNaN(fidNum) ? (u.fid as number) : fidNum,
            username: u.username,
            displayName: u.displayName,
            pfpUrl: u.pfpUrl,
          })
        }
      } catch (error) {
        console.log("Not in Farcaster miniapp context:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  return { user, loading }
}