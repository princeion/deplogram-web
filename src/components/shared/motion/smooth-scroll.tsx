"use client"

import * as React from "react"
import { ReactLenis } from "lenis/react"
import { useReducedMotion } from "motion/react"

/** Lenis smooth scrolling on the root scroller. Off entirely for reduced-motion users. */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return <>{children}</>
  return (
    <ReactLenis root options={{ lerp: 0.12 }}>
      {children}
    </ReactLenis>
  )
}
