import * as React from "react"

import { cn } from "@/lib/utils"
import type { FailureState, LifecycleState } from "@/content/deploy"

type ProductWindowProps = {
  /** Shown in the title bar, mono — e.g. "galley / projects". */
  title: string
  /** Right side of the title bar. */
  actions?: React.ReactNode
  className?: string
  bodyClassName?: string
  children: React.ReactNode
}

/**
 * Chrome for every product mock (deploy console, Galley, CodePad, storage): the window panel, three
 * "lights", mono path. Mocks are illustrative — they show the intended experience.
 */
export function ProductWindow({ title, actions, className, bodyClassName, children }: ProductWindowProps) {
  return (
    <div className={cn("window flex flex-col overflow-hidden", className)}>
      <div className="flex h-10 shrink-0 items-center gap-3 border-b border-border/70 bg-background/60 px-3">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-2.5 rounded-full border border-border/70 bg-muted" />
          <span className="size-2.5 rounded-full border border-border/70 bg-muted" />
          <span className="size-2.5 rounded-full border border-border/70 bg-muted" />
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-[0.6875rem] text-muted-foreground">{title}</span>
        {actions}
      </div>
      <div className={cn("relative min-h-0 flex-1", bodyClassName)}>{children}</div>
    </div>
  )
}

type State = LifecycleState | FailureState

const tone: Record<State, string> = {
  QUEUED: "text-muted-foreground border-border/70",
  BUILDING: "text-brand-ink border-brand/40",
  BUILT: "text-foreground border-foreground/30",
  DEPLOYING: "text-brand-ink border-brand/40",
  RUNNING: "text-success border-success/40",
  BUILD_FAILED: "text-destructive border-destructive/40",
  DEPLOY_FAILED: "text-destructive border-destructive/40",
  CRASHED: "text-destructive border-destructive/40",
}

const pulsing: readonly State[] = ["BUILDING", "DEPLOYING"]

/** Mono lifecycle chip — colour carries state, the label always says it in words. */
export function StateBadge({ state, className }: { state: State; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[0.625rem] leading-none tracking-wider whitespace-nowrap",
        tone[state],
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full bg-current",
          pulsing.includes(state) && "animate-pulse-dot motion-reduce:animate-none"
        )}
      />
      {state}
    </span>
  )
}
