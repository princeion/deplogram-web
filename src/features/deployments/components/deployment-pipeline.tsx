"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format"
import type { BuildStep, Deployment } from "@/features/deployments/deployments"
import { Icon, type IconName } from "@/components/shared/icon"
import { StatusDot, type StatusMotion, type StatusTone } from "@/components/shared/status-dot"

type NodeState = "done" | "current" | "failed" | "pending" | "skipped" | "live"
export type CableState = "done" | "flowing" | "failed" | "idle"

type PipelineNode = {
  id: string
  eyebrow: string
  icon: IconName
  title: React.ReactNode
  /** The recessed strip: a command, a commit, a URL. */
  detail: React.ReactNode
  detailMono?: boolean
  status: string
  state: NodeState
  /** For the duration readout; ticks while `until` is null and the node is current. */
  since?: string | null
  until?: string | null
}

const dot: Record<NodeState, { tone: StatusTone; motion: StatusMotion; dim?: boolean }> = {
  done: { tone: "success", motion: "still" },
  current: { tone: "progress", motion: "progress" },
  failed: { tone: "danger", motion: "still" },
  pending: { tone: "muted", motion: "waiting" },
  skipped: { tone: "muted", motion: "still", dim: true },
  live: { tone: "success", motion: "live" },
}

/** 2840 → "2.8s", 74_000 → "1m 14s". */
function formatSpan(ms: number) {
  return ms < 60_000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`
}

function Duration({ since, until, live }: { since?: string | null; until?: string | null; live: boolean }) {
  const [now, setNow] = React.useState<number | null>(null)
  React.useEffect(() => {
    if (!live || until) return
    const tick = () => setNow(Date.now())
    tick()
    const id = window.setInterval(tick, 100)
    return () => window.clearInterval(id)
  }, [live, until])
  if (!since) return null
  const end = until ? new Date(until).getTime() : now
  if (end == null) return null
  return <span className="tabular-nums">{formatSpan(Math.max(0, end - new Date(since).getTime()))}</span>
}

/** Where each stage stands, from the deployment's state (QUEUED → BUILDING → BUILT → DEPLOYING → RUNNING). */
function nodesFor(deployment: Deployment, steps: readonly BuildStep[] = []): PipelineNode[] {
  const { state, live, trigger, config, commit } = deployment
  const step = (id: BuildStep["id"]) => steps.find((s) => s.id === id)
  const failedAt = { BUILD_FAILED: "build", DEPLOY_FAILED: "deploy", CRASHED: "live" }[state as string]
  const order = ["source", "build", "deploy", "live"]
  const reached = { QUEUED: 1, BUILDING: 1, BUILT: 2, DEPLOYING: 2, RUNNING: 3, BUILD_FAILED: 1, DEPLOY_FAILED: 2, CRASHED: 3 }[state]
  const stateOf = (id: string): NodeState => {
    const i = order.indexOf(id)
    if (failedAt === id) return "failed"
    if (failedAt && i > order.indexOf(failedAt)) return "skipped"
    if (i < reached) return "done"
    if (i === reached) return state === "RUNNING" ? (live ? "live" : "done") : state === "QUEUED" ? "pending" : "current"
    return "pending"
  }
  const rollback = trigger === "rollback"
  const build = { since: step("clone")?.startedAt, until: step("build")?.endedAt }
  const deploy = step("deploy")
  const buildState = rollback ? "skipped" : stateOf("build")
  const deployState = stateOf("deploy")
  const liveState = stateOf("live")

  return [
    {
      id: "source",
      eyebrow: "Source",
      icon: "github",
      title: (
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <Icon name="git-branch" size="xs" className="shrink-0 text-muted-foreground" />
          <span className="truncate font-mono text-[0.85rem]">{commit.branch}</span>
        </span>
      ),
      detail: (
        <>
          <span className="text-foreground">{commit.sha}</span> <span className="text-muted-foreground">{commit.message}</span>
        </>
      ),
      detailMono: true,
      status: `${commit.author.name} · ${formatRelativeTime(deployment.createdAt)}`,
      state: "done",
    },
    {
      id: "build",
      eyebrow: "Build",
      icon: "hammer",
      title: config.runtimeVersion,
      detail: `$ ${config.buildCommand ?? "no build command"}`,
      detailMono: true,
      status: rollback
        ? `Reused the build of ${commit.sha}`
        : { done: "Built", current: "Building…", failed: "Build failed", pending: state === "QUEUED" ? "Queued — waiting for a builder" : "Waiting", skipped: "Skipped", live: "Built" }[buildState],
      state: buildState,
      since: build.since,
      until: build.until,
    },
    {
      id: "deploy",
      eyebrow: "Deploy",
      icon: config.port ? "container" : "upload",
      title: config.port ? "Container" : "Static files",
      detail: config.port ? `$ ${config.startCommand ?? "default start command"}` : "Published to storage, served at the edge",
      detailMono: Boolean(config.port),
      status: { done: "Healthy", current: state === "BUILT" ? "Starting…" : "Deploying…", failed: "Health checks failed", pending: "Waiting for the build", skipped: "Didn't run", live: "Healthy" }[deployState],
      state: deployState,
      since: deploy?.startedAt,
      until: deploy?.endedAt,
    },
    {
      id: "live",
      eyebrow: "Live",
      icon: "network",
      title: deployment.url ? (
        <a href={`https://${deployment.url}`} target="_blank" rel="noreferrer" className="hover:underline">
          {deployment.url}
        </a>
      ) : state === "RUNNING" ? (
        "Replaced"
      ) : (
        "Not live yet"
      ),
      detail:
        liveState === "live"
          ? "Serving traffic"
          : state === "CRASHED"
            ? "The process exited — see the log"
            : state === "RUNNING"
              ? "A newer deployment is serving traffic"
              : liveState === "skipped"
                ? "Didn't go live"
                : "Goes live after a healthy deploy",
      status: { done: "Ready", current: "Switching traffic…", failed: "Crashed", pending: "Waiting", skipped: "—", live: "Live" }[liveState],
      state: liveState,
    },
  ]
}

