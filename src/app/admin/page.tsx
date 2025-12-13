"use client"

import { useFarcasterUser } from "@/hooks/useFarcasterUser"
import { isAdmin, getAdminByFid } from "@/lib/admin/config"
import { AdminPanel } from "@/components/admin/AdminPanel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminPage() {
  const { user, loading } = useFarcasterUser()

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400 text-xl">Loading...</div>
      </div>
    )
  }

  if (!user || !isAdmin(user.fid)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md bg-black/90 border-2 border-red-500/50">
          <CardHeader>
            <CardTitle className="text-red-400">Access Denied</CardTitle>
            <CardDescription className="text-red-300/70">
              You do not have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400">Only authorized administrators can access this panel.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto">
        {(() => { const admin = getAdminByFid(user!.fid)!; return <AdminPanel adminFid={admin.fid} adminWallet={admin.wallet} /> })()}
      </div>
    </div>
  )
}