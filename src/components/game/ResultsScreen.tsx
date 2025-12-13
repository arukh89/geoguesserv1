"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Target, MapPin, ArrowRight } from "lucide-react";
import type { RoundResult } from "@/lib/game/types";
import { formatDistance, getPerformanceMessage } from "@/lib/game/scoring";
import type { LatLngExpression, LatLngBoundsExpression } from "leaflet";
import "@/lib/leaflet.config";

// Dynamically import react-leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then((m) => m.Polyline), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

interface ResultsScreenProps {
  result: RoundResult;
  onNext: () => void;
  isLastRound: boolean;
}

export default function ResultsScreen({ result, onNext, isLastRound }: ResultsScreenProps) {
  const [isClient, setIsClient] = useState(false);
  const [icons, setIcons] = useState<{ actual: any; guess: any } | null>(null);

  useEffect(() => {
    setIsClient(true);
    (async () => {
      const leafletMod: any = await import("leaflet");
      const L = leafletMod.default ?? leafletMod;
      const actual = L.divIcon({ className: "mx-marker", html: "", iconSize: [18, 18], iconAnchor: [9, 9] });
      const guess = L.divIcon({ className: "mx-marker guess", html: "", iconSize: [18, 18], iconAnchor: [9, 9] });
      setIcons({ actual, guess });
    })();
  }, []);

  const scorePercentage = (result.score / 5000) * 100;
  const performanceMessage = getPerformanceMessage(result.score, 5000);

  const actualPosition: LatLngExpression = [result.location.lat, result.location.lng];
  const guessPosition: LatLngExpression = [result.guess.lat, result.guess.lng];
  const linePositions: LatLngExpression[] = [actualPosition, guessPosition];
  const leafletBounds: LatLngBoundsExpression = [
    [
      Math.min(result.location.lat, result.guess.lat),
      Math.min(result.location.lng, result.guess.lng),
    ],
    [
      Math.max(result.location.lat, result.guess.lat),
      Math.max(result.location.lng, result.guess.lng),
    ],
  ];

  return (
    <div className="min-h-screen p-4 pt-16 md:pt-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        <Card className="shadow-2xl overflow-hidden mx-panel">
          <CardHeader className="text-[var(--text)] border-b mx-border">
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <CardTitle className="text-3xl flex items-center gap-3 text-[var(--accent)]">
                <Trophy className="w-8 h-8" />
                Round {result.round} Results
              </CardTitle>
              <CardDescription className="text-[color:rgba(151,255,151,0.85)] text-lg mt-2">{performanceMessage}</CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="p-6 space-y-6 text-[var(--text)]">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <Card className="mx-panel">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-[rgba(0,255,65,0.08)] border mx-border">
                      <Target className="w-5 h-5 text-[var(--accent)]" />
                    </div>
                    <div className="font-semibold">Location</div>
                  </div>
                  <div className="text-2xl font-bold text-[var(--accent)]">{result.location.name}</div>
                  <div className="text-sm text-[color:rgba(151,255,151,0.8)] mt-1">{result.location.country}</div>
                </CardContent>
              </Card>

              <Card className="mx-panel">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-[rgba(0,255,65,0.08)] border mx-border">
                      <MapPin className="w-5 h-5 text-[var(--accent)]" />
                    </div>
                    <div className="font-semibold">Distance</div>
                  </div>
                  <div className="text-2xl font-bold text-[var(--accent)]">{formatDistance(result.distance)}</div>
                  <div className="text-sm text-[color:rgba(151,255,151,0.8)] mt-1">from actual location</div>
                </CardContent>
              </Card>

              <Card className="mx-panel">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-[rgba(0,255,65,0.08)] border mx-border">
                      <Trophy className="w-5 h-5 text-[var(--accent)]" />
                    </div>
                    <div className="font-semibold">Score</div>
                  </div>
                  <div className="text-2xl font-bold text-[var(--accent)]">{result.score.toLocaleString()}</div>
                  <div className="text-sm text-[color:rgba(151,255,151,0.8)] mt-1">{scorePercentage.toFixed(1)}% accuracy</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="h-96 rounded-lg overflow-hidden mx-panel"
            >
              {isClient && (
                <MapContainer bounds={leafletBounds} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    subdomains={["a","b","c","d"] as any}
                  />

                  <Marker position={actualPosition} icon={icons?.actual as any}>
                    <Popup>
                      <div className="font-semibold text-[var(--accent)]">Actual Location</div>
                      <div className="text-sm text-[color:rgba(151,255,151,0.9)]">{result.location.name}</div>
                    </Popup>
                  </Marker>

                  <Marker position={guessPosition} icon={icons?.guess as any}>
                    <Popup>
                      <div className="font-semibold text-[var(--accent)]">Your Guess</div>
                      <div className="text-sm text-[color:rgba(151,255,151,0.9)]">{formatDistance(result.distance)} away</div>
                    </Popup>
                  </Marker>

                  <Polyline positions={linePositions} pathOptions={{ color: "#00ff41", weight: 2, opacity: 0.9, dashArray: "10 10", className: "mx-polyline" }} />
                </MapContainer>
              )}
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
              <Button
                onClick={onNext}
                size="lg"
                className="w-full h-14 text-lg"
              >
                {isLastRound ? "View Final Results" : "Next Round"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
