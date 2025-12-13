'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import '@/lib/leaflet.config';
import { Button } from '@/components/ui/button';
import { MapPin, X } from 'lucide-react';

interface WorldMapProps {
  onGuess: (lat: number, lng: number) => void;
  disabled?: boolean;
  active?: boolean; // when shown as overlay
}

interface MapPosition {
  lat: number;
  lng: number;
}

function AutoResize({ active }: { active?: boolean }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => {
      try { map.invalidateSize(); } catch {}
    }, 50);
    return () => clearTimeout(t);
  }, [map]);
  useEffect(() => {
    if (!active) return;
    const t1 = setTimeout(() => { try { map.invalidateSize(); } catch {} }, 50);
    const t2 = setTimeout(() => { try { map.invalidateSize(); } catch {} }, 300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [active, map]);
  return null;
}

function ClickCapture({ onPick }: { onPick: (pos: MapPosition) => void }) {
  const map = useMap();
  const ref = useRef<HTMLDivElement | null>(null);
  const handle = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const point = map.containerPointToLatLng([e.clientX - rect.left, e.clientY - rect.top]);
    onPick({ lat: point.lat, lng: point.lng });
  };
  return (
    <div
      ref={ref}
      onClick={handle}
      style={{ position: 'absolute', inset: 0, zIndex: 450, background: 'transparent' }}
      aria-hidden="true"
    />
  );
}

function DefaultPositionOnActive({ active, onSet }: { active?: boolean; onSet: (pos: MapPosition) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!active) return;
    try {
      const c = map.getCenter();
      onSet({ lat: c.lat, lng: c.lng });
    } catch {}
  }, [active, map, onSet]);
  return null;
}

export default function WorldMap({ onGuess, disabled = false, active }: WorldMapProps) {
  const [position, setPosition] = useState<MapPosition | null>(null);
  const [isClient] = useState<boolean>(typeof window !== 'undefined');
  const [useFallbackTiles, setUseFallbackTiles] = useState(false);

  const handlePositionClick = (pos: MapPosition): void => {
    if (!disabled) {
      setPosition(pos);
    }
  };

  const handleConfirmGuess = (): void => {
    if (position) {
      onGuess(position.lat, position.lng);
      setPosition(null);
    }
  };

  const handleClearGuess = (): void => {
    setPosition(null);
  };

  if (!isClient) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  const center: LatLngExpression = [20, 0];

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <AutoResize active={active} />
        {!useFallbackTiles ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains={['a','b','c','d'] as any}
            eventHandlers={{ tileerror: () => { console.warn('Tile failed, switching to fallback'); setUseFallbackTiles(true); } }}
          />
        ) : (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        )}

        /* Use ClickCapture overlay for consistent click handling */
        <ClickCapture onPick={handlePositionClick} />
        <DefaultPositionOnActive active={active} onSet={(p) => setPosition((prev) => prev ?? p)} />

        {position && (
          <Marker position={[position.lat, position.lng]}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold mb-1">Your Guess</div>
                <div>Lat: {position.lat.toFixed(4)}</div>
                <div>Lng: {position.lng.toFixed(4)}</div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {!disabled && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000] flex gap-2 items-center">
          <Button
            onClick={handleConfirmGuess}
            size="lg"
            className="shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!position}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Confirm Guess
          </Button>
          {position && (
            <Button
              onClick={handleClearGuess}
              size="lg"
              variant="secondary"
              className="shadow-lg"
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
          <div className="px-4 py-2 rounded-lg shadow-lg text-sm mx-panel">
            <span className="text-[color:rgba(151,255,151,0.9)]">
              {position ? 'Click the map to adjust your guess' : 'Click on the map to place your guess'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
