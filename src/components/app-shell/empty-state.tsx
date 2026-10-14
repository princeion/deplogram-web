import type * as React from "react"

import { cn } from "@/lib/utils"
import type { IconName } from "@/components/shared/icon"
import { Icon } from "@/components/shared/icon"

type EmptyStateProps = {
  icon?: IconName
  title: string
  description?: React.ReactNode
  /** Buttons or links — keep to one primary action. */
  actions?: React.ReactNode
  /** "dashed": a bordered drop-zone look for whole-page empties; "plain": inside cards and lists. */
  variant?: "dashed" | "plain"
  size?: "default" | "compact"
  className?: string
}

/**
 * Nothing to show yet. One of the few places personality is allowed, sparingly (brief §3) — e.g.
 * "Nothing on the counter yet." — while the action under it stays plain ("Deploy your first project").
 */
export function EmptyState({ icon = "folder", title, description, actions, variant = "dashed", size = "default", className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 text-center",
        variant === "dashed" && "rounded-2xl border border-dashed border-border/70 bg-card",
        size === "default" ? "px-6 py-14 sm:py-20" : "px-4 py-8",
        className
      )}
    >
      <span className={cn("flex items-center justify-center rounded-xl bg-muted text-muted-foreground", size === "default" ? "size-11" : "size-9")}>
        <Icon name={icon} size={size === "default" ? "md" : "sm"} />
      </span>
      <div className="grid max-w-sm gap-1.5">
        <p className={cn("font-medium tracking-tight", size === "default" ? "text-lg" : "text-base")}>{title}</p>
        {description && <p className="text-sm text-pretty text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="mt-1 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  )
}