function Node({ node, index }: { node: PipelineNode; index: number }) {
  const { state } = node
  const ringed = state === "current" || state === "failed" || state === "live"
  return (
    <li
      aria-current={state === "current" ? "step" : undefined}
      className={cn(
        "relative flex min-w-0 flex-1 animate-in flex-col rounded-2xl border p-4 duration-700 fade-in fill-mode-both slide-in-from-bottom-2 ease-out-expo motion-reduce:animate-none",
        "bg-[color-mix(in_oklab,var(--card),var(--foreground)_4%)] shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_7%,transparent),0_14px_30px_-18px_rgb(0_0_0/0.6)]",
        state === "done" && "border-border/80",
        state === "current" && "border-brand/40 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_7%,transparent),0_0_0_1px_color-mix(in_oklab,var(--brand)_12%,transparent),0_18px_60px_-24px_color-mix(in_oklab,var(--brand)_70%,transparent)]",
        state === "failed" && "border-destructive/45 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_7%,transparent),0_18px_60px_-26px_color-mix(in_oklab,var(--destructive)_70%,transparent)]",
        state === "live" && "border-success/40 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_7%,transparent),0_18px_60px_-26px_color-mix(in_oklab,var(--success)_60%,transparent)]",
        (state === "pending" || state === "skipped") && "border-dashed border-border/80 bg-transparent shadow-none",
        state === "skipped" && "opacity-55"
      )}
      style={{ animationDelay: `${index * 90}ms` }}
    >
      {state === "current" && <span aria-hidden className="beam-border" />}

      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/40 text-foreground",
            state === "current" && "border-brand/30 text-brand-ink",
            state === "failed" && "border-destructive/30 text-destructive",
            state === "live" && "border-success/30 text-success",
            (state === "pending" || state === "skipped") && "text-muted-foreground"
          )}
        >
          <Icon name={node.icon} filled={ringed} />
        </span>
        <div className="grid min-w-0 flex-1 gap-0.5">
          <span className="text-[0.6875rem] font-medium tracking-[0.08em] text-muted-foreground uppercase">{node.eyebrow}</span>
          <span className="truncate text-sm font-medium">{node.title}</span>
        </div>
        <span className="pt-1">
          <StatusDot {...dot[state]} />
        </span>
      </div>

      <div
        className={cn(
          "mt-3 truncate rounded-lg border border-border/60 bg-background/35 px-2.5 py-2 text-xs shadow-[inset_0_1px_2px_rgb(0_0_0/0.25)]",
          node.detailMono && "font-mono text-[0.72rem]"
        )}
        title={typeof node.detail === "string" ? node.detail : undefined}
      >
        {node.detail}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <span
          className={cn(
            "truncate text-muted-foreground",
            state === "current" && "text-brand-ink",
            state === "failed" && "text-destructive",
            state === "live" && "text-success"
          )}
        >
          {node.status}
        </span>
        <span className="shrink-0 text-muted-foreground">
          <Duration since={node.since} until={node.until} live={state === "current"} />
        </span>
      </div>
    </li>
  )
}

