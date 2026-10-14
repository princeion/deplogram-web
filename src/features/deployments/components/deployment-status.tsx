"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { formatDuration } from "@/lib/format"
import { StatusDot, type StatusMotion, type StatusTone } from "@/components/shared/status-dot"
import type { Deployment } from "@/features/deployments/deployments"

const tonePill: Record<StatusTone, string> = {
  success: "bg-success/10 text-success",
  progress: "bg-brand/10 text-brand-ink",
  danger: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
}

/** Plain-language label, tone and motion for each lifecycle state (brief §5). */
export function deploymentStatusMeta(state: Deployment["state"], live = true): { label: string; tone: StatusTone; motion: StatusMotion } {
  switch (state) {
    case "RUNNING":
      // Succeeded, then replaced by a newer deployment: settled history.
      return live ? { label: "Running", tone: "success", motion: "live" } : { label: "Ready", tone: "success", motion: "still" }
    case "QUEUED":
      return { label: "Queued", tone: "muted", motion: "waiting" }
    case "BUILDING":
      return { label: "Building", tone: "progress", motion: "progress" }
    case "BUILT":
      return { label: "Built", tone: "progress", motion: "progress" }
    case "DEPLOYING":
      return { label: "Deploying", tone: "progress", motion: "progress" }
    case "BUILD_FAILED":
      return { label: "Build failed", tone: "danger", motion: "still" }
    case "DEPLOY_FAILED":
      return { label: "Deploy failed", tone: "danger", motion: "still" }
    case "CRASHED":
      return { label: "Crashed", tone: "danger", motion: "alert" }
  }
}

/** Seconds since `since`, ticking every second while mounted. */
function useElapsed(since: string | undefined) {
  const [now, setNow] = React.useState<number | null>(null)
  React.useEffect(() => {
    if (!since) return
    const tick = () => setNow(Date.now())
    const id = window.setInterval(tick, 1000)
    const first = window.setTimeout(tick, 0)
    return () => {
      window.clearInterval(id)
      window.clearTimeout(first)
    }
  }, [since])
  return since && now != null ? Math.max(0, Math.round((now - new Date(since).getTime()) / 1000)) : null
}

/**
 * A deployment's state, everywhere it appears. "dot": animated dot + label (+ duration) for tables;
 * "pill": a tinted badge for cards and headers. While a deployment is in progress the label
 * shimmers and, given `startedAt`, an elapsed timer ticks.
 */
export function DeploymentStatus({
  state,
  live = true,
  durationSeconds,
  startedAt,
  appearance = "dot",
  compactOnMobile = false,
  className,
}: {
  state: Deployment["state"]
  live?: boolean
  durationSeconds?: number | null
  /** When the deployment started; shows a live timer while it's in progress. */
  startedAt?: string
  appearance?: "dot" | "pill"
  /** Hide the duration on small screens (dense tables). */
  compactOnMobile?: boolean
  className?: string
}) {
  const { label, tone, motion } = deploymentStatusMeta(state, live)
  const working = motion === "progress" || motion === "waiting"
  const elapsed = useElapsed(working ? startedAt : undefined)
  const seconds = durationSeconds ?? elapsed

  if (appearance === "pill") {
    return (
      <span className={cn("inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", tonePill[tone], className)}>
        <StatusDot tone={tone} motion={motion} size="sm" />
        {label}
      </span>
    )
  }

  return (
    <span className={cn("inline-flex items-center gap-2.5 text-sm whitespace-nowrap", className)}>
      <StatusDot tone={tone} motion={motion} dim={motion === "still" && tone === "success"} />
      <span
        className={cn(
          "font-medium",
          motion === "progress" &&
            "animate-text-shimmer bg-[linear-gradient(110deg,var(--foreground)_38%,var(--brand)_50%,var(--foreground)_62%)] bg-size-[250%_100%] bg-clip-text text-transparent motion-reduce:animate-none motion-reduce:bg-none motion-reduce:text-foreground"
        )}
      >
        {label}
      </span>
      {seconds != null && (
        <span className={cn("text-muted-foreground tabular-nums", compactOnMobile && "hidden sm:inline")}>{formatDuration(seconds)}</span>
      )}
    </span>
  )
}
