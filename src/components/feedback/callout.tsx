"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@/components/shared/icon"
import { Button } from "@/components/ui/button"

type Tone = "info" | "success" | "warning" | "danger"

const tones: Record<Tone, { icon: IconName; box: string; iconBox: string }> = {
  info: { icon: "circle-alert", box: "border-border/70 bg-card", iconBox: "bg-muted text-foreground" },
  success: { icon: "check", box: "border-success/25 bg-success/[0.06]", iconBox: "bg-success/15 text-success" },
  warning: { icon: "triangle", box: "border-brand/30 bg-brand/[0.06]", iconBox: "bg-brand/15 text-brand-ink" },
  danger: { icon: "circle-x", box: "border-destructive/30 bg-destructive/[0.06]", iconBox: "bg-destructive/15 text-destructive" },
}

const storageKey = (id: string) => `deplogram:callout:${id}`

/**
 * An inline message that belongs to the page: a limit reached, a failing build, a heads-up before
 * something risky. Calm by default; tone it up only when there's something to do. Pass
 * `dismissId` to let people hide it — the choice is remembered on this device.
 */
export function Callout({
  tone = "info",
  title,
  icon,
  actions,
  dismissId,
  className,
  children,
}: {
  tone?: Tone
  title: React.ReactNode
  icon?: IconName
  actions?: React.ReactNode
  /** Makes the callout dismissible, remembered under this id. */
  dismissId?: string
  className?: string
  children?: React.ReactNode
}) {
  const [dismissed, setDismissed] = React.useState(false)
  React.useEffect(() => {
    if (!dismissId) return
    try {
      if (localStorage.getItem(storageKey(dismissId))) setDismissed(true)
    } catch {}
  }, [dismissId])

  if (dismissed) return null
  const style = tones[tone]

  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cn("flex animate-in items-start gap-3 rounded-xl border p-3.5 pr-3 duration-300 fade-in slide-in-from-top-1 sm:p-4", style.box, className)}
    >
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", style.iconBox)}>
        <Icon name={icon ?? style.icon} size="sm" />
      </span>
      <div className="grid min-w-0 flex-1 gap-1 pt-1">
        <p className="text-sm font-medium">{title}</p>
        {children && <div className="text-sm text-pretty text-muted-foreground">{children}</div>}
        {actions && <div className="mt-2 flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {dismissId && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Dismiss"
          className="-mt-0.5 text-muted-foreground"
          onClick={() => {
            setDismissed(true)
            try {
              localStorage.setItem(storageKey(dismissId), "1")
            } catch {}
          }}
        >
          <Icon name="x" />
        </Button>
      )}
    </div>
  )
}
