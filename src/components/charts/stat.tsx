import * as React from "react"

import { cn } from "@/lib/utils"
import { formatPercent } from "@/lib/format"
import { Icon } from "@/components/shared/icon"

/**
 * Change against a previous period: a filled arrow in a circle and the change. Green when it's
 * good news, red when bad — pass `inverse` for metrics where down is good (errors, build time).
 */
export function Delta({
  value,
  format = (v) => formatPercent(Math.abs(v)),
  inverse = false,
  suffix,
  className,
}: {
  /** Signed change; a ratio by default (0.074 → 7.4%). */
  value: number
  format?: (value: number) => string
  inverse?: boolean
  /** Muted text after the change: "vs last week". */
  suffix?: React.ReactNode
  className?: string
}) {
  const flat = value === 0
  const good = flat ? null : value > 0 !== inverse
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs whitespace-nowrap tabular-nums", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1 font-medium",
          good === true && "text-success",
          good === false && "text-destructive",
          good === null && "text-muted-foreground"
        )}
      >
        {!flat && (
          <span className={cn("flex size-3.5 items-center justify-center rounded-full", good ? "bg-success/20" : "bg-destructive/20")}>
            <Icon name="arrow-up" className={cn("size-2.5!", value < 0 && "rotate-180")} />
          </span>
        )}
        {flat ? "No change" : format(value)}
      </span>
      {suffix && <span className="text-muted-foreground">{suffix}</span>}
    </span>
  )
}

/** One number with its label, change and an optional visual (meter, sparkline) underneath. */
export function Stat({
  label,
  value,
  unit,
  delta,
  hint,
  size = "default",
  className,
  children,
}: {
  label: React.ReactNode
  value: React.ReactNode
  /** Small muted text after the value: "of 5", "GB". */
  unit?: React.ReactNode
  delta?: React.ReactNode
  hint?: React.ReactNode
  size?: "default" | "lg"
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div className={cn("grid min-w-0 content-start gap-1.5", className)}>
      <p className="truncate text-sm text-muted-foreground">{label}</p>
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className={cn("font-medium tracking-tight tabular-nums", size === "lg" ? "text-3xl" : "text-2xl")}>{value}</span>
        {unit && <span className="text-sm text-muted-foreground tabular-nums">{unit}</span>}
      </p>
      {(delta || hint) && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {delta}
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
      )}
      {children && <div className="pt-2">{children}</div>}
    </div>
  )
}

/**
 * A row of stats in one well, split by hairlines — the header strip of a dashboard. Wraps to a
 * 2-up grid on small screens.
 */
export function StatGroup({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 overflow-hidden rounded-xl border border-border/70 bg-card min-[480px]:grid-cols-2 lg:grid-flow-col lg:grid-cols-none lg:auto-cols-fr",
        "[&>*]:border-border/60 [&>*]:p-4 sm:[&>*]:p-5",
        // Hairlines between cells: bottom borders on the stacked layouts, left borders in a row.
        "[&>*]:border-b min-[480px]:[&>*:nth-child(even)]:border-l lg:[&>*]:border-b-0 lg:[&>*:not(:first-child)]:border-l",
        className
      )}
    >
      {children}
    </div>
  )
}
