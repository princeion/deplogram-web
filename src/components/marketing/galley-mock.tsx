"use client"

import * as React from "react"
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/site"
import { galleyNav } from "@/content/workspace"
import type { LifecycleState, FailureState } from "@/content/deploy"
import { Icon, type IconName } from "@/components/shared/icon"
import { ProductWindow, StateBadge } from "@/components/marketing/product-window"

const FRAME_MS = 1500

/** admin-dashboard's deployment, one state per frame; the loop restarts once it has been live a while. */
const dashboardTimeline: (LifecycleState)[] = ["QUEUED", "BUILDING", "BUILDING", "BUILT", "DEPLOYING", "RUNNING", "RUNNING", "RUNNING", "RUNNING"]

type Project = {
  name: string
  runtime: string
  icon: IconName
  branch: string
  commit: string
  state: LifecycleState | FailureState
  updated: string
  traffic: number[]
}

type Activity = { id: string; at: string; text: React.ReactNode }

/**
 * Your Galley — the workspace. A deployment of admin-dashboard moves through its lifecycle while
 * activity streams in. Loops while on screen; reduced motion shows the settled workspace.
 */
export function GalleyMock({ className }: { className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.3 })
  const reduceMotion = useReducedMotion()
  const [frame, setFrame] = React.useState(0)

  React.useEffect(() => {
    if (reduceMotion || !inView) return
    const id = window.setInterval(() => setFrame((f) => (f + 1) % dashboardTimeline.length), FRAME_MS)
    return () => window.clearInterval(id)
  }, [reduceMotion, inView])

  const f = reduceMotion ? dashboardTimeline.length - 1 : frame
  const dashboardState = dashboardTimeline[f]
  const live = dashboardState === "RUNNING"

  const projects: Project[] = [
    { name: "orders-api", runtime: "Node.js", icon: "hexagon", branch: "main", commit: "feat: add order filters", state: "RUNNING", updated: "2m ago", traffic: [8, 12, 10, 16, 14, 20, 18, 24, 22, 28] },
    {
      name: "admin-dashboard",
      runtime: "Next.js",
      icon: "triangle",
      branch: "main",
      commit: "fix: table pagination",
      state: dashboardState,
      updated: live ? "just now" : "deploying",
      traffic: live ? [4, 6, 5, 9, 8, 12, 10, 14, 13, 16] : [],
    },
    { name: "docs-site", runtime: "Static Sites", icon: "file-text", branch: "gh-pages", commit: "docs: storage guide", state: "BUILD_FAILED", updated: "1h ago", traffic: [] },
  ]

  const activity: Activity[] = [
    ...(live ? [{ id: "live", at: "14:03", text: <>admin-dashboard is <span className="text-success">RUNNING</span></> }] : []),
    ...(f >= 1 ? [{ id: "build", at: "14:02", text: <>admin-dashboard started <span className="text-brand-ink">BUILDING</span></> }] : []),
    { id: "push", at: "14:02", text: <>ada pushed to <span className="font-mono">main</span> · fix: table pagination</> },
    { id: "orders", at: "13:58", text: <>orders-api is <span className="text-success">RUNNING</span></> },
    { id: "docs", at: "12:48", text: <>docs-site <span className="text-destructive">BUILD_FAILED</span> · missing build script</> },
  ].slice(0, 4)

  return (
    <div ref={ref} className={className}>
      <ProductWindow title="your galley / overview" bodyClassName="grid md:grid-cols-[12.5rem_1fr]">
        {/* Sidebar */}
        <aside aria-hidden className="hidden flex-col border-r border-border/70 bg-background/40 md:flex">
          <div className="flex items-center gap-2.5 border-b border-border/70 px-3.5 py-3.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand text-xs font-semibold text-white">A</span>
            <span className="grid min-w-0 flex-1 leading-tight">
              <span className="truncate text-sm font-medium">Your Galley</span>
              <span className="text-[0.6875rem] text-muted-foreground">ada · personal</span>
            </span>
            <Icon name="arrow-up-down" size="xs" className="text-muted-foreground" />
          </div>
          <nav className="flex flex-col gap-0.5 p-2">
            {galleyNav.map((item, i) => (
              <span
                key={item.label}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[0.8125rem]",
                  i === 0 ? "bg-muted font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon name={item.icon} size="xs" />
                <span className="flex-1">{item.label}</span>
                {item.label === "Deployments" && !live && f > 0 && <span className="size-1.5 animate-pulse-dot rounded-full bg-brand" />}
              </span>
            ))}
          </nav>
          <div className="mt-auto grid gap-2 border-t border-border/70 p-3.5">
            <div className="flex justify-between text-[0.6875rem]">
              <span className="text-muted-foreground">Storage</span>
              <span className="font-mono">312 MB</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-foreground"
                initial={{ width: reduceMotion ? "31%" : "0%" }}
                whileInView={{ width: "31%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-3">
            <p className="font-heading text-base font-medium tracking-tight">Overview</p>
            <div className="flex items-center gap-2">
              <span className="hidden h-8 items-center gap-2 rounded-full border border-border/70 bg-background px-3 text-xs text-muted-foreground sm:flex">
                <Icon name="search" size="xs" />
                Search
                <kbd className="rounded border border-border/70 px-1 font-mono text-[0.625rem]">⌘K</kbd>
              </span>
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-xs font-medium text-background">
                <Icon name="plus" size="xs" />
                New deployment
              </span>
            </div>
          </div>

          {/* Stats */}
          <dl className="grid grid-cols-3 border-b border-border/70">
            <Stat label="Projects" value="3" />
            <Stat label="Deploys this week" value={live ? "25" : "24"} />
            <Stat label="Requests" value="1.4k/min" spark />
          </dl>

          {/* Projects */}
          <div className="grid gap-3 p-4 sm:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.name} project={project} />
            ))}
          </div>

          {/* Activity */}
          <div className="mt-auto border-t border-border/70 px-5 py-3.5">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Recent activity</p>
            <ul className="grid text-xs" aria-hidden>
              <AnimatePresence initial={false}>
                {activity.map((item) => (
                  <motion.li
                    key={item.id}
                    layout={!reduceMotion}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <span className="flex gap-3 py-1">
                      <span className="shrink-0 font-mono text-muted-foreground/60">{item.at}</span>
                      <span className="min-w-0 truncate">{item.text}</span>
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        </div>
      </ProductWindow>
    </div>
  )
}

function Stat({ label, value, spark }: { label: string; value: string; spark?: boolean }) {
  return (
    <div className="grid gap-1 border-border/70 px-5 py-3.5 not-last:border-r">
      <dt className="truncate text-[0.6875rem] text-muted-foreground">{label}</dt>
      <dd className="flex items-end justify-between gap-2">
        <span className="font-heading text-lg font-medium tracking-tight tabular-nums">{value}</span>
        {spark && <Sparkline points={[6, 9, 7, 12, 10, 15, 13, 18, 16, 21]} className="hidden h-6 w-16 sm:block" />}
      </dd>
    </div>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const live = project.state === "RUNNING"
  const failed = project.state === "BUILD_FAILED"
  const inProgress = !live && !failed
  return (
    <div className="relative flex flex-col gap-4 overflow-hidden rounded-xl border border-border/70 bg-background/50 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg border border-border/70 bg-card">
          <Icon name={project.icon} size="sm" />
        </span>
        <StateBadge state={project.state} />
      </div>
      <div className="grid gap-0.5">
        <span className="truncate text-sm font-medium">{project.name}</span>
        <span className={cn("truncate font-mono text-[0.6875rem]", live ? "text-foreground/80" : "text-muted-foreground")}>
          {live ? `${project.name}.${siteConfig.deployDomain}` : failed ? "missing build script" : `${project.runtime} · building`}
        </span>
      </div>
      <div className="h-8">
        {project.traffic.length > 0 ? (
          <Sparkline points={project.traffic} className="h-8 w-full" />
        ) : failed ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 px-2.5 py-1 text-[0.6875rem] text-destructive">
            <Icon name="circle-alert" size="xs" /> View logs
          </span>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border/70 pt-2.5 text-[0.6875rem] text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          <Icon name="git-branch" size="xs" />
          <span className="truncate">{project.commit}</span>
        </span>
        <span className="shrink-0">{project.updated}</span>
      </div>
      {inProgress && (
        <span className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-border/50">
          <span className="block h-full w-1/3 animate-scan bg-brand" />
        </span>
      )}
    </div>
  )
}

function Sparkline({ points, className }: { points: number[]; className?: string }) {
  const reduceMotion = useReducedMotion()
  const w = 100
  const h = 32
  const max = Math.max(...points)
  const d = points.map((v, i) => `${i ? "L" : "M"}${((i / (points.length - 1)) * w).toFixed(1)} ${(h - (v / max) * (h - 4)).toFixed(1)}`).join(" ")
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn("overflow-visible", className)} aria-hidden>
      <motion.path
        d={d}
        fill="none"
        stroke="var(--success)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: reduceMotion ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  )
}

/** The empty Galley (brief §3): one line of personality, then a plain action. */
export function GalleyEmptyState({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col items-center gap-4 border border-dashed border-border/70 bg-card/60 px-6 py-12 text-center", className)}>
      <span className="flex size-12 items-center justify-center rounded-lg elevation-control">
        <Icon name="rocket" size="md" className="text-brand-ink" />
      </span>
      <p className="font-heading text-2xl font-medium tracking-tight">No projects yet.</p>
      <p className="max-w-sm text-sm text-pretty text-muted-foreground">Projects you deploy will show up here, with their state and deployment URL.</p>
      {children}
    </div>
  )
}
