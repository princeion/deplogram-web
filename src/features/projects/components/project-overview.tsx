"use client"

import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { formatCompact, formatDuration, formatPercent, formatRelativeTime } from "@/lib/format"
import { siteConfig } from "@/lib/site"
import { useProject, useProjectMetrics, type Project } from "@/features/projects/projects"
import { useDeployment, useDeployments, type Deployment } from "@/features/deployments/deployments"
import { deploymentStatusMeta } from "@/features/deployments/components/deployment-status"
import { deploymentHref, useDeploymentActions } from "@/features/deployments/components/use-deployment-actions"
import { ProjectGate } from "@/features/projects/components/project-gate"
import { LiveSignal } from "@/features/projects/components/live-signal"
import { StatusDot } from "@/components/shared/status-dot"
import { Icon } from "@/components/shared/icon"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Sparkline, type ChartColor } from "@/components/charts"
import { SettingRow, SettingsTable } from "@/components/shared/settings-table"

const working = ["QUEUED", "BUILDING", "BUILT", "DEPLOYING"]
const failed = ["BUILD_FAILED", "DEPLOY_FAILED", "CRASHED"]

// ── The Stage ──────────────────────────────────────────────────────────────────────

function StageStatus({ project }: { project: Project }) {
  const isWorking = working.includes(project.state)
  const isFailed = failed.includes(project.state)
  const live = Boolean(project.url)
  const { label } = deploymentStatusMeta(project.state, project.latest?.live ?? true)
  return (
    <p className="surface-sunken flex items-center gap-2 rounded-full py-1 pr-3 pl-2.5 text-xs">
      <StatusDot
        tone={project.state === "CRASHED" ? "danger" : isWorking ? "progress" : live ? "success" : isFailed ? "danger" : "muted"}
        motion={project.state === "CRASHED" ? "alert" : isWorking ? "progress" : live ? "live" : "still"}
      />
      <span className="font-medium">{isWorking || !live ? label : "Live"}</span>
      {project.latest && <span className="font-mono text-muted-foreground">{formatRelativeTime(project.latest.createdAt)}</span>}
    </p>
  )
}

function CurrentDeployment({ project }: { project: Project }) {
  const latest = useDeployment(project.latest?.id ?? "")
  const d = latest.data
  return (
    <div className="surface-raised relative grid content-start gap-3 rounded-2xl p-4">
      <span className="flex items-center justify-between text-[0.6875rem] font-medium tracking-[0.08em] text-muted-foreground uppercase">
        Latest deployment
        {d && (
          <Link href={deploymentHref(d)} className="tracking-normal normal-case hover:text-foreground">
            Open →
          </Link>
        )}
      </span>
      {!d ? (
        <div className="grid gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          <div className="grid gap-1">
            <p className="line-clamp-2 text-sm font-medium">{d.commit.message}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {d.commit.sha} · {d.commit.branch} · {d.commit.author.name}
            </p>
          </div>
          <dl className="surface-sunken grid grid-cols-2 divide-x divide-border/50 rounded-xl text-xs">
            <div className="grid gap-0.5 px-3 py-2">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium">{deploymentStatusMeta(d.state, d.live).label}</dd>
            </div>
            <div className="grid gap-0.5 px-3 py-2">
              <dt className="text-muted-foreground">Build &amp; deploy</dt>
              <dd className="font-mono">{d.durationSeconds != null ? formatDuration(d.durationSeconds) : "running…"}</dd>
            </div>
          </dl>
        </>
      )}
    </div>
  )
}

function StageActions({ project }: { project: Project }) {
  const latest = useDeployment(project.latest?.id ?? "")
  const { startRedeploy } = useDeploymentActions()
  const isWorking = working.includes(project.state)
  return (
    <div className="flex flex-wrap gap-2">
      <Button disabled={!latest.data || isWorking} onClick={() => latest.data && void startRedeploy(latest.data)}>
        <Icon name="refresh" />
        {isWorking ? "Deploying…" : "Redeploy"}
      </Button>
      {project.url && (
        <a href={`https://${project.url}`} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline" }))}>
          Visit
          <Icon name="arrow-up-right" />
        </a>
      )}
      <Link href={`/dashboard/projects/${project.id}/logs`} className={cn(buttonVariants({ variant: "ghost" }))}>
        <Icon name="scroll-text" />
        Logs
      </Link>
    </div>
  )
}

/**
 * The hero: the project's name set large over a haze of the brand metal, its URL and state, the
 * latest deployment beside it, and its live traffic running along the bottom.
 */
