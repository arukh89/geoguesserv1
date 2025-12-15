"use server"

// Server action to provide Mapillary token to client components
export async function getMapillaryToken() {
  const token = process.env.MAPILLARY_SERVER_TOKEN || process.env.NEXT_PUBLIC_MAPILLARY_TOKEN
  if (!token) {
    throw new Error("Mapillary token not configured")
  }
  return token
}
