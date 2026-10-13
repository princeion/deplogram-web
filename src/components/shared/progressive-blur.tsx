import type * as React from "react"

import { cn } from "@/lib/utils"

type ProgressiveBlurProps = {
  className?: string
  /** CSS height of the strip. */
  height?: string
  /** Number of stacked blur layers — more is smoother, fewer is cheaper. */
  steps?: number
  /** Blur (px) of the strongest layer, at the bottom edge. */
  maxBlur?: number
  /** Which edge the blur builds towards. */
  side?: "bottom" | "top"
}

/**
 * Stacked backdrop-filter layers, each masked to a later band and blurring harder than the last,
 * so content softens progressively towards one edge. A faint tint into the page background on top
 * keeps text from looking smeared.
 */
export function ProgressiveBlur({ className, height = "14vh", steps = 5, maxBlur = 16, side = "bottom" }: ProgressiveBlurProps) {
  const direction = side === "bottom" ? "to bottom" : "to top"
  const layers = Array.from({ length: steps }, (_, i) => {
    const start = (i / steps) * 100
    const end = ((i + 1) / steps) * 100
    // Ease the blur in: gentle at the top of the strip, strongest at the edge.
    const blur = maxBlur * Math.pow((i + 1) / steps, 2)
    const mask = `linear-gradient(${direction}, transparent ${start}%, black ${end}%)`
    return { blur, mask }
  })

  return (
    <div aria-hidden className={cn("pointer-events-none relative w-full", className)} style={{ height }}>
      {layers.map(({ blur, mask }, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={
            {
              backdropFilter: `blur(${blur.toFixed(2)}px)`,
              WebkitBackdropFilter: `blur(${blur.toFixed(2)}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            } as React.CSSProperties
          }
        />
      ))}
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(${direction}, transparent, color-mix(in oklab, var(--background) 55%, transparent))` }}
      />
    </div>
  )
}
