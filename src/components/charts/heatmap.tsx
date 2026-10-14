"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useEntered } from "@/components/charts/meters"

const LEVELS = [0.06, 0.16, 0.3, 0.5, 0.78]

/**
 * A grid of intensities — traffic by weekday and hour, builds by day. Cells fade in on a
 * diagonal on mount; hovering a cell shows its exact value in the readout above the grid.
 * The busiest cell is outlined.
 */
export function Heatmap({
  rows,
  columns,
  values,
  format = String,
  columnTicks,
  className,
}: {
  /** Row labels, top to bottom ("Mon"…"Sun"). */
  rows: readonly string[]
  /** Column labels, used in the readout ("00:00"…"23:00"). */
  columns: readonly string[]
  /** values[row][column]. */
  values: readonly (readonly number[])[]
  format?: (value: number) => string
  /** Which column labels to print under the grid: index → label. */
  columnTicks?: Record<number, string>
  className?: string
}) {
  const entered = useEntered()
  const [hover, setHover] = React.useState<{ row: number; column: number } | null>(null)
  const flat = values.flat()
  const max = Math.max(1, ...flat)
  const peak = flat.indexOf(max)
  const level = (value: number) => LEVELS[Math.min(LEVELS.length - 1, Math.floor((value / max) * LEVELS.length))]

  return (
    <div className={cn("grid gap-3", className)}>
      <p className="h-4 text-xs text-muted-foreground tabular-nums" aria-live="polite">
        {hover ? (
          <>
            <span className="text-foreground">
              {rows[hover.row]} {columns[hover.column]}
            </span>{" "}
            · {format(values[hover.row][hover.column])}
          </>
        ) : (
          "Hover a cell for details"
        )}
      </p>

      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2.5 gap-y-1" onMouseLeave={() => setHover(null)}>
        {rows.map((rowLabel, r) => (
          <React.Fragment key={rowLabel}>
            <span className="self-center text-[0.6875rem] leading-none text-muted-foreground">{rowLabel}</span>
            <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
              {values[r].map((value, c) => {
                const isPeak = r * columns.length + c === peak
                const active = hover?.row === r && hover.column === c
                return (
                  <span
                    key={c}
                    onMouseEnter={() => setHover({ row: r, column: c })}
                    className={cn(
                      "h-3.5 rounded-[3px] bg-foreground transition-opacity duration-500 motion-reduce:transition-none sm:h-4",
                      (isPeak || active) && "ring-1 ring-foreground ring-offset-1 ring-offset-card"
                    )}
                    style={{ opacity: entered ? level(value) : 0, transitionDelay: entered ? `${(r + c) * 14}ms` : "0ms" }}
                  />
                )
              })}
            </div>
          </React.Fragment>
        ))}
        {columnTicks && (
          <>
            <span />
            <div className="relative mt-1 h-3 text-[0.6875rem] text-muted-foreground">
              {Object.entries(columnTicks).map(([index, label]) => (
                <span key={index} className="absolute -translate-x-1/2" style={{ left: `${((Number(index) + 0.5) / columns.length) * 100}%` }}>
                  {label}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-end gap-1.5 text-[0.6875rem] text-muted-foreground">
        Lower
        {LEVELS.map((opacity) => (
          <span key={opacity} className="size-2.5 rounded-[3px] bg-foreground" style={{ opacity }} />
        ))}
        Higher
      </div>
    </div>
  )
}
