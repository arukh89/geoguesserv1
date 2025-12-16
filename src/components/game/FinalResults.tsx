import React from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, MapPin, Target, Share2, RotateCcw, TrendingUp, CheckCircle, AlertCircle, Home } from "lucide-react"
import type { RoundResult } from "@/lib/game/types"
import { formatDistance, calculateAverageDistance } from "@/lib/game/scoring"
import Leaderboard from "./Leaderboard"
import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useFarcasterUser } from "@/hooks/useFarcasterUser"
import { formatUsernameForDisplay, formatUsernameForCompactDisplay, isFarcasterUser, type FarcasterUser } from "@/lib/utils/formatUsernameFarcaster"

interface FinalResultsProps {
  results: RoundResult[]
  totalScore: number
  onPlayAgain: () => void
  onShare: () => void
  gameMode: "classic" | "no-move" | "time-attack"
  timeLimit?: number
}

// Only Time Attack 30s mode counts for leaderboard
const LEADERBOARD_MODE = "time-attack"
const LEADERBOARD_TIME_LIMIT = 30

export default function FinalResults({ results, totalScore, onPlayAgain, onShare, gameMode, timeLimit }: FinalResultsProps) {
  const isLeaderboardEligible = gameMode === LEADERBOARD_MODE && timeLimit === LEADERBOARD_TIME_LIMIT
  const { user: farcasterUser, loading: userLoading } = useFarcasterUser()
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
        message: "You're a geography master! Top 10 weekly players win GEO EXPLORER tokens!",
        emoji: "🌟",
      }
    } else if (percentage >= 75) {
      return {
        title: "Excellent",
        message: "Impressive knowledge of the world! Keep playing to climb the leaderboard!",
        emoji: "🎯",
      }
    } else if (percentage >= 60) {
      return {
        title: "Great",
        message: "You know your way around! Top 10 weekly players win rewards!",
        emoji: "👏",
      }
    } else if (percentage >= 40) {
      return {
        title: "Good",
        message: "Nice effort, keep exploring! Play more to improve your rank!",
        emoji: "👍",
      }
    } else {
      return {
        title: "Keep Learning",
        message: "Every explorer starts somewhere! Practice makes perfect!",
        emoji: "🗺️",
      }
    }
  }

  const performance = getPerformanceLevel(accuracyPercentage)

  const submittedRef = useRef(false)
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [submissionMessage, setSubmissionMessage] = useState<string>('')

  useEffect(() => {
    // Only submit scores for Time Attack 30s mode
    if (!isLeaderboardEligible) {
      setSubmissionStatus('idle')
      return
    }

    // Wait for user loading to complete before submitting
    if (userLoading) {
      setSubmissionStatus('submitting')
      setSubmissionMessage('Loading user data...')
      return
    }
    
    if (submittedRef.current) {
      return
    }
    submittedRef.current = true

    const submit = async () => {
      try {
        setSubmissionStatus('submitting')
        setSubmissionMessage('Submitting your score to leaderboard...')
        
        const supabase = createClient()

        // Use database function to insert score with validation
        // Store username and FID separately for proper display
        const playerName = farcasterUser?.username 
          ? `@${farcasterUser.username}` 
          : farcasterUser?.displayName || "Anonymous";
        const playerFid = farcasterUser?.fid || null;
        
        // Get wallet address from Farcaster user if available
        const walletAddress = farcasterUser?.verifiedAddresses?.[0] || farcasterUser?.custodyAddress || null;
        
        console.log("[FinalResults] Submitting score with:", { playerName, playerFid, walletAddress, farcasterUser })
        
        const { data, error } = await supabase.rpc("insert_score", {
          p_player_name: playerName,
          p_identity: walletAddress, // Store wallet address for token rewards
          p_score_value: totalScore,
          p_rounds: results.length,
          p_average_distance: Math.round(averageDistance),
          p_fid: playerFid,
          p_pfp_url: farcasterUser?.pfpUrl || null,
        })

        if (error) {
          console.error("Failed to submit score to Supabase:", error)
          setSubmissionStatus('error')
          setSubmissionMessage(`Failed to submit score: ${error.message}`)
        } else {
          console.log("Score submitted successfully:", data)
          setSubmissionStatus('success')
          setSubmissionMessage('Score submitted to leaderboard!')
        }
      } catch (err) {
        console.error("Failed to submit score to Supabase:", err)
        setSubmissionStatus('error')
        setSubmissionMessage(`Failed to submit score: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }
    
    submit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, isLeaderboardEligible])

  return (
    <div className="min-h-screen p-4 pt-16 md:pt-8 relative z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto space-y-6"
      >
        <Card className="shadow-2xl overflow-hidden mx-panel">
          <CardHeader className="border-b mx-border text-center bg-[rgba(0,255,65,0.06)]">
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <div className="text-6xl mb-2">{performance.emoji}</div>
              <CardTitle className="text-4xl mb-2 text-green-400">{performance.title}!</CardTitle>
              <CardDescription className="text-xl text-green-400 opacity-90">
                {performance.message}
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="p-6 space-y-6 text-green-200">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center py-6 rounded-lg mx-panel"
            >
              <div className="text-sm font-semibold text-green-400 mb-2 opacity-90">TOTAL SCORE</div>
              <div
                className="text-6xl font-bold text-green-400"
                style={{ filter: "drop-shadow(0 0 12px rgba(0,255,65,.6))" }}
              >
                {totalScore.toLocaleString()}
              </div>
              <div className="text-sm text-green-400 opacity-80 mt-2">
                {accuracyPercentage.toFixed(1)}% accuracy
              </div>
            </motion.div>

            {!isLeaderboardEligible && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-4 rounded-lg border-2 border-yellow-500/50 bg-yellow-500/10 flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <div className="text-sm font-medium text-yellow-300">
                  This score is not eligible for leaderboard. Play Time Attack 30s mode to compete for GEO token rewards!
                </div>
              </motion.div>
            )}

            {isLeaderboardEligible && submissionStatus !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={`p-4 rounded-lg border-2 flex items-center gap-3 ${
                  submissionStatus === 'success'
                    ? 'border-green-500/50 bg-green-500/10'
                    : submissionStatus === 'error'
                    ? 'border-red-500/50 bg-red-500/10'
                    : 'border-blue-500/50 bg-blue-500/10'
                }`}
              >
                {submissionStatus === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : submissionStatus === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                ) : (
                  <div className="w-5 h-5 border-2 border-blue-400/30 border-t-transparent rounded-full animate-spin" />
                )}
                <div className="text-sm font-medium">
                  {submissionMessage}
                </div>
              </motion.div>
            )}

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
                      <MapPin className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="font-semibold text-green-400">Avg Distance</div>
                  </div>
                  <div className="text-2xl font-bold text-green-400">{formatDistance(averageDistance)}</div>
                </CardContent>
              </Card>

              <Card className="mx-panel">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-[rgba(0,255,65,0.12)] border mx-border">
                      <Trophy className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="font-semibold text-green-400">Best Round</div>
                  </div>
                  <div className="text-2xl font-bold text-green-400">{bestRound.score.toLocaleString()}</div>
                  <div className="text-sm text-green-400 opacity-80 mt-1">{bestRound.location.name}</div>
                </CardContent>
              </Card>

              <Card className="mx-panel">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-[rgba(0,255,65,0.12)] border mx-border">
                      <Target className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="font-semibold text-green-400">Rounds</div>
                  </div>
                  <div className="text-2xl font-bold text-green-400">{results.length}</div>
                  <div className="text-sm text-green-400 opacity-80 mt-1">completed</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="mx-panel">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-400">
                    <TrendingUp className="w-5 h-5" />
                    Round Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.map((result: RoundResult, index: number) => (
                      <div key={result.round} className="flex items-center justify-between p-3 mx-panel">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center text-[var(--bg)] font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-green-400 truncate">{result.location.name}</div>
                            <div className="text-sm text-green-400 opacity-80">
                              {formatDistance(result.distance)} away
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-400">{result.score.toLocaleString()}</div>
                          <div className="text-xs text-green-400 opacity-70">points</div>
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
              <Button
                onClick={onPlayAgain}
                size="lg"
                variant="ghost"
                className="sm:flex-none h-14 px-6 text-lg font-semibold text-green-400 hover:text-green-300 hover:bg-green-500/10"
              >
                <Home className="w-5 h-5 mr-2" />
                Home
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
