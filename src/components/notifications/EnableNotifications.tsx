"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, Loader2, Check } from "lucide-react"
import { promptAddMiniApp, checkMiniAppAdded } from "@/lib/notifications/client"
import { toast } from "sonner"

export function EnableNotifications() {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkMiniAppAdded().then(setEnabled)
  }, [])

  async function handleEnable() {
    setLoading(true)
    try {
      const added = await promptAddMiniApp()
      if (added) {
        setEnabled(true)
        toast.success("Notifications enabled! You'll receive updates about rewards and leaderboards.")
      } else {
        toast.error("Failed to enable notifications")
      }
    } catch (e) {
      toast.error("Failed to enable notifications")
    } finally {
      setLoading(false)
    }
  }

  if (enabled === null) {
    return null // Still checking
  }

  if (enabled) {
    return (
      <div className="flex items-center gap-2 text-green-400 text-sm">
        <Check className="w-4 h-4" />
        <span>Notifications enabled</span>
      </div>
    )
  }

  return (
    <Button
      onClick={handleEnable}
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-2 border-green-500/30 text-green-400 hover:bg-green-500/10"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Bell className="w-4 h-4" />
      )}
      Enable Notifications
    </Button>
  )
}
