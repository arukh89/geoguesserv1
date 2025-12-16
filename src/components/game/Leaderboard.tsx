"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Medal, Award, TrendingUp, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { fetchUserByFid } from "@/lib/neynar/client"

interface LeaderboardEntry {
  id: string
  playerName: string
  score: number
  rounds: number
  timestamp: number
  averageDistance: number
  fid: number | null
  pfpUrl?: string
}

interface LeaderboardProps {
  currentScore?: number
}

export default function Leaderboard({ currentScore }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchScores = async () => {
      try {
        const { data, error } = await supabase
          .rpc("get_top_leaderboard", { limit_count: 10 })

        if (error) {
          console.error("Failed to fetch scores from Supabase:", error)
          setEntries([])
          return
        }
        
        const mapped: LeaderboardEntry[] = (data || []).map((row: any) => {
          let playerName = row.player_name || "Anonymous"
          // Clean up bad identity values
          if (playerName === "fid:undefined" || playerName === "anonymous" || playerName === "Anonymous") {
            // Try to use identity if it looks like a username
            const identity = row.identity || ""
            if (identity.startsWith("@") || (identity && !identity.startsWith("fid:") && identity !== "anonymous")) {
              playerName = identity
            } else {
              playerName = "Anonymous"
            }
          }
          
          return {
            id: row.id,
            playerName,
            score: row.score_value,
            rounds: row.rounds,
            timestamp: new Date(row.created_at).getTime(),
            averageDistance: row.average_distance,
            fid: row.fid || null,
          }
        })
        
        setEntries(mapped)
        
        // Fetch PFPs for entries with FID
        const entriesWithFid = mapped.filter(e => e.fid)
        if (entriesWithFid.length > 0) {
          const pfpPromises = entriesWithFid.map(async (entry) => {
            if (!entry.fid) return null
            const userData = await fetchUserByFid(entry.fid)
            return { fid: entry.fid, pfpUrl: userData?.pfpUrl, username: userData?.username }
          })
          
          const pfpResults = await Promise.all(pfpPromises)
          
          setEntries(prev => prev.map(entry => {
            const pfpData = pfpResults.find(p => p?.fid === entry.fid)
            if (pfpData) {
              return {
                ...entry,
                pfpUrl: pfpData.pfpUrl,
                playerName: pfpData.username ? `@${pfpData.username}` : entry.playerName
              }
            }
            return entry
          }))
        }
      } catch (err) {
        console.error("Failed to fetch scores from Supabase:", err)
        setEntries([])
      } finally {
        setLoading(false)
      }
    }

    fetchScores()

    const channel = supabase
      .channel("scores_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "scores" }, () => {
        fetchScores()
      })
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [])

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => b.score - a.score).slice(0, 10)
  }, [entries])

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />
      case 3:
        return <Award className="w-6 h-6 text-orange-400" />
      default:
        return (
          <div className="w-6 h-6 flex items-center justify-center text-green-400/70 font-semibold">
            {rank}
          </div>
        )
    }
  }

  return (
    <Card className="bg-black/80 border-green-500/30 shadow-lg shadow-green-500/10">
      <CardHeader className="border-b border-green-500/30 bg-green-500/5">
        <CardTitle className="text-2xl flex items-center gap-2 text-green-400">
          <TrendingUp className="w-6 h-6" />
          Live Leaderboard
        </CardTitle>
        <CardDescription className="text-green-300/70">
          {loading ? "Loading scores..." : "Real-time scores"}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        {loading ? (
          <div className="text-center py-8 text-green-400/70">
            <div className="animate-pulse">Loading leaderboard...</div>
          </div>
        ) : sortedEntries.length === 0 ? (
          <div className="text-center py-8 text-green-400/70">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-green-500/30" />
            <p>No scores yet. Be the first to play!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedEntries.map((entry, index) => {
              const rank = index + 1
              const isCurrentScore = currentScore && entry.score === currentScore

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border border-green-500/20 bg-green-500/5 ${
                    isCurrentScore ? "ring-2 ring-green-400" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">{getMedalIcon(rank)}</div>
                    
                    {/* PFP */}
                    <div className="flex-shrink-0">
                      {entry.pfpUrl ? (
                        <img 
                          src={entry.pfpUrl} 
                          alt="" 
                          className="w-10 h-10 rounded-full object-cover border-2 border-green-500/30"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center border-2 border-green-500/30">
                          <User className="w-5 h-5 text-green-400/50" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold truncate text-green-300">{entry.playerName}</span>
                        {entry.fid && (
                          <span className="text-xs bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded font-mono border border-purple-500/50">
                            #{entry.fid}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-green-400/70">
                        {entry.rounds} rounds • Avg {entry.averageDistance}km
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold text-green-300">{entry.score.toLocaleString()}</div>
                      <div className="text-xs text-green-400/70">points</div>
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
