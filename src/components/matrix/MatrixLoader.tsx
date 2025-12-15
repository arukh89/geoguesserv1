"use client"

import React from "react"
export default function MatrixLoader({ label = "Loading...", className = "" }: { label?: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 text-[var(--text)] ${className}`}>
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-2 border-[rgba(0,255,65,0.25)]" />
        <div
          className="absolute inset-0 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin"
          style={{ filter: "drop-shadow(0 0 10px rgba(0,255,65,0.6))" }}
        />
        <div className="absolute inset-2 rounded-full bg-[rgba(0,255,65,0.06)]" />
      </div>
      <div className="text-sm tracking-wider text-[color:rgba(151,255,151,0.9)] mx-glitch" aria-live="polite">
        {label}
      </div>
    </div>
  )
}
