"use client"

import React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Gamepad2, Clock, Navigation } from "lucide-react"

interface GameModeDropdownProps {
  onStart: (mode: "classic" | "no-move" | "time-attack", durationSec?: number) => void
}

export default function GameModeDropdown({ onStart }: GameModeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const modes = [
    { key: "classic" as const, label: "Classic", icon: Gamepad2, desc: "5 rounds, free exploration" },
    { key: "no-move" as const, label: "No-Move", icon: Navigation, desc: "Look around only" },
  ]

  const timeAttackModes = [
    { duration: 30, label: "30s" },
    { duration: 60, label: "60s" },
    { duration: 90, label: "90s" },
  ]

  return (
    <div className="fixed left-2 sm:left-4 top-20 sm:top-1/2 sm:-translate-y-1/2 z-50">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-3 rounded-lg bg-black/80 backdrop-filter backdrop-blur-lg border-2 border-green-500/50 hover:bg-green-900/20 hover:border-green-400 transition-colors shadow-lg shadow-green-500/20"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
        <span className="font-semibold text-green-300 text-sm sm:text-base">Menu</span>
        <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-green-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-2 w-56 sm:w-64 rounded-lg bg-black/90 backdrop-filter backdrop-blur-lg border-2 border-green-500/50 overflow-hidden shadow-xl shadow-green-500/20"
          >
            <div className="p-2 space-y-1">
              {modes.map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => {
                    onStart(mode.key)
                    setIsOpen(false)
                  }}
                  className="w-full text-left px-3 py-3 rounded-md hover:bg-green-900/30 transition-colors flex items-start gap-3 group border border-transparent hover:border-green-500/30"
                >
                  <mode.icon className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <div className="font-semibold text-green-300 group-hover:text-green-200 transition-colors">
                      {mode.label}
                    </div>
                    <div className="text-xs text-green-400/70">{mode.desc}</div>
                  </div>
                </button>
              ))}

              {/* Time Attack submenu */}
              <div className="border-t border-green-500/30 pt-2 mt-2">
                <div className="px-3 py-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-semibold text-green-300">Time Attack</span>
                </div>
                <div className="space-y-1">
                  {timeAttackModes.map((ta) => (
                    <button
                      key={ta.duration}
                      onClick={() => {
                        onStart("time-attack", ta.duration)
                        setIsOpen(false)
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-green-900/30 transition-colors text-green-300 hover:text-green-200 text-sm pl-9 border border-transparent hover:border-green-500/30"
                    >
                      {ta.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
