"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, MapPin, Target, Share2, RotateCcw, TrendingUp } from "lucide-react"
import type { RoundResult } from "@/lib/game/types"
import { formatDistance, calculateAverageDistance } from "@/lib/game/scoring"
import Leaderboard from "./Leaderboard"
import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

interface FinalResultsProps {
  results: RoundResult[]
  totalScore: number
  onPlayAgain: () => void
  onShare: () => void
}

export default function FinalResults({ results, totalScore, onPlayAgain, onShare }: FinalResultsProps) {
  const distances = results.map((r: RoundResult) => r.distance)
  const averageDistance = calculateAverageDistance(distances)
  const bestRound = results.reduce((best: RoundResult, current: RoundResult) =>
    current.score > best.score ? current : best,
  )
  const maxPossibleScore = results.length * 5000
  const accuracyPercentage = (totalScore / maxPossibleScore) * 100

  const getPerformanceLevel = (percentage: number): { title: string; message: string; emoji: string } => {
    if (percentage >= 90) {
      return {
        title: "Legendary",
        message: "You're a geography master!",
        emoji: "🌟",
      }
    } else if (percentage >= 75) {
      return {
        title: "Excellent",
        message: "Impressive knowledge of the world!",
        emoji: "🎯",
      }
    } else if (percentage >= 60) {
      return {
        title: "Great",
        message: "You know your way around!",
        emoji: "👏",
      }
    } else if (percentage >= 40) {
      return {
        title: "Good",
        message: "Nice effort, keep exploring!",
        emoji: "👍",
      }
    } else {
      return {
        title: "Keep Learning",
        message: "Every explorer starts somewhere!",
        emoji: "🗺️",
      }
    }
  }

  const performance = getPerformanceLevel(accuracyPercentage)

  const submittedRef = useRef(false)

  useEffect(() => {
    if (submittedRef.current) {
      return
    }
    submittedRef.current = true

    const submit = async () => {
      try {
        const supabase = createClient()

        // Use database function to insert score with validation
        const { error } = await supabase.rpc("insert_score", {
          p_player_name: "You",
          p_score_value: totalScore,
          p_rounds: results.length,
          p_average_distance: Math.round(averageDistance),
        })

        if (error) {
          console.error("Failed to submit score to Supabase:", error)
        }
      } catch (err) {
        console.error("Failed to submit score to Supabase:", err)
      }
    }
    submit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen p-4 pt-16 md:pt-8 relative z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto space-y-6"
      >
        <Card className="shadow-2xl overflow-hidden mx-panel">
          <CardHeader className="text-center border-b mx-border">
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <div className="text-6xl mb-2">{performance.emoji}</div>
              <CardTitle className="text-4xl mb-2 text-[var(--accent)]">{performance.title}!</CardTitle>
              <CardDescription className="text-[var(--accent)] text-xl opacity-90">
                {performance.message}
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="p-6 space-y-6 text-[var(--text)]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center py-6 rounded-lg mx-panel"
            >
              <div className="text-sm font-semibold text-[var(--accent)] mb-2 opacity-90">TOTAL SCORE</div>
              <div
                className="text-6xl font-bold text-[var(--accent)]"
                style={{ filter: "drop-shadow(0 0 12px rgba(0,255,65,.6))" }}
              >
                {totalScore.toLocaleString()}
              </div>
              <div className="text-sm text-[var(--accent)] opacity-80 mt-2">
                {accuracyPercentage.toFixed(1)}% accuracy
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <Card className="mx-panel">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-[rgba(0,255,65,0.12)] border mx-border">
                      <MapPin className="w-5 h-5 text-[var(--accent)]" />
                    </div>
                    <div className="font-semibold text-[var(--accent)]">Avg Distance</div>
                  </div>
                  <div className="text-2xl font-bold text-[var(--accent)]">{formatDistance(averageDistance)}</div>
                </CardContent>
              </Card>

              <Card className="mx-panel">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-[rgba(0,255,65,0.12)] border mx-border">
                      <Trophy className="w-5 h-5 text-[var(--accent)]" />
                    </div>
                    <div className="font-semibold text-[var(--accent)]">Best Round</div>
                  </div>
                  <div className="text-2xl font-bold text-[var(--accent)]">{bestRound.score.toLocaleString()}</div>
                  <div className="text-sm text-[var(--accent)] opacity-80 mt-1">{bestRound.location.name}</div>
                </CardContent>
              </Card>

              <Card className="mx-panel">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-[rgba(0,255,65,0.12)] border mx-border">
                      <Target className="w-5 h-5 text-[var(--accent)]" />
                    </div>
                    <div className="font-semibold text-[var(--accent)]">Rounds</div>
                  </div>
                  <div className="text-2xl font-bold text-[var(--accent)]">{results.length}</div>
                  <div className="text-sm text-[var(--accent)] opacity-80 mt-1">completed</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
              <Card className="mx-panel">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[var(--accent)]">
                    <TrendingUp className="w-5 h-5" />
                    Round Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.map((result: RoundResult, index: number) => (
                      <div key={result.round} className="flex items-center justify-between p-3 mx-panel">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 text-[var(--bg)] bg-[var(--accent)] rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--accent)]">{result.location.name}</div>
                            <div className="text-sm text-[var(--accent)] opacity-80">
                              {formatDistance(result.distance)} away
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-[var(--accent)]">{result.score.toLocaleString()}</div>
                          <div className="text-xs text-[var(--accent)] opacity-70">points</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Button onClick={onShare} size="lg" className="flex-1 h-14 text-lg font-semibold">
                <Share2 className="w-5 h-5 mr-2" />
                Share on Farcaster
              </Button>
              <Button
                onClick={onPlayAgain}
                size="lg"
                variant="outline"
                className="flex-1 h-14 text-lg font-semibold bg-transparent"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Play Again
              </Button>
            </motion.div>
          </CardContent>
        </Card>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.1 }}>
          <Leaderboard currentScore={totalScore} />
        </motion.div>
      </motion.div>
    </div>
  )
}
