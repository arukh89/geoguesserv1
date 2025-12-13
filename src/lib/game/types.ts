// Game type definitions

export interface Location {
  id: string;
  name: string;
  country: string;
  continent: string;
  lat: number;
  lng: number;
  panoramaUrl?: string; // legacy/static
  provider?: 'mapillary' | 'kartaview' | 'static';
  imageId?: string; // mapillary image id
  imageUrl?: string; // kartaview/static image url
  difficulty: 'easy' | 'medium' | 'hard';
  hints?: string[];
}

export interface GameState {
  currentRound: number;
  totalRounds: number;
  score: number;
  locations: Location[];
  currentLocation: Location | null;
  guess: { lat: number; lng: number } | null;
  roundScores: RoundResult[];
  gameStarted: boolean;
  gameEnded: boolean;
  mode?: GameMode;
  timeLeftSec?: number;
  timeLimitSec?: number;
}

export interface RoundResult {
  location: Location;
  guess: { lat: number; lng: number };
  distance: number;
  score: number;
  round: number;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  rounds: number;
  timestamp: number;
  averageDistance: number;
}

export interface GuessResult {
  distance: number;
  score: number;
  maxScore: number;
}

export type GameMode = 'classic' | 'no-move' | 'time-attack';
