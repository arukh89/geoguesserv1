"use client"

import React, { useState, useEffect } from "react"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"

interface WorldMapProps {
  onGuess: (lat: number, lng: number) => void
  disabled?: boolean
  active?: boolean
}

// Dynamically import Leaflet components (no SSR)
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="text-green-400">Loading map...</div>
    </div>
  ),
})

export default function WorldMap({ onGuess, disabled = false }: WorldMapProps) {
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null)

  const handleMapClick = (lat: number, lng: number) => {
    if (disabled) return
    setMarkerPosition({ lat, lng })
  }

  const handleConfirmGuess = () => {
    if (!markerPosition) return
    onGuess(markerPosition.lat, markerPosition.lng)
  }

  return (
    <div className="w-full h-full flex flex-col bg-black">
      {/* Map container */}
      <div className="flex-1 relative overflow-hidden">
        <LeafletMap
          onMapClick={handleMapClick}
          markerPosition={markerPosition}
          disabled={disabled}
        />
      </div>

      {/* Instructions and Confirm Button */}
      <div className="p-4 bg-black border-t border-green-500/20 flex items-center justify-between">
        <div className="text-green-400 text-sm">
          {markerPosition 
            ? `Selected: ${markerPosition.lat.toFixed(2)}°, ${markerPosition.lng.toFixed(2)}°` 
            : "Click anywhere on the map to place your guess"}
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
