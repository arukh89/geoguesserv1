// Admin configuration
export const ADMIN_USERS = [
  {
    fid: 250704,
    username: "ukhy89",
    wallet: "0x09D02D25D0D082f7F2E04b4838cEfe271b2daB09",
  },
  {
    fid: 1386932,
    username: "genuinerealmoe",
    wallet: "0x103396D1D28e787e5a0f99AcC03D20a407Ca8f11",
  },
] as const

export function isAdmin(fid?: number): boolean {
  if (!fid) return false
  return ADMIN_USERS.some((admin) => admin.fid === fid)
}

export function getAdminByFid(fid: number) {
  return ADMIN_USERS.find((admin) => admin.fid === fid)
}

export function isAdminWallet(address?: string): boolean {
  if (!address) return false
  const a = address.toLowerCase()
  return ADMIN_USERS.some((admin) => admin.wallet.toLowerCase() === a)
}

export function getAdminByWallet(address?: string) {
  if (!address) return undefined
  const a = address.toLowerCase()
  return ADMIN_USERS.find((admin) => admin.wallet.toLowerCase() === a)
}
