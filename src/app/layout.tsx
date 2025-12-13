import type React from "react"
import type { Metadata } from "next"
import { Share_Tech_Mono, VT323 } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "./providers"
import GlobalHeader from "@/components/GlobalHeader"
import FarcasterWrapper from "@/components/FarcasterWrapper"
import "../styles/globals.css"

const shareTechMono = Share_Tech_Mono({ subsets: ["latin"], weight: "400" })
const vt323 = VT323({ subsets: ["latin"], weight: "400" })

export const metadata: Metadata = {
  metadataBase: new URL("https://v0-geoguesser-7k.vercel.app"),
  title: "Farcaster Geo Explorer",
  description: "Explore the world. Test your geography skills. Share your scores.",
  openGraph: {
    title: "Farcaster Geo Explorer",
    description: "Explore the world. Test your geography skills. Share your scores.",
    url: "/",
    siteName: "Farcaster Geo Explorer",
    images: ["/heroImageUrl.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Farcaster Geo Explorer",
    description: "Explore the world. Test your geography skills. Share your scores.",
    images: ["/heroImageUrl.png"],
  },
    icons: {`n    icon: "/icon.png",`n    apple: "/splash.png",`n  },
  other: {
    "base:app_id": "693d9f2bd77c069a945bde7d",
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${shareTechMono.className} font-mono antialiased min-h-screen flex flex-col bg-black`}>
        <Providers>
          <FarcasterWrapper>
            <GlobalHeader />
            <main className="flex-1 mt-14">{children}</main>
          </FarcasterWrapper>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
