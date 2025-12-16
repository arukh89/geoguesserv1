"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useFarcasterUser } from "@/hooks/useFarcasterUser"
import NavigationDropdown from "@/components/NavigationDropdown"
import ProfileModal from "@/components/ProfileModal"

export function GlobalHeader() {
  const router = useRouter()
  const { user, loading } = useFarcasterUser()
  const [showProfile, setShowProfile] = useState(false)

  return (
    <>
      <header className="h-14 w-full fixed top-0 left-0 right-0 z-[9999] bg-black/90 backdrop-blur-lg border-b-2 border-green-500/50 shadow-lg shadow-green-500/20">
        <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setShowProfile(true)}
              aria-label="Profile"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/80 backdrop-blur-lg border-2 border-green-500/50 hover:bg-green-900/20 hover:border-green-400 transition-colors shadow-lg shadow-green-500/20 text-green-300 font-semibold hover:text-green-200"
            >
              {user?.pfpUrl ? (
                <img 
                  src={user.pfpUrl} 
                  alt="Profile" 
                  className="w-6 h-6 rounded-full object-cover border border-green-500/50"
                />
              ) : (
                <User className="w-5 h-5" />
              )}
              <span className="hidden sm:inline">
                {user?.username ? `@${user.username}` : 'Profile'}
              </span>
            </Button>
          </div>

          <NavigationDropdown />
        </div>
      </header>

      <ProfileModal 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
        user={user}
      />
    </>
  )
}

export default GlobalHeader
