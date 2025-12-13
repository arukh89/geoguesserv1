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

        // Initialize SDK
        await sdk.actions.ready()

        // Get user from SDK context
        const context = sdk.context
        if (context?.user) {
          setUser(context.user)
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
