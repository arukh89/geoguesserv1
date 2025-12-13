"use client"

import { Trophy, MapPin, Timer, ArrowLeft } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { MatrixToggle } from "@/components/matrix/MatrixToggle"
import { Button } from "@/components/ui/button"

interface GameHeaderProps {
  currentRound: number
  totalRounds: number
  score: number
  timeLeftSec?: number
  onBack?: () => void
}

export default function GameHeader({ currentRound, totalRounds, score, timeLeftSec, onBack }: GameHeaderProps) {
  const progress = (currentRound / totalRounds) * 100
  const timeClass = (time?: number) => {
    if (typeof time !== "number") return "text-[color:rgba(151,255,151,0.8)]"
    return time <= 5 ? "text-red-500" : "text-[color:rgba(151,255,151,0.9)]"
  }
  return (
    <div className="mx-panel border-b mx-border shadow-[var(--shadow)]">
      <div className="max-w-7xl mx-auto px-4 py-3 text-[var(--text)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {onBack && (
              <Button onClick={onBack} variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Menu
              </Button>
            )}

            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[var(--accent)]" />
              <div className="text-sm">
                <span className="font-semibold">Round</span>
                <span className="ml-2 text-[color:rgba(151,255,151,0.85)] font-mono">
                  {currentRound} / {totalRounds}
                </span>
              </div>
            </div>

            <div className="hidden md:block w-32">
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {typeof timeLeftSec === "number" && (
              <div className="text-sm">
                <span className="font-semibold">Time</span>
                <span className={`ml-2 font-mono inline-flex items-center gap-1 ${timeClass(timeLeftSec)}`}>
                  <Timer className="w-4 h-4" />
                  {Math.max(0, Math.floor(timeLeftSec))}s
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[var(--accent)]" />
              <div className="text-sm">
                <span className="font-semibold">Score</span>
                <span className="ml-2 font-mono text-[color:rgba(151,255,151,0.9)]">{score.toLocaleString()}</span>
              </div>
            </div>

            <div className="hidden md:block pl-4">
              <MatrixToggle />
            </div>
          </div>

          <div className="md:hidden mt-2 w-full">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>
    </div>
  )
}
