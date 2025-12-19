import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Admin FIDs that can send notifications
const ADMIN_FIDS = [250704] // Add your admin FIDs here

interface SendNotificationRequest {
  adminFid: number
  targetFids?: number[] // Specific FIDs to notify, or empty for all
  title: string // Max 32 chars
  body: string // Max 128 chars
  targetUrl?: string // URL to open when clicked
  notificationId?: string // For deduplication
}

export async function POST(request: NextRequest) {
  try {
    const body: SendNotificationRequest = await request.json()
    const { adminFid, targetFids, title, body: notifBody, targetUrl, notificationId } = body
    
    // Verify admin
    if (!ADMIN_FIDS.includes(adminFid)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    
    // Validate inputs
    if (!title || title.length > 32) {
      return NextResponse.json({ error: "Title required, max 32 chars" }, { status: 400 })
    }
    if (!notifBody || notifBody.length > 128) {
      return NextResponse.json({ error: "Body required, max 128 chars" }, { status: 400 })
    }
    
    // Get notification tokens
    let query = supabase.from("notification_tokens").select("fid, token, url")
    
    if (targetFids && targetFids.length > 0) {
      query = query.in("fid", targetFids)
    }
    
    const { data: tokens, error } = await query
    
    if (error) {
      console.error("[Notifications] Failed to fetch tokens:", error)
      return NextResponse.json({ error: "Failed to fetch tokens" }, { status: 500 })
    }
    
    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ 
        success: true, 
        sent: 0, 
        message: "No users with notifications enabled" 
      })
    }
    
    // Group tokens by URL (different Farcaster clients may have different URLs)
    const tokensByUrl = new Map<string, string[]>()
    for (const t of tokens) {
      const existing = tokensByUrl.get(t.url) || []
      existing.push(t.token)
      tokensByUrl.set(t.url, existing)
    }
    
    // Send notifications (batch up to 100 per request)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://geoguesserv1.vercel.app"
    const results = {
      successful: 0,
      failed: 0,
      invalidTokens: [] as string[],
    }
    
    for (const [url, urlTokens] of tokensByUrl) {
      // Split into batches of 100
      for (let i = 0; i < urlTokens.length; i += 100) {
        const batch = urlTokens.slice(i, i + 100)
        
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              notificationId: notificationId || `geo-${Date.now()}`,
              title,
              body: notifBody,
              targetUrl: targetUrl || baseUrl,
              tokens: batch,
            }),
          })
          
          if (response.ok) {
            const result = await response.json()
            results.successful += result.successfulTokens?.length || 0
            results.invalidTokens.push(...(result.invalidTokens || []))
          } else {
            results.failed += batch.length
            console.error("[Notifications] Failed to send batch:", await response.text())
          }
        } catch (e) {
          results.failed += batch.length
          console.error("[Notifications] Error sending batch:", e)
        }
      }
    }
    
    // Clean up invalid tokens
    if (results.invalidTokens.length > 0) {
      await supabase
        .from("notification_tokens")
        .delete()
        .in("token", results.invalidTokens)
    }
    
    return NextResponse.json({
      success: true,
      sent: results.successful,
      failed: results.failed,
      invalidTokensRemoved: results.invalidTokens.length,
    })
  } catch (e) {
    console.error("[Notifications] Error:", e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
