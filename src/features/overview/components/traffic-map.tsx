"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { cities, type CityCode } from "@/features/overview/cities"
import type { WorldMapData } from "@/features/overview/world-map"
import type { Traffic } from "@/features/projects/projects"

/**
 * Where traffic is coming from, live: the world in dots, and every city that sent requests in
 * the last minute lit up — larger the busier it is, each with a steady sonar ring (faster when
 * busier). Errors tint a city red.
 */
export function TrafficMap({ map, traffic, className }: { map: WorldMapData; traffic?: Traffic; className?: string }) {
  const stats = React.useMemo(() => {
    const byCity = new Map<CityCode, { requests: number; errors: number; last: string }>()
    for (const r of traffic?.requests ?? []) {
      const code = r.city as CityCode
      if (!(code in cities)) continue
      const s = byCity.get(code) ?? { requests: 0, errors: 0, last: r.at }
      s.requests++
      if (r.error) s.errors++
      if (r.at > s.last) s.last = r.at
      byCity.set(code, s)
    }
    return [...byCity.entries()].sort((a, b) => b[1].requests - a[1].requests)
  }, [traffic])
  const max = Math.max(1, ...stats.map(([, s]) => s.requests))

  return (
    <div className={cn("relative", className)}>
      <svg viewBox={`0 0 ${map.width} ${map.height}`} className="h-auto w-full" role="img" aria-label={`Live traffic map — requests from ${stats.length} cities in the last minute`}>
        <g className="fill-foreground/[0.13]">
          {map.dots.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={0.36} />
          ))}
        </g>
        {stats.map(([code, s], i) => {
          const [x, y] = map.cities[code]
          const weight = s.requests / max
          const danger = s.errors > 0 && s.errors / s.requests > 0.15
          const color = danger ? "var(--destructive)" : "var(--brand)"
          const core = 0.5 + weight * 0.35
          // A steady sonar: busier cities pulse a little faster; cities are staggered so they don't beat in unison.
          const duration = 3.2 - weight * 1.2
          const begin = `-${((i * 0.73) % duration).toFixed(2)}s`
          return (
            <g key={code} className="motion-reduce:[&_animate]:hidden">
              <circle cx={x} cy={y} r={core + 0.7 + weight * 0.6} fill={color} opacity={0.14} />
              <circle cx={x} cy={y} r={core} fill="none" stroke={color} strokeWidth={0.14}>
                <animate attributeName="r" values={`${core};${core + 1.8 + weight * 1.2}`} dur={`${duration}s`} begin={begin} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.75;0" dur={`${duration}s`} begin={begin} repeatCount="indefinite" />
              </circle>
              <circle cx={x} cy={y} r={core} fill={color} />
            </g>
          )
        })}
      </svg>

      {/* The busiest cities, as a legend. */}
      {stats.length > 0 && (
        <ol className="surface-raised absolute top-0 right-0 hidden min-w-40 gap-1 rounded-xl px-3 py-2.5 text-xs sm:grid">
          {stats.slice(0, 5).map(([code, s]) => (
            <li key={code} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <span className={cn("size-1.5 rounded-full", s.errors / s.requests > 0.15 ? "bg-destructive" : "bg-brand")} />
                {cities[code].name}
              </span>
              <span className="font-mono text-muted-foreground tabular-nums">{s.requests}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
