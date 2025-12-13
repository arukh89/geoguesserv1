"use client"

import type React from "react"
import Image from "next/image"

import { useState, useRef } from "react"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WorldMapProps {
  onGuess: (lat: number, lng: number) => void
  disabled?: boolean
  active?: boolean
}

export default function WorldMap({ onGuess, disabled = false }: WorldMapProps) {
  const [markerPosition, setMarkerPosition] = useState<{ x: number; y: number } | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Convert pixel coordinates to lat/lng
    // Map dimensions: width = 360 degrees, height = 180 degrees
    const lng = (x / rect.width) * 360 - 180
    const lat = 90 - (y / rect.height) * 180

    setMarkerPosition({ x, y })
  }

  const handleConfirmGuess = () => {
    if (!markerPosition || !mapRef.current) return

    const rect = mapRef.current.getBoundingClientRect()
    const lng = (markerPosition.x / rect.width) * 360 - 180
    const lat = 90 - (markerPosition.y / rect.height) * 180

    onGuess(lat, lng)
  }

  return (
    <div className="w-full h-full flex flex-col bg-black">
      {/* Map container */}
      <div className="flex-1 relative overflow-hidden" ref={mapRef} onClick={handleMapClick}>
        {/* World map image */}
        <Image src="/images/design-mode/Equirectangular_projection_SW.jpg" alt="World Map" fill sizes="100vw" className="object-cover" draggable={false} />

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full">
            {/* Latitude lines */}
            {Array.from({ length: 7 }).map((_, i) => (
              <line
                key={`lat-${i}`}
                x1="0"
                y1={`${(i * 100) / 6}%`}
                x2="100%"
                y2={`${(i * 100) / 6}%`}
                stroke="rgba(34, 197, 94, 0.2)"
                strokeWidth="1"
              />
            ))}
            {/* Longitude lines */}
            {Array.from({ length: 13 }).map((_, i) => (
              <line
                key={`lng-${i}`}
                x1={`${(i * 100) / 12}%`}
                y1="0"
                x2={`${(i * 100) / 12}%`}
                y2="100%"
                stroke="rgba(34, 197, 94, 0.2)"
                strokeWidth="1"
              />
            ))}
          </svg>
        </div>

        {/* Marker */}
        {markerPosition && (
          <div
            className="absolute -translate-x-1/2 -translate-y-full pointer-events-none animate-bounce"
            style={{
              left: markerPosition.x,
              top: markerPosition.y,
            }}
          >
            <MapPin className="w-8 h-8 text-green-500 fill-green-500 drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* Instructions and Confirm Button */}
      <div className="p-4 bg-black border-t border-green-500/20 flex items-center justify-between">
        <div className="text-green-400 text-sm">
          {markerPosition ? "Click Confirm to submit your guess" : "Click anywhere on the map to place your guess"}
        </div>
        <Button
          onClick={handleConfirmGuess}
          disabled={!markerPosition || disabled}
          className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
          size="lg"
        >
          Confirm Guess
        </Button>
      </div>
    </div>
  )
}
