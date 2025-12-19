import { useAccount } from "wagmi"

export function useWalletConnection() {
  const { address, isConnected, isConnecting, isDisconnected } = useAccount()

  return {
    address,
    isConnected,
    isConnecting,
    isDisconnected,
  }
}
