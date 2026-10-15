"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { cities, type CityCode } from "@/features/overview/cities"
import type { WorldMapData } from "@/features/overview/world-map"
import type { Traffic } from "@/features/projects/projects"

type Wave = { x: number; y: number; start: number; strength: number; reach: number; danger: boolean }

const WAVE_LIFE = 2400 // ms a wave travels for
const BAND = 1.15 // thickness of the wavefront, in map units

/** Theme colours for the canvas (canvas can't read CSS variables itself). */
function readColors() {
  const style = getComputedStyle(document.documentElement)
  return {
    dot: style.getPropertyValue("--foreground").trim() || "#fff",
    brand: style.getPropertyValue("--brand").trim() || "#ff5c35",
    danger: style.getPropertyValue("--destructive").trim() || "#e5484d",
  }
}

/**
 * Where traffic comes from, live. The world is drawn in dots; when requests arrive from a city, a
 * pulse travels out through the dots around it — wider and brighter the more requests that city
 * sends, red when they're mostly errors. Busy cities keep the map moving; quiet ones flicker
 * now and then. Drawn on a canvas so thousands of dots animate smoothly.
 */
export function TrafficMap({ map, traffic, className }: { map: WorldMapData; traffic?: Traffic; className?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const waves = React.useRef<Wave[]>([])
  const seenUpTo = React.useRef<string | null>(null)

  const stats = React.useMemo(() => {
    const byCity = new Map<CityCode, { requests: number; errors: number }>()
    for (const r of traffic?.requests ?? []) {
      const code = r.city as CityCode
      if (!(code in cities)) continue
      const s = byCity.get(code) ?? { requests: 0, errors: 0 }
      s.requests++
      if (r.error) s.errors++
      byCity.set(code, s)
    }
    return [...byCity.entries()].sort((a, b) => b[1].requests - a[1].requests)
  }, [traffic])
  const statsRef = React.useRef(stats)
  statsRef.current = stats

  // New requests since the last update send a pulse out from their city, sized by that city's volume.
  React.useEffect(() => {
    const requests = traffic?.requests ?? []
    if (!requests.length) return
    const newest = requests[requests.length - 1].at
    const fresh = seenUpTo.current ? requests.filter((r) => r.at > seenUpTo.current!) : requests
    seenUpTo.current = newest
    const max = Math.max(1, ...stats.map(([, s]) => s.requests))
    const total = new Map(stats)
    const touched = new Set(fresh.map((r) => r.city as CityCode).filter((c) => c in cities))
    const now = performance.now()
    let i = 0
    for (const code of touched) {
      const s = total.get(code)
      if (!s) continue
      const weight = s.requests / max
      const [x, y] = map.cities[code]
      waves.current.push({
        x,
        y,
        // Spread the pulses across the polling interval so the map doesn't pulse in one beat.
        start: now + ((i++ * 173) % 1400),
        strength: 0.3 + weight * 0.7,
        reach: 2.5 + weight * 9,
        danger: s.errors / s.requests > 0.15,
      })
    }
  }, [traffic, stats, map])

  // The draw loop.
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let colors = readColors()
    const themeObserver = new MutationObserver(() => (colors = readColors()))
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] })
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const width = canvas.clientWidth
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(width * (map.height / map.width) * dpr)
    }
    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)

    let frame = 0
    const draw = () => {
      const now = performance.now()
      const scale = canvas.width / map.width
      const dotR = 0.36 * scale
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const alive = (waves.current = waves.current.filter((w) => now - w.start < WAVE_LIFE))
      const max = Math.max(1, ...statsRef.current.map(([, s]) => s.requests))

      // Base dots, then lit dots on top.
      ctx.fillStyle = colors.dot
      ctx.globalAlpha = 0.13
      ctx.beginPath()
      for (const [x, y] of map.dots) {
        ctx.moveTo(x * scale + dotR, y * scale)
        ctx.arc(x * scale, y * scale, dotR, 0, Math.PI * 2)
      }
      ctx.fill()

      if (!reduceMotion && alive.length) {
        for (const [x, y] of map.dots) {
          let light = 0
          let danger = false
          for (const w of alive) {
            const age = now - w.start
            if (age < 0) continue
            const dx = x - w.x
            const dy = y - w.y
            if (Math.abs(dx) > w.reach + BAND || Math.abs(dy) > w.reach + BAND) continue
            const progress = age / WAVE_LIFE
            const radius = progress * w.reach
            const band = 1 - Math.abs(Math.hypot(dx, dy) - radius) / BAND
            if (band <= 0) continue
            const add = band * w.strength * (1 - progress) ** 1.4
            if (add > light) danger = w.danger
            light += add
          }
          if (light < 0.04) continue
          light = Math.min(1, light)
          ctx.fillStyle = danger ? colors.danger : colors.brand
          ctx.globalAlpha = 0.18 + light * 0.82
          ctx.beginPath()
          ctx.arc(x * scale, y * scale, dotR * (1 + light * 0.5), 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // The cities themselves: a solid point, larger the busier.
      for (const [code, s] of statsRef.current) {
        const [x, y] = map.cities[code]
        const weight = s.requests / max
        ctx.fillStyle = s.errors / s.requests > 0.15 ? colors.danger : colors.brand
        ctx.globalAlpha = 1
        ctx.beginPath()
        ctx.arc(x * scale, y * scale, (0.5 + weight * 0.4) * scale, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      themeObserver.disconnect()
    }
  }, [map])

  return (
    <div className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        className="block h-auto w-full"
        style={{ aspectRatio: `${map.width} / ${map.height}` }}
        role="img"
        aria-label={`Live traffic map — requests from ${stats.length} cities in the last minute`}
      />

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
