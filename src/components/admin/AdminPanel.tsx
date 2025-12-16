"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAccount, useWalletClient } from "wagmi"
import { parseUnits, encodeFunctionData } from "viem"
import { toast } from "sonner"
import { Loader2, Send, Trash2, AlertTriangle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { fetchUserByFid } from "@/lib/neynar/client"

// GEO EXPLORER token on Base Mainnet
const GEO_EXPLORER_CONTRACT = "0x9d7ff2e9ba89502776248acd6cbcb6734049fb07"
const GEO_EXPLORER_DECIMALS = 18
const BASE_CHAIN_ID = 8453

const ERC20_ABI = [
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
  player_name: string | null
  identity: string | null
  fid: number | null
  pfp_url: string | null
  score_value: number
  weekly_rank: number
  week_start: string
  week_end: string
}

export function AdminPanel({ adminFid, adminWallet }: AdminPanelProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [wallets, setWallets] = useState<Record<string, string>>({})
  const [sending, setSending] = useState<Record<string, boolean>>({})
  const [deleting, setDeleting] = useState<Record<string, boolean>>({})
  const [clearingAll, setClearingAll] = useState(false)

  const { isConnected, chainId } = useAccount()
  const { data: walletClient } = useWalletClient()
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
        player_name: entry.player_name,
        identity: entry.identity,
        fid: entry.fid,
        pfp_url: entry.pfp_url,
        score_value: entry.score_value || 0,
        weekly_rank: idx + 1,
        week_start: weekStart.toISOString().split("T")[0],
        week_end: weekEnd.toISOString().split("T")[0],
      }))

      setLeaderboard(entries)

      const suggestedAmounts: Record<string, string> = {}
      const initialWallets: Record<string, string> = {}
      
      // Fetch wallet addresses from Neynar for entries without valid wallet
      await Promise.all(entries.map(async (entry) => {
        const rank = entry.weekly_rank
        if (rank === 1) suggestedAmounts[entry.id] = "1000"
        else if (rank === 2) suggestedAmounts[entry.id] = "500"
        else if (rank === 3) suggestedAmounts[entry.id] = "250"
        else if (rank <= 10) suggestedAmounts[entry.id] = String(Math.round(150 - (rank - 4) * 12.5))
        
        // If wallet already stored in database, use it
        if (entry.identity && /^0x[a-fA-F0-9]{40}$/.test(entry.identity)) {
          initialWallets[entry.id] = entry.identity
        } 
        // Otherwise, fetch from Neynar using FID
        else if (entry.fid) {
          try {
            const neynarUser = await fetchUserByFid(entry.fid)
            if (neynarUser) {
              // Prefer verified address (Warplet), fallback to custody address
              const walletAddress = neynarUser.verifiedAddresses?.[0] || neynarUser.custodyAddress
              if (walletAddress && /^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
                initialWallets[entry.id] = walletAddress
              }
            }
          } catch (e) {
            console.warn(`Failed to fetch wallet for FID ${entry.fid}:`, e)
          }
        }
      }))
      
      setAmounts(suggestedAmounts)
      setWallets(initialWallets)
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

  const getRecipientWallet = (entry: LeaderboardEntry): string => {
    return wallets[entry.id] || entry.identity || ""
  }

  const isValidWallet = (wallet: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(wallet)
  }

  async function handleSendTokens(entry: LeaderboardEntry) {
    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }
    if (chainId !== BASE_CHAIN_ID) {
      toast.error("Please switch to Base network")
      return
    }
    const amount = amounts[entry.id]
    if (!amount || Number.parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }
    const recipientWallet = getRecipientWallet(entry)
    if (!isValidWallet(recipientWallet)) {
      toast.error("Please enter a valid wallet address")
      return
    }

    try {
      setSending((prev) => ({ ...prev, [entry.id]: true }))
      const transferData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [recipientWallet as `0x${string}`, parseUnits(amount, GEO_EXPLORER_DECIMALS)],
      })

      if (!walletClient) {
        toast.error("Wallet not connected")
        setSending((prev) => ({ ...prev, [entry.id]: false }))
        return
      }

      const hash = await walletClient.sendTransaction({
        to: GEO_EXPLORER_CONTRACT as `0x${string}`,
        data: transferData,
      })

      await supabase.from("admin_rewards").insert({
        admin_fid: adminFid,
        admin_wallet: adminWallet,
        recipient_wallet: recipientWallet,
        recipient_name: entry.player_name || entry.fid?.toString() || "Unknown",
        amount: Number.parseFloat(amount),
        week_start: entry.week_start,
        week_end: entry.week_end,
        tx_hash: hash,
      })

      toast.success(`Sent ${amount} GEO EXPLORER to ${recipientWallet.slice(0, 6)}...${recipientWallet.slice(-4)}`)
    } catch (error: any) {
      console.error("Failed to send tokens:", error)
      toast.error(error?.message || "Failed to send tokens")
    } finally {
      setSending((prev) => ({ ...prev, [entry.id]: false }))
    }
  }

  async function handleDeleteScore(entryId: string) {
    try {
      setDeleting((prev) => ({ ...prev, [entryId]: true }))
      const { error } = await supabase.from("scores").delete().eq("id", entryId)
      if (error) throw error
      toast.success("Score deleted successfully")
      loadWeeklyLeaderboard()
    } catch (error) {
      console.error("Failed to delete score:", error)
      toast.error("Failed to delete score")
    } finally {
      setDeleting((prev) => ({ ...prev, [entryId]: false }))
    }
  }

  async function handleClearAllScores() {
    try {
      setClearingAll(true)
      const { error } = await supabase.from("scores").delete().neq("id", "00000000-0000-0000-0000-000000000000")
      if (error) throw error
      toast.success("All leaderboard data cleared")
      loadWeeklyLeaderboard()
    } catch (error) {
      console.error("Failed to clear leaderboard:", error)
      toast.error("Failed to clear leaderboard")
    } finally {
      setClearingAll(false)
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
          <h2 className="text-2xl font-bold text-green-400">Admin Panel</h2>
          <p className="text-sm text-green-400/80 mt-1">Send GEO EXPLORER tokens (Base Network)</p>
          {chainId && chainId !== BASE_CHAIN_ID && (
            <p className="text-sm text-red-400 mt-1">⚠️ Switch to Base network</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={loadWeeklyLeaderboard} variant="secondary" size="sm">Refresh</Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={clearingAll || leaderboard.length === 0}>
                {clearingAll ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Clear All Leaderboard?
                </AlertDialogTitle>
                <AlertDialogDescription>This will delete ALL scores. Cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAllScores} className="bg-red-600 hover:bg-red-700">Yes, Clear All</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-4">
        {leaderboard.map((entry) => {
          const recipientWallet = getRecipientWallet(entry)
          const hasValidWallet = isValidWallet(recipientWallet)
          
          return (
            <Card key={entry.id} className="p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center overflow-hidden">
                    {entry.pfp_url ? (
                      <img src={entry.pfp_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-[var(--accent)]">#{entry.weekly_rank}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-300 font-medium">{entry.player_name || "Anonymous"}</span>
                      {entry.fid && <span className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">FID: {entry.fid}</span>}
                    </div>
                    <div className="text-sm text-green-400/80">Score: {entry.score_value.toLocaleString()} pts</div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={deleting[entry.id]} className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                        {deleting[entry.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this score?</AlertDialogTitle>
                        <AlertDialogDescription>Delete score for {entry.player_name || "this user"}?</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteScore(entry.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="flex items-center gap-2 pl-16">
                  <div className="flex-1">
                    <Label htmlFor={`wallet-${entry.id}`} className="sr-only">Wallet</Label>
                    <Input
                      id={`wallet-${entry.id}`}
                      value={wallets[entry.id] || entry.identity || ""}
                      onChange={(e) => setWallets((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                      placeholder="0x... wallet address"
                      disabled={sending[entry.id]}
                      className={`font-mono text-xs ${!hasValidWallet && wallets[entry.id] ? 'border-red-500' : ''}`}
                    />
                  </div>
                  <div className="w-24">
                    <Label htmlFor={`amount-${entry.id}`} className="sr-only">Amount</Label>
                    <Input
                      id={`amount-${entry.id}`}
                      type="number"
                      value={amounts[entry.id] || ""}
                      onChange={(e) => setAmounts((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                      placeholder="Amount"
                      disabled={sending[entry.id]}
                      className="text-right"
                    />
                  </div>
                  <Button
                    onClick={() => handleSendTokens(entry)}
                    disabled={sending[entry.id] || !amounts[entry.id] || !hasValidWallet || chainId !== BASE_CHAIN_ID}
                    size="sm"
                    className="gap-2"
                  >
                    {sending[entry.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
        {leaderboard.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-[var(--text-secondary)]">No entries this week yet.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
