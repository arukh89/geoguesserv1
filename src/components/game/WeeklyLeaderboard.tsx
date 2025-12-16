"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, TrendingUp, Calendar } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useFarcasterUser } from "@/hooks/useFarcasterUser"
import { formatUsernameForDisplay } from "@/lib/utils/formatUsernameFarcaster"
import type { LeaderboardEntry } from "@/lib/game/types"

interface WeeklyLeaderboardProps {
  period?: "daily" | "weekly" | "monthly" | "all-time"
  className?: string
  showPersonalScore?: boolean
  limit?: number
}

const getDateRangeText = (period: string): string => {
  switch (period) {
    case "daily":
      return "Today"
    case "weekly":
      const today = new Date()
      const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      return `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    case "monthly":
      return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })
    case "all-time":
      return "All Time"
    default:
      return "This Week"
  }
}

export default function WeeklyLeaderboard({
  period = "weekly",
  className = "",
  showPersonalScore = true,
  limit = 10
}: WeeklyLeaderboardProps) {
  const { user: farcasterUser } = useFarcasterUser()
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()
        
        const { data, error } = await supabase
          .from('leaderboard_weekly')
          .select('p_player_name, p_player_username, p_score_value, p_rounds, p_avg_distance, p_last_submit_date, p_fid')
          .order('p_score_value', { ascending: false })
          .limit(limit)

        if (error) {
          console.error("Error fetching leaderboard:", error)
        } else if (data) {
          setLeaderboardData(data.map((row: any) => ({
            id: row.id,
            playerName: row.p_player_name || row.p_player_username || "Anonymous",
            score: row.p_score_value || 0,
            rounds: row.p_rounds || 0,
            timestamp: new Date(row.p_last_submit_date).getTime(),
            averageDistance: row.p_avg_distance || 0,
            fid: row.p_fid || null,
          })))
        }
      } catch (err) {
        console.error("Error in fetchLeaderboardData:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboardData()
  }, [period, limit])

  const getRankIcon = (rank: number): string | null => {
    if (rank === 1) return "🥇"
    if (rank === 2) return "🥈"
    if (rank === 3) return "🥉"
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`max-w-6xl mx-auto ${className}`}
    >
      <Card className="shadow-2xl overflow-hidden bg-black/80 border-green-500/30">
        <CardHeader className="border-b border-green-500/30 bg-green-500/5">
          <CardTitle className="flex items-center gap-2 text-green-400">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Weekly Leaderboard
          </CardTitle>
          <div className="text-sm text-green-300/70 mt-1">
            {getDateRangeText(period)}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500/30 border-t-green-400"></div>
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="text-center py-8 text-green-400/70">
              No scores yet this week. Be the first to play!
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboardData.map((entry, index) => {
                const isCurrentUserEntry = farcasterUser?.fid && (entry as any).fid === farcasterUser.fid
                
                return (
                  <motion.div
                    key={entry.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center p-4 rounded-lg border ${
                      isCurrentUserEntry
                        ? "border-green-400 bg-green-500/10"
                        : "border-green-500/20 bg-green-500/5"
                    }`}
                  >
                    <div className="flex-shrink-0 w-14 text-center">
                      <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-lg font-bold ${
                        index < 3 ? "bg-green-500/20 text-green-300" : "bg-green-500/10 text-green-400/70"
                      }`}>
                        {getRankIcon(index + 1) || `#${index + 1}`}
                      </div>
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-lg font-bold text-green-300 truncate">
                          {entry.playerName}
                        </span>
                        {(entry as any).fid && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-mono">
                            FID: {(entry as any).fid}
                          </span>
                        )}
                        {isCurrentUserEntry && (
                          <span className="text-xs bg-green-400 text-black px-2 py-0.5 rounded-full font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-green-400/70">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {entry.rounds || 0} rounds
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {entry.averageDistance ? `~${Math.round(entry.averageDistance)}km avg` : "N/A"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-300">
                        {entry.score.toLocaleString()}
                      </div>
                      <div className="text-xs text-green-400/70">
                        points
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
          
          <div className="text-center mt-6 text-sm text-green-400/60">
            Showing top {limit} scores for {getDateRangeText(period)}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
