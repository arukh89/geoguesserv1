import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Webhook event types from Farcaster
type WebhookEvent = {
  event: "miniapp_added" | "miniapp_removed" | "notifications_enabled" | "notifications_disabled"
  notificationDetails?: {
    url: string
    token: string
  }
}

// Parse and verify webhook event
async function parseWebhookEvent(request: NextRequest): Promise<{ fid: number; event: WebhookEvent } | null> {
  try {
    const body = await request.text()
    const json = JSON.parse(body)
    
    // The webhook payload contains a JSON Farcaster Signature
    // For now, we'll do basic parsing - in production, verify with @farcaster/miniapp-node
    const { header, payload, signature } = json
    
    if (!header || !payload) {
      console.error("[Webhook] Missing header or payload")
      return null
    }
    
    // Decode header to get FID
    const headerData = JSON.parse(Buffer.from(header, "base64").toString())
    const fid = headerData.fid
    
    // Decode payload to get event data
    const eventData = JSON.parse(Buffer.from(payload, "base64").toString()) as WebhookEvent
    
    console.log("[Webhook] Received event:", { fid, event: eventData.event })
    
    return { fid, event: eventData }
  } catch (e) {
    console.error("[Webhook] Failed to parse event:", e)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseWebhookEvent(request)
    
    if (!parsed) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 })
    }
    
    const { fid, event } = parsed
    
    switch (event.event) {
      case "miniapp_added":
      case "notifications_enabled":
        // Save notification token
        if (event.notificationDetails) {
          const { token, url } = event.notificationDetails
          
          // Upsert token (update if exists, insert if not)
          const { error } = await supabase
            .from("notification_tokens")
            .upsert(
              { fid, token, url, updated_at: new Date().toISOString() },
              { onConflict: "fid,token" }
            )
          
          if (error) {
            console.error("[Webhook] Failed to save token:", error)
          } else {
            console.log("[Webhook] Saved notification token for FID:", fid)
          }
        }
        break
        
      case "miniapp_removed":
      case "notifications_disabled":
        // Remove all tokens for this user
        const { error } = await supabase
          .from("notification_tokens")
          .delete()
          .eq("fid", fid)
        
        if (error) {
          console.error("[Webhook] Failed to remove tokens:", error)
        } else {
          console.log("[Webhook] Removed notification tokens for FID:", fid)
        }
        break
    }
    
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[Webhook] Error:", e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
