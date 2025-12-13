"use client"

import { useState } from "react"
import HomeScreen from "./HomeScreen"
import PanoramaViewer from "./PanoramaViewer"
import ResultsScreen from "./ResultsScreen"
import FinalResults from "./FinalResults"
import { getRandomLocations } from "@/lib/game/locations"
import type { Location, GameMode } from "@/lib/game/types"

export default function GamePage() {
  const [gameState, setGameState] = useState<"home" | "playing" | "results" | "final">("home")
  const [locations, setLocations] = useState<Location[]>([])
  const [currentRound, setCurrentRound] = useState(0)
  const [scores, setScores] = useState<number[]>([])
  const [guesses, setGuesses] = useState<{ lat: number; lng: number }[]>([])
  const [gameMode, setGameMode] = useState<GameMode>("classic")
  const [timeLimit, setTimeLimit] = useState<number | undefined>()

  const startGame = async (mode: GameMode, durationSec?: number) => {
    const newLocations = await getRandomLocations(5)
    setLocations(newLocations)
    setCurrentRound(0)
    setScores([])
    setGuesses([])
    setGameMode(mode)
    setTimeLimit(durationSec)
    setGameState("playing")
  }

  const handleGuess = (guess: { lat: number; lng: number }, score: number) => {
    setGuesses([...guesses, guess])
    setScores([...scores, score])
    setGameState("results")
  }

  const nextRound = () => {
    if (currentRound < locations.length - 1) {
      setCurrentRound(currentRound + 1)
      setGameState("playing")
    } else {
      setGameState("final")
    }
  }

  const playAgain = () => {
    setGameState("home")
  }

  if (gameState === "home") {
    return <HomeScreen onStart={startGame} />
  }

  if (gameState === "playing" && locations[currentRound]) {
    return (
      <PanoramaViewer
        location={locations[currentRound]}
        roundNumber={currentRound + 1}
        totalRounds={locations.length}
        onGuess={handleGuess}
        gameMode={gameMode}
        timeLimit={timeLimit}
      />
    )
  }

  if (gameState === "results" && locations[currentRound]) {
    return (
      <ResultsScreen
        location={locations[currentRound]}
        guess={guesses[currentRound]}
        score={scores[currentRound]}
        roundNumber={currentRound + 1}
        onNext={nextRound}
      />
    )
  }

  if (gameState === "final") {
    return <FinalResults locations={locations} guesses={guesses} scores={scores} onPlayAgain={playAgain} />
  }

  return null
}
