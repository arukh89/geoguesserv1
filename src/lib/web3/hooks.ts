import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { MOONSHOT_CONTRACT_ADDRESS, MOONSHOT_ABI } from "./config"
import { parseEther } from "viem"

export function useClaimTokens() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const claimTokens = async (recipient: `0x${string}`, amount: string) => {
    try {
      writeContract({
        address: MOONSHOT_CONTRACT_ADDRESS,
        abi: MOONSHOT_ABI,
        functionName: "claim",
        args: [recipient, parseEther(amount)],
      })
    } catch (err) {
      console.error("[v0] Claim error:", err)
      throw err
    }
  }

  return {
    claimTokens,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

export function useWalletConnection() {
  const { address, isConnected, isConnecting, isDisconnected } = useAccount()

  return {
    address,
    isConnected,
    isConnecting,
    isDisconnected,
  }
}
