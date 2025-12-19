// Client-side notification helpers

/**
 * Prompt user to add the MiniApp (enables notifications)
 */
export async function promptAddMiniApp(): Promise<boolean> {
  try {
    const { sdk } = await import("@farcaster/miniapp-sdk")
    
    if (sdk?.actions?.addMiniApp) {
      const result = await sdk.actions.addMiniApp()
      // Result contains notificationDetails if notifications were enabled
      return !!(result as any)?.notificationDetails || !!(result as any)?.added
    }
    
    return false
  } catch (e) {
    console.error("[Notifications] Failed to prompt add:", e)
    return false
  }
}

/**
 * Check if user has added the MiniApp
 */
export async function checkMiniAppAdded(): Promise<boolean> {
  try {
    const { sdk } = await import("@farcaster/miniapp-sdk")
    
    // The context will have notificationDetails if notifications are enabled
    const context = await sdk.context
    return !!context?.client?.notificationDetails
  } catch (e) {
    return false
  }
}

/**
 * Send notification to specific users (admin only)
 */
export async function sendNotification(params: {
  adminFid: number
  targetFids?: number[]
  title: string
  body: string
  targetUrl?: string
}): Promise<{ success: boolean; sent?: number; error?: string }> {
  try {
    const response = await fetch("/api/notifications/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })
    
    return await response.json()
  } catch (e) {
    return { success: false, error: "Failed to send notification" }
  }
}

// Notification templates for common events
export const NotificationTemplates = {
  weeklyRewardsReady: (rank: number) => ({
    title: "🏆 Weekly Rewards Ready!",
    body: `You ranked #${rank} this week! Claim your GEOX tokens now.`,
    targetUrl: "https://geoguesserv1.vercel.app/?tab=rewards",
  }),
  
  newHighScore: (score: number) => ({
    title: "🎮 New High Score!",
    body: `Amazing! You scored ${score.toLocaleString()} points. Can you beat it?`,
    targetUrl: "https://geoguesserv1.vercel.app/",
  }),
  
  weeklyReminder: () => ({
    title: "🌍 Weekly Challenge Ending!",
    body: "Only 24 hours left to climb the leaderboard. Play now!",
    targetUrl: "https://geoguesserv1.vercel.app/",
  }),
  
  rewardsClaimed: (amount: string) => ({
    title: "✅ Rewards Claimed!",
    body: `${amount} GEOX tokens sent to your wallet. Thanks for playing!`,
    targetUrl: "https://geoguesserv1.vercel.app/?tab=rewards",
  }),
}
