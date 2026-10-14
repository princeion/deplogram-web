"use client"

import * as React from "react"
import { MotionConfig } from "motion/react"
import { ThemeProvider } from "next-themes"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

import { getQueryClient } from "@/lib/query-client"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SmoothScroll } from "@/components/shared/motion/smooth-scroll"

/**
 * App-wide client providers: server data (TanStack Query — including the session, see
 * features/auth), theme, reduced-motion policy, smooth scroll, toasts.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
        <MotionConfig reducedMotion="user">
          <TooltipProvider delay={200}>
            <SmoothScroll>{children}</SmoothScroll>
            <Toaster position="bottom-right" />
          </TooltipProvider>
        </MotionConfig>
      </ThemeProvider>
      {/* Excluded from production builds by the package itself. */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  )
}
