"use client"

import Link from "next/link"

import { cn } from "@/lib/utils"
import { formatPercent } from "@/lib/format"
import { useUsage, type UsageLimit } from "@/features/usage/usage"
import { Callout } from "@/components/feedback"
import { buttonVariants } from "@/components/ui/button"

/** What reaching each limit means in practice — said plainly, with what to do. */
const consequence: Record<UsageLimit["id"], { reached: string; near: string }> = {
  active_deployments: {
    reached: "New projects can't go live until you take one offline. Redeploys and rollbacks still work — they replace the live deployment.",
    near: "You can have one more project live on your plan.",
  },
  build_minutes: {
    reached: "New builds are paused until your limit resets.",
    near: "Builds pause when you reach the limit, until it resets.",
  },
  bandwidth: {
    reached: "Traffic to your projects may be slowed until your limit resets.",
    near: "Traffic may be slowed once you reach the limit, until it resets.",
  },
  storage: {
    reached: "Uploads are paused. Delete files you no longer need to make room.",
    near: "Uploads pause when you reach the limit.",
  },
}

/**
 * Warns about the plan limit that needs attention most: one reached (red), else one at 80% or
 * more (orange). Nothing when everything's comfortable. Dismissible per limit and period.
 */
export function LimitCallout({ showUsageLink = true, className }: { showUsageLink?: boolean; className?: string }) {
  const { data } = useUsage()
  if (!data) return null

  const ranked = data.limits.map((l) => ({ ...l, ratio: l.limit > 0 ? l.used / l.limit : 0 })).sort((a, b) => b.ratio - a.ratio)
  const top = ranked[0]
  if (!top || top.ratio < 0.8) return null
  const reached = top.ratio >= 1

  return (
    <Callout
      tone={reached ? "danger" : "warning"}
      icon="gauge"
      dismissId={`limit:${top.id}:${data.period.start}:${reached ? "reached" : "near"}`}
      title={reached ? `You've reached your ${top.label.toLowerCase()} limit` : `${top.label} at ${formatPercent(top.ratio, 0)} of your limit`}
      actions={
        showUsageLink && (
          <Link href="/dashboard/usage" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            See usage & limits
          </Link>
        )
      }
      className={className}
    >
      {reached ? consequence[top.id].reached : consequence[top.id].near}
    </Callout>
  )
}
