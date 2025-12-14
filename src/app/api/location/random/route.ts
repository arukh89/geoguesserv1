import { type NextRequest, NextResponse } from "next/server"
import { getRandomLocations } from "@/lib/game/locations"

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

export async function GET(req: NextRequest) {
  try {
    console.log("[v0] Random location API called")
    const origin = new URL(req.url).origin
    console.log("[v0] Origin:", origin)

    // Try a few random samples against Mapillary coverage; fall back to curated list
    const tries = 8
    for (let i = 0; i < tries; i++) {
      const lat = rand(-55, 75) // bias away from poles/oceans a bit
      const lon = rand(-180, 180)
      console.log(`[v0] Try ${i + 1}: lat=${lat.toFixed(2)}, lon=${lon.toFixed(2)}`)

      try {
        const mapillaryUrl = `${origin}/api/imagery/mapillary?lat=${lat}&lon=${lon}`
        console.log("[v0] Fetching from Mapillary API:", mapillaryUrl)

        const resp = await fetch(mapillaryUrl, {
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
        })

        console.log("[v0] Mapillary API response status:", resp.status)

        if (resp.ok) {
          const j = await resp.json()
          console.log("[v0] Mapillary API response:", j)

          if (j?.found && j?.imageId && typeof j.lat === "number" && typeof j.lon === "number") {
            console.log("[v0] Found valid Mapillary image:", j.imageId)
            return NextResponse.json({ found: true, provider: "mapillary", imageId: j.imageId, lat: j.lat, lon: j.lon })
          }
        }
      } catch (error) {
        console.error(`[v0] Error on try ${i + 1}:`, error)
      }
    }

    // Fallback to a curated static panorama image as a playable experience
    console.log("[v0] No Mapillary images found, falling back to curated locations")
    const [loc] = getRandomLocations(1)
    if (loc) {
      console.log("[v0] Using curated location:", loc.name)
      return NextResponse.json({
        found: true,
        provider: "kartaview",
        imageUrl: loc.panoramaUrl,
        lat: loc.lat,
        lon: loc.lng,
      })
    }

    console.log("[v0] No locations available")
    return NextResponse.json({ found: false })
  } catch (error) {
    console.error("[v0] Error in random location API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
