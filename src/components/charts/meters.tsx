"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { formatPercent } from "@/lib/format"
import { chartColor, type ChartColor } from "@/components/charts/types"

/** False on the first paint, true a frame later — lets meters animate in from empty. */
export function useEntered() {
  const [entered, setEntered] = React.useState(false)
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  return entered
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/**
 * How close a limit is. Under 80%: neutral. 80% and up: brand orange, so it's noticed. At or
 * over the limit: red.
 */
export function limitTone(ratio: number): { fill: string; text: string; label: "ok" | "near" | "reached" } {
  if (ratio >= 1) return { fill: "bg-destructive", text: "text-destructive", label: "reached" }
  if (ratio >= 0.8) return { fill: "bg-brand", text: "text-brand-ink", label: "near" }
  return { fill: "bg-foreground/85", text: "text-foreground", label: "ok" }
}

/** A plan limit as a slim bar: fills on mount, coloured by how close it is to the limit. */
export function UsageMeter({ used, limit, className, label }: { used: number; limit: number; className?: string; label?: string }) {
  const entered = useEntered()
  const ratio = limit > 0 ? used / limit : 0
  const tone = limitTone(ratio)
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={limit}
      aria-valuenow={used}
      className={cn("relative h-1.5 overflow-hidden rounded-full bg-foreground/10", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-1000 ease-out-expo motion-reduce:transition-none", tone.fill)}
        style={{ width: `${entered ? clamp01(ratio) * 100 : 0}%` }}
      />
    </div>
  )
}

/**
 * A share as a row of thin ticks with a taller marker at the edge and the percentage above it
 * ("78% paid"). Ticks light up left to right on mount.
 */
export function TickMeter({
  value,
  ticks = 56,
  color = "chart-1",
  showLabel = true,
  height = 36,
  className,
  label,
}: {
  /** 0–1. */
  value: number
  ticks?: number
  color?: ChartColor
  showLabel?: boolean
  height?: number
  className?: string
  label?: string
}) {
  const entered = useEntered()
  const filled = Math.round(clamp01(value) * ticks)
  return (
    <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)} className={cn("relative grid gap-1.5", className)}>
      {showLabel && (
        <span
          className="absolute -top-5 -translate-x-1/2 text-xs font-medium tabular-nums transition-[left] duration-1000 ease-out-expo"
          style={{ left: `${entered ? (filled / ticks) * 100 : 0}%` }}
        >
          {formatPercent(value, 0)}
        </span>
      )}
      <div className="flex items-end justify-between" style={{ height }}>
        {Array.from({ length: ticks }, (_, i) => {
          const on = i < filled
          const marker = i === filled - 1
          return (
            <span
              key={i}
              className="w-[2px] rounded-full transition-[opacity,background-color] duration-300 motion-reduce:transition-none"
              style={{
                height: marker ? "100%" : "70%",
                background: on ? chartColor(color) : "var(--foreground)",
                opacity: on && entered ? 1 : on ? 0.1 : 0.14,
                transitionDelay: entered ? `${i * 14}ms` : "0ms",
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

export type Segment = { key: string; label: string; value: number; color?: ChartColor }

/**
 * A whole split into parts (storage by type, usage by project): rounded segments with gaps,
 * each with its share above, and a legend below. Segments grow in on mount.
 */
export function SegmentedMeter({ segments, total, format = String, className }: { segments: readonly Segment[]; total?: number; format?: (v: number) => string; className?: string }) {
  const entered = useEntered()
  const sum = total ?? segments.reduce((acc, s) => acc + s.value, 0)
  const shades: ChartColor[] = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"]
  return (
    <div className={cn("grid gap-3", className)}>
      <div className="flex gap-1">
        {segments.map((s, i) => {
          const share = sum > 0 ? s.value / sum : 0
          return (
            <div key={s.key} className="grid min-w-0 gap-1.5" style={{ flexGrow: Math.max(share, 0.04), flexBasis: 0 }}>
              {/* Slivers keep their bar but drop the label; the legend still lists them. */}
              <span className="h-4 truncate text-xs text-muted-foreground tabular-nums">{share >= 0.08 ? formatPercent(share, 0) : ""}</span>
              <span
                title={`${s.label}: ${format(s.value)}`}
                className="h-3 origin-left rounded-[5px] transition-transform duration-700 ease-out-expo motion-reduce:transition-none"
                style={{ background: chartColor(s.color ?? shades[i % shades.length]), transform: `scaleX(${entered ? 1 : 0})`, transitionDelay: `${i * 90}ms` }}
              />
            </div>
          )
        })}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {segments.map((s, i) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className="size-2 rounded-[3px]" style={{ background: chartColor(s.color ?? shades[i % shades.length]) }} />
            {s.label}
            <span className="text-foreground/80 tabular-nums">{format(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Ranked rows with a dotted bar each (traffic sources, bandwidth by project). Bars are relative
 * to the largest row; dots light up on mount.
 */
export function DotProgressList({
  items,
  format = String,
  dots = 40,
  color = "chart-1",
  className,
}: {
  items: readonly { key: string; label: React.ReactNode; value: number }[]
  format?: (v: number) => string
  dots?: number
  color?: ChartColor
  className?: string
}) {
  const entered = useEntered()
  const max = Math.max(1, ...items.map((item) => item.value))
  return (
    <ul className={cn("grid gap-4", className)}>
      {items.map((item, row) => {
        const filled = Math.max(1, Math.round((item.value / max) * dots))
        return (
          <li key={item.key} className="grid gap-2">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">{item.label}</span>
              <span className="text-muted-foreground tabular-nums">{format(item.value)}</span>
            </div>
            <div className="flex justify-between gap-[2px]" aria-hidden>
              {Array.from({ length: dots }, (_, i) => (
                <span
                  key={i}
                  className="h-1 flex-1 rounded-full transition-opacity duration-300 motion-reduce:transition-none"
                  style={{
                    background: i < filled ? chartColor(color) : "var(--foreground)",
                    opacity: i < filled ? (entered ? 1 : 0.1) : 0.12,
                    transitionDelay: `${row * 60 + i * 10}ms`,
                  }}
                />
              ))}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
