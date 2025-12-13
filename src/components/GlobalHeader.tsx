"use client"

import { Button } from "@/components/ui/button"
import { Trophy, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { useFarcasterUser } from "@/hooks/useFarcasterUser"
import { isAdmin } from "@/lib/admin/config"

export default function GlobalHeader() {
  const router = useRouter()
  const { user } = useFarcasterUser()
  const isAdminUser = user?.fid ? isAdmin(user.fid) : false

  return (
    <header className="relative z-20 bg-[var(--panel)] border-b mx-border shadow-[var(--shadow)]">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2">
        <Button size="md" onClick={() => router.push("/")} aria-label="Home">
          Home
        </Button>
        <Button size="md" variant="secondary" onClick={() => router.back()} aria-label="Back">
          Back
        </Button>
        <Button
          size="md"
          variant="secondary"
          onClick={() => router.push("/leaderboard")}
          aria-label="Leaderboard"
          className="gap-2 ml-auto"
        >
          <Trophy className="h-4 w-4" />
          Leaderboard
        </Button>

        {isAdminUser && (
          <Button
            size="md"
            variant="secondary"
            onClick={() => router.push("/admin")}
            aria-label="Admin Panel"
            className="gap-2"
          >
            <Shield className="h-4 w-4" />
            Admin
          </Button>
        )}
      </div>
    </header>
  )
}
