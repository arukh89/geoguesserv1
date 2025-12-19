"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAccount, useWalletClient, useChainId, useSwitchChain, useConnect } from "wagmi"
import { toast } from "sonner"
import { Loader2, Wallet, CheckCircle, Zap } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useFarcasterUser } from "@/hooks/useFarcasterUser"
import { fetchUserByFid } from "@/lib/neynar/client"
import { detectWalletEnvironment, getPreferredConnectorName } from "@/lib/web3/environment"

const BASE_CHAIN_ID = 8453

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
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { data: walletClient } = useWalletClient()
  const { connect, connectors } = useConnect()

  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)

  // Auto-connect appropriate wallet based on environment
  useEffect(() => {
    if (isConnected || connectors.length === 0) return
    
    const env = detectWalletEnvironment()
    const preferredName = getPreferredConnectorName(env)
    
    // Find matching connector
    const connector = connectors.find(c => 
      c.name.toLowerCase().includes(preferredName.toLowerCase())
    ) || connectors[0]
    
    if (connector) {
      connect({ connector })
    }
  }, [isConnected, connectors, connect])

  async function handleClaim() {
    if (!farcasterUser?.fid) {
      toast.error("Please sign in with Farcaster first")
      return
    }

    if (!isConnected || !walletClient) {
      toast.error("Please connect your wallet")
      return
    }

    if (chainId !== BASE_CHAIN_ID) {
      try {
        switchChain({ chainId: BASE_CHAIN_ID })
        return
      } catch {
        toast.error("Please switch to Base network")
        return
      }
    }

    try {
      setClaiming(true)

      // Get user's wallet address from Neynar
      let walletAddress = address
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
      toast.success("Points claimed! Your score is now on the leaderboard!")
      onSuccess()
    } catch (error: any) {
      console.error("Failed to claim points:", error)
      toast.error(error?.message || "Failed to claim points")
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
            Claiming...
          </>
        ) : !isConnected ? (
          <>
            <Wallet className="w-5 h-5" />
            Connect Wallet to Claim
          </>
        ) : chainId !== BASE_CHAIN_ID ? (
          <>
            <Zap className="w-5 h-5" />
            Switch to Base Network
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            Claim {score.toLocaleString()} Points
          </>
        )}
      </Button>

      <p className="text-xs text-center text-green-400/60">
        Top 10 weekly players win GEOX tokens every Sunday!
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