function Stage({ project }: { project: Project }) {
  const live = Boolean(project.url)
  return (
    <section aria-label={project.name} className="relative overflow-hidden rounded-3xl border border-border/70 bg-card">
      {/* A faint dot grid fading out, and a hairline highlight along the top edge. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dot-grid opacity-40 mask-fade-edges" />
      <div aria-hidden className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-foreground/25 to-transparent" />

      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-end">
        <div className="grid min-w-0 content-start gap-5">
          <div className="grid gap-1.5">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="animate-in truncate text-2xl font-semibold tracking-[-0.02em] duration-500 fade-in slide-in-from-bottom-1 ease-out-expo sm:text-[1.75rem] motion-reduce:animate-none">
                {project.name}
              </h1>
              <StageStatus project={project} />
            </div>
            {live ? (
              <a href={`https://${project.url}`} target="_blank" rel="noreferrer" className="group flex w-fit items-center gap-1.5 font-mono text-sm text-muted-foreground transition-colors hover:text-foreground">
                https://<span className="text-foreground">{project.url}</span>
                <Icon name="arrow-up-right" size="sm" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            ) : (
              <p className="font-mono text-sm text-muted-foreground">Not live yet — https://{project.name}.{siteConfig.deployDomain}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { icon: "package" as const, text: project.config.runtimeVersion },
              { icon: "git-branch" as const, text: project.branch },
              { icon: "github" as const, text: project.repository },
            ].map((chip) => (
              <span key={chip.icon} className="surface-sunken flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs text-muted-foreground">
                <Icon name={chip.icon} size="xs" />
                {chip.text}
              </span>
            ))}
          </div>
          <StageActions project={project} />
        </div>
        <CurrentDeployment project={project} />
      </div>

      <div className="surface-sunken relative border-t border-border/50">
        <LiveSignal projectId={project.id} live={live} />
      </div>
    </section>
  )
}

// ── The Reel ───────────────────────────────────────────────────────────────────────

function Frame({ d, index }: { d: Deployment; index: number }) {
  const { label, tone } = deploymentStatusMeta(d.state, d.live)
  return (
    <li className="relative shrink-0 animate-in pb-5 duration-500 fade-in fill-mode-both slide-in-from-right-2 ease-out-expo motion-reduce:animate-none" style={{ animationDelay: `${index * 45}ms` }}>
      <Link
        href={deploymentHref(d)}
        className={cn(
          "surface-raised group relative grid w-56 gap-2.5 overflow-hidden rounded-xl p-3 transition-transform duration-300 ease-out-expo outline-none hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-ring/60",
          d.live && "ring-1 ring-brand/45"
        )}
      >
        {d.live && <span aria-hidden className="metal-brand absolute inset-x-0 top-0 h-[3px]" />}
        <span className="flex items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-2">
            <StatusDot tone={tone} motion={d.live ? "live" : working.includes(d.state) ? "progress" : "still"} size="sm" dim={!d.live && d.state === "RUNNING"} />
            <span className={cn("font-medium", d.live && "metal-brand-text")}>{d.live ? "Live" : label}</span>
          </span>
          <span className="text-muted-foreground">{formatRelativeTime(d.createdAt)}</span>
        </span>
        <span className="line-clamp-2 min-h-10 text-sm">{d.commit.message}</span>
        <span className="flex items-center justify-between gap-2 font-mono text-[0.6875rem] text-muted-foreground">
          <span>{d.commit.sha}</span>
          <span className="truncate">{d.commit.branch}</span>
        </span>
      </Link>
      {/* Where this frame sits on the rail. */}
      <span
        aria-hidden
        className={cn(
          "absolute bottom-0 left-1/2 size-2.5 -translate-x-1/2 rounded-full border-2 bg-card",
          d.live ? "border-brand shadow-[0_0_10px_var(--brand)]" : failed.includes(d.state) ? "border-destructive/70" : working.includes(d.state) ? "border-brand/70" : "border-foreground/30"
        )}
      />
    </li>
  )
}

