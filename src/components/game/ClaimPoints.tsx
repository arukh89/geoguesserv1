"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, CheckCircle, Zap } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useFarcasterUser } from "@/hooks/useFarcasterUser"
import { fetchUserByFid } from "@/lib/neynar/client"
import { parseEther, createPublicClient, custom } from "viem"
import { base } from "viem/chains"
import { 
  getMiniAppProvider, 
  getMiniAppWalletClient, 
  ensureBaseChain, 
  getPrimaryAccount 
} from "@/lib/web3/miniappProvider"

interface ClaimPointsProps {
  score: number
  rounds: number
  averageDistance: number
  gameSessionHash?: string
  onSuccess: () => void
  onSkip?: () => void
  disabled?: boolean
}

export function ClaimPoints({
  score,
  rounds,
  averageDistance,
  gameSessionHash,
  onSuccess,
  onSkip,
  disabled = false,
}: ClaimPointsProps) {
  const { user: farcasterUser } = useFarcasterUser()
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [checking, setChecking] = useState(true)
  
  // Ref to prevent race condition from rapid clicks
  const submittingRef = useRef(false)

  // Check if this game has already been claimed on mount
  useEffect(() => {
    async function checkIfClaimed() {
      console.log("[ClaimPoints] Checking claim status for hash:", gameSessionHash)
      
      if (!gameSessionHash) {
        console.log("[ClaimPoints] No gameSessionHash provided!")
        setChecking(false)
        return
      }

      // First check sessionStorage (fast)
      if (typeof window !== 'undefined') {
        const localClaimed = sessionStorage.getItem(`claimed_${gameSessionHash}`)
        if (localClaimed === 'true') {
          console.log("[ClaimPoints] Already claimed (sessionStorage)")
          setClaimed(true)
          setChecking(false)
          return
        }
      }

      // Then check database (authoritative)
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('scores')
          .select('id')
          .eq('game_session_hash', gameSessionHash)
          .maybeSingle()
        
        console.log("[ClaimPoints] Database check result:", data)
        
        if (data) {
          setClaimed(true)
          // Sync to sessionStorage
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`claimed_${gameSessionHash}`, 'true')
          }
        }
      } catch (e) {
        console.warn("[ClaimPoints] Failed to check claim status:", e)
      } finally {
        setChecking(false)
      }
    }

    checkIfClaimed()
  }, [gameSessionHash])

  async function handleClaim() {
    // Prevent race condition from rapid clicks
    if (submittingRef.current) return
    
    if (!farcasterUser?.fid) {
      toast.error("Please sign in with Farcaster first")
      return
    }

    // Validate gameSessionHash exists
    if (!gameSessionHash) {
      toast.error("Invalid game session. Please play a new game.")
      return
    }

    // Check if already claimed in this session
    if (typeof window !== 'undefined') {
      const alreadyClaimed = sessionStorage.getItem(`claimed_${gameSessionHash}`)
      if (alreadyClaimed === 'true') {
        toast.error("This game session has already been claimed!")
        setClaimed(true)
        return
      }
    }

    try {
      submittingRef.current = true
      setClaiming(true)
      toast.loading("Connecting wallet...", { id: "claim-tx" })

      // Get provider using Farcaster SDK pattern
      const provider = await getMiniAppProvider()
      if (!provider) {
        toast.dismiss("claim-tx")
        toast.error("No wallet available. Please open in Warpcast.")
        setClaiming(false)
        return
      }

      // Ensure we're on Base chain
      await ensureBaseChain(provider)

      // Get wallet client
      const walletClient = await getMiniAppWalletClient()
      if (!walletClient) {
        toast.dismiss("claim-tx")
        toast.error("Failed to connect wallet")
        setClaiming(false)
        return
      }

      // Get account
      const account = await getPrimaryAccount(provider, walletClient)

      toast.loading("Confirming on Base...", { id: "claim-tx" })

      // Send 0 ETH transaction (on-chain activity with gas fee)
      // Send to user's own address to avoid contract rejection
      const hash = await walletClient.sendTransaction({
        account,
        to: account, // Send to self
        value: parseEther("0"),
        data: `0x${Buffer.from(`geoexplorer:claim:${farcasterUser.fid}:${score}:${Date.now()}`).toString("hex")}` as `0x${string}`,
      })

      // Try to wait for transaction receipt, but don't fail if provider doesn't support it
      // Farcaster Wallet doesn't support eth_getTransactionReceipt
      try {
        const publicClient = createPublicClient({ chain: base, transport: custom(provider) })
        await publicClient.waitForTransactionReceipt({ hash, timeout: 10_000 })
      } catch (receiptError: any) {
        // If the provider doesn't support getTransactionReceipt, that's OK
        // The transaction was already submitted successfully (we have the hash)
        console.log("[ClaimPoints] Receipt wait skipped (provider may not support it):", receiptError?.message)
      }
      
      toast.dismiss("claim-tx")

      // Get user's verified wallet from Neynar
      let walletAddress = account
      try {
        const neynarUser = await fetchUserByFid(farcasterUser.fid)
        if (neynarUser?.primaryEthAddress) {
          walletAddress = neynarUser.primaryEthAddress as `0x${string}`
        }
      } catch (e) {
        console.warn("Failed to fetch wallet address:", e)
      }

      // Submit score to database
      const supabase = createClient()
      const playerName = farcasterUser.username
        ? `@${farcasterUser.username}`
        : farcasterUser.displayName || "Anonymous"

      console.log("[ClaimPoints] Submitting score with hash:", gameSessionHash)
      console.log("[ClaimPoints] Score data:", { playerName, walletAddress, score, rounds, averageDistance, fid: farcasterUser.fid })

      const { data: insertResult, error } = await supabase.rpc("insert_score", {
        p_player_name: playerName,
        p_identity: walletAddress,
        p_score_value: score,
        p_rounds: rounds,
        p_average_distance: Math.round(averageDistance),
        p_fid: farcasterUser.fid,
        p_pfp_url: farcasterUser.pfpUrl || null,
        p_game_session_hash: gameSessionHash,
      })
      
      console.log("[ClaimPoints] Insert result:", insertResult, "Error:", error)

      if (error) {
        console.error("Failed to submit score:", error)
        if (error.message?.includes("already claimed")) {
          toast.error("This game session has already been claimed!")
          setClaimed(true) // Mark as claimed to prevent retry
          return
        }
        toast.error("Failed to save score. Please try again.")
        return
      }

      setClaimed(true)
      toast.success("Points claimed on-chain! Your score is now on the leaderboard!")
      
      // Mark this session as claimed in sessionStorage to prevent re-claim on refresh
      if (typeof window !== 'undefined' && gameSessionHash) {
        sessionStorage.setItem(`claimed_${gameSessionHash}`, 'true')
        // Clear game state to prevent any further claims
        sessionStorage.removeItem("geo_game_state")
      }
      
      onSuccess()
    } catch (error: any) {
      console.error("Failed to claim points:", error)
      toast.dismiss("claim-tx")
      if (error?.message?.includes("rejected") || error?.message?.includes("denied")) {
        toast.error("Transaction rejected")
      } else if (error?.message === "no_account") {
        toast.error("Please connect your wallet in Warpcast")
      } else {
        toast.error(error?.message || "Failed to claim points")
      }
    } finally {
      setClaiming(false)
      submittingRef.current = false
    }
  }

  // Show loading while checking claim status
  if (checking) {
    return (
      <div className="flex items-center justify-center gap-2 text-green-400/60 py-4">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Checking claim status...</span>
      </div>
    )
  }

  // Already claimed - show 0 points
  if (claimed) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-green-400">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Points claimed!</span>
        </div>
        <p className="text-xs text-green-400/60">
          This game&apos;s {score.toLocaleString()} points have been added to your leaderboard score.
        </p>
      </div>
    )
  }

  // No valid game session
  if (!gameSessionHash) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-yellow-400/80">
          Invalid game session. Please play a new game to claim points.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleClaim}
        disabled={disabled || claiming || !farcasterUser || claimed}
        size="lg"
        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 gap-2"
      >
        {claiming ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Confirming on Base...
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            Claim {score.toLocaleString()} Points
          </>
        )}
      </Button>

      <p className="text-xs text-center text-green-400/60">
        Requires small gas fee on Base. Top 10 weekly win GEOX!
      </p>

      {onSkip && (
        <Button
          onClick={onSkip}
          variant="secondary"
          size="sm"
          className="w-full text-green-400/50 hover:text-green-400/80 bg-transparent border-transparent hover:bg-green-500/10"
        >
          Skip (points won&apos;t be saved to leaderboard)
        </Button>
      )}
    </div>
  )
}

export default ClaimPoints
