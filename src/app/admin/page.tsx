"use client"

import { useFarcasterUser } from "@/hooks/useFarcasterUser"
import { isAdmin, getAdminByFid, isAdminWallet, getAdminByWallet } from "@/lib/admin/config"
import { AdminPanel } from "@/components/admin/AdminPanel"
import { SendNotification } from "@/components/admin/SendNotification"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAccount } from "wagmi"

export default function AdminPage() {
  const { user, loading } = useFarcasterUser()
  const { address, isConnected } = useAccount()

  const adminFromFid = user?.fid ? getAdminByFid(user.fid) : undefined
  const adminFromWallet = isConnected && address ? getAdminByWallet(address) : undefined
  const admin = adminFromFid ?? adminFromWallet

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400 text-xl">Loading...</div>
      </div>
    )
  }

  if (!admin) {
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
            <p className="text-gray-400">
              Only authorized administrators can access this panel.
              If you are an admin, please open from Farcaster mini-app or connect the admin wallet.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <AdminPanel adminFid={admin.fid} adminWallet={admin.wallet} />
        <SendNotification adminFid={admin.fid} />
      </div>
    </div>
  )
}
