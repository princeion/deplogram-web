"use client"

import * as React from "react"
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/site"
import { deployLog, lifecycle, type LifecycleState } from "@/content/deploy"
import { Icon, type IconName } from "@/components/shared/icon"
import { ProductWindow, StateBadge } from "@/components/marketing/product-window"

const LINE_MS = 700
const HOLD_MS = 5200
const states = lifecycle.map((l) => l.state)
const url = `orders-api.${siteConfig.deployDomain}`

const toSeconds = (at: string) => {
  const [m, s] = at.split(":").map(Number)
  return m * 60 + s
}

/** When each lifecycle state starts, read from the log ("BUILDING · …" lines). */
const stateStart = Object.fromEntries(
  states.map((s) => [s, toSeconds(deployLog.find((l) => l.text.startsWith(s))?.at ?? "00:00")])
) as Record<LifecycleState, number>

/** Which lifecycle state a log line moves the deployment into. */
export function stateAt(lineCount: number): LifecycleState {
  let current: LifecycleState = "QUEUED"
  for (const line of deployLog.slice(0, lineCount)) {
    const match = states.find((s) => line.text.startsWith(s))
    if (match) current = match
  }
  return current
}

const sidebar: { icon: IconName; label: string; active?: boolean }[] = [
  { icon: "layout", label: "Overview" },
  { icon: "rocket", label: "Deployments", active: true },
  { icon: "scroll-text", label: "Logs" },
  { icon: "activity", label: "Metrics" },
  { icon: "variable", label: "Environment" },
  { icon: "settings", label: "Settings" },
]

/**
 * The live deployment screen: logs stream in, the stepper advances QUEUED → RUNNING, then the URL
 * and health come up. Loops while on screen; reduced motion shows the finished deployment.
 */
