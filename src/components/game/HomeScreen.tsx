"use client"

import React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Globe, MapPin, Trophy, Target, Gift, Lock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import GameModeDropdown from "./GameModeDropdown"
import ClaimRewards from "./ClaimRewards"
import { useFarcasterUser } from "@/hooks/useFarcasterUser"
import { WEEKLY_REWARDS } from "@/lib/contracts/geoxRewards"

interface HomeScreenProps {
  onStart: (mode: "classic" | "no-move" | "time-attack", durationSec?: number) => void
}

export default function HomeScreen({ onStart }: HomeScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [showRewards, setShowRewards] = useState(false)
  const [pendingReward, setPendingReward] = useState<{ rank: number; amount: number } | null>(null)
  const [loadingRank, setLoadingRank] = useState(false)
  const { user: farcasterUser } = useFarcasterUser()

  // Fetch user's current rank from weekly leaderboard
  const fetchCurrentRank = useCallback(async () => {
    if (!farcasterUser?.fid) return
    
    try {
      setLoadingRank(true)
      const response = await fetch(`/api/rewards?fid=${farcasterUser.fid}&current=true`)
      const data = await response.json()
      
      if (data.currentRank && data.currentRank <= 10) {
        const amount = WEEKLY_REWARDS[data.currentRank] || 0
        setPendingReward({ rank: data.currentRank, amount })
      } else {
        setPendingReward(null)
      }
    } catch (error) {
      console.error("Failed to fetch rank:", error)
    } finally {
      setLoadingRank(false)
    }
  }, [farcasterUser?.fid])

  useEffect(() => {
    fetchCurrentRank()
  }, [fetchCurrentRank])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf = 0
    let width = 0
    let height = 0
    let columns = 0
    let drops: number[] = []
    const chars = "アイウエオカキクケコサシスセソ012345789田由甲水火地風AEIOUY".split("")
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      width = rect ? rect.width : canvas.clientWidth
      height = rect ? rect.height : canvas.clientHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      columns = Math.floor(width / 14)
      drops = Array.from({ length: columns }, () => (Math.random() * -100) | 0)
    }

    const step = () => {
      ctx.fillStyle = "rgba(0,0,0,0.08)"
      ctx.fillRect(0, 0, width, height)
      for (let i = 0; i < drops.length; i++) {
        const x = i * 14 + 4
        const y = drops[i] * 18
        const ch = chars[(Math.random() * chars.length) | 0]
        ctx.fillStyle = Math.random() > 0.975 ? "#fff" : "#00ff41"
        ctx.font = "14px 'Share Tech Mono', monospace"
        ctx.fillText(ch, x, y)
        drops[i]++
        if (y > height && Math.random() > 0.975) drops[i] = (Math.random() * -50) | 0
      }
      raf = requestAnimationFrame(step)
    }

    const onResize = () => {
      cancelAnimationFrame(raf)
      resize()
      raf = requestAnimationFrame(step)
    }

    resize()
    raf = requestAnimationFrame(step)
    const ro = new ResizeObserver(onResize)
    ro.observe(canvas.parentElement || canvas)
    window.addEventListener("resize", onResize)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener("resize", onResize)
    }
  }, [])

  return (
    <div className="flex items-start justify-center relative isolate z-0 bg-black px-4 py-8 md:px-16 md:py-10 min-h-full overflow-auto">
      <GameModeDropdown onStart={onStart} />

      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 w-full h-full"
        style={{ opacity: 0.25, zIndex: -1 }}
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl w-full relative z-10"
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-block mb-4"
          >
            <div className="p-6 rounded-full bg-[rgba(0,255,65,0.15)] border-2 border-[rgba(0,255,65,0.5)] shadow-lg shadow-green-500/20">
              <Globe className="w-16 h-16 text-green-400" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-5xl md:text-6xl font-bold text-green-400 tracking-wide mb-3 drop-shadow-[0_0_15px_rgba(0,255,65,0.5)]"
            data-text="Farcaster Geo Explorer"
          >
            Farcaster Geo Explorer
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xl text-green-300 drop-shadow-[0_0_8px_rgba(0,255,65,0.3)]"
          >
            Explore the world. Test your geography skills. Share your scores.
          </motion.p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Card className="shadow-xl bg-black/80 border-2 border-green-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-green-400">How to Play</CardTitle>
              <CardDescription className="text-green-300/80">Master the world in 3 simple steps</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1 }}
                className="flex items-start gap-4"
              >
                <div className="p-3 rounded-lg bg-[rgba(0,255,65,0.15)] border-2 border-[rgba(0,255,65,0.4)]">
                  <Globe className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1 text-green-300">1. Explore</h3>
                  <p className="text-green-200/90">
                    You&apos;ll be dropped into a random location around the world. Look around using your mouse or
                    touch to drag the 360° view.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="flex items-start gap-4"
              >
                <div className="p-3 rounded-lg bg-[rgba(0,255,65,0.15)] border-2 border-[rgba(0,255,65,0.4)]">
                  <MapPin className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1 text-green-300">2. Guess</h3>
                  <p className="text-green-200/90">
                    Click on the world map to drop a pin where you think you are. The closer your guess, the higher your
                    score!
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.4 }}
                className="flex items-start gap-4"
              >
                <div className="p-3 rounded-lg bg-[rgba(0,255,65,0.15)] border-2 border-[rgba(0,255,65,0.4)]">
                  <Trophy className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1 text-green-300">3. Score & Share</h3>
                  <p className="text-green-200/90">
                    Earn up to 5,000 points per round. Complete 5 rounds and share your results with friends on
                    Farcaster!
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
                className="p-4 rounded-lg border-2 border-green-500/40 bg-[rgba(0,255,65,0.1)]"
              >
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-green-400" />
                  <p className="text-sm font-medium text-green-200">
                    <span className="font-bold text-green-300">Pro Tip:</span> Look for landmarks, architecture,
                    language signs, and vegetation to help identify your location!
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.7 }}
                className="p-4 rounded-lg border-2 border-yellow-500/40 bg-[rgba(255,200,0,0.1)]"
              >
                <div className="flex items-start gap-3">
                  <Trophy className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm font-medium text-green-200 space-y-1">
                    <p>
                      <span className="font-bold text-yellow-300">Leaderboard & Rewards:</span> Only{" "}
                      <span className="font-bold text-yellow-300">Time Attack 30s</span> mode counts!
                    </p>
                    <p className="text-green-200/80">
                      • Claim your points on Base network to submit to leaderboard
                    </p>
                    <p className="text-green-200/80">
                      • Top 10 weekly players win GEOX tokens!
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
                className="pt-4 text-center"
              >
                <p className="text-green-200/90">
                  Click <span className="font-semibold text-green-400">Game Mode</span> button on the left to start
                  playing!
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Claim Rewards Section */}
        {farcasterUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.9 }}
            className="mt-6"
          >
            {/* Pending Reward Preview - Always visible */}
            {loadingRank ? (
              <Card className="shadow-xl bg-black/80 border-2 border-yellow-500/30 backdrop-blur-sm mb-4">
                <CardContent className="p-4 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-yellow-400" />
                </CardContent>
              </Card>
            ) : pendingReward ? (
              <Card className="shadow-xl bg-black/80 border-2 border-yellow-500/30 backdrop-blur-sm mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-yellow-500/20 border border-yellow-500/40">
                        <Lock className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div>
                        <div className="text-sm text-yellow-400/80">Current Rank #{pendingReward.rank}</div>
                        <div className="text-2xl font-bold text-yellow-400">
                          {pendingReward.amount.toLocaleString()} GEOX
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-yellow-400/60 max-w-[140px]">
                        Locked until end of week
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-xs text-yellow-400/80 text-center">
                      ⚠️ Ranking may change. Claim available every Sunday for top 10.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {showRewards ? (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowRewards(false)}
                    className="text-green-400/70 hover:text-green-400 bg-transparent border-transparent hover:bg-green-500/10"
                  >
                    Hide Rewards
                  </Button>
                </div>
                <ClaimRewards />
              </div>
            ) : (
              <Card className="shadow-xl bg-black/80 border-2 border-green-500/30 backdrop-blur-sm">
                <CardContent className="p-4">
                  <Button
                    onClick={() => setShowRewards(true)}
                    variant="outline"
                    className="w-full h-12 text-green-400 border-green-500/50 hover:bg-green-500/10 gap-2"
                  >
                    <Gift className="w-5 h-5" />
                    View & Claim Your Rewards
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="text-center mt-6 text-sm text-green-300/70"
        >
          Powered by Farcaster • Built on Base
        </motion.p>
      </motion.div>
    </div>
  )
}
