"use client"

import * as React from "react"
import { MotionConfig } from "motion/react"
import { ThemeProvider } from "next-themes"
import { SessionProvider } from "next-auth/react"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SmoothScroll } from "@/components/shared/motion/smooth-scroll"

/** App-wide client providers: theme, auth, reduced-motion policy, smooth scroll, toasts. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider session={undefined}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
        <MotionConfig reducedMotion="user">
          <TooltipProvider delay={200}>
            <SmoothScroll>{children}</SmoothScroll>
            <Toaster position="bottom-right" />
          </TooltipProvider>
        </MotionConfig>
      </ThemeProvider>
    </SessionProvider>
  )
}
