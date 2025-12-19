"use client"

import { useState } from "react"
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

// Contract address to send 0 ETH for on-chain activity
const GEOX_CONTRACT = process.env.NEXT_PUBLIC_GEOX_REWARDS_CONTRACT as `0x${string}` || "0xA09Ce8CF97046DDFF087b31e353d43e08f62d165"

interface ClaimPointsProps {
  score: number
  rounds: number
  averageDistance: number
  onSuccess: () => void
  onSkip?: () => void
  disabled?: boolean
}

export function ClaimPoints({
  score,
  rounds,
  averageDistance,
  onSuccess,
  onSkip,
  disabled = false,
}: ClaimPointsProps) {
  const { user: farcasterUser } = useFarcasterUser()
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)

  async function handleClaim() {
    if (!farcasterUser?.fid) {
      toast.error("Please sign in with Farcaster first")
      return
    }

    try {
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

      // Wait for transaction
      const publicClient = createPublicClient({ chain: base, transport: custom(provider) })
      await publicClient.waitForTransactionReceipt({ hash })
      
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

      const { error } = await supabase.rpc("insert_score", {
        p_player_name: playerName,
        p_identity: walletAddress,
        p_score_value: score,
        p_rounds: rounds,
        p_average_distance: Math.round(averageDistance),
        p_fid: farcasterUser.fid,
        p_pfp_url: farcasterUser.pfpUrl || null,
      })

      if (error) {
        console.error("Failed to submit score:", error)
        toast.error("Failed to save score. Please try again.")
        return
      }

      setClaimed(true)
      toast.success("Points claimed on-chain! Your score is now on the leaderboard!")
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
    }
  }

  if (claimed) {
    return (
      <div className="flex items-center gap-2 text-green-400">
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">Points claimed!</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleClaim}
        disabled={disabled || claiming || !farcasterUser}
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
