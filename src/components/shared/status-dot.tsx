"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export type StatusTone = "success" | "progress" | "danger" | "muted"

/**
 * How the dot moves — each one says something different at a glance:
 * - "live": serving traffic. Soft glow and a slow sonar ripple.
 * - "progress": working (building, deploying). A comet orbits the breathing core.
 * - "waiting": queued. A hollow ring fading in and out.
 * - "alert": broken right now (crashed). A red heartbeat.
 * - "still": settled history (ready, failed). No motion.
 */
export type StatusMotion = "live" | "progress" | "waiting" | "alert" | "still"

const toneColor: Record<StatusTone, string> = {
  success: "text-success",
  progress: "text-brand",
  danger: "text-destructive",
  muted: "text-muted-foreground",
}

const sizes = { sm: "size-1.5", md: "size-2" } as const

/**
 * A status dot that moves with meaning. When its tone changes while on screen (a build finishes,
 * a service crashes), a one-off flash ring marks the moment. Motion is off under reduced motion.
 */
export function StatusDot({
  tone,
  motion = "still",
  size = "md",
  dim = false,
  className,
}: {
  tone: StatusTone
  motion?: StatusMotion
  size?: keyof typeof sizes
  /** Quieter dot for history rows (e.g. a successful deploy that's no longer live). */
  dim?: boolean
  className?: string
}) {
  // Flash only on a change after mount, not on first paint (adjusting state during render).
  const [prevTone, setPrevTone] = React.useState(tone)
  const [flash, setFlash] = React.useState(0)
  if (prevTone !== tone) {
    setPrevTone(tone)
    setFlash((n) => n + 1)
  }

  const glow = motion === "live" || motion === "alert" || motion === "progress"

  return (
    <span aria-hidden className={cn("relative inline-flex shrink-0", sizes[size], toneColor[tone], className)}>
      {motion === "live" && (
        <>
          <span className="absolute inset-0 animate-status-ripple rounded-full bg-current motion-reduce:hidden" />
          <span className="absolute inset-0 animate-status-ripple rounded-full bg-current [animation-delay:-1.4s] motion-reduce:hidden" />
        </>
      )}

      {motion === "progress" && (
        // A comet tail, masked to a thin ring around the dot, turning.
        <span
          className="absolute -inset-[3.5px] animate-spin rounded-full [animation-duration:1.1s] motion-reduce:hidden"
          style={{
            background: "conic-gradient(from 0deg, transparent 0 40%, color-mix(in oklab, currentColor 25%, transparent) 70%, currentColor)",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1px))",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1px))",
          }}
        />
      )}

      {flash > 0 && <span key={flash} className="absolute inset-0 animate-status-flash rounded-full bg-current motion-reduce:hidden" />}

      <span
        className={cn(
          "relative size-full rounded-full transition-[background-color,box-shadow,opacity] duration-500",
          motion === "waiting" ? "bg-transparent ring-[1.5px] ring-current ring-inset" : "bg-current",
          glow && "shadow-[0_0_8px_currentColor]",
          motion === "progress" && "animate-status-breathe",
          motion === "waiting" && "animate-status-wait",
          motion === "alert" && "animate-status-heartbeat",
          dim && "opacity-55",
          "motion-reduce:animate-none"
        )}
      />
    </span>
  )
}