export function DeployConsole({ className }: { className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.25 })
  const reduceMotion = useReducedMotion()
  const [count, setCount] = React.useState(1)

  const shown = reduceMotion ? deployLog.length : count
  const done = shown >= deployLog.length
  const state = stateAt(shown)
  const stateIndex = states.indexOf(state)
  const elapsed = toSeconds(deployLog[Math.max(0, shown - 1)].at)

  React.useEffect(() => {
    if (reduceMotion || !inView) return
    const id = window.setTimeout(() => setCount((c) => (c >= deployLog.length ? 1 : c + 1)), done ? HOLD_MS : LINE_MS)
    return () => window.clearTimeout(id)
  }, [reduceMotion, inView, count, done])

  return (
    <div ref={ref} className={className}>
      <ProductWindow
        title="galley / orders-api / deployments / #42"
        actions={<StateBadge state={state} />}
        bodyClassName="grid md:grid-cols-[1fr_15rem] lg:grid-cols-[10.5rem_1fr_16rem]"
      >
        {/* Project sidebar */}
        <nav aria-hidden className="hidden flex-col gap-0.5 border-r border-border/70 bg-background/40 p-2.5 lg:flex">
          <div className="mb-3 flex items-center gap-2 px-2 pt-1.5">
            <span className="flex size-6 items-center justify-center rounded-md bg-foreground text-background">
              <Icon name="hexagon" size="xs" />
            </span>
            <span className="truncate text-xs font-medium">orders-api</span>
          </div>
          {sidebar.map((item) => (
            <span
              key={item.label}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs",
                item.active ? "bg-muted text-foreground" : "text-muted-foreground"
              )}
            >
              <Icon name={item.icon} size="xs" />
              {item.label}
            </span>
          ))}
        </nav>

        {/* Main column */}
        <div className="flex min-w-0 flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4">
            <div className="min-w-0">
              <p className="truncate font-heading text-base font-medium tracking-tight">feat: add order filters</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.6875rem] text-muted-foreground">
                <Meta icon="git-branch" label="main · 8c41e0a" />
                <Meta icon="hexagon" label="Node.js 22" />
                <Meta icon="clock" label={`${elapsed}s`} live={!done} />
              </div>
            </div>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[0.6875rem] font-medium transition-colors duration-500",
                done ? "bg-foreground text-background" : "bg-muted text-muted-foreground/60"
              )}
            >
              Visit
              <Icon name="arrow-up-right" size="xs" />
            </span>
          </header>

          <Stepper stateIndex={stateIndex} running={state === "RUNNING"} reduceMotion={!!reduceMotion} />

          {/* Log viewer */}
          <div className="flex items-center justify-between border-y border-border/70 px-5 text-[0.6875rem]">
            <div className="flex gap-4">
              <span className="relative py-2.5 font-medium text-foreground">
                Build logs
                <span className="absolute inset-x-0 -bottom-px h-px bg-foreground" />
              </span>
              <span className="py-2.5 text-muted-foreground">Runtime logs</span>
            </div>
            <span className="flex items-center gap-3 font-mono text-muted-foreground">
              {shown} lines
              <Icon name="search" size="xs" />
            </span>
          </div>
          <div className="h-60 overflow-hidden bg-background/60 py-3 font-mono text-[0.6875rem] leading-[1.6rem] sm:text-xs" aria-live="off">
            <p className="sr-only">{deployLog.map((l) => l.text).join(". ")}</p>
            <ol aria-hidden>
              <AnimatePresence initial={false}>
                {deployLog.slice(0, shown).map((line, i) => (
                  <motion.li
                    key={line.at + line.text}
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className={cn("flex gap-4 px-5", line.tone === "success" && "bg-success/10")}
                  >
                    <span className="w-4 shrink-0 text-right text-muted-foreground/40 select-none">{i + 1}</span>
                    <span className="shrink-0 text-muted-foreground/60">{line.at}</span>
                    <LogText text={line.text} tone={line.tone} />
                  </motion.li>
                ))}
              </AnimatePresence>
              {!done && (
                <li className="flex gap-4 px-5">
                  <span className="w-4 shrink-0" />
                  <span className="mt-1.5 inline-block h-3.5 w-1.5 animate-blink bg-brand" />
                </li>
              )}
            </ol>
          </div>

          {/* Status bar */}
          <div className="flex h-10 items-center border-t border-border/70 px-5 font-mono text-[0.6875rem]">
            <AnimatePresence mode="wait" initial={false}>
              {done ? (
                <motion.span key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-success">
                  <Icon name="heart-pulse" size="xs" />
                  Health check passing · 200 OK · p50 14ms
                </motion.span>
              ) : (
                <motion.span key="build" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-muted-foreground">
                  <Icon name="loader" size="xs" className="animate-spin" />
                  {state === "QUEUED" ? "Waiting for a builder…" : `${state.toLowerCase()} on builder-03 · 2 vCPU`}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Details panel */}
        <aside className="hidden flex-col border-l border-border/70 md:flex">
          <dl className="grid gap-3.5 border-b border-border/70 p-5 text-[0.6875rem]">
            <Detail label="Status">
              <StateBadge state={state} />
            </Detail>
            <Detail label="Environment">Production</Detail>
            <Detail label="Duration">{done ? `${elapsed}s` : "—"}</Detail>
            <Detail label="Instance">512 MB · 0.5 vCPU</Detail>
            <Detail label="Created">just now by ada</Detail>
          </dl>

          <div className="grid gap-2 border-b border-border/70 p-5">
            <span className="text-[0.6875rem] text-muted-foreground">Deployment URL</span>
            <AnimatePresence mode="wait" initial={false}>
              {done ? (
                <motion.span
                  key="url"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 rounded-md border border-border/70 bg-background px-2.5 py-2 font-mono text-[0.6875rem]"
                >
                  <span className="relative flex size-1.5">
                    <span className="absolute inset-0 animate-ping rounded-full bg-success/60 motion-reduce:animate-none" />
                    <span className="relative size-1.5 rounded-full bg-success" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{url}</span>
                  <Icon name="arrow-up-right" size="xs" className="text-muted-foreground" />
                </motion.span>
              ) : (
                <motion.span key="wait" exit={{ opacity: 0 }} className="block h-[2.125rem] animate-pulse rounded-md bg-muted" />
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-1 flex-col gap-3 p-5">
            <div className="flex items-baseline justify-between text-[0.6875rem]">
              <span className="text-muted-foreground">Requests</span>
              <span className="font-mono">{done ? "1.2k/min" : "—"}</span>
            </div>
            <RequestsChart active={done} reduceMotion={!!reduceMotion} />
            <div className="flex justify-between font-mono text-[0.625rem] text-muted-foreground/60">
              <span>CPU {done ? "12%" : "—"}</span>
              <span>MEM {done ? "148 MB" : "—"}</span>
            </div>
          </div>
        </aside>
      </ProductWindow>
    </div>
  )
}

export function Stepper({ stateIndex, running, reduceMotion }: { stateIndex: number; running: boolean; reduceMotion: boolean }) {
  return (
    <ol aria-label="Deployment lifecycle" className="flex px-5 py-4">
      {lifecycle.map((step, i) => {
        const complete = i < stateIndex || (i === stateIndex && running)
        const current = i === stateIndex && !running
        const last = i === lifecycle.length - 1
        const duration = last ? "live" : `${stateStart[states[i + 1]] - stateStart[step.state]}s`
        return (
          <li key={step.state} aria-current={current ? "step" : undefined} className={cn("flex min-w-0 flex-col gap-2", !last && "flex-1")}>
            <div className="flex items-center">
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
                  complete && (step.state === "RUNNING" ? "border-success bg-success text-background" : "border-foreground bg-foreground text-background"),
                  current && "border-brand text-brand-ink",
                  !complete && !current && "border-border bg-background"
                )}
              >
                {complete ? <Icon name="check" size="xs" /> : current ? <Icon name="loader" size="xs" className="animate-spin" /> : null}
              </span>
              {!last && (
                <span className="mx-2 h-px flex-1 overflow-hidden bg-border">
                  <motion.span
                    className="block h-full origin-left bg-foreground"
                    initial={false}
                    animate={{ scaleX: complete ? 1 : current ? 0.45 : 0 }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  />
                </span>
              )}
            </div>
            <div className="flex flex-col gap-0.5 font-mono text-[0.5625rem] tracking-wider sm:text-[0.625rem]">
              <span className={cn(complete ? "text-foreground" : current ? "text-brand-ink" : "text-muted-foreground/50")}>{step.state}</span>
              <span className={cn("hidden text-muted-foreground transition-opacity sm:block", complete ? "opacity-100" : "opacity-0")}>{duration}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

const stateTone: Partial<Record<LifecycleState, string>> = {
  QUEUED: "text-muted-foreground",
  BUILDING: "text-brand-ink",
  BUILT: "text-foreground",
  DEPLOYING: "text-brand-ink",
  RUNNING: "text-success",
}

/** Log line: a leading lifecycle state is rendered as a coloured token. */
export function LogText({ text, tone }: { text: string; tone?: "muted" | "brand" | "success" }) {
  const match = states.find((s) => text.startsWith(s))
  const rest = match ? text.slice(match.length) : text
  return (
    <span className={cn("min-w-0 truncate", tone === "muted" && !match && "text-muted-foreground", tone === "success" && "text-success")}>
      {match && <span className={cn("font-medium", stateTone[match])}>{match}</span>}
      {rest}
    </span>
  )
}

const chartPoints = [14, 18, 12, 22, 19, 28, 24, 34, 30, 38, 33, 42, 37, 46]

function RequestsChart({ active, reduceMotion }: { active: boolean; reduceMotion: boolean }) {
  const w = 200
  const h = 56
  const max = Math.max(...chartPoints)
  const pts = chartPoints.map((v, i) => [(i / (chartPoints.length - 1)) * w, h - (v / max) * (h - 6)] as const)
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full overflow-visible" aria-hidden>
      <defs>
        <linearGradient id="deploy-chart-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--success)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--success)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" x2={w} y1={h} y2={h} className="stroke-border" strokeWidth="1" />
      <motion.path
        d={`${line} L${w} ${h} L0 ${h} Z`}
        fill="url(#deploy-chart-fill)"
        initial={false}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : 0.6 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke="var(--success)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{ pathLength: active ? 1 : 0, opacity: active ? 1 : 0 }}
        transition={{ duration: reduceMotion ? 0 : 1.4, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  )
}

function Meta({ icon, label, live }: { icon: IconName; label: string; live?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon name={icon} size="xs" className={cn(live && "animate-pulse")} />
      <span className="tabular-nums">{label}</span>
    </span>
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate text-right font-medium">{children}</dd>
    </div>
  )
}
