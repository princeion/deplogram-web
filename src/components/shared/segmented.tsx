"use client"

import { cn } from "@/lib/utils"

export type SegmentedOption<T extends string> = { value: T; label: React.ReactNode; count?: number }

/**
 * A segmented control: options on a sunken track, the selected one raised. For switching a view
 * (range, filter) — not for navigation. Counts show as "Label · 3".
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  size = "default",
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: readonly SegmentedOption<T>[]
  /** Accessible name for the group. */
  label: string
  size?: "sm" | "default"
  className?: string
}) {
  return (
    <div role="tablist" aria-label={label} className={cn("surface-sunken inline-flex gap-0.5 rounded-xl p-1", size === "sm" ? "text-xs" : "text-sm", className)}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              size === "sm" ? "px-2.5 py-1" : "px-3 py-1.5",
              selected ? "surface-raised text-foreground" : "border border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
            {option.count !== undefined && <span className="text-muted-foreground tabular-nums"> · {option.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
