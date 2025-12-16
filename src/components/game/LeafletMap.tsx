"use client"

import React, { useEffect } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Custom green marker icon
const greenIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#22c55e" stroke="#000" stroke-width="1">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3" fill="#000"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

interface LeafletMapProps {
  onMapClick: (lat: number, lng: number) => void
  markerPosition: { lat: number; lng: number } | null
  disabled?: boolean
}

// Component to handle map click events
function MapClickHandler({ onMapClick, disabled }: { onMapClick: (lat: number, lng: number) => void; disabled?: boolean }) {
  useMapEvents({
    click: (e) => {
      if (!disabled) {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

// Component to fit bounds on mount
function FitBounds() {
  const map = useMap()
  useEffect(() => {
    map.setView([20, 0], 2)
  }, [map])
  return null
}

export default function LeafletMap({ onMapClick, markerPosition, disabled }: LeafletMapProps) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      maxZoom={18}
      style={{ width: "100%", height: "100%", background: "#000" }}
      worldCopyJump={true}
    >
      {/* OpenStreetMap tiles with labels */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapClickHandler onMapClick={onMapClick} disabled={disabled} />
      <FitBounds />
      
      {markerPosition && (
        <Marker position={[markerPosition.lat, markerPosition.lng]} icon={greenIcon} />
      )}
    </MapContainer>
  )
}
