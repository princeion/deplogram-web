"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { chartColor, type ChartColor } from "@/components/charts/types"
import { useEntered } from "@/components/charts/meters"

/**
 * A radial gauge made of ticks around an open arc, with anything you like in the middle (a
 * total, a label, an icon). Filled ticks sweep round on mount, one after another.
 */
export function TickGauge({
  value,
  ticks = 44,
  sweep = 260,
  color = "chart-1",
  size = 220,
  label,
  className,
  children,
}: {
  /** 0–1. */
  value: number
  ticks?: number
  /** Arc in degrees; the opening sits at the bottom. */
  sweep?: number
  color?: ChartColor
  size?: number
  label?: string
  className?: string
  children?: React.ReactNode
}) {
  const entered = useEntered()
  const filled = Math.round(Math.min(1, Math.max(0, value)) * ticks)
  const center = size / 2
  const outer = size / 2 - 2
  const inner = outer - size * 0.13
  const start = -90 - sweep / 2

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className={cn("relative mx-auto", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full overflow-visible" aria-hidden>
        {Array.from({ length: ticks }, (_, i) => {
          const angle = ((start + (sweep / (ticks - 1)) * i) * Math.PI) / 180
          const on = i < filled
          return (
            <line
              key={i}
              x1={center + inner * Math.cos(angle)}
              y1={center + inner * Math.sin(angle)}
              x2={center + outer * Math.cos(angle)}
              y2={center + outer * Math.sin(angle)}
              strokeWidth={size * 0.026}
              strokeLinecap="round"
              className="transition-[stroke-opacity] duration-300 motion-reduce:transition-none"
              style={{
                stroke: on ? chartColor(color) : "var(--foreground)",
                strokeOpacity: on ? (entered ? 0.35 + 0.65 * (i / Math.max(1, filled - 1)) : 0.1) : 0.1,
                transitionDelay: `${i * 18}ms`,
              }}
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}
