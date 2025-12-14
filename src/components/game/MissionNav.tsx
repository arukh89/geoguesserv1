"use client"

import type React from "react"

import { useMemo } from "react"
import { Home, User, Trophy, Upload, BookText, ExternalLink, Leaf, HelpCircle, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { useFarcasterUser } from "@/hooks/useFarcasterUser"
import { isAdmin } from "@/lib/admin/config"

type Item = {
  key: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  active?: boolean
}

interface MissionNavProps {
  onExplore?: () => void
  onProfile?: () => void
  onLeaderboard?: () => void
}

export default function MissionNav({ onExplore, onProfile, onLeaderboard }: MissionNavProps) {
  const router = useRouter()
  const { user } = useFarcasterUser()
  const isAdminUser = user?.fid ? isAdmin(user.fid) : false

  const items: Item[] = useMemo(() => {
    const allItems = [
      { key: "explore", label: "Explore", icon: <Home className="w-5 h-5" />, onClick: () => onExplore?.() },
      // Profile: only show if handler is provided
      ...(onProfile
        ? [{ key: "profile", label: "Profile", icon: <User className="w-5 h-5" />, onClick: onProfile }]
        : []),
      {
        key: "leaderboard",
        label: "Leaderboard",
        icon: <Trophy className="w-5 h-5" />,
        onClick: () => {
          if (onLeaderboard) {
            onLeaderboard()
          } else {
            router.push("/leaderboard")
          }
        },
      },
      ...(isAdminUser
        ? [
            {
              key: "admin",
              label: "Admin",
              icon: <Shield className="w-5 h-5" />,
              onClick: () => router.push("/admin"),
            },
          ]
        : []),
      {
        key: "upload",
        label: "Upload",
        icon: <Upload className="w-5 h-5" />,
        onClick: () => window.open("https://www.mapillary.com/desktop-uploader", "_blank"),
      },
      {
        key: "blog",
        label: "Blog",
        icon: <BookText className="w-5 h-5" />,
        onClick: () => window.open("https://blog.mapillary.com/", "_blank"),
      },
      {
        key: "website",
        label: "Mapillary.com",
        icon: <ExternalLink className="w-5 h-5" />,
        onClick: () => window.open("https://www.mapillary.com/", "_blank"),
      },
    ]
    return allItems
  }, [onExplore, onProfile, onLeaderboard, router, isAdminUser])

  return (
    <nav className="w-16 px-2 py-3 rounded-2xl mx-panel text-[var(--text)] flex flex-col items-center gap-3">
      {/* Brand */}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[rgba(0,255,65,0.08)] border mx-border">
        <Leaf className="w-5 h-5 text-[var(--accent)]" />
      </div>
      <div className="w-full h-px bg-[rgba(0,255,65,0.18)]" />

      {/* Icon buttons */}
      <div className="flex flex-col items-center gap-2">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={it.onClick}
            title={it.label}
            className="w-10 h-10 rounded-xl border mx-border bg-[rgba(0,255,65,0.05)] hover:bg-[rgba(0,255,65,0.12)] flex items-center justify-center transition-colors"
            aria-label={it.label}
            type="button"
          >
            {it.icon}
          </button>
        ))}
      </div>

      <div className="flex-1" />
      <button
        title="Help"
        className="w-10 h-10 rounded-xl border mx-border bg-[rgba(0,255,65,0.05)] hover:bg-[rgba(0,255,65,0.12)] flex items-center justify-center"
        type="button"
        onClick={() => window.open("https://help.mapillary.com/hc/en-us", "_blank")}
        aria-label="Help"
      >
        <HelpCircle className="w-5 h-5" />
      </button>
    </nav>
  )
}
