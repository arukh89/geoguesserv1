"use client"
import React from "react"
import { Viewer } from "mapillary-js"
import { useEffect, useRef, useState } from "react"
import { getMapillaryToken } from "@/lib/actions/mapillary"

export default function MapillaryViewer({ imageId, allowMove = true }: { imageId: string; allowMove?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [token, setToken] = useState<string>("")

  useEffect(() => {
    getMapillaryToken().then(setToken).catch(console.error)
  }, [])

  useEffect(() => {
    if (!ref.current || !imageId || !token) return
    const v = new Viewer({
      accessToken: token,
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
  }, [imageId, allowMove, token])

  return <div ref={ref} style={{ width: "100%", height: "100%" }} />
}
