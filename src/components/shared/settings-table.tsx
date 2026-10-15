import * as React from "react"

import { cn } from "@/lib/utils"

/** A borderless mono input for a settings row — it shows its edges on hover and sinks when focused. */
export const settingInputClass =
  "h-8 w-full min-w-0 rounded-md bg-transparent px-2 font-mono text-[0.8125rem] outline-none ring-1 ring-transparent transition-[box-shadow,background-color] placeholder:text-muted-foreground/50 hover:bg-foreground/[0.04] focus:surface-sunken focus:ring-ring/50 aria-invalid:ring-destructive/60 disabled:text-muted-foreground"

/** A raised, two-tone table of settings: a darker label column, values edited in place. */
export function SettingsTable({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("surface-raised overflow-hidden rounded-xl", className)}>{children}</div>
}

/** One setting: label on the darker band, the control (and any status beside it), an error under it. */
export function SettingRow({
  label,
  htmlFor,
  error,
  aside,
  children,
}: {
  label: string
  htmlFor?: string
  error?: string
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  const Label = htmlFor ? "label" : "span"
  return (
    <div className="grid border-b border-border/50 last:border-b-0 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
      <Label htmlFor={htmlFor} className="surface-band flex items-center px-3.5 pt-2.5 text-sm text-muted-foreground sm:border-r sm:border-border/50 sm:py-2.5">
        {label}
      </Label>
      <div className="grid gap-1 px-2 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {children}
          {aside}
        </div>
        {error && <p className="px-2 text-xs text-destructive">{error}</p>}
      </div>
    </div>
  )
}
