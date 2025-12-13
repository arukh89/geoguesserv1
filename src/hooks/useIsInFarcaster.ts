"use client"

import { useEffect, useState } from "react"

export function useIsInFarcaster() {
  const [isInFarcaster, setIsInFarcaster] = useState(false)

  useEffect(() => {
    // Check if we're in a Farcaster context
    const checkFarcaster = () => {
      // Check for Farcaster SDK availability
      if (typeof window !== "undefined") {
        const isFarcaster =
          window.location.ancestorOrigins?.length > 0 ||
          window.parent !== window ||
          /farcaster/i.test(navigator.userAgent) ||
          /warpcast/i.test(navigator.userAgent)

        setIsInFarcaster(isFarcaster)
      }
    }

    checkFarcaster()
  }, [])

  return isInFarcaster
}
