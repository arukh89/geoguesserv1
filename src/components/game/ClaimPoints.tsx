"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAccount, useConnect, useWalletClient, usePublicClient, useChainId, useSwitchChain } from "wagmi"
import { toast } from "sonner"
import { Loader2, Wallet, CheckCircle, Zap } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useFarcasterUser } from "@/hooks/useFarcasterUser"
import { fetchUserByFid } from "@/lib/neynar/client"
import { parseEther } from "viem"

const BASE_CHAIN_ID = 8453
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
  const { isConnected, address } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)

  // Auto-connect first available connector on mount
  useEffect(() => {
    if (!isConnected && connectors.length > 0 && !isConnecting) {
      const connector = connectors[0]
      if (connector) {
        connect({ connector })
      }
    }
  }, [isConnected, connectors, connect, isConnecting])

  async function handleConnect() {
    if (connectors.length === 0) {
      toast.error("No wallet available")
      return
    }
    const connector = connectors[0]
    if (connector) {
      connect({ connector })
    }
  }

  async function handleClaim() {
    if (!farcasterUser?.fid) {
      toast.error("Please sign in with Farcaster first")
      return
    }

    if (!isConnected || !address || !walletClient) {
      toast.error("Please connect your wallet first")
      return
    }

    // Check chain
    if (chainId !== BASE_CHAIN_ID) {
      try {
        switchChain({ chainId: BASE_CHAIN_ID })
        toast.info("Please switch to Base network and try again")
        return
      } catch {
        toast.error("Please switch to Base network")
        return
      }
    }

    try {
      setClaiming(true)

      // Send 0 ETH transaction to contract (on-chain activity with gas fee)
      toast.loading("Confirming on Base...", { id: "claim-tx" })
      
      const hash = await walletClient.sendTransaction({
        to: GEOX_CONTRACT,
        value: parseEther("0"),
        data: `0x${Buffer.from(`claim:${farcasterUser.fid}:${score}:${Date.now()}`).toString("hex")}` as `0x${string}`,
      })

      // Wait for transaction
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash })
      }
      
      toast.dismiss("claim-tx")

      // Get user's verified wallet from Neynar
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
      toast.success("Points claimed on-chain! Your score is now on the leaderboard!")
      onSuccess()
    } catch (error: any) {
      console.error("Failed to claim points:", error)
      toast.dismiss("claim-tx")
      if (error?.message?.includes("rejected") || error?.message?.includes("denied")) {
        toast.error("Transaction rejected")
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
        onClick={!isConnected ? handleConnect : handleClaim}
        disabled={disabled || claiming || !farcasterUser || isConnecting}
        size="lg"
        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 gap-2"
      >
        {claiming ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Confirming on Base...
          </>
        ) : isConnecting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Connecting...
          </>
        ) : !isConnected ? (
          <>
            <Wallet className="w-5 h-5" />
            Connect Wallet to Claim
          </>
        ) : chainId !== BASE_CHAIN_ID ? (
          <>
            <Zap className="w-5 h-5" />
            Switch to Base & Claim
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
