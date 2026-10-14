"use client"

import type * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/shared/icon"

type ErrorStateProps = {
  title?: string
  description?: React.ReactNode
  /** Shows a "Try again" button — pass `refetch` from a query, or `retry` from an error boundary. */
  onRetry?: () => void
  /** The retry is in flight (e.g. `isRefetching`). */
  retrying?: boolean
  /** Next.js error digest, for support. */
  reference?: string
  size?: "default" | "compact"
  className?: string
}

/**
 * Something failed to load. Plain language, no blame, one way forward. Use it for failed queries
 * inside a page, and (via error.tsx) for a whole page.
 */
export function ErrorState({
  title = "This didn't load.",
  description = "Something went wrong on our side. Try again — if it keeps happening, contact support.",
  onRetry,
  retrying = false,
  reference,
  size = "default",
  className,
}: ErrorStateProps) {
  return (
    <div role="alert" className={cn("flex flex-col items-center gap-4 text-center", size === "default" ? "px-6 py-14 sm:py-20" : "px-4 py-8", className)}>
      <span className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
        <Icon name="circle-alert" size="md" />
      </span>
      <div className="grid max-w-sm gap-1.5">
        <p className="text-lg font-medium tracking-tight">{title}</p>
        <p className="text-sm text-pretty text-muted-foreground">{description}</p>
        {reference && (
          <p className="text-xs text-muted-foreground">
            Reference <code className="font-mono">{reference}</code>
          </p>
        )}
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} loading={retrying}>
          Try again
        </Button>
      )}
    </div>
  )
}
