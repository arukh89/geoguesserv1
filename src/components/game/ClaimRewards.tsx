"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useFarcasterUser } from "@/hooks/useFarcasterUser"
import { toast } from "sonner"
import { createPublicClient, custom } from "viem"
import { base } from "viem/chains"
import { 
  Loader2, 
  Gift, 
  Trophy, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Wallet,
  Sparkles
} from "lucide-react"
import { 
  GEOX_REWARDS_CONTRACT,
  GEOX_REWARDS_ABI,
  formatRewardAmount,
  type WeeklyReward 
} from "@/lib/contracts/geoxRewards"
import { fetchUserByFid } from "@/lib/neynar/client"
import { 
  getMiniAppProvider, 
  getMiniAppWalletClient, 
  ensureBaseChain, 
  getPrimaryAccount 
} from "@/lib/web3/miniappProvider"

interface ClaimRewardsProps {
  onClose?: () => void
}

export function ClaimRewards({ onClose }: ClaimRewardsProps) {
  const { user: farcasterUser, loading: userLoading } = useFarcasterUser()
  
  const [rewards, setRewards] = useState<WeeklyReward[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<Record<number, boolean>>({})
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  // Fetch user's wallet address from Neynar
  useEffect(() => {
    async function fetchWallet() {
      if (farcasterUser?.fid) {
        try {
          const neynarUser = await fetchUserByFid(farcasterUser.fid)
          if (neynarUser?.primaryEthAddress) {
            setWalletAddress(neynarUser.primaryEthAddress)
          } else if (neynarUser?.verifiedAddresses?.[0]) {
            setWalletAddress(neynarUser.verifiedAddresses[0])
          }
        } catch (e) {
          console.warn("Failed to fetch wallet:", e)
        }
      }
    }
    fetchWallet()
  }, [farcasterUser?.fid])

  // Fetch user's rewards
  const fetchRewards = useCallback(async () => {
    if (!farcasterUser?.fid) {
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      const response = await fetch(`/api/rewards?fid=${farcasterUser.fid}`)
      const data = await response.json()
      
      if (data.rewards) {
        const formattedRewards: WeeklyReward[] = data.rewards.map((r: any) => ({
          weekId: r.week_id,
          rank: r.rank,
          points: r.total_score,
          amount: r.amount,
          username: r.player_name?.replace('@', '') || '',
          pfpUrl: r.pfp_url || '',
          deadline: new Date(r.claim_deadline).getTime() / 1000,
          signature: r.signature,
          claimed: r.claimed,
          expired: r.is_expired,
        }))
        setRewards(formattedRewards)
      }
    } catch (error) {
      console.error("Failed to fetch rewards:", error)
      toast.error("Failed to load rewards")
    } finally {
      setLoading(false)
    }
  }, [farcasterUser?.fid])

  useEffect(() => {
    fetchRewards()
  }, [fetchRewards])

  // Handle claim with contract interaction using Farcaster SDK
  async function handleClaim(reward: WeeklyReward) {
    if (!GEOX_REWARDS_CONTRACT) {
      toast.error("Rewards contract not configured yet")
      return
    }
    
    if (reward.claimed) {
      toast.error("This reward has already been claimed")
      return
    }
    
    if (reward.expired) {
      toast.error("Claim deadline has passed")
      return
    }

    try {
      setClaiming(prev => ({ ...prev, [reward.weekId]: true }))
      toast.loading("Connecting wallet...", { id: 'claim' })

      // Get provider using Farcaster SDK pattern
      const provider = await getMiniAppProvider()
      if (!provider) {
        toast.dismiss('claim')
        toast.error("No wallet available. Please open in Warpcast.")
        setClaiming(prev => ({ ...prev, [reward.weekId]: false }))
        return
      }

      // Ensure we're on Base chain
      await ensureBaseChain(provider)

      // Get wallet client
      const walletClient = await getMiniAppWalletClient()
      if (!walletClient) {
        toast.dismiss('claim')
        toast.error("Failed to connect wallet")
        setClaiming(prev => ({ ...prev, [reward.weekId]: false }))
        return
      }

      // Get account
      const account = await getPrimaryAccount(provider, walletClient)

      // Get signature if not already have one
      let signature = reward.signature
      if (!signature) {
        toast.loading("Getting signature...", { id: 'claim' })
        const signResponse = await fetch('/api/rewards/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fid: farcasterUser?.fid,
            weekId: reward.weekId,
          }),
        })
        
        if (!signResponse.ok) {
          const error = await signResponse.json()
          throw new Error(error.error || 'Failed to get signature')
        }
        
        const signData = await signResponse.json()
        signature = signData.signature
      }

      if (!signature) {
        throw new Error('No signature available')
      }

      toast.loading("Claiming reward...", { id: 'claim' })

      // Call contract to claim
      const hash = await walletClient.writeContract({
        account,
        address: GEOX_REWARDS_CONTRACT,
        abi: GEOX_REWARDS_ABI,
        functionName: 'claimReward',
        args: [
          BigInt(reward.weekId),
          BigInt(reward.rank),
          BigInt(reward.points),
          reward.username,
          reward.pfpUrl,
          BigInt(reward.deadline),
          signature as `0x${string}`,
        ],
      })

      // Wait for transaction
      const publicClient = createPublicClient({ chain: base, transport: custom(provider) })
      await publicClient.waitForTransactionReceipt({ hash })
      
      toast.dismiss('claim')
      toast.success(`Claimed ${formatRewardAmount(reward.amount)}! Check your wallet for GEOX tokens and NFT badge.`)
      
      // Update database
      await fetch('/api/rewards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardId: `${farcasterUser?.fid}-${reward.weekId}`,
          txHash: hash,
        }),
      })
      
      fetchRewards()
    } catch (error: any) {
      console.error("Failed to claim:", error)
      toast.dismiss('claim')
      if (error?.message?.includes('rejected') || error?.message?.includes('denied')) {
        toast.error("Transaction cancelled")
      } else if (error?.message === "no_account") {
        toast.error("Please connect your wallet in Warpcast")
      } else {
        toast.error(error?.message || "Failed to claim reward")
      }
    } finally {
      setClaiming(prev => ({ ...prev, [reward.weekId]: false }))
    }
  }

  // Loading state
  if (userLoading || loading) {
    return (
      <Card className="bg-black/80 border-green-500/30">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-green-400" />
        </CardContent>
      </Card>
    )
  }

  // Not logged in
  if (!farcasterUser) {
    return (
      <Card className="bg-black/80 border-green-500/30">
        <CardContent className="p-6 text-center">
          <Wallet className="w-12 h-12 mx-auto mb-4 text-green-400/50" />
          <p className="text-green-400/80">Sign in with Farcaster to view your rewards</p>
        </CardContent>
      </Card>
    )
  }

  const claimableRewards = rewards.filter(r => !r.claimed && !r.expired)
  const claimedRewards = rewards.filter(r => r.claimed)
  const expiredRewards = rewards.filter(r => !r.claimed && r.expired)

  return (
    <Card className="bg-black/80 border-green-500/30">
      <CardHeader className="border-b border-green-500/20">
        <CardTitle className="flex items-center gap-2 text-green-400">
          <Gift className="w-5 h-5" />
          Weekly GEOX Rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Wallet info */}
        {walletAddress && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 text-xs text-green-400/80">
              <Wallet className="w-4 h-4" />
              <span>Rewards will be sent to:</span>
            </div>
            <div className="font-mono text-sm text-green-400 mt-1 truncate">
              {walletAddress}
            </div>
          </div>
        )}

        {/* Info about NFT */}
        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 text-xs text-purple-400">
            <Sparkles className="w-4 h-4" />
            <span>Each claim includes a Dynamic NFT Badge!</span>
          </div>
        </div>

        {/* Claimable rewards */}
        {claimableRewards.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-green-400 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Claimable ({claimableRewards.length})
            </h3>
            {claimableRewards.map(reward => (
              <RewardCard
                key={reward.weekId}
                reward={reward}
                onClaim={() => handleClaim(reward)}
                claiming={claiming[reward.weekId]}
              />
            ))}
          </div>
        )}

        {/* Claimed rewards */}
        {claimedRewards.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-green-400/70 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Claimed ({claimedRewards.length})
            </h3>
            {claimedRewards.map(reward => (
              <RewardCard key={reward.weekId} reward={reward} claimed />
            ))}
          </div>
        )}

        {/* Expired rewards */}
        {expiredRewards.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-red-400/70 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Expired ({expiredRewards.length})
            </h3>
            {expiredRewards.map(reward => (
              <RewardCard key={reward.weekId} reward={reward} expired />
            ))}
          </div>
        )}

        {/* No rewards */}
        {rewards.length === 0 && (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-green-400/30" />
            <p className="text-green-400/60 text-sm">No rewards yet</p>
            <p className="text-green-400/40 text-xs mt-1">
              Finish in top 10 weekly to earn GEOX tokens!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface RewardCardProps {
  reward: WeeklyReward
  onClaim?: () => void
  claiming?: boolean
  claimed?: boolean
  expired?: boolean
}

function RewardCard({ 
  reward, 
  onClaim, 
  claiming, 
  claimed, 
  expired,
}: RewardCardProps) {
  const deadline = new Date(reward.deadline * 1000)
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  
  return (
    <div className={`p-3 rounded-lg border ${
      claimed 
        ? 'bg-green-500/5 border-green-500/20' 
        : expired 
        ? 'bg-red-500/5 border-red-500/20 opacity-60'
        : 'bg-green-500/10 border-green-500/30'
    }`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-green-400">
              #{reward.rank}
            </span>
            <span className="text-sm text-green-400/80">
              Week {reward.weekId}
            </span>
          </div>
          <div className="text-xl font-bold text-green-400 mt-1">
            {formatRewardAmount(reward.amount)}
          </div>
          <div className="text-xs text-green-400/60 mt-1">
            Score: {reward.points?.toLocaleString() || 0} pts
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {claimed ? (
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              Claimed
            </div>
          ) : expired ? (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              Expired
            </div>
          ) : (
            <>
              <Button
                size="sm"
                onClick={onClaim}
                disabled={claiming || !GEOX_REWARDS_CONTRACT}
                className="gap-1"
              >
                {claiming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Gift className="w-4 h-4" />
                )}
                Claim
              </Button>
              <div className="flex items-center gap-1 text-xs text-yellow-400/80">
                <Clock className="w-3 h-3" />
                {daysLeft}d left
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClaimRewards
