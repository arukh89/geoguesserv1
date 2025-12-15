"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Calendar, Award } from "lucide-react"

interface WeeklyScore {
  id: string
  identity: string
  score_value: number
  created_at: string
  week_start: string
  week_end: string
  weekly_rank: number
}

interface AdminReward {
  recipient_wallet: string
  week_start: string
  amount: number
  tx_hash: string
}

export function WeeklyLeaderboard() {
  const [weeklyScores, setWeeklyScores] = useState<WeeklyScore[]>([])
  const [rewards, setRewards] = useState<AdminReward[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWeeklyLeaderboard()
  }, [])

  const loadWeeklyLeaderboard = async () => {
    const supabase = createBrowserClient()
    
    // DEBUG: Log Supabase configuration
    console.log('[DEBUG] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ggjgxbqptiyuhioaoaru.supabase.co')
    console.log('[DEBUG] Supabase project ref from URL:', (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ggjgxbqptiyuhioaoaru.supabase.co').replace('https://', '').replace('.supabase.co', ''))

    try {
      // Get current week's leaderboard
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      startOfWeek.setHours(0, 0, 0, 0)

      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)

      // Get top 10 scores for current week using database function
      const { data: scores, error: scoresError } = await supabase
        .rpc("get_weekly_leaderboard", {
          week_start_date: startOfWeek.toISOString().split("T")[0]
        })

      if (scoresError) throw scoresError

      // Transform data to match WeeklyScore interface
      const rankedScores: WeeklyScore[] = (scores || []).map((score: any) => ({
        id: score.id,
        identity: score.identity,
        score_value: score.score_value,
        created_at: startOfWeek.toISOString(), // Using the week start as created_at for compatibility
        week_start: score.week_start,
        week_end: score.week_end,
        weekly_rank: score.weekly_rank,
      }))

      // Get admin rewards for this week using database function
      const { data: rewardsData, error: rewardsError } = await supabase
        .rpc("get_weekly_rewards", {
          week_start_date: startOfWeek.toISOString().split("T")[0]
        })

      if (rewardsError) throw rewardsError

      setWeeklyScores(rankedScores)
      setRewards(rewardsData || [])
    } catch (error) {
      console.error("[v0] Failed to load weekly leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRewardAmount = (rank: number): string => {
    const rewardTiers: { [key: number]: string } = {
      1: "1000",
      2: "500",
      3: "250",
      4: "150",
      5: "100",
      6: "75",
      7: "50",
      8: "40",
      9: "30",
      10: "25",
    }
    return rewardTiers[rank] || "0"
  }

  const hasReceivedReward = (wallet: string) => {
    return rewards.some((reward) => reward.recipient_wallet.toLowerCase() === wallet.toLowerCase())
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Leaderboard</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Weekly Leaderboard
            </CardTitle>
            <CardDescription>The top 10 on the leaderboard will receive GEO EXPLORER tokens (only for the top 50 DEAFS token holders — you can buy DEAFS on Mint Club).!</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {weeklyScores[0] && (
              <span>
                {new Date(weeklyScores[0].week_start).toLocaleDateString()} -{" "}
                {new Date(weeklyScores[0].week_end).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {weeklyScores.map((score) => {
            const rewarded = hasReceivedReward(score.identity)
            return (
              <div
                key={score.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  score.weekly_rank <= 3
                    ? "bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/20"
                    : score.weekly_rank <= 10
                      ? "bg-gradient-to-r from-blue-500/5 to-transparent border-blue-500/10"
                      : "bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-bold flex-shrink-0 ${
                      score.weekly_rank === 1
                        ? "bg-yellow-500 text-black"
                        : score.weekly_rank === 2
                          ? "bg-gray-400 text-black"
                          : score.weekly_rank === 3
                            ? "bg-amber-600 text-white"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {score.weekly_rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm truncate">{score.identity}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                      <span>Score: {score.score_value.toLocaleString()}</span>
                      {score.weekly_rank <= 10 && (
                        <span className="text-green-600 font-semibold">
                          • Prize: {getRewardAmount(score.weekly_rank)} GEO EXPLORER
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {rewarded && (
                  <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    <Award className="h-4 w-4" />
                    Rewarded
                  </div>
                )}
              </div>
            )
          })}

          {weeklyScores.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No scores yet this week</p>
              <p className="text-sm mt-1">Be the first to play and win GEO EXPLORER tokens!</p>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-muted/30 border">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Weekly winners will receive GEO EXPLORER tokens directly from our admin team. Make sure
            your wallet address is correct when playing!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
