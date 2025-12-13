"use client"

import { Button } from "@/components/ui/button"
import { Trophy, Shield, HomeIcon, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useFarcasterUser } from "@/hooks/useFarcasterUser"
import { isAdmin } from "@/lib/admin/config"
import LoginButton from "@/components/auth/LoginButton"

export function GlobalHeader() {
  const router = useRouter()
  const { user } = useFarcasterUser()
  const isAdminUser = user?.fid ? isAdmin(user.fid) : false

  return (
    <header className="h-14 w-full fixed top-0 left-0 right-0 z-[9999] bg-black/90 backdrop-blur-lg border-b-2 border-green-500/50 shadow-lg shadow-green-500/20">
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            size="md"
            onClick={() => { if (typeof window !== "undefined") { window.location.href = "/" } else { router.push("/") } }}
            aria-label="Home"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/80 backdrop-blur-lg border-2 border-green-500/50 hover:bg-green-900/20 hover:border-green-400 transition-colors shadow-lg shadow-green-500/20 text-green-300 font-semibold hover:text-green-200"
          >
            <HomeIcon className="w-4 h-4" />
            Home
          </Button>
          <Button
            size="md"
            onClick={() => { if (typeof window !== "undefined") { if (window.history.length > 1) { window.history.back() } else { window.location.href = "/" } } else { router.back() } }}
            aria-label="Back"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/80 backdrop-blur-lg border-2 border-green-500/50 hover:bg-green-900/20 hover:border-green-400 transition-colors shadow-lg shadow-green-500/20 text-green-300 font-semibold hover:text-green-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="md"
            onClick={() => router.push("/leaderboard")}
            aria-label="Leaderboard"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/80 backdrop-blur-lg border-2 border-green-500/50 hover:bg-green-900/20 hover:border-green-400 transition-colors shadow-lg shadow-green-500/20 text-green-300 font-semibold hover:text-green-200"
          >
            <Trophy className="h-4 w-4" />
            Leaderboard
          </Button>

          {isAdminUser && (
            <Button
              size="md"
              onClick={() => router.push("/admin")}
              aria-label="Admin Panel"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/80 backdrop-blur-lg border-2 border-green-500/50 hover:bg-green-900/20 hover:border-green-400 transition-colors shadow-lg shadow-green-500/20 text-green-300 font-semibold hover:text-green-200"
            >
              <Shield className="h-4 w-4" />
              Admin
            </Button>
          )}

          <LoginButton />
        </div>
      </div>
    </header>
  )
}

export default GlobalHeader
