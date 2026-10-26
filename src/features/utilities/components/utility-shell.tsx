"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { notify } from "@/components/feedback"
import { Icon, type IconName } from "@/components/shared/icon"
import { Button } from "@/components/ui/button"

/**
 * The parts every utility is built from, so the six read as one set: panes (a well with a
 * titled header and small actions), a status line that says whether the input is good and what
 * was found, a copy button, and the "runs in your browser" note.
 */

/** A titled well: header bar with actions, then the content. */
export function Pane({
  title,
  icon,
  actions,
  className,
  bodyClassName,
  children,
}: {
  title: React.ReactNode
  icon?: IconName
  actions?: React.ReactNode
  className?: string
  bodyClassName?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("flex min-w-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-card", className)}>
      <header className="flex h-10 shrink-0 items-center gap-2 border-b border-border/60 pr-1.5 pl-3.5">
        {icon && <Icon name={icon} size="xs" className="text-muted-foreground" />}
        <h2 className="truncate text-xs font-medium text-muted-foreground">{title}</h2>
        {actions && <div className="ml-auto flex items-center gap-0.5">{actions}</div>}
      </header>
      <div className={cn("min-h-0 grow", bodyClassName)}>{children}</div>
    </section>
  )
}

/** Copies `value`; says so. */
export function CopyButton({ value, label = "Copy", disabled }: { value: string; label?: string; disabled?: boolean }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <Button
      variant="ghost"
      size="xs"
      disabled={disabled || !value}
      onClick={() =>
        navigator.clipboard.writeText(value).then(
          () => {
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1400)
          },
          () => notify.error(new Error("Your browser blocked copying."), { title: "Couldn't copy" })
        )
      }
    >
      <Icon name={copied ? "check" : "copy"} className={cn(copied && "text-success")} />
      {copied ? "Copied" : label}
    </Button>
  )
}

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
