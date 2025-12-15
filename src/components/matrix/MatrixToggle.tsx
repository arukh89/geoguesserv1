"use client"

import React from "react"
import { useMatrix } from "@/components/matrix/MatrixProvider"

export function MatrixToggle() {
  const { settings, setSettings } = useMatrix()
  return (
    <label className="flex items-center gap-2 text-[var(--text)] text-sm select-none">
      <input
        type="checkbox"
        className="accent-[var(--accent)]"
        checked={settings.rain}
        onChange={(e) => setSettings({ rain: e.target.checked })}
      />
      Digital Rain
    </label>
  )
}

export default MatrixToggle
