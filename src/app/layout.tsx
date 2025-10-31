import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Providers from "@/components/provider"
import ChatInterface from "@/components/chat-interface"
import { Toaster } from "@/components/ui/toaster"

const geist = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GmailAgent - AI-Powered Email Management",
  description: "Manage your Gmail efficiently with AI assistance",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ChatInterface>
            <div className="min-h-screen flex flex-col">
              <div className="flex-1">
                {children}
              </div>
            </div>
            <Toaster />
          </ChatInterface>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
