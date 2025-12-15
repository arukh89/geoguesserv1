// src/app/layout.tsx
import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "./providers"
import GlobalHeader from "@/components/GlobalHeader"
import FarcasterWrapper from "@/components/FarcasterWrapper"
import MatrixRain from "@/components/matrix/MatrixRain"
import "../styles/globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

const baseUrl = "https://geoguesserv1.vercel.app"

export async function generateMetadata(): Promise<Metadata> {
  const miniApp = {
    version: "next",
    imageUrl: `${baseUrl}/icon.png`,
    button: {
      title: "Play Game",
      action: {
        type: "launch_frame",
        name: "Farcaster Geo Explorer",
        url: `${baseUrl}/`,
        splashImageUrl: `${baseUrl}/splash.png`,
        splashBackgroundColor: "#001a0f",
      },
    },
  }

  return {
    title: "Farcaster Geo Explorer",
    description: "Explore the world. Test your geography skills. Share your scores on Farcaster!",
 
    icons: {
      icon: `${baseUrl}/icon.png`,
      apple: `${baseUrl}/icon.png`,
    },
    openGraph: {
      title: "Farcaster Geo Explorer",
      description: "Explore the world. Test your geography skills. Share your scores on Farcaster!",
      url: baseUrl,
      siteName: "Farcaster Geo Explorer",
      images: [
        {
          url: `${baseUrl}/heroImageUrl.png`,
          width: 1200,
          height: 630,
          alt: "Farcaster Geo Explorer - Master the world in 3 simple steps",
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Farcaster Geo Explorer",
      description: "Explore the world. Test your geography skills. Share your scores on Farcaster!",
      images: [`${baseUrl}/heroImageUrl.png`],
    },
    other: {
      "fc:miniapp": JSON.stringify({
        version: "next",
        imageUrl: `${baseUrl}/heroImageUrl.png`,
        button: {
          title: "Play Game",
          action: {
            type: "launch_frame",
            name: "Farcaster Geo Explorer",
            url: baseUrl,
            splashImageUrl: `${baseUrl}/splash.png`,
            splashBackgroundColor: "#001a0f",
          },
        },
      }),
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${_geist.className} ${_geistMono.className} font-sans antialiased min-h-screen flex flex-col bg-black relative`}
      >
        <Providers>
          <FarcasterWrapper>
            <MatrixRain />
            <div className="relative z-10">
              <GlobalHeader />
              <main className="flex-1 mt-14">{children}</main>
            </div>
          </FarcasterWrapper>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
