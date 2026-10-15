"use client"

import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { formatBytes, formatCompact, formatNumber, formatRelativeTime } from "@/lib/format"
import { runtimes } from "@/content/runtimes"
import { useViewer } from "@/features/auth/session"
import { useProjects, useWorkspaceTraffic, type ProjectSummary } from "@/features/projects/projects"
import { useUsage } from "@/features/usage/usage"
import { useRecentActivity } from "@/features/activity/activity"
import { ActivityItem } from "@/features/activity/components/activity-item"
import { SignalBars } from "@/features/projects/components/live-signal"
import { deploymentStatusMeta } from "@/features/deployments/components/deployment-status"
import { TrafficMap } from "@/features/overview/components/traffic-map"
import type { WorldMapData } from "@/features/overview/world-map"
import { Icon, type IconName } from "@/components/shared/icon"
import { StatusDot } from "@/components/shared/status-dot"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { UsageMeter } from "@/components/charts"
import { EmptyState } from "@/components/app-shell/empty-state"

const working = ["QUEUED", "BUILDING", "BUILT", "DEPLOYING"]
const failed = ["BUILD_FAILED", "DEPLOY_FAILED", "CRASHED"]

// "Welcome" in the languages of home, taking turns.
const welcomes = [
  { word: "Ẹ káàbọ̀", language: "Yoruba" },
  { word: "Nnọọ", language: "Igbo" },
  { word: "Sannu", language: "Hausa" },
  { word: "Welcome back", language: "English" },
] as const

function Greeting({ projects }: { projects?: ProjectSummary[] }) {
  const { data: viewer } = useViewer()
  // Cycle through the languages, one every few seconds.
  const [index, setIndex] = React.useState(0)
  React.useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % welcomes.length), 3500)
    return () => window.clearInterval(id)
  }, [])
  const welcome = welcomes[index]
  const first = viewer?.name?.split(" ")[0]
  const live = projects?.filter((p) => p.url).length ?? 0
  const deploying = projects?.filter((p) => working.includes(p.state)).length ?? 0
  const attention = projects?.filter((p) => failed.includes(p.state)).length ?? 0
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="grid gap-1.5">
        <h1 className="flex flex-wrap items-baseline gap-x-3 text-2xl font-semibold tracking-[-0.02em] sm:text-[1.75rem]">
          <span key={welcome.word} title={`“Welcome” in ${welcome.language}`} className="animate-in duration-500 fade-in slide-in-from-bottom-1 ease-out-expo">
            {welcome.word}
            {first ? `, ${first}` : ""}!
          </span>
          {welcome.language !== "English" && <span key={welcome.language} className="animate-in font-mono text-xs font-normal text-muted-foreground duration-500 fade-in">{welcome.language} for welcome</span>}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
          {projects === undefined ? (
            <Skeleton className="h-3.5 w-56" />
          ) : (
            <>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-success" />
                {live} live
              </span>
              {deploying > 0 && (
                <span className="flex items-center gap-1.5 text-brand-ink">
                  <span className="size-1.5 animate-pulse-dot rounded-full bg-brand" />
                  {deploying} deploying
                </span>
              )}
              {attention > 0 && (
                <span className="flex items-center gap-1.5 text-destructive">
                  <span className="size-1.5 rounded-full bg-destructive" />
                  {attention} need{attention === 1 ? "s" : ""} attention
                </span>
              )}
            </>
          )}
        </div>
      </div>
      <Link href="/dashboard/new" className={cn(buttonVariants())}>
        <Icon name="plus" />
        New deployment
      </Link>
    </header>
  )
}

/** One figure in the strip, with a large faint icon behind it. */
function Figure({ label, value, unit, icon, children }: { label: string; value: React.ReactNode; unit?: string; icon: IconName; children?: React.ReactNode }) {
  return (
    <div className="relative grid content-start gap-1.5 overflow-hidden p-4 sm:p-5">
      <Icon name={icon} aria-hidden className="pointer-events-none absolute -right-3 -bottom-4 size-24! rotate-[-10deg] text-foreground/[0.05]" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-2xl tracking-tight tabular-nums">
        {value}
        {unit && <span className="ml-1.5 text-sm text-muted-foreground">{unit}</span>}
      </span>
      {children}
    </div>
  )
}

