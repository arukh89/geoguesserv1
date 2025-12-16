"use client"

import React, { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Trophy, Calendar, Target, TrendingUp, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { FarcasterUser } from "@/hooks/useFarcasterUser"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: FarcasterUser | null
}

interface WeeklyScore {
  id: string
  score_value: number
  rounds: number
  average_distance: number
  created_at: string
}

export default function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  const [weeklyScores, setWeeklyScores] = useState<WeeklyScore[]>([])
  const [loading, setLoading] = useState(false)
  const [totalScore, setTotalScore] = useState(0)
  const [totalRounds, setTotalRounds] = useState(0)
  const [bestScore, setBestScore] = useState(0)

  useEffect(() => {
    if (isOpen && user?.fid) {
      loadWeeklyHistory()
    }
  }, [isOpen, user?.fid])

  async function loadWeeklyHistory() {
    if (!user?.fid) return
    
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Get current week start
      const now = new Date()
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      weekStart.setHours(0, 0, 0, 0)

      // Fetch scores for this user this week
      const { data, error } = await supabase
        .from("scores")
        .select("id, score_value, rounds, average_distance, created_at")
        .eq("fid", user.fid)
        .gte("created_at", weekStart.toISOString())
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Failed to load weekly history:", error)
      } else if (data) {
        setWeeklyScores(data)
        
        // Calculate stats
        const total = data.reduce((sum, s) => sum + (s.score_value || 0), 0)
        const rounds = data.reduce((sum, s) => sum + (s.rounds || 0), 0)
        const best = Math.max(...data.map(s => s.score_value || 0), 0)
        
        setTotalScore(total)
        setTotalRounds(rounds)
        setBestScore(best)
      }
    } catch (err) {
      console.error("Error loading history:", err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { 
      weekday: "short", 
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/95 border-2 border-green-500/50 text-green-300 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-green-400 text-xl flex items-center gap-3">
            {user?.pfpUrl ? (
              <img 
                src={user.pfpUrl} 
                alt="Profile" 
                className="w-12 h-12 rounded-full object-cover border-2 border-green-500/50"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500/50">
                <User className="w-6 h-6 text-green-400" />
              </div>
            )}
            <div>
              <div className="font-bold">
                {user?.username ? `@${user.username}` : user?.displayName || "Anonymous"}
              </div>
              {user?.fid && (
                <div className="text-sm text-green-400/70 font-mono">FID: {user.fid}</div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Weekly Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-green-500/10 border-green-500/30 p-3 text-center">
              <Trophy className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-green-300">{totalScore.toLocaleString()}</div>
              <div className="text-xs text-green-400/70">Total Score</div>
            </Card>
            <Card className="bg-green-500/10 border-green-500/30 p-3 text-center">
              <Target className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-green-300">{totalRounds}</div>
              <div className="text-xs text-green-400/70">Rounds</div>
            </Card>
            <Card className="bg-green-500/10 border-green-500/30 p-3 text-center">
              <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-green-300">{bestScore.toLocaleString()}</div>
              <div className="text-xs text-green-400/70">Best Score</div>
            </Card>
          </div>

          {/* Weekly History */}
          <div>
            <h3 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              This Week's Games
            </h3>
            
            {loading ? (
              <div className="text-center py-4 text-green-400/70">Loading...</div>
            ) : weeklyScores.length === 0 ? (
              <div className="text-center py-4 text-green-400/70">
                No games played this week yet. Start playing!
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {weeklyScores.map((score) => (
                  <Card key={score.id} className="bg-green-500/5 border-green-500/20 p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-green-300">{score.score_value.toLocaleString()} pts</div>
                        <div className="text-xs text-green-400/70">{formatDate(score.created_at)}</div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-green-300">{score.rounds} rounds</div>
                        <div className="text-green-400/70">~{score.average_distance}km avg</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
