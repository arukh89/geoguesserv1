"use client"

import { motion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Medal, Award, TrendingUp } from "lucide-react"
import type { LeaderboardEntry } from "@/lib/game/types"
import { createClient } from "@/lib/supabase/client"

interface LeaderboardProps {
  currentScore?: number
}

export default function Leaderboard({ currentScore }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    // DEBUG: Log Supabase configuration
    console.log('[DEBUG] Leaderboard - Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ggjgxbqptiyuhioaoaru.supabase.co')
    console.log('[DEBUG] Leaderboard - Supabase project ref from URL:', (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ggjgxbqptiyuhioaoaru.supabase.co').replace('https://', '').replace('.supabase.co', ''))

    const fetchScores = async () => {
      try {
        // Use the database function to get top leaderboard
        const { data, error } = await supabase
          .rpc("get_top_leaderboard", { limit_count: 10 })

        if (error) {
          console.error("Failed to fetch scores from Supabase:", error)
          setEntries([])
        } else {
          const mapped: LeaderboardEntry[] = (data || []).map((row: any) => ({
            id: row.id,
            playerName: row.player_name || row.identity || "Anonymous",
            score: row.score_value,
            rounds: row.rounds,
            timestamp: new Date(row.created_at).getTime(),
            averageDistance: row.average_distance,
          }))
          setEntries(mapped)
        }
      } catch (err) {
        console.error("Failed to fetch scores from Supabase:", err)
        setEntries([])
      } finally {
        setLoading(false)
      }
    }

    fetchScores()

    // Set up real-time subscription for leaderboard updates
    const channel = supabase
      .channel("scores_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scores",
        },
        () => {
          // Refetch when data changes
          fetchScores()
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => b.score - a.score).slice(0, 10)
  }, [entries])

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-[var(--accent)]" />
      case 2:
        return <Medal className="w-6 h-6 text-[color:rgba(151,255,151,0.85)]" />
      case 3:
        return <Award className="w-6 h-6 text-[var(--accent)]" />
      default:
        return (
          <div className="w-6 h-6 flex items-center justify-center text-[color:rgba(151,255,151,0.7)] font-semibold">
            {rank}
          </div>
        )
    }
  }

  const getRankColor = (rank: number): string => "bg-[rgba(0,255,65,0.06)] border-[rgba(0,255,65,0.25)]"

  return (
    <Card className="mx-panel border mx-border shadow-[var(--shadow)] relative z-10">
      <CardHeader className="border-b mx-border text-[var(--text)] bg-[rgba(0,255,65,0.06)]">
        <CardTitle className="text-2xl flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Live Leaderboard
        </CardTitle>
        <CardDescription>{loading ? "Loading scores..." : "Real-time scores from Supabase"}</CardDescription>
      </CardHeader>

      <CardContent className="p-6 text-[var(--text)]">
        {loading ? (
          <div className="text-center py-8 text-[color:rgba(151,255,151,0.7)]">
            <div className="animate-pulse">Loading leaderboard...</div>
          </div>
        ) : sortedEntries.length === 0 ? (
          <div className="text-center py-8 text-[color:rgba(151,255,151,0.7)]">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-[color:rgba(151,255,151,0.35)]" />
            <p>No scores yet. Be the first to play!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedEntries.map((entry: LeaderboardEntry, index: number) => {
              const rank = index + 1
              const isCurrentScore = currentScore && entry.score === currentScore

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border ${getRankColor(rank)} ${
                    isCurrentScore ? "ring-2 ring-[var(--accent)]" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">{getMedalIcon(rank)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate text-[var(--text)]">{entry.playerName}</div>
                      <div className="text-sm text-[color:rgba(151,255,151,0.8)]">
                        {entry.rounds} rounds • Avg {entry.averageDistance}km
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold text-[var(--accent)]">{entry.score.toLocaleString()}</div>
                      <div className="text-xs text-[color:rgba(151,255,151,0.7)]">points</div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
