"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useRuntimeLogs } from "@/features/projects/projects"

const WINDOW = 60 // seconds on screen

/** A request on the signal: when, and whether it failed. */
export type SignalEvent = { at: string; error: boolean }

/** A project's live signal, fed by its runtime log. */
export function LiveSignal({ projectId, live, height = 112, className }: { projectId: string; live: boolean; height?: number; className?: string }) {
  const { data } = useRuntimeLogs(projectId, { paused: !live })
  const events = React.useMemo(() => (data?.lines ?? []).filter((l) => l.source === "request").map((l) => ({ at: l.at, error: l.level === "error" })), [data])
  return <SignalBars events={events} live={live} height={height} className={className} />
}

/**
 * Traffic as a live signal: one bar per second of requests over the last minute, gliding left as
 * time passes. The newest second glows in the brand metal; errors cap their bar in red; a scan
 * line marks "now". Give it events from any source (one project's log, the whole workspace).
 */
export function SignalBars({ events, live, height = 112, label = "Live traffic · last 60s", className }: { events: readonly SignalEvent[]; live: boolean; height?: number; label?: string; className?: string }) {
  const [second, setSecond] = React.useState(() => Math.floor(Date.now() / 1000))
  const trackRef = React.useRef<HTMLDivElement>(null)

  // Glide: shift the bars by the elapsed fraction of the current second every frame (no re-render),
  // and move to the next second once a second.
  React.useEffect(() => {
    if (!live) return
    let frame = 0
    const tick = () => {
      const now = Date.now()
      const s = Math.floor(now / 1000)
      setSecond((current) => (current === s ? current : s))
      if (trackRef.current) trackRef.current.style.transform = `translate3d(${-((now % 1000) / 1000) * (100 / (WINDOW + 1))}%, 0, 0)`
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [live])

  const buckets = React.useMemo(() => {
    const counts = new Map<number, { requests: number; errors: number }>()
    for (const event of events) {
      const s = Math.floor(new Date(event.at).getTime() / 1000)
      if (s < second - WINDOW - 1) continue
      const b = counts.get(s) ?? { requests: 0, errors: 0 }
      b.requests++
      if (event.error) b.errors++
      counts.set(s, b)
    }
    return Array.from({ length: WINDOW + 1 }, (_, i) => {
      const s = second - WINDOW + i
      return { s, ...(counts.get(s) ?? { requests: 0, errors: 0 }) }
    })
  }, [events, second])

  const max = Math.max(4, ...buckets.map((b) => b.requests))
  const perMinute = buckets.slice(1).reduce((a, b) => a + b.requests, 0)
  const errors = buckets.slice(1).reduce((a, b) => a + b.errors, 0)

  return (
    <div className={cn("relative overflow-hidden", className)} style={{ height }} role="img" aria-label={live ? `Live traffic: ${perMinute} requests in the last minute, ${errors} errors` : "No live traffic"}>
      {/* Guide lines. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-8 bottom-6 flex flex-col justify-between">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-px bg-foreground/[0.05]" />
        ))}
      </div>

      <div className="absolute inset-x-4 top-3 z-10 flex items-baseline justify-between gap-4 text-xs">
        <span className="flex items-center gap-2 text-muted-foreground">
          <span className={cn("size-1.5 rounded-full", live ? "animate-pulse-dot bg-success" : "bg-muted-foreground/50")} />
          {live ? label : "No live traffic"}
        </span>
        {live && (
          <span className="font-mono text-muted-foreground tabular-nums">
            <span className="text-foreground">{perMinute}</span> req/min
            {errors > 0 && <span className="text-destructive"> · {errors} err</span>}
          </span>
        )}
      </div>

      {live ? (
        <div className="absolute inset-x-4 top-8 bottom-6 overflow-hidden">
          <div ref={trackRef} className="flex h-full items-end will-change-transform" style={{ width: `${((WINDOW + 1) / WINDOW) * 100}%` }}>
            {buckets.map((b, i) => {
              const newest = i >= buckets.length - 2
              const h = b.requests ? Math.max(6, (b.requests / max) * 100) : 2
              const errorShare = b.requests ? b.errors / b.requests : 0
              return (
                <div key={b.s} className="flex h-full flex-1 items-end justify-center px-[1.5px]">
                  <div
                    className={cn("relative w-full max-w-2 overflow-hidden rounded-t-[3px] transition-[height] duration-500 ease-out-expo", !b.requests && "opacity-40")}
                    style={{
                      height: `${h}%`,
                      background: newest
                        ? "linear-gradient(to top, color-mix(in oklab, var(--brand) 25%, transparent), var(--brand))"
                        : "linear-gradient(to top, color-mix(in oklab, var(--foreground) 6%, transparent), color-mix(in oklab, var(--foreground) 38%, transparent))",
                      boxShadow: newest && b.requests ? "0 0 14px color-mix(in oklab, var(--brand) 55%, transparent)" : undefined,
                    }}
                  >
                    {errorShare > 0 && <span className="absolute inset-x-0 top-0 bg-destructive" style={{ height: `${Math.max(18, errorShare * 100)}%` }} />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div aria-hidden className="absolute inset-x-4 bottom-6 h-px bg-[repeating-linear-gradient(90deg,var(--border)_0_6px,transparent_6px_12px)]" />
      )}

      {/* "Now": a scan line at the right edge. */}
      {live && (
        <span aria-hidden className="absolute top-8 right-4 bottom-6 w-px bg-brand/70 shadow-[0_0_10px_var(--brand)]">
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-mono text-[0.625rem] text-brand-ink">now</span>
        </span>
      )}
      <span aria-hidden className="absolute bottom-1 left-4 font-mono text-[0.625rem] text-muted-foreground/60">−60s</span>
    </div>
  )
}