function Figures({ projects }: { projects?: ProjectSummary[] }) {
  const { data: usage } = useUsage()
  const limit = (id: string) => usage?.limits.find((l) => l.id === id)
  const live = limit("active_deployments")
  const minutes = limit("build_minutes")
  const bandwidth = limit("bandwidth")
  const requests = usage?.requests.reduce((a, d) => a + d.requests, 0)
  const loading = <Skeleton className="h-7 w-20" />
  return (
    <section aria-label="Workspace figures" className="grid grid-cols-2 divide-border/60 overflow-hidden rounded-2xl border border-border/70 bg-card lg:grid-cols-4 lg:divide-x max-lg:[&>*:nth-child(-n+2)]:border-b max-lg:[&>*:nth-child(odd)]:border-r">
      <Figure label="Projects" icon="folder" value={projects ? projects.length : loading} unit={live ? `${live.used} of ${live.limit} live` : undefined}>
        {live && <UsageMeter used={live.used} limit={live.limit} label="Live deployments" className="mt-2" />}
      </Figure>
      <Figure label="Requests · 30d" icon="activity" value={requests !== undefined ? formatCompact(requests) : loading} />
      <Figure label="Build minutes" icon="hammer" value={minutes ? formatNumber(minutes.used) : loading} unit={minutes ? `/ ${minutes.limit}` : undefined}>
        {minutes && <UsageMeter used={minutes.used} limit={minutes.limit} label="Build minutes" className="mt-2" />}
      </Figure>
      <Figure label="Bandwidth" icon="network" value={bandwidth ? formatBytes(bandwidth.used) : loading} unit={bandwidth ? `/ ${formatBytes(bandwidth.limit)}` : undefined}>
        {bandwidth && <UsageMeter used={bandwidth.used} limit={bandwidth.limit} label="Bandwidth" className="mt-2" />}
      </Figure>
    </section>
  )
}

function LivePanel({ map }: { map: WorldMapData }) {
  const { data: traffic } = useWorkspaceTraffic()
  const events = React.useMemo(() => traffic?.requests.map((r) => ({ at: r.at, error: r.error })) ?? [], [traffic])
  const cities = new Set(traffic?.requests.map((r) => r.city)).size
  const live = (traffic?.liveProjects ?? 0) > 0
  return (
    <section className="relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card">
      <header className="flex items-center justify-between gap-3 px-5 pt-4">
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <StatusDot tone={live ? "success" : "muted"} motion={live ? "live" : "still"} size="sm" />
          Live across your projects
        </h2>
        <span className="font-mono text-xs text-muted-foreground">
          {traffic?.liveProjects ?? "–"} live · {cities} {cities === 1 ? "city" : "cities"}
        </span>
      </header>
      <div className="flex flex-1 items-center px-5 pt-3 pb-3">
        <TrafficMap map={map} traffic={traffic} className="w-full" />
      </div>
      <div className="surface-sunken mt-auto border-t border-border/50">
        <SignalBars events={events} live={live} height={96} label="Requests · last 60s" />
      </div>
    </section>
  )
}

