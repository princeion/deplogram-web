import * as React from "react"

import { cn } from "@/lib/utils"
import { Icon } from "@/components/shared/icon"

type TerminalWindowProps = {
  title: string
  children: React.ReactNode
  className?: string
  /** Right-aligned slot in the title bar (e.g. a status pill). */
  action?: React.ReactNode
}

/** Window chrome for terminals and code blocks. Panel recipe: elevation-surface rounded-3xl. */
export function TerminalWindow({ title, children, className, action }: TerminalWindowProps) {
  return (
    <div className={cn("overflow-hidden rounded-3xl elevation-surface", className)}>
      <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
        <Icon name="terminal" size="xs" className="text-muted-foreground" />
        <span className="truncate font-mono text-xs text-muted-foreground">{title}</span>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      <div className="p-4 font-mono text-[0.8125rem] leading-relaxed sm:p-5">{children}</div>
    </div>
  )
}
