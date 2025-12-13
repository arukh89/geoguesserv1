import { type NextRequest, NextResponse } from "next/server"
import { VectorTile } from "@mapbox/vector-tile"
import Pbf from "pbf"

const Z = 14 // supported zoom for Mapillary coverage tiles

function lonLatToTile(lon: number, lat: number, z: number) {
  const x = Math.floor(((lon + 180) / 360) * Math.pow(2, z))
  const latRad = (lat * Math.PI) / 180
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, z))
  return { x, y }
}

export async function GET(req: NextRequest) {
  try {
    console.log("[v0] Mapillary imagery API called")
    const { searchParams } = new URL(req.url)
    const lat = Number(searchParams.get("lat"))
    const lon = Number(searchParams.get("lon"))

    console.log("[v0] Request params - lat:", lat, "lon:", lon)

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      console.log("[v0] Invalid lat/lon parameters")
      return NextResponse.json({ error: "lat/lon required" }, { status: 400 })
    }

    const token = process.env.MAPILLARY_SERVER_TOKEN || process.env.NEXT_PUBLIC_MAPILLARY_TOKEN
    if (!token) {
      console.log("[v0] Missing Mapillary token")
      return NextResponse.json({ error: "Missing Mapillary token" }, { status: 500 })
    }

    console.log("[v0] Token available:", token.substring(0, 10) + "...")

    const { x, y } = lonLatToTile(lon, lat, Z)
    console.log("[v0] Tile coordinates - x:", x, "y:", y, "z:", Z)

    const url = `https://tiles.mapillary.com/maps/vtp/mly1_public/2/${Z}/${x}/${y}?access_token=${token}`
    console.log("[v0] Fetching Mapillary tile...")

    const resp = await fetch(url, { cache: "no-store" })
    console.log("[v0] Mapillary tile response status:", resp.status)

    if (!resp.ok) {
      console.log("[v0] Tile fetch failed:", resp.status, resp.statusText)
      return NextResponse.json({ error: "Tile fetch failed" }, { status: 502 })
    }

    const arrayBuf = await resp.arrayBuffer()
    console.log("[v0] Tile data size:", arrayBuf.byteLength, "bytes")

    const vt = new VectorTile(new Pbf(new Uint8Array(arrayBuf)))

    const layer = vt.layers["image"]
    if (!layer || layer.length === 0) {
      console.log("[v0] No images in tile")
      return NextResponse.json({ found: false })
    }

    console.log("[v0] Found", layer.length, "images in tile")

    let best: any = null
    for (let i = 0; i < layer.length; i++) {
      const f = layer.feature(i).toGeoJSON(x, y, Z) as any
      const [flon, flat] = f.geometry.coordinates as [number, number]
      const dx = (flon - lon) * Math.cos(((flat + lat) * Math.PI) / 360)
      const dy = flat - lat
      const d2 = dx * dx + dy * dy
      if (!best || d2 < best.d2) best = { d2, f, lon: flon, lat: flat }
    }

    const id = best?.f?.properties?.id
    if (!id) {
      console.log("[v0] No valid image ID found")
      return NextResponse.json({ found: false })
    }

    console.log("[v0] Best image ID:", id, "at", best.lat.toFixed(4), best.lon.toFixed(4))
    return NextResponse.json({ found: true, provider: "mapillary", imageId: id, lat: best.lat, lon: best.lon })
  } catch (e) {
    console.error("[v0] Error in Mapillary API:", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
