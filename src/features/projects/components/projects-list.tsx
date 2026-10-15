"use client"

import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format"
import { runtimes } from "@/content/runtimes"
import { useProjects, type ProjectSummary } from "@/features/projects/projects"
import { DeploymentStatus } from "@/features/deployments/components/deployment-status"
import { Icon, type IconName } from "@/components/shared/icon"
import { Skeleton } from "@/components/ui/skeleton"
import { buttonVariants } from "@/components/ui/button"
import { EmptyState } from "@/components/app-shell/empty-state"
import { ErrorState } from "@/components/app-shell/error-state"

type Filter = "all" | "live" | "working" | "failed"

const working = ["QUEUED", "BUILDING", "BUILT", "DEPLOYING"]
const failed = ["BUILD_FAILED", "DEPLOY_FAILED", "CRASHED"]
const matches: Record<Filter, (p: ProjectSummary) => boolean> = {
  all: () => true,
  live: (p) => Boolean(p.url),
  working: (p) => working.includes(p.state),
  failed: (p) => failed.includes(p.state),
}

const runtimeIcon = (id: string): IconName => runtimes.find((r) => r.id === id)?.icon ?? "package"
const runtimeName = (id: string) => runtimes.find((r) => r.id === id)?.name ?? id

/** The last ten deployments as a strip of blocks, oldest to newest — a project's track record at a glance. */
function History({ states }: { states: ProjectSummary["recent"] }) {
  const slots = [...states].reverse()
  const pad = Math.max(0, 10 - slots.length)
  return (
    <div className="flex items-center gap-[3px]" aria-label={`Last ${states.length} deployments`}>
      {Array.from({ length: pad }, (_, i) => (
        <span key={`pad-${i}`} className="surface-sunken h-3.5 w-2 rounded-[3px]" />
      ))}
      {slots.map((state, i) => (
        <span
          key={i}
          title={state.toLowerCase().replace("_", " ")}
          className={cn(
            "h-3.5 w-2 rounded-[3px]",
            state === "RUNNING" && "bg-success/75",
            failed.includes(state) && "bg-destructive/80",
            working.includes(state) && "animate-pulse-dot bg-brand",
            i === slots.length - 1 && "h-4"
          )}
        />
      ))}
    </div>
  )
}

function ProjectCard({ project, index }: { project: ProjectSummary; index: number }) {
  const href = `/dashboard/projects/${project.id}`
  return (
    <article
      className="surface-raised group/card relative flex animate-in flex-col overflow-hidden rounded-2xl duration-500 fade-in fill-mode-both slide-in-from-bottom-1 ease-out-expo motion-reduce:animate-none"
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
    >
      <div className="grid gap-4 p-4">
        <div className="flex items-start gap-3">
          <span className="surface-sunken flex size-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground">
            <Icon name={runtimeIcon(project.runtime)} />
          </span>
          <div className="grid min-w-0 flex-1 gap-0.5">
            <h2 className="truncate text-[0.95rem] font-medium">
              {/* The whole card is the link; actions sit above it. */}
              <Link href={href} className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-ring/60">
                {project.name}
              </Link>
            </h2>
            <p className="truncate font-mono text-xs text-muted-foreground">{project.url ?? "not live"}</p>
          </div>
          <DeploymentStatus state={project.state} live={project.latest?.live ?? true} appearance="pill" />
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="grid min-w-0 gap-1">
            <span className="text-[0.6875rem] tracking-wide text-muted-foreground uppercase">Latest</span>
            {project.latest ? (
              <p className="truncate text-sm">
                <span className="font-mono text-[0.8rem]">{project.latest.sha}</span> <span className="text-muted-foreground">{project.latest.message}</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No deployments yet</p>
            )}
          </div>
          <History states={project.recent} />
        </div>
      </div>

      <div className="surface-band mt-auto flex items-center gap-3 border-t border-border/50 px-4 py-2.5 font-mono text-[0.6875rem] text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          <Icon name="github" size="xs" className="shrink-0" />
          <span className="truncate">{project.repository}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <Icon name="git-branch" size="xs" />
          {project.branch}
        </span>
        <span className="ml-auto shrink-0 font-sans">{runtimeName(project.runtime)}</span>
        <span aria-hidden>·</span>
        <span className="shrink-0 font-sans">{formatRelativeTime(project.updatedAt)}</span>
      </div>

      {project.url && (
        <a
          href={`https://${project.url}`}
          target="_blank"
          rel="noreferrer"
          aria-label={`Visit ${project.url}`}
          className="surface-raised absolute top-4 right-[7.5rem] z-10 hidden size-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity group-hover/card:opacity-100 hover:text-foreground focus-visible:opacity-100 sm:flex"
        >
          <Icon name="arrow-up-right" size="xs" />
        </a>
      )}
    </article>
  )
}

function CardSkeleton() {
  return (
    <div className="surface-raised grid gap-4 rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-xl" />
        <div className="grid flex-1 gap-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-44" />
        </div>
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
    </div>
  )
}

/** Every project: filter by state, search by name or repository, open one. */
export function ProjectsList() {
  const { data, isPending, error, refetch } = useProjects()
  const [filter, setFilter] = React.useState<Filter>("all")
  const [query, setQuery] = React.useState("")
  const projects = data ?? []
  const q = query.trim().toLowerCase()
  const shown = projects.filter((p) => matches[filter](p) && (!q || p.name.includes(q) || p.repository.toLowerCase().includes(q)))
  const tabs: [Filter, string][] = [
    ["all", "All"],
    ["live", "Live"],
    ["working", "Deploying"],
    ["failed", "Failed"],
  ]

  if (error && !data) return <ErrorState title="Projects didn't load." onRetry={() => refetch()} />

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Filter projects" className="surface-sunken flex gap-0.5 rounded-xl p-1 text-sm">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={filter === id}
              onClick={() => setFilter(id)}
              className={cn("rounded-lg px-3 py-1.5 transition-colors", filter === id ? "surface-raised text-foreground" : "border border-transparent text-muted-foreground hover:text-foreground")}
            >
              {label} <span className="text-muted-foreground tabular-nums">· {isPending ? "–" : projects.filter(matches[id]).length}</span>
            </button>
          ))}
        </div>
        <label className="relative ml-auto flex w-full items-center sm:w-64">
          <Icon name="search" size="xs" className="pointer-events-none absolute left-3 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects"
            aria-label="Search projects"
            className="surface-sunken h-9 w-full rounded-lg pr-3 pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </label>
      </div>

      {isPending ? (
        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 4 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon="folder"
          title="No projects yet."
          description="Import a repository and it becomes a project with its own URL."
          actions={
            <Link href="/dashboard/new" className={cn(buttonVariants())}>
              New deployment
            </Link>
          }
        />
      ) : shown.length === 0 ? (
        <EmptyState variant="plain" size="compact" icon="search" title="No projects match." description="Try another filter or search." />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {shown.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
