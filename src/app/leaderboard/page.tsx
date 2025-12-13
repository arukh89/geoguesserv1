import { WeeklyLeaderboard } from "@/components/game/WeeklyLeaderboard"

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground">Compete for the top spot and claim MOONSHOT tokens on Base mainnet!</p>
        </div>

        <WeeklyLeaderboard />
      </div>
    </main>
  )
}
