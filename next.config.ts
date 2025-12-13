import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "kartaview.org" },
      { protocol: "https", hostname: "*.kartaview.org" as any },
    ],
  },
  // Explicitly use src directory for app router
  experimental: {
    appDir: true,
  },
}

export default nextConfig
