"use client"

import { useFarcasterUser } from "@/hooks/useFarcasterUser"
import { getAdminByFid } from "@/lib/admin/config"
import { AdminPanel } from "@/components/admin/AdminPanel"
import GlobalHeader from "@/components/GlobalHeader"
import { Card } from "@/components/ui/card"
import { Loader2, ShieldAlert } from "lucide-react"

export default function AdminPage() {
  const { user, loading } = useFarcasterUser()

  if (loading) {
    return (
      <>
        <GlobalHeader />
        <main className="min-h-screen bg-[var(--bg)] p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-[var(--accent)]" />
          </div>
        </main>
      </>
    )
  }

  const admin = user?.fid ? getAdminByFid(user.fid) : null

  if (!admin) {
    return (
      <>
        <GlobalHeader />
        <main className="min-h-screen bg-[var(--bg)] p-4">
          <div className="max-w-2xl mx-auto pt-20">
            <Card className="p-12 text-center">
              <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Access Denied</h1>
              <p className="text-[var(--text-secondary)]">You do not have permission to access the admin panel.</p>
            </Card>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <GlobalHeader />
      <main className="min-h-screen bg-[var(--bg)] p-4">
        <div className="max-w-6xl mx-auto pt-6">
          <AdminPanel adminFid={admin.fid} adminWallet={admin.wallet} />
        </div>
      </main>
    </>
  )
}
