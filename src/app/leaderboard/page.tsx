"use client"

import { useState } from "react"
import WeeklyLeaderboard from "@/components/game/WeeklyLeaderboard"
import { Button } from "@/components/ui/button"

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<"daily" | "weekly">("weekly")

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-green-400 mb-2">Leaderboard</h1>
          <p className="text-green-300/70">Top 10 players compete for GEO EXPLORER token rewards</p>
        </div>
        
        {/* Period Toggle */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setPeriod("daily")}
            variant={period === "daily" ? "default" : "secondary"}
            size="sm"
          >
            Daily
          </Button>
          <Button
            onClick={() => setPeriod("weekly")}
            variant={period === "weekly" ? "default" : "secondary"}
            size="sm"
          >
            Weekly
          </Button>
        </div>
        
        <WeeklyLeaderboard period={period} />
      </div>
    </div>
  )
}
