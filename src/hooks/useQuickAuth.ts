"use client";

import { useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

// Triggers Quick Auth when running inside Farcaster. Optionally pings our backend.
export function useQuickAuth(isInFarcaster: boolean) {
  useEffect(() => {
    if (!isInFarcaster) return;
    let cancelled = false;
    (async () => {
      try {
        // Ensure we have a valid Quick Auth token
        const { token } = await sdk.quickAuth.getToken();
        if (cancelled) return;

        // Hit backend to establish a verified session (example endpoint)
        await sdk.quickAuth.fetch("/api/auth/me");
      } catch (e) {
        console.error("QuickAuth failed", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isInFarcaster]);
}
