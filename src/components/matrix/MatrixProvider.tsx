"use client"

import type React from "react"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

type MatrixSettings = {
  rain: boolean
  glitch: boolean
  crt: boolean
}

type MatrixContextType = {
  settings: MatrixSettings
  setSettings: (s: Partial<MatrixSettings>) => void
}

const MatrixContext = createContext<MatrixContextType | null>(null)

export function useMatrix() {
  const ctx = useContext(MatrixContext)
  if (!ctx) throw new Error("useMatrix must be used within MatrixProvider")
  return ctx
}

export function MatrixProvider({ children }: { children: React.ReactNode }) {
  const prefersReduced = usePrefersReducedMotion()
  const [settings, setState] = useState<MatrixSettings>({
    rain: true,
    glitch: !prefersReduced,
    crt: true,
  })

  const effective = useMemo<MatrixSettings>(
    () => ({
      rain: settings.rain,
      glitch: settings.glitch && !prefersReduced,
      crt: settings.crt,
    }),
    [settings, prefersReduced],
  )

  const api = useMemo<MatrixContextType>(
    () => ({
      settings: effective,
      setSettings: (s) => setState((prev) => ({ ...prev, ...s })),
    }),
    [effective],
  )

  return <MatrixContext.Provider value={api}>{children}</MatrixContext.Provider>
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    const q = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onChange = () => setReduced(q.matches)
    onChange()
    q.addEventListener?.("change", onChange)
    return () => q.removeEventListener?.("change", onChange)
  }, [])
  return reduced
}
