import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, TrendingUp, Users, Calendar } from "lucide-react"
// import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useFarcasterUser } from "@/hooks/useFarcasterUser"
import { formatUsernameForDisplay, formatUsernameForCompactDisplay, isFarcasterUser, type FarcasterUser } from "@/lib/utils/formatUsernameFarcaster"
import type { LeaderboardEntry } from "@/lib/game/types"

interface WeeklyLeaderboardProps {
  period?: "daily" | "weekly" | "monthly" | "all-time"
  className?: string
  showPersonalScore?: boolean
  limit?: number
}

/**
 * Gets the date range text based on the period selected
 */
const getDateRangeText = (period: string): string => {
  switch (period) {
    case "daily":
      return "Today"
    case "weekly":
      const today = new Date()
      const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      return `${weekStart.toLocaleDateString("en-US", { month: "short" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short" })}`
    case "monthly":
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return `${monthStart.toLocaleDateString("en-US", { month: "short" })} - ${monthEnd.toLocaleDateString("en-US", { month: "short" })}`
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
  const { toast } = useToast()
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const userScore = 0 // Reset this since we don't have user scores in this context
  const isUserOnLeaderboard = leaderboardData.some(entry => entry.playerName === formatUsernameForDisplay(farcasterUser))

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()
        
        let query = supabase
          .from('leaderboard_weekly')
          .select('p_player_name, p_player_username, p_score_value, p_rounds, p_avg_distance, p_last_submit_date')
          .order('p_score_value', { ascending: false })
          .limit(limit)
        
        // Filter by period if specified
        if (period === "daily") {
          const today = new Date()
          const todayString = today.toISOString().split('T')[0]
          query = query.eq('p_last_submit_date', todayString)
        } else if (period === "weekly") {
          // Get current week's Monday (start of week)
          const today = new Date()
          const monday = new Date(today)
          monday.setDate(today.getDate() - today.getDay() + 1)
          const mondayString = monday.toISOString().split('T')[0]
          query = query.gte('p_last_submit_date', mondayString)
        } else if (period === "monthly") {
          // Get current month's start (1st day of month)
          const now = new Date()
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
          const firstDayString = firstDay.toISOString().split('T')[0]
          query = query.gte('p_last_submit_date', firstDayString)
        }

        const { data, error } = await query
        
        if (error) {
          console.error("Error fetching leaderboard:", error)
          toast({
            title: "Error",
            description: "Failed to load leaderboard data",
            variant: "destructive",
          })
        } else if (data) {
          setLeaderboardData(data.map((row: any) => ({
            id: row.id,
            playerName: row.p_player_name || row.p_player_username || "Anonymous",
            score: row.p_score_value || 0,
            rounds: row.p_rounds || 0,
            timestamp: new Date(row.p_last_submit_date).getTime(),
            averageDistance: row.p_avg_distance || 0,
          })))
        }
      } catch (err) {
        console.error("Error in fetchLeaderboardData:", err)
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        })
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

  const getRankBadgeColor = (rank: number): string => {
    if (rank === 1) return "bg-yellow-100 text-yellow-800"
    if (rank === 2) return "bg-gray-100 text-gray-800"
    if (rank === 3) return "bg-orange-100 text-orange-800"
    return "bg-gray-100 text-gray-600"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`max-w-6xl mx-auto ${className}`}
    >
      <Card className="shadow-2xl overflow-hidden">
        <CardHeader className="border-b mx-border">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Weekly Leaderboard
          </CardTitle>
          
          <div className="ml-auto flex gap-2">
            <div className="text-sm text-gray-600">
              {getDateRangeText(period)}
            </div>
            
            <div className="flex gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                  period === "daily" ? "bg-blue-100 text-blue-800" :
                  period === "weekly" ? "bg-green-100 text-green-800" :
                  period === "monthly" ? "bg-purple-100 text-purple-800" :
                  "bg-gray-100 text-gray-800"
                }`}
              >
                Daily
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                  period === "daily" ? "bg-blue-100 text-blue-800" :
                  period === "weekly" ? "bg-green-100 text-green-800" :
                  period === "monthly" ? "bg-purple-100 text-purple-800" :
                  "bg-gray-100 text-gray-800"
                }`}
              >
                Weekly
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                  period === "daily" ? "bg-blue-100 text-blue-800" :
                  period === "weekly" ? "bg-green-100 text-green-800" :
                  period === "monthly" ? "bg-purple-100 text-purple-800" :
                  "bg-gray-100 text-gray-800"
                }`}
              >
                Monthly
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                  period === "daily" ? "bg-blue-100 text-blue-800" :
                  period === "weekly" ? "bg-green-100 text-green-800" :
                  period === "monthly" ? "bg-purple-100 text-purple-800" :
                  "bg-gray-100 text-gray-800"
                }`}
              >
                All Time
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {showPersonalScore && farcasterUser && (
            <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
              <div className="text-center text-purple-800">
                <div className="text-sm font-medium mb-1">Your Score</div>
                <div className="text-4xl font-bold">
                  {userScore.toLocaleString()}
                </div>
                <div className="text-sm text-purple-600 mt-1">
                  {formatUsernameForDisplay(farcasterUser)}
                </div>
                <div className="text-xs text-purple-500 mt-2">
                  {!isUserOnLeaderboard && "Not on this week's leaderboard. Keep playing to get on top!"}
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-200 border-t-purple-700"></div>
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No scores yet this week. Be the first to play!
            </div>
          ) : (
            <div className="space-y-4">
              {leaderboardData.map((entry, index) => {
                const isCurrentUserEntry = entry.playerName === formatUsernameForDisplay(farcasterUser)
                
                return (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center p-4 rounded-lg border ${
                      isCurrentUserEntry
                        ? "border-green-200 bg-green-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex-shrink-0 w-12 text-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${getRankBadgeColor(index + 1)}`}>
                        {getRankIcon(index + 1)}
                      </div>
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">
                            #{index + 1}
                          </div>
                        </div>
                        
                        <div className="flex-grow">
                          <div className="flex items-center">
                            <div className="text-lg font-bold text-gray-900 truncate max-w-[180px]">
                              {entry.playerName}
                            </div>
                            {isCurrentUserEntry && (
                              <div className="ml-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                YOU
                              </div>
                            )}
                          </div>
                          
                          {entry.playerName !== entry.playerName && (
                            <div className="text-sm text-gray-500 truncate max-w-[120px]">
                              {formatUsernameForDisplay({
                                username: entry.playerName,
                                displayName: entry.playerName
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {entry.score.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        points
                      </div>
                      
                      <div className="flex justify-center gap-2 mt-1 text-xs text-gray-500">
                        <div className="flex items-center">
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          {entry.rounds || 0} rounds
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 text-blue-500" />
                          {entry.averageDistance ? `avg ${entry.averageDistance.toFixed(0)}km` : "N/A"}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
          
          <div className="flex justify-center mt-6">
            <div className="text-sm text-gray-500">
              {showPersonalScore ? (
                <span>Showing top {limit} scores for {getDateRangeText(period)}</span>
              ) : (
                <span>Showing top {limit} scores for all time</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
