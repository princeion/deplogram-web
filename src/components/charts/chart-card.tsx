import * as React from "react"

import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@/components/shared/icon"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/app-shell/error-state"

/**
 * The frame every chart sits in: a recessed well with a small titled header (icon, title,
 * right-hand action) and the chart below. Handles loading (a skeleton the chart's height) and
 * error states, so pages only pass data.
 */
export function ChartCard({
  title,
  icon,
  action,
  loading = false,
  error,
  onRetry,
  /** Height of the skeleton while loading — match the chart's height so nothing jumps. */
  skeletonHeight = 240,
  className,
  bodyClassName,
  children,
}: {
  title: React.ReactNode
  icon?: IconName
  action?: React.ReactNode
  loading?: boolean
  error?: unknown
  onRetry?: () => void
  skeletonHeight?: number
  className?: string
  bodyClassName?: string
  children?: React.ReactNode
}) {
  return (
    <section className={cn("flex min-w-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-card", className)}>
      <header className="flex min-h-11 items-center justify-between gap-3 px-4 pt-3 sm:px-5">
        <h2 className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          {icon && <Icon name={icon} size="xs" className="shrink-0" />}
          <span className="truncate">{title}</span>
        </h2>
        {action && <div className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">{action}</div>}
      </header>
      <div className={cn("flex min-w-0 flex-1 flex-col gap-4 px-4 pt-2 pb-4 sm:px-5 sm:pb-5", bodyClassName)}>
        {error ? (
          <ErrorState size="compact" title="This chart didn't load." onRetry={onRetry} />
        ) : loading ? (
          <div className="grid gap-3" aria-busy="true">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="w-full rounded-lg" style={{ height: skeletonHeight }} />
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  )
}
