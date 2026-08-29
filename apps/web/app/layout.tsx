import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Geist_Mono, Inter, Playfair_Display } from "next/font/google"

import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"

import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

const title = Playfair_Display({
  variable: "--font-title",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Sonar AI | Paper fund operations",
  description: "A source-linked autonomous paper hedge fund.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      className={`${inter.variable} ${geistMono.variable} ${title.variable} antialiased`}
      lang="en"
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange enableSystem>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
