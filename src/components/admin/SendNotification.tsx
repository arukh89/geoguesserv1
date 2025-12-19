"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Bell, Send, Loader2, Users } from "lucide-react"
import { sendNotification, NotificationTemplates } from "@/lib/notifications/client"
import { toast } from "sonner"

interface SendNotificationProps {
  adminFid: number
}

export function SendNotification({ adminFid }: SendNotificationProps) {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [targetFids, setTargetFids] = useState("")
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are required")
      return
    }
    if (title.length > 32) {
      toast.error("Title must be 32 characters or less")
      return
    }
    if (body.length > 128) {
      toast.error("Body must be 128 characters or less")
      return
    }

    setSending(true)
    try {
      const fids = targetFids.trim()
        ? targetFids.split(",").map(f => parseInt(f.trim())).filter(f => !isNaN(f))
        : undefined

      const result = await sendNotification({
        adminFid,
        targetFids: fids,
        title: title.trim(),
        body: body.trim(),
      })

      if (result.success) {
        toast.success(`Notification sent to ${result.sent} users`)
        setTitle("")
        setBody("")
        setTargetFids("")
      } else {
        toast.error(result.error || "Failed to send notification")
      }
    } catch {
      toast.error("Failed to send notification")
    } finally {
      setSending(false)
    }
  }

  function useTemplate(template: { title: string; body: string }) {
    setTitle(template.title)
    setBody(template.body)
  }

  return (
    <Card className="bg-black/80 border-green-500/30">
      <CardHeader className="border-b border-green-500/20">
        <CardTitle className="flex items-center gap-2 text-green-400">
          <Bell className="w-5 h-5" />
          Send Notification
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Quick Templates */}
        <div className="space-y-2">
          <Label className="text-green-400/80 text-xs">Quick Templates</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => useTemplate(NotificationTemplates.weeklyReminder())}
              className="text-xs border-green-500/30 text-green-400"
            >
              Weekly Reminder
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => useTemplate(NotificationTemplates.weeklyRewardsReady(1))}
              className="text-xs border-green-500/30 text-green-400"
            >
              Rewards Ready
            </Button>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="notif-title" className="text-green-400/80">
            Title ({title.length}/32)
          </Label>
          <Input
            id="notif-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="🏆 Weekly Rewards Ready!"
            maxLength={32}
            className="bg-black/50 border-green-500/30"
          />
        </div>

        {/* Body */}
        <div className="space-y-2">
          <Label htmlFor="notif-body" className="text-green-400/80">
            Body ({body.length}/128)
          </Label>
          <Textarea
            id="notif-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="You ranked #1 this week! Claim your GEOX tokens now."
            maxLength={128}
            rows={2}
            className="bg-black/50 border-green-500/30 resize-none"
          />
        </div>

        {/* Target FIDs */}
        <div className="space-y-2">
          <Label htmlFor="target-fids" className="text-green-400/80">
            Target FIDs (comma-separated, leave empty for all)
          </Label>
          <Input
            id="target-fids"
            value={targetFids}
            onChange={(e) => setTargetFids(e.target.value)}
            placeholder="250704, 509587, 1477579"
            className="bg-black/50 border-green-500/30 font-mono text-sm"
          />
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={sending || !title.trim() || !body.trim()}
          className="w-full gap-2"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {targetFids.trim() ? "Send to Selected Users" : "Send to All Users"}
        </Button>

        <p className="text-xs text-green-400/50 text-center">
          Rate limit: 1 notification per 30 seconds per user, 100 per day
        </p>
      </CardContent>
    </Card>
  )
}
