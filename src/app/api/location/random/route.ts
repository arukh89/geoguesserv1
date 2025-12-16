import { type NextRequest, NextResponse } from "next/server"
import { getRandomLocations } from "@/lib/game/locations"

// Regions with good Mapillary coverage for more varied locations
const REGIONS = [
  // Europe
  { name: "Western Europe", latMin: 43, latMax: 55, lonMin: -5, lonMax: 15 },
  { name: "Northern Europe", latMin: 55, latMax: 70, lonMin: 5, lonMax: 30 },
  { name: "Eastern Europe", latMin: 45, latMax: 55, lonMin: 15, lonMax: 35 },
  { name: "Southern Europe", latMin: 35, latMax: 45, lonMin: -10, lonMax: 25 },
  // Americas
  { name: "USA East", latMin: 25, latMax: 45, lonMin: -90, lonMax: -70 },
  { name: "USA West", latMin: 32, latMax: 48, lonMin: -125, lonMax: -105 },
  { name: "USA Central", latMin: 30, latMax: 48, lonMin: -105, lonMax: -90 },
  { name: "Canada", latMin: 45, latMax: 55, lonMin: -130, lonMax: -60 },
  { name: "Brazil", latMin: -25, latMax: 0, lonMin: -55, lonMax: -35 },
  { name: "Argentina", latMin: -40, latMax: -25, lonMin: -70, lonMax: -55 },
  // Asia
  { name: "Japan", latMin: 30, latMax: 45, lonMin: 128, lonMax: 145 },
  { name: "South Korea", latMin: 33, latMax: 38, lonMin: 125, lonMax: 130 },
  { name: "Southeast Asia", latMin: -10, latMax: 20, lonMin: 95, lonMax: 125 },
  { name: "India", latMin: 8, latMax: 30, lonMin: 70, lonMax: 90 },
  // Oceania
  { name: "Australia East", latMin: -40, latMax: -20, lonMin: 140, lonMax: 155 },
  { name: "Australia West", latMin: -35, latMax: -20, lonMin: 115, lonMax: 140 },
  { name: "New Zealand", latMin: -47, latMax: -34, lonMin: 166, lonMax: 178 },
  // Africa
  { name: "South Africa", latMin: -35, latMax: -22, lonMin: 16, lonMax: 33 },
  { name: "North Africa", latMin: 25, latMax: 37, lonMin: -10, lonMax: 35 },
]

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function getRandomRegion() {
  return REGIONS[Math.floor(Math.random() * REGIONS.length)]
}

export async function GET(req: NextRequest) {
  try {
    console.log("[v0] Random location API called")
    const origin = new URL(req.url).origin

    // Try region-based sampling for better coverage
    const tries = 12
    const usedRegions = new Set<string>()
    
    for (let i = 0; i < tries; i++) {
      // Pick a random region, try to avoid repeats
      let region = getRandomRegion()
      let attempts = 0
      while (usedRegions.has(region.name) && attempts < 5) {
        region = getRandomRegion()
        attempts++
      }
      usedRegions.add(region.name)
      
      const lat = rand(region.latMin, region.latMax)
      const lon = rand(region.lonMin, region.lonMax)
      console.log(`[v0] Try ${i + 1} (${region.name}): lat=${lat.toFixed(2)}, lon=${lon.toFixed(2)}`)

      try {
        const mapillaryUrl = `${origin}/api/imagery/mapillary?lat=${lat}&lon=${lon}`
        const resp = await fetch(mapillaryUrl, {
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
        })

        if (resp.ok) {
          const j = await resp.json()
          if (j?.found && j?.imageId && typeof j.lat === "number" && typeof j.lon === "number") {
            console.log(`[v0] Found image in ${region.name}:`, j.imageId)
            return NextResponse.json({ 
              found: true, 
              provider: "mapillary", 
              imageId: j.imageId, 
              lat: j.lat, 
              lon: j.lon,
              region: region.name 
            })
          }
        }
      } catch (error) {
        console.error(`[v0] Error on try ${i + 1}:`, error)
      }
    }

    // Fallback to curated locations
    console.log("[v0] No Mapillary images found, using curated locations")
    const [loc] = getRandomLocations(1)
    if (loc) {
      return NextResponse.json({
        found: true,
        provider: "kartaview",
        imageUrl: loc.panoramaUrl,
        lat: loc.lat,
        lon: loc.lng,
      })
    }

    return NextResponse.json({ found: false })
  } catch (error) {
    console.error("[v0] Error in random location API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
