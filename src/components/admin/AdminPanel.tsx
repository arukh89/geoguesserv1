"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createBrowserClient } from "@/lib/supabase/client"
import { useSendTransaction, useAccount, useWalletClient } from "wagmi"
import { parseEther, encodeFunctionData } from "viem"
import { toast } from "sonner"
import { Loader2, Send } from "lucide-react"

const MOONSHOT_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const

interface AdminPanelProps {
  adminFid: number
  adminWallet: string
}

interface LeaderboardEntry {
  id: string
  identity: string
  score_value: number
  weekly_rank: number
  week_start: string
  week_end: string
}

export function AdminPanel({ adminFid, adminWallet }: AdminPanelProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [sending, setSending] = useState<Record<string, boolean>>({})

  const { isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { sendTransaction } = useSendTransaction()
  const supabase = createBrowserClient()

  const loadWeeklyLeaderboard = useCallback(async () => {
    try {
      setLoading(true)

      const now = new Date()
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      weekStart.setHours(0, 0, 0, 0)

      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from("scores")
        .select("*")
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString())
        .order("score_value", { ascending: false })
        .limit(10)

      if (error) throw error

      const entries: LeaderboardEntry[] = data.map((entry, idx) => ({
        id: entry.id,
        identity: entry.identity,
        score_value: entry.score_value || 0,
        weekly_rank: idx + 1,
        week_start: weekStart.toISOString().split("T")[0],
        week_end: weekEnd.toISOString().split("T")[0],
      }))

      setLeaderboard(entries)

      const suggestedAmounts: Record<string, string> = {}
      entries.forEach((entry) => {
        const rank = entry.weekly_rank
        if (rank === 1) suggestedAmounts[entry.id] = "1000"
        else if (rank === 2) suggestedAmounts[entry.id] = "500"
        else if (rank === 3) suggestedAmounts[entry.id] = "250"
        else if (rank <= 10) suggestedAmounts[entry.id] = String(150 - (rank - 4) * 12.5)
      })
      setAmounts(suggestedAmounts)
    } catch (error) {
      console.error("Failed to load leaderboard:", error)
      toast.error("Failed to load leaderboard")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadWeeklyLeaderboard()
  }, [loadWeeklyLeaderboard])

  async function handleSendTokens(entry: LeaderboardEntry) {
    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }

    const amount = amounts[entry.id]
    if (!amount || Number.parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    const walletAddress = entry.identity
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      toast.error("Invalid wallet address")
      return
    }

    try {
      setSending((prev) => ({ ...prev, [entry.id]: true }))

      const contractAddress = (process.env.NEXT_PUBLIC_MOONSHOT_CONTRACT_ADDRESS as `0x${string}`) ||
        "0x9d7ff2e9ba89502776248acd6cbcb6734049fb07"

      const data = encodeFunctionData({
        abi: MOONSHOT_ABI,
        functionName: "transfer",
        args: [walletAddress as `0x${string}`, parseEther(amount)],
      })

      // Try ERC-5792 wallet_sendCalls with Base Builder Code attribution (Base)
      try {
        if (walletClient) {
          const params: any = { calls: [{ to: contractAddress, data }], chainId: "eip155:8453" }

          const res: any = await (walletClient as any).request({ method: "wallet_sendCalls", params: [params] })
          const hash: string | undefined = res?.hash ?? (Array.isArray(res) ? res[0]?.hash : undefined)
          if (hash) {
            await supabase.from("admin_rewards").insert({
              admin_fid: adminFid,
              admin_wallet: adminWallet,
              recipient_wallet: walletAddress,
              recipient_name: entry.identity,
              amount: Number.parseFloat(amount),
              week_start: entry.week_start,
              week_end: entry.week_end,
              tx_hash: hash,
            })
            toast.success(`Successfully sent ${amount} MOONSHOT to ${walletAddress}`)
            setSending((prev) => ({ ...prev, [entry.id]: false }))
            return
          }
        }
      } catch (e) {
        console.warn("wallet_sendCalls failed, falling back", e)
      }

      // Fallback to legacy sendTransaction
      sendTransaction(
        { to: contractAddress, data },
        {
          onSuccess: async (hash) => {
            await supabase.from("admin_rewards").insert({
              admin_fid: adminFid,
              admin_wallet: adminWallet,
              recipient_wallet: walletAddress,
              recipient_name: entry.identity,
              amount: Number.parseFloat(amount),
              week_start: entry.week_start,
              week_end: entry.week_end,
              tx_hash: hash,
            })
            toast.success(`Successfully sent ${amount} MOONSHOT to ${walletAddress}`)
            setSending((prev) => ({ ...prev, [entry.id]: false }))
          },
          onError: (error) => {
            console.error("Transaction failed:", error)
            toast.error("Failed to send tokens")
            setSending((prev) => ({ ...prev, [entry.id]: false }))
          },
        },
      )
    } catch (error) {
      console.error("Failed to send tokens:", error)
      toast.error("Failed to send tokens")
      setSending((prev) => ({ ...prev, [entry.id]: false }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text)]">Admin Panel</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Send MOONSHOT tokens to top 10 weekly winners</p>
        </div>
        <Button onClick={loadWeeklyLeaderboard} variant="secondary" size="sm">Refresh</Button>
      </div>

      <div className="grid gap-4">
        {leaderboard.map((entry) => (
          <Card key={entry.id} className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                <span className="text-xl font-bold text-[var(--accent)]">#{entry.weekly_rank}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm text-[var(--text)] truncate">{entry.identity}</div>
                <div className="text-sm text-[var(--text-secondary)]">Score: {entry.score_value.toLocaleString()}</div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-32">
                  <Label htmlFor={`amount-${entry.id}`} className="sr-only">Amount</Label>
                  <Input id={`amount-${entry.id}`} type="number" value={amounts[entry.id] || ""} onChange={(e) => setAmounts((prev) => ({ ...prev, [entry.id]: e.target.value }))} placeholder="Amount" disabled={sending[entry.id]} className="text-right" />
                </div>
                <Button onClick={() => handleSendTokens(entry)} disabled={sending[entry.id] || !amounts[entry.id]} size="sm" className="gap-2">
                  {sending[entry.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {leaderboard.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-[var(--text-secondary)]">No leaderboard entries for this week yet.</p>
          </Card>
        )}
      </div>
    </div>
  )
}

