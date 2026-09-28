"use client"

import * as React from "react"
import { useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

type SpotlightCardProps = React.ComponentProps<"div">

/**
 * Surface card with a cursor-tracked radial wash (the `spotlight` utility reads --spot-x/--spot-y).
 * Reduced motion → no tracking; the wash stays centred and only fades in on hover.
 */
export function SpotlightCard({ className, children, onPointerMove, ...props }: SpotlightCardProps) {
  const reduceMotion = useReducedMotion()

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    onPointerMove?.(event)
    if (reduceMotion) return
    const rect = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty("--spot-x", `${event.clientX - rect.left}px`)
    event.currentTarget.style.setProperty("--spot-y", `${event.clientY - rect.top}px`)
  }

  return (
    <div
      className={cn(
        "group/spotlight relative isolate overflow-hidden rounded-2xl elevation-surface transition-colors duration-300 hover:border-brand-ink/30",
        className
      )}
      onPointerMove={handlePointerMove}
      {...props}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 spotlight opacity-0 transition-opacity duration-500 group-hover/spotlight:opacity-100"
      />
      {children}
    </div>
  )
}
