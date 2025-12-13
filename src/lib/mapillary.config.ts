// Mapillary API Configuration
// Client ID: 25246864601630618
// Authentication URL: https://www.mapillary.com/connect?client_id=25246864601630618

// Token will be fetched via server action instead

// Server-side only configuration
export const MAPILLARY_CLIENT_SECRET = process.env.MAPILLARY_CLIENT_SECRET || ""
export const MAPILLARY_CLIENT_ID = "25246864601630618"
export const MAPILLARY_AUTH_URL = `https://www.mapillary.com/connect?client_id=${MAPILLARY_CLIENT_ID}`