function Attention({ projects }: { projects?: ProjectSummary[] }) {
  const items = (projects ?? []).filter((p) => working.includes(p.state) || failed.includes(p.state))
  return (
    <section className="grid content-start gap-2.5 rounded-2xl border border-border/70 bg-card p-4">
      <h2 className="text-sm font-medium">Right now</h2>
      {projects === undefined ? (
        <Skeleton className="h-14 rounded-xl" />
      ) : items.length === 0 ? (
        <p className="surface-sunken flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm text-muted-foreground">
          <Icon name="check" size="sm" className="text-success" />
          All quiet — nothing deploying, nothing failing.
        </p>
      ) : (
        <ul className="grid gap-2">
          {items.map((p) => {
            const isWorking = working.includes(p.state)
            const { label, tone } = deploymentStatusMeta(p.state)
            return (
              <li key={p.id}>
                <Link
                  href={p.latest ? `/dashboard/projects/${p.id}/deployments/${p.latest.id}` : `/dashboard/projects/${p.id}`}
                  className={cn("surface-raised flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-colors", isWorking ? "border-brand/35" : "border-destructive/35")}
                >
                  <StatusDot tone={tone} motion={isWorking ? "progress" : p.state === "CRASHED" ? "alert" : "still"} />
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate text-sm font-medium">{p.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{p.latest?.message}</span>
                  </span>
                  <span className={cn("shrink-0 text-xs", isWorking ? "text-brand-ink" : "text-destructive")}>{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function RecentActivity() {
  const { data, isPending } = useRecentActivity(6)
  return (
    <section className="flex flex-col rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex items-end justify-between">
        <h2 className="text-sm font-medium">Activity</h2>
        <Link href="/dashboard/activity" className="text-xs text-muted-foreground hover:text-foreground">
          All activity →
        </Link>
      </div>
      {isPending ? (
        <div className="mt-3 grid gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-9" />
          ))}
        </div>
      ) : (
        <ol className="relative mt-1 before:absolute before:top-4 before:bottom-4 before:left-4 before:w-px before:bg-border/80">
          {data?.items.map((event) => (
            <ActivityItem key={event.id} event={event} compact />
          ))}
        </ol>
      )}
    </section>
  )
}

/** A project tile with its own heartbeat: the last 30 seconds of its requests. */
function ProjectTile({ project, beats }: { project: ProjectSummary; beats: number[] }) {
  const runtime = runtimes.find((r) => r.id === project.runtime)
  const isWorking = working.includes(project.state)
  const isFailed = failed.includes(project.state)
  const peak = Math.max(2, ...beats)
  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="surface-raised group grid gap-3 rounded-xl p-3.5 transition-transform duration-300 ease-out-expo hover:-translate-y-0.5"
    >
      <span className="flex items-center gap-2.5">
        <span className="surface-sunken flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground">
          <Icon name={runtime?.icon ?? "package"} size="sm" />
        </span>
        <span className="grid min-w-0 flex-1">
          <span className="truncate text-sm font-medium">{project.name}</span>
          <span className="truncate font-mono text-[0.6875rem] text-muted-foreground">{project.url ?? "not live"}</span>
        </span>
        <StatusDot tone={isFailed ? "danger" : isWorking ? "progress" : project.url ? "success" : "muted"} motion={isWorking ? "progress" : project.url && !isFailed ? "live" : "still"} size="sm" />
      </span>
      {/* Heartbeat. */}
      <span aria-hidden className="flex h-7 items-end gap-[2px]">
        {beats.map((n, i) => (
          <span
            key={i}
            className={cn("flex-1 rounded-t-[2px] transition-[height] duration-500", i === beats.length - 1 && n ? "bg-brand" : "bg-foreground/25")}
            style={{ height: `${n ? Math.max(15, (n / peak) * 100) : 6}%`, opacity: n ? 1 : 0.4 }}
          />
        ))}
      </span>
      <span className="flex items-center justify-between gap-2 text-[0.6875rem] text-muted-foreground">
        <span className="truncate">{project.latest ? `${project.latest.sha} · ${formatRelativeTime(project.latest.createdAt)}` : "no deployments"}</span>
        <span className="font-mono tabular-nums">{beats.reduce((a, b) => a + b, 0)} req/30s</span>
      </span>
    </Link>
  )
}

function Projects({ projects }: { projects?: ProjectSummary[] }) {
  const { data: traffic } = useWorkspaceTraffic()
  const [second, setSecond] = React.useState(() => Math.floor(Date.now() / 1000))
  React.useEffect(() => {
    const id = window.setInterval(() => setSecond(Math.floor(Date.now() / 1000)), 1000)
    return () => window.clearInterval(id)
  }, [])
  const beatsFor = (projectId: string) => {
    const beats = Array.from({ length: 30 }, () => 0)
    for (const r of traffic?.requests ?? []) {
      if (r.projectId !== projectId) continue
      const age = second - Math.floor(new Date(r.at).getTime() / 1000)
      if (age >= 0 && age < 30) beats[29 - age]++
    }
    return beats
  }

  return (
    <section className="grid gap-3">
      <div className="flex items-end justify-between">
        <h2 className="text-sm font-medium">Projects</h2>
        <Link href="/dashboard/projects" className="text-xs text-muted-foreground hover:text-foreground">
          All projects →
        </Link>
      </div>
      {projects === undefined ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon="rocket"
          title="Nothing on the counter yet."
          description="Connect a GitHub repository, pick a runtime and get a live URL."
          actions={
            <Link href="/dashboard/new" className={cn(buttonVariants())}>
              Deploy your first project
              <Icon name="arrow-right" />
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 rounded-2xl border border-border/70 bg-card p-3 sm:grid-cols-2 xl:grid-cols-4">
          {projects.map((p) => (
            <ProjectTile key={p.id} project={p} beats={beatsFor(p.id)} />
          ))}
          <Link
            href="/dashboard/new"
            className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <Icon name="plus" />
            New deployment
          </Link>
        </div>
      )}
    </section>
  )
}

/**
 * The Galley at a glance: a welcome, the workspace in four figures, live traffic across every
 * project (on a map and as a signal), what needs attention, recent activity, and each project
 * with its own heartbeat.
 */
export function GalleyOverview({ map }: { map: WorldMapData }) {
  const { data: projects } = useProjects()
  return (
    <div className="grid gap-5">
      <Greeting projects={projects} />
      <Figures projects={projects} />
      <Projects projects={projects} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <LivePanel map={map} />
        <div className="grid content-start gap-4">
          <Attention projects={projects} />
          <RecentActivity />
        </div>
      </div>
    </div>
  )
}
