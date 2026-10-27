"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Icon } from "@/components/shared/icon"

/**
 * The parts every utility is built from, so the six read as one set: panes (a well with a
 * titled header and small actions), a status line that says whether the input is good and what
 * was found, a copy button, and the "runs in your browser" note.
 */

export { Pane } from "@/components/shared/pane"
export { CopyButton } from "@/components/shared/copy-button"

/** Under the panes: valid / invalid, and the facts found. */
export function StatusLine({ tone, children, className }: { tone: "idle" | "ok" | "error" | "warn"; children: React.ReactNode; className?: string }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      aria-live="polite"
      className={cn(
        "surface-sunken flex min-h-10 flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3.5 py-2 font-mono text-xs",
        tone === "error" && "text-destructive",
        tone === "warn" && "text-brand-ink",
        tone === "idle" && "text-muted-foreground"
      )}
    >
      {tone === "ok" && <Icon name="check" size="xs" className="text-success" />}
      {tone === "error" && <Icon name="circle-x" size="xs" />}
      {tone === "warn" && <Icon name="circle-alert" size="xs" />}
      {children}
    </p>
  )
}

/** A fact in the status line: "keys 14". */
export function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="text-muted-foreground">
      {label} <span className="text-foreground tabular-nums">{children}</span>
    </span>
  )
}

/** The privacy note in the header: these tools never send what you paste. */
export function LocalBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
      <Icon name="shield" size="xs" /> Runs in your browser
    </span>
  )
}

/** A plain monospace text area that fills its pane. */
export function CodeArea({
  value,
  onChange,
  placeholder,
  readOnly,
  label,
  className,
  rows,
}: {
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  readOnly?: boolean
  label: string
  className?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      readOnly={readOnly}
      placeholder={placeholder}
      aria-label={label}
      spellCheck={false}
      rows={rows}
      className={cn(
        "block size-full min-h-40 resize-none bg-transparent px-3.5 py-3 font-mono text-[0.8125rem] leading-relaxed outline-none placeholder:text-muted-foreground/50",
        className
      )}
    />
  )
}

/** Byte length of a string as UTF-8. */
export const byteLength = (value: string) => new TextEncoder().encode(value).length
