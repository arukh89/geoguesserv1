import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "./providers"
import GlobalHeader from "@/components/GlobalHeader"
import FarcasterWrapper from "@/components/FarcasterWrapper"
import "../styles/globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://geoguesserv1.vercel.app"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Farcaster Geo Explorer",
    description: "Explore the world. Test your geography skills. Share your scores on Farcaster!",
 
    icons: {
      icon: "https://geoguesserv1.vercel.app/icon.png",
     },
    openGraph: {
      title: "Farcaster Geo Explorer",
      description: "Explore the world. Test your geography skills. Share your scores on Farcaster!",
      url: "https://geoguesserv1.vercel.app",
      siteName: "Farcaster Geo Explorer",
      images: [
        {
          url: "https://geoguesserv1.vercel.app/icon.png/heroImageUrl.png",
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
      images: "https://geoguesserv1.vercel.app/icon.png/heroImageUrl.png",
    },
    other: {
      "fc:miniapp": JSON.stringify({
        version: "next",
        imageUrl: "https://geoguesserv1.vercel.app/icon.png/heroImageUrl.png",
        button: {
          title: "Play Game",
          action: {
            type: "launch_frame",
            name: "Farcaster Geo Explorer",
            url: "https://geoguesserv1.vercel.app/,
            splashImageUrl: "https://geoguesserv1.vercel.app/splash.png",
            splashBackgroundColor: #001a0f",
          },
        },
      }),
    },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased min-h-screen flex flex-col bg-black">
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
