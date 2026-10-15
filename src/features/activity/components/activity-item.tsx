"use client"

import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format"
import type { ActivityEvent, ActivityType } from "@/features/activity/activity"
import { deploymentHref } from "@/features/deployments/components/use-deployment-actions"
import { Icon, type IconName } from "@/components/shared/icon"

const look: Record<ActivityType, { icon: IconName; tone: string }> = {
  "deployment.started": { icon: "rocket", tone: "text-foreground" },
  "deployment.succeeded": { icon: "check", tone: "text-success" },
  "deployment.failed": { icon: "circle-x", tone: "text-destructive" },
  "deployment.rolled_back": { icon: "undo", tone: "text-brand-ink" },
  "project.created": { icon: "folder-plus", tone: "text-foreground" },
  "project.renamed": { icon: "folder", tone: "text-muted-foreground" },
  "project.deleted": { icon: "trash", tone: "text-destructive" },
  "env.updated": { icon: "variable", tone: "text-muted-foreground" },
  "settings.updated": { icon: "settings", tone: "text-muted-foreground" },
}

const exact = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

function ProjectName({ event }: { event: ActivityEvent }) {
  if (!event.project) return null
  return event.project.id ? (
    <Link href={`/dashboard/projects/${event.project.id}`} className="font-medium text-foreground hover:underline">
      {event.project.name}
    </Link>
  ) : (
    <span className="font-medium text-foreground line-through decoration-muted-foreground/60">{event.project.name}</span>
  )
}

/** The event as a sentence. */
function Sentence({ event }: { event: ActivityEvent }) {
  const actor = <span className="font-medium text-foreground">{event.actor.name}</span>
  const project = <ProjectName event={event} />
  switch (event.type) {
    case "deployment.started":
      return (
        <>
          {actor} deployed {project}
        </>
      )
    case "deployment.succeeded":
      return <>{project} is live</>
    case "deployment.failed":
      return <>{project} failed to deploy</>
    case "deployment.rolled_back":
      return (
        <>
          {actor} rolled back {project}
        </>
      )
    case "project.created":
      return (
        <>
          {actor} created {project}
        </>
      )
    case "project.renamed":
      return (
        <>
          {actor} renamed a project to {project}
        </>
      )
    case "project.deleted":
      return (
        <>
          {actor} deleted {project}
        </>
      )
    case "env.updated":
      return (
        <>
          {actor} updated variables in {project}
        </>
      )
    case "settings.updated":
      return (
        <>
          {actor} changed settings of {project}
        </>
      )
  }
}

/**
 * One event in the timeline: a type icon on the rail, the sentence, the commit when there is one,
 * the detail in mono, and the time (exact on hover). `compact` drops the commit line.
 */
export function ActivityItem({ event, compact = false, className }: { event: ActivityEvent; compact?: boolean; className?: string }) {
  const { icon, tone } = look[event.type]
  const d = event.deployment
  return (
    <li className={cn("relative grid grid-cols-[2rem_minmax(0,1fr)_auto] gap-x-3 py-2.5", className)}>
      <span className={cn("surface-raised relative z-10 flex size-8 items-center justify-center rounded-lg", tone)}>
        <Icon name={icon} size="sm" />
      </span>
      <div className="grid min-w-0 gap-0.5 pt-1">
        <p className="truncate text-sm text-muted-foreground">
          <Sentence event={event} />
        </p>
        {d && !compact && (
          <Link
            href={event.project?.id ? deploymentHref({ id: d.id, projectId: event.project.id }) : "#"}
            className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <span className="font-mono text-foreground/80">{d.sha}</span>
            <span className="truncate">{d.message}</span>
          </Link>
        )}
        {event.detail && <p className="truncate font-mono text-[0.6875rem] text-muted-foreground/80">{event.detail}</p>}
      </div>
      <time dateTime={event.at} title={exact.format(new Date(event.at))} className="pt-1.5 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
        {formatRelativeTime(event.at)}
      </time>
    </li>
  )
}