/** A thick cable between stages with sockets at both ends; light travels along it while work flows through. */
export function Cable({ state, label, as: Tag = "li" }: { state: CableState; label?: string; as?: "li" | "div" }) {
  const fill = {
    done: "bg-foreground/30",
    failed: "bg-destructive/55",
    idle: "bg-[repeating-linear-gradient(90deg,var(--border)_0_6px,transparent_6px_11px)] max-lg:bg-[repeating-linear-gradient(180deg,var(--border)_0_6px,transparent_6px_11px)]",
    flowing:
      "bg-[repeating-linear-gradient(90deg,color-mix(in_oklab,var(--brand)_25%,transparent)_0_10px,var(--brand)_10px_14px,color-mix(in_oklab,var(--brand)_25%,transparent)_14px_28px)] max-lg:bg-[repeating-linear-gradient(180deg,color-mix(in_oklab,var(--brand)_25%,transparent)_0_10px,var(--brand)_10px_14px,color-mix(in_oklab,var(--brand)_25%,transparent)_14px_28px)] animate-[cable-flow_0.9s_linear_infinite] max-lg:animate-[cable-flow-y_0.9s_linear_infinite] shadow-[0_0_14px_color-mix(in_oklab,var(--brand)_55%,transparent)] motion-reduce:animate-none",
  }[state]
  const socket = cn("size-2.5 shrink-0 rounded-full border-2 bg-card", state === "flowing" ? "border-brand" : state === "failed" ? "border-destructive/70" : state === "done" ? "border-foreground/40" : "border-border")
  return (
    <Tag aria-hidden className="relative flex shrink-0 items-center justify-center max-lg:h-12 max-lg:flex-col lg:w-12">
      <span className={socket} />
      <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/[0.06] shadow-[inset_0_1px_2px_rgb(0_0_0/0.5)] max-lg:h-auto max-lg:w-1.5">
        <span className={cn("absolute inset-0 rounded-full transition-colors duration-500", fill)} />
      </span>
      <span className={socket} />
      {label && (
        <span className="absolute rounded-md border border-border/70 bg-card px-1.5 py-0.5 font-mono text-[0.625rem] text-muted-foreground shadow-sm max-lg:left-[calc(50%+14px)]">
          {label}
        </span>
      )}
    </Tag>
  )
}

const cableInto = (to: NodeState): CableState =>
  to === "current" ? "flowing" : to === "failed" ? "failed" : to === "pending" || to === "skipped" ? "idle" : "done"

/**
 * The deployment as a pipeline on a canvas — Source → Build → Deploy → Live — with solid node
 * cards and cables between them. The stage at work carries an orbiting light and the cable into
 * it flows; a failure turns its node and cable red; the live node glows. Stacks vertically on
 * small screens.
 */
export function DeploymentPipeline({ deployment, steps, className, children }: { deployment: Deployment; steps?: readonly BuildStep[]; className?: string; children?: React.ReactNode }) {
  const nodes = nodesFor(deployment, steps)
  return (
    <section aria-label="Deployment pipeline" className={cn("relative overflow-hidden rounded-2xl border border-border/70 bg-card", className)}>
      {/* The canvas: a dot grid fading out toward the edges. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dot-grid mask-fade-edges opacity-80" />
      <ol className="relative flex flex-col p-4 sm:p-6 lg:flex-row lg:items-stretch lg:p-8">
        {nodes.map((node, i) => (
          <React.Fragment key={node.id}>
            {i > 0 && <Cable state={cableInto(node.state)} label={node.id === "live" && deployment.config.port ? `:${deployment.config.port}` : undefined} />}
            <Node node={node} index={i} />
          </React.Fragment>
        ))}
      </ol>
      {children && <div className="relative border-t border-border/60 bg-card/80 px-4 py-4 backdrop-blur-sm sm:px-6 lg:px-8">{children}</div>}
    </section>
  )
}