/** Recent deployments as a film strip on a rail, oldest to newest, ending at "now". */
function Reel({ projectId }: { projectId: string }) {
  const { data, isPending } = useDeployments({ project: [projectId], page: 1, pageSize: 12, sort: "-created" })
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const items = React.useMemo(() => [...(data?.items ?? [])].reverse(), [data])

  // Open at the newest end.
  React.useEffect(() => {
    const el = scrollRef.current
    if (el && items.length) el.scrollLeft = el.scrollWidth
  }, [items.length])

  return (
    <section className="grid gap-3">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-sm font-medium">Deployments</h2>
        <Link href={`/dashboard/projects/${projectId}/deployments`} className="text-xs text-muted-foreground hover:text-foreground">
          View all →
        </Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div ref={scrollRef} className="overflow-x-auto overscroll-x-contain px-6 pt-5 pb-3 [scrollbar-width:none] [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
          <ol className="relative flex w-max items-start gap-3 pr-16">
            {/* The rail. */}
            <span aria-hidden className="absolute inset-x-0 bottom-[4px] h-px bg-gradient-to-r from-transparent via-foreground/20 to-brand/60" />
            {isPending
              ? Array.from({ length: 5 }, (_, i) => (
                  <li key={i} className="pb-5">
                    <Skeleton className="h-[7.25rem] w-56 rounded-xl" />
                  </li>
                ))
              : items.map((d, i) => <Frame key={d.id} d={d} index={i} />)}
            <li aria-hidden className="absolute right-0 bottom-0 flex items-center gap-1.5">
              <span className="metal-brand size-2.5 rounded-full" />
              <span className="font-mono text-[0.625rem] text-brand-ink">now</span>
            </li>
          </ol>
        </div>
      </div>
    </section>
  )
}

// ── Vitals & spec ──────────────────────────────────────────────────────────────────

function Vital({ label, value, unit, values, color }: { label: string; value: string; unit?: string; values: number[]; color: ChartColor }) {
  return (
    <div className="surface-raised grid gap-2 rounded-xl p-3.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-2xl tracking-tight tabular-nums">
        {value}
        {unit && <span className="ml-1 text-sm text-muted-foreground">{unit}</span>}
      </span>
      <Sparkline values={values} color={color} height={32} />
    </div>
  )
}

function Vitals({ projectId }: { projectId: string }) {
  const { data, isPending } = useProjectMetrics(projectId, "24h")
  return (
    <section className="grid content-start gap-3 rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex items-end justify-between">
        <h2 className="text-sm font-medium">
          Vitals <span className="font-normal text-muted-foreground">· 24h</span>
        </h2>
        <Link href={`/dashboard/projects/${projectId}/metrics`} className="text-xs text-muted-foreground hover:text-foreground">
          Metrics →
        </Link>
      </div>
      {isPending || !data ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Vital label="Requests" value={formatCompact(data.summary.requests)} values={data.series.map((s) => s.requests)} color="chart-1" />
          <Vital label="p95 latency" value={String(data.summary.p95)} unit="ms" values={data.series.map((s) => s.p95)} color="chart-2" />
          <Vital label="Error rate" value={formatPercent(data.summary.errorRate, 2)} values={data.series.map((s) => s.errors)} color="destructive" />
          <Vital label="Memory" value={String(data.series.at(-1)?.memory ?? 0)} unit={`/ ${data.memoryLimit} MB`} values={data.series.map((s) => s.memory)} color="brand" />
        </div>
      )}
    </section>
  )
}

function Spec({ project }: { project: Project }) {
  const value = (text: React.ReactNode, mono = true) => <span className={cn("truncate px-2 text-[0.8125rem]", mono && "font-mono")}>{text}</span>
  return (
    <section className="grid content-start gap-3 rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex items-end justify-between">
        <h2 className="text-sm font-medium">Configuration</h2>
        <Link href={`/dashboard/projects/${project.id}/settings`} className="text-xs text-muted-foreground hover:text-foreground">
          Settings →
        </Link>
      </div>
      <SettingsTable>
        <SettingRow label="Runtime">{value(project.config.runtimeVersion)}</SettingRow>
        <SettingRow label="Build">{value(project.config.buildCommand ?? "—")}</SettingRow>
        {project.config.port ? (
          <>
            <SettingRow label="Start">{value(project.config.startCommand ?? "—")}</SettingRow>
            <SettingRow label="Port">{value(project.config.port)}</SettingRow>
          </>
        ) : (
          <SettingRow label="Serve">{value("static files at the edge", false)}</SettingRow>
        )}
        <SettingRow label="Variables">
          <Link href={`/dashboard/projects/${project.id}/environment`} className="px-2 text-[0.8125rem] hover:underline">
            {project.envCount} {project.envCount === 1 ? "variable" : "variables"} →
          </Link>
        </SettingRow>
      </SettingsTable>
    </section>
  )
}

/** A project at a glance: the Stage (identity, state, live traffic), the deployment reel, vitals and configuration. */
export function ProjectOverview({ projectId }: { projectId: string }) {
  const query = useProject(projectId)
  return (
    <ProjectGate query={query}>
      {(project) => (
        <div className="grid gap-6">
          <Stage project={project} />
          <Reel projectId={project.id} />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <Vitals projectId={project.id} />
            <Spec project={project} />
          </div>
        </div>
      )}
    </ProjectGate>
  )
}
