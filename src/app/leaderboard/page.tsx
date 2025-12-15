"use client"

import { WeeklyLeaderboard } from "@/components/game/WeeklyLeaderboard"

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-green-400 mb-2">Weekly Leaderboard</h1>
          <p className="text-green-300/70">Top 10 players compete for GEO EXPLORER token rewards</p>
        </div>
        <WeeklyLeaderboard />
      </div>
    </div>
  )
}
