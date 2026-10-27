import type * as React from "react"

import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@/components/shared/icon"

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
