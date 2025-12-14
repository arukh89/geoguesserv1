"use client"

import { useState, useEffect } from "react"
import HomeScreen from "./HomeScreen"
import ResultsScreen from "./ResultsScreen"
import FinalResults from "./FinalResults"
import PanoramaViewer from "./PanoramaViewer"
import WorldMap from "./WorldMap"
import GameHeader from "./GameHeader"
import { getRandomLocations } from "@/lib/game/locations"
import { calculateDistance, calculateScore } from "@/lib/game/scoring"
import type { Location, GameMode, RoundResult } from "@/lib/game/types"
import { Button } from "@/components/ui/button"
import { Map, X } from "lucide-react"

export function GamePage() {
  const [gameState, setGameState] = useState<"home" | "playing" | "results" | "final">("home")
  const [locations, setLocations] = useState<Location[]>([])
  const [currentRound, setCurrentRound] = useState(0)
  const [results, setResults] = useState<RoundResult[]>([])
  const [gameMode, setGameMode] = useState<GameMode>("classic")
  const [timeLimit, setTimeLimit] = useState<number | undefined>()
  const [timeLeft, setTimeLeft] = useState<number | undefined>(undefined)
  const [showMap, setShowMap] = useState(false)
  // Countdown timer per round
  useEffect(() => {
    if (gameState !== "playing" || typeof timeLimit !== "number") return
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (typeof prev !== "number") return prev
        const next = prev > 0 ? prev - 1 : 0
        if (next <= 0) {
          clearInterval(id)
          const location = locations[currentRound]
          if (location) {
            const guessLat = -location.lat
            const guessLng = location.lng >= 0 ? location.lng - 180 : location.lng + 180
            const distance = calculateDistance(location.lat, location.lng, guessLat, guessLng)
            const roundResult: RoundResult = {
              location,
              guess: { lat: guessLat, lng: guessLng },
              distance,
              score: 0,
              round: currentRound + 1,
            }
            setResults((prev) => [...prev, roundResult])
            setShowMap(false)
            setGameState("results")
          }
        }
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [gameState, currentRound, timeLimit, locations])
  const startGame = (mode: GameMode, durationSec?: number) => {
    const newLocations = getRandomLocations(5)
    setLocations(newLocations)
    setCurrentRound(0)
    setResults([])
    setGameMode(mode)
    setTimeLimit(durationSec)
    setTimeLeft(durationSec)
    setGameState("playing")
    setShowMap(false)
  }

  const handleGuess = (lat: number, lng: number) => {
    const location = locations[currentRound]
    const distance = calculateDistance(location.lat, location.lng, lat, lng)
    const scoreResult = calculateScore(distance)

    const roundResult: RoundResult = {
      location,
      guess: { lat, lng },
      distance,
      score: scoreResult.score,
      round: currentRound + 1,
    }

    setResults([...results, roundResult])
    setShowMap(false)
    setGameState("results")
  }

  const nextRound = () => {
    if (currentRound < locations.length - 1) {
      setCurrentRound(currentRound + 1)
      setGameState("playing")
      setShowMap(false)
      if (typeof timeLimit === "number") setTimeLeft(timeLimit)
    } else {
      setGameState("final")
    }
  }

  const playAgain = () => {
    setGameState("home")
    setShowMap(false)
  }

  const shareResults = () => {
    const totalScore = results.reduce((sum, r) => sum + r.score, 0)
    const text = `I scored ${totalScore.toLocaleString()} points in Matrix GeoGuesser! Can you beat my score?`
    if (navigator.share) {
      navigator.share({ text, url: window.location.href }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).then(() => alert("Score copied to clipboard!"))
    }
  }

  if (gameState === "home") {
    return <HomeScreen onStart={startGame} />
  }

  if (gameState === "playing" && locations[currentRound]) {
    const location = locations[currentRound]
    const allowMove = gameMode !== "no-move"
    const totalScore = results.reduce((sum, r) => sum + r.score, 0)

    return (
      <div className="relative w-full h-[calc(100vh-3.5rem)] bg-black/95 overflow-hidden">
        <GameHeader
          currentRound={currentRound + 1}
          totalRounds={locations.length}
          score={totalScore}
          timeLeftSec={typeof timeLeft === "number" ? timeLeft : undefined}
        />

        <div className="absolute inset-0 top-14">
          <PanoramaViewer
            imageUrl={location.panoramaUrl}
            shot={
              location.provider && location.provider !== 'static'
                ? {
                    provider: location.provider,
                    imageId: location.imageId,
                    imageUrl: location.imageUrl,
                  }
                : undefined
            }
            allowMove={allowMove}
          />
        </div>

        {/* Make Guess Button */}
        {!showMap && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[100]">
            <Button
              size="lg"
              onClick={() => setShowMap(true)}
              className="shadow-2xl h-14 px-8 text-lg bg-green-600 hover:bg-green-700 text-white"
            >
              <Map className="w-5 h-5 mr-2" />
              Make Guess
            </Button>
          </div>
        )}

        {showMap && (
          <div className="fixed inset-0 top-14 bg-black z-[200]">
            {/* Close button */}
            <Button
              onClick={() => setShowMap(false)}
              className="absolute top-4 right-4 z-[300]"
              variant="secondary"
              size="sm"
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Map container - full remaining height */}
            <div className="w-full h-full">
              <WorldMap onGuess={handleGuess} active={showMap} />
            </div>
          </div>
        )}
      </div>
    )
  }

  if (gameState === "results" && results[currentRound]) {
    return (
      <ResultsScreen
        result={results[currentRound]}
        onNext={nextRound}
        isLastRound={currentRound === locations.length - 1}
      />
    )
  }

  if (gameState === "final") {
    const totalScore = results.reduce((sum, r) => sum + r.score, 0)
    return <FinalResults results={results} totalScore={totalScore} onPlayAgain={playAgain} onShare={shareResults} />
  }

  return null
}

export default GamePage
