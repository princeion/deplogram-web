"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { chartColor, type ChartColor } from "@/components/charts/types"

/**
 * A tiny trend line for stat tiles: a smooth line, a fill fading downward, and a dot on the latest
 * value. No axes or tooltip — it's there to show shape, not exact numbers.
 */
export function Sparkline({ values, color = "chart-1", height = 36, className }: { values: readonly number[]; color?: ChartColor; height?: number; className?: string }) {
  const id = React.useId().replace(/:/g, "")
  const width = 120
  if (values.length < 2) return <div className={className} style={{ height }} />
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const points = values.map((v, i) => [(i / (values.length - 1)) * width, height - 3 - ((v - min) / span) * (height - 8)] as const)
  // Smooth with midpoint quadratic curves.
  let line = `M ${points[0][0]} ${points[0][1]}`
  for (let i = 1; i < points.length; i++) {
    const [px, py] = points[i - 1]
    const [x, y] = points[i]
    line += ` Q ${px} ${py} ${(px + x) / 2} ${(py + y) / 2}`
  }
  const [lx, ly] = points[points.length - 1]
  line += ` T ${lx} ${ly}`
  const area = `${line} L ${width} ${height} L 0 ${height} Z`

  return (
    <div className={cn("relative w-full", className)} style={{ height }} aria-hidden>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="size-full overflow-visible">
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColor(color)} stopOpacity={0.28} />
            <stop offset="100%" stopColor={chartColor(color)} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${id}-fill)`} />
        <path d={line} fill="none" stroke={chartColor(color)} strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
      </svg>
      {/* The latest value, as an HTML dot so it stays round however the line stretches. */}
      <span
        className="absolute right-0 size-1.5 translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ top: `${(ly / height) * 100}%`, background: chartColor(color), boxShadow: `0 0 6px ${chartColor(color)}` }}
      />
    </div>
  )
}
