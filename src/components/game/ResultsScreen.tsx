"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Target, MapPin, ArrowRight } from "lucide-react"
import type { RoundResult } from "@/lib/game/types"
import { formatDistance, getPerformanceMessage } from "@/lib/game/scoring"

interface ResultsScreenProps {
  result: RoundResult
  onNext: () => void
  isLastRound: boolean
}

export default function ResultsScreen({ result, onNext, isLastRound }: ResultsScreenProps) {
  const scorePercentage = (result.score / 5000) * 100
  const performanceMessage = getPerformanceMessage(result.score, 5000)

  const latToY = (lat: number) => ((90 - lat) / 180) * 100
  const lngToX = (lng: number) => ((lng + 180) / 360) * 100

  const actualX = lngToX(result.location.lng)
  const actualY = latToY(result.location.lat)
  const guessX = lngToX(result.guess.lng)
  const guessY = latToY(result.guess.lat)

  return (
    <div className="min-h-screen p-4 pt-16 md:pt-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        <Card className="shadow-2xl overflow-hidden mx-panel">
          <CardHeader className="border-b mx-border">
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <CardTitle className="text-3xl flex items-center gap-3 text-green-400 font-bold">
                <Trophy className="w-8 h-8" />
                Round {result.round} Results
              </CardTitle>
              <CardDescription className="text-green-400 text-lg mt-2 font-semibold opacity-90">
                {performanceMessage}
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <Card className="mx-panel">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-[rgba(0,255,65,0.15)] border mx-border">
                      <Target className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="font-semibold text-green-400">Location</div>
                  </div>
                  <div className="text-2xl font-bold text-green-400">{result.location.name}</div>
                  <div className="text-sm text-green-400 mt-1 opacity-80">{result.location.country}</div>
                </CardContent>
              </Card>

              <Card className="mx-panel">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-[rgba(0,255,65,0.15)] border mx-border">
                      <MapPin className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="font-semibold text-green-400">Distance</div>
                  </div>
                  <div className="text-2xl font-bold text-green-400">{formatDistance(result.distance)}</div>
                  <div className="text-sm text-green-400 mt-1 opacity-80">from actual location</div>
                </CardContent>
              </Card>

              <Card className="mx-panel">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-[rgba(0,255,65,0.15)] border mx-border">
                      <Trophy className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="font-semibold text-green-400">Score</div>
                  </div>
                  <div className="text-2xl font-bold text-green-400">{result.score.toLocaleString()}</div>
                  <div className="text-sm text-green-400 mt-1 opacity-80">{scorePercentage.toFixed(1)}% accuracy</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="h-96 rounded-lg overflow-hidden border mx-border relative bg-black"
            >
              {/* World map background */}
              <div className="absolute inset-0 bg-[#0a0a0a]">
                <Image src="/images/design-mode/Equirectangular_projection_SW.jpg" alt="World Map" fill sizes="100vw" className="object-cover opacity-40" />
                {/* Grid overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
              </div>

              {/* Connection line */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <line
                  x1={`${actualX}%`}
                  y1={`${actualY}%`}
                  x2={`${guessX}%`}
                  y2={`${guessY}%`}
                  stroke="#00ff41"
                  strokeWidth="2"
                  strokeDasharray="10 5"
                  opacity="0.8"
                />
              </svg>

              {/* Actual location marker */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
                className="absolute w-5 h-5 -ml-2.5 -mt-2.5"
                style={{ left: `${actualX}%`, top: `${actualY}%` }}
              >
                <div className="w-full h-full rounded-full bg-green-400 border-2 border-white shadow-lg shadow-green-500/50 animate-pulse" />
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs mx-panel px-2 py-1 rounded border mx-border text-green-400 font-semibold">
                  Actual
                </div>
              </motion.div>

              {/* Guess location marker */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: "spring" }}
                className="absolute w-5 h-5 -ml-2.5 -mt-2.5"
                style={{ left: `${guessX}%`, top: `${guessY}%` }}
              >
                <div className="w-full h-full rounded-full bg-red-500 border-2 border-white shadow-lg shadow-red-500/50" />
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs mx-panel px-2 py-1 rounded border-2 border-red-500/50 text-red-400 font-semibold">
                  Your Guess
                </div>
              </motion.div>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
              <Button
                onClick={onNext}
                size="lg"
                className="w-full h-14 text-lg font-semibold mx-panel hover:bg-[rgba(0,255,65,0.1)] transition-colors shadow-lg shadow-green-500/20 text-green-400"
              >
                {isLastRound ? "View Final Results" : "Next Round"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
