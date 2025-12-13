// Mapillary API Configuration
// Client ID: 25246864601630618
// Authentication URL: https://www.mapillary.com/connect?client_id=25246864601630618

// Client-side token (safe to expose via NEXT_PUBLIC_ prefix)
export const MAPILLARY_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPILLARY_TOKEN || ""

// Server-side only configuration
export const MAPILLARY_CLIENT_SECRET = process.env.MAPILLARY_CLIENT_SECRET || ""
export const MAPILLARY_CLIENT_ID = "25246864601630618"
export const MAPILLARY_AUTH_URL = `https://www.mapillary.com/connect?client_id=${MAPILLARY_CLIENT_ID}`
