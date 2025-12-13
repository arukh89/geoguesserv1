"use client"
import { Viewer } from "mapillary-js"
import { useEffect, useRef } from "react"
import { MAPILLARY_ACCESS_TOKEN } from "@/lib/mapillary.config"

export default function MapillaryViewer({ imageId, allowMove = true }: { imageId: string; allowMove?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current || !imageId) return
    const v = new Viewer({
      accessToken: MAPILLARY_ACCESS_TOKEN,
      container: ref.current,
      imageId,
      component: { cover: false },
    })
    if (!allowMove) {
      // Prevent click/dblclick based navigation while allowing drag to look
      const el = ref.current
      const stop = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
      }
      el.addEventListener("click", stop, true)
      el.addEventListener("dblclick", stop, true)
      el.addEventListener("auxclick", stop, true)
      el.addEventListener("contextmenu", stop, true)
      // Also prevent wheel zoom if desired? keep zoom allowed for now
      return () => {
        el.removeEventListener("click", stop, true)
        el.removeEventListener("dblclick", stop, true)
        el.removeEventListener("auxclick", stop, true)
        el.removeEventListener("contextmenu", stop, true)
        v.remove()
      }
    }
    return () => v.remove()
  }, [imageId, allowMove])
  return <div ref={ref} style={{ width: "100%", height: "100%" }} />
}
