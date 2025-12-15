"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Loader2, User, Server, Wallet } from "lucide-react"

type Step = {
  key: string
  label: string
  icon: React.ReactNode
  status: "idle" | "working" | "done"
}

export default function StartupSplash({ onDone }: { onDone: () => void }) {
  const [steps, setSteps] = useState<Step[]>([
    { key: "profile", label: "Check profile", icon: <User className="w-4 h-4" />, status: "idle" },
    { key: "server", label: "Check server", icon: <Server className="w-4 h-4" />, status: "idle" },
    { key: "wallet", label: "Check your wallet", icon: <Wallet className="w-4 h-4" />, status: "idle" },
  ])

  useEffect(() => {
    let mounted = true
    const run = async () => {
      const next = async (i: number, delay = 600) => {
        setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, status: "working" } : s)))
        await new Promise((r) => setTimeout(r, delay))
        if (!mounted) return
        setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, status: "done" } : s)))
      }
      for (let i = 0; i < steps.length; i++) {
        await next(i, 650 + i * 150)
      }
      await new Promise((r) => setTimeout(r, 400))
      if (mounted) onDone()
    }
    run()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="fixed inset-0 z-[200]"
        style={{
          background:
            "radial-gradient(1200px 800px at 10% 10%, rgba(0,255,65,.06) 0%, transparent 40%), radial-gradient(1200px 800px at 90% 90%, rgba(0,255,65,.06) 0%, transparent 40%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-2xl p-8 mx-panel relative overflow-hidden"
          style={{
            margin: "auto",
            width: "75vw",
            maxWidth: "1200px",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.06]"
            style={{
              background: "repeating-linear-gradient(to bottom, transparent 0 2px, rgba(0,255,65,.9) 2px 3px)",
            }}
          />
          <div className="relative">
            <div className="text-2xl font-semibold mb-4 text-[var(--accent)]">Initializing</div>
            <div className="space-y-2">
              {steps.map((s, idx) => (
                <motion.div
                  key={s.key}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between p-5 rounded-lg border mx-border bg-[rgba(0,255,65,0.05)]"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-md bg-[rgba(0,255,65,0.08)] border mx-border">{s.icon}</div>
                    <div className="text-lg text-[var(--text)]">{s.label}</div>
                  </div>
                  <div>
                    {s.status === "done" ? (
                      <CheckCircle2 className="w-7 h-7 text-[var(--accent)]" />
                    ) : s.status === "working" ? (
                      <Loader2 className="w-7 h-7 animate-spin text-[color:rgba(151,255,151,0.9)]" />
                    ) : (
                      <div className="w-7 h-7" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
