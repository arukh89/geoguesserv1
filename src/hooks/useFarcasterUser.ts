"use client"

import { useState, useEffect } from "react"
import { sdk } from "@farcaster/miniapp-sdk"

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
        // Get user from SDK context
        const context = sdk.context
        if (context?.user) {
          setUser(context.user)
        }
      } catch (error) {
        console.error("Failed to load Farcaster user:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  return { user, loading }
}
