"use client"

import { useEffect, useRef } from "react"
import { useMatrix } from "@/components/matrix/MatrixProvider"

export default function MatrixRain({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { settings } = useMatrix()

  useEffect(() => {
    if (!settings.rain) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    console.log("[v0] MatrixRain: Initializing canvas animation")

    let raf = 0
    let width = 0
    let height = 0
    let columns = 0
    let drops: number[] = []
    const chars = "アイウエオカキクケコサシスセソ012345789田由甲水火地風AEIOUY".split("")
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))

    const resize = () => {
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      columns = Math.floor(canvas.width / (14 * dpr))
      drops = Array.from({ length: columns }, () => (Math.random() * -100) | 0)
      ctx.scale(dpr, dpr)
      console.log("[v0] MatrixRain: Canvas resized", { width, height, columns })
    }

    const step = () => {
      ctx.fillStyle = "rgba(0,0,0,0.08)"
      ctx.fillRect(0, 0, width, height)
      for (let i = 0; i < drops.length; i++) {
        const x = i * 14 + 4
        const y = drops[i] * 18
        const ch = chars[(Math.random() * chars.length) | 0]
        ctx.fillStyle = Math.random() > 0.975 ? "#fff" : "#00ff41"
        ctx.font = "14px 'Share Tech Mono', monospace"
        ctx.fillText(ch, x, y)
        drops[i]++
        if (y > height && Math.random() > 0.975) drops[i] = (Math.random() * -50) | 0
      }
      raf = requestAnimationFrame(step)
    }

    const onResize = () => {
      cancelAnimationFrame(raf)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      resize()
      raf = requestAnimationFrame(step)
    }

    resize()
    raf = requestAnimationFrame(step)
    const ro = new ResizeObserver(onResize)
    ro.observe(canvas)
    window.addEventListener("resize", onResize)

    return () => {
      console.log("[v0] MatrixRain: Cleaning up")
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener("resize", onResize)
    }
  }, [settings.rain])

  if (!settings.rain) return null

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 w-full h-full"
      style={{
        opacity: 0.14,
        width: "100vw",
        height: "100vh",
        zIndex: 1,
      }}
      aria-hidden
    />
  )
}
