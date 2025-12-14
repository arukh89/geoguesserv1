import type { GuessResult } from './types';

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Calculate score based on distance
// Closer guesses get higher scores (max 5000 points)
export function calculateScore(distanceKm: number): GuessResult {
  const MAX_SCORE = 5000;
  const MAX_DISTANCE = 20000; // Maximum meaningful distance on Earth

  // Score decreases exponentially with distance
  // Perfect guess (0km) = 5000 points
  // 100km = ~4750 points
  // 1000km = ~3000 points
  // 5000km = ~1000 points
  // 10000km+ = minimal points
  
  let score = 0;
  
  if (distanceKm === 0) {
    score = MAX_SCORE;
  } else if (distanceKm < 1) {
    score = Math.round(MAX_SCORE * 0.99);
  } else {
    // Exponential decay formula
    const normalizedDistance = Math.min(distanceKm / MAX_DISTANCE, 1);
    score = Math.round(MAX_SCORE * Math.pow(1 - normalizedDistance, 2));
  }

  // Ensure score is not negative
  score = Math.max(0, score);

  return {
    distance: distanceKm,
    score: score,
    maxScore: MAX_SCORE
  };
}

// Format distance for display
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  } else if (km < 10) {
    return `${km.toFixed(1)}km`;
  } else {
    return `${Math.round(km).toLocaleString()}km`;
  }
}

// Get performance message based on score
export function getPerformanceMessage(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100;

  if (percentage >= 95) return '🎯 Incredible! Almost perfect!';
  if (percentage >= 85) return '🌟 Excellent guess!';
  if (percentage >= 70) return '👍 Great job!';
  if (percentage >= 50) return '👌 Good effort!';
  if (percentage >= 30) return '🤔 Not bad!';
  return '💪 Keep trying!';
}

// Calculate average performance
export function calculateAverageDistance(distances: number[]): number {
  if (distances.length === 0) return 0;
  const sum = distances.reduce((acc: number, val: number) => acc + val, 0);
  return Math.round(sum / distances.length);
}
