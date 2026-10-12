"use client"

import * as React from "react"
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"
import { DURATION, EASE_OUT } from "@/lib/motion"
import { siteConfig } from "@/lib/site"
import { deployLog, deploySteps, lifecycle } from "@/content/deploy"
import { runtimes } from "@/content/runtimes"
import { Icon } from "@/components/shared/icon"
import { ProductWindow, StateBadge } from "@/components/marketing/product-window"

const STEP_MS = 5200

/**
 * The deploy screen, step by step (source → runtime → configure → deploy → live). Auto-advances
 * while on screen until the visitor picks a step; reduced motion never auto-advances.
 */
export function DeployFlow() {
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.35 })
  const reduceMotion = useReducedMotion()
  const [active, setActive] = React.useState(0)
  const [manual, setManual] = React.useState(false)
  const autoplay = inView && !manual && !reduceMotion
  const id = React.useId()

  React.useEffect(() => {
    if (!autoplay) return
    const timer = window.setTimeout(() => setActive((i) => (i + 1) % deploySteps.length), STEP_MS)
    return () => window.clearTimeout(timer)
  }, [autoplay, active])

  function select(index: number) {
    setManual(true)
    setActive(index)
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const delta = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 0
    if (!delta) return
    event.preventDefault()
    const next = (active + delta + deploySteps.length) % deploySteps.length
    select(next)
    document.getElementById(`${id}-tab-${next}`)?.focus()
  }

  const step = deploySteps[active]

  return (
    <div ref={ref} className="grid overflow-hidden rounded-3xl elevation-surface lg:grid-cols-[minmax(0,22rem)_1fr]">
      <div role="tablist" aria-label="Deploy steps" aria-orientation="vertical" onKeyDown={onKeyDown} className="flex flex-col">
        {deploySteps.map((s, i) => {
          const selected = i === active
          return (
            <button
              key={s.id}
              id={`${id}-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(i)}
              className={cn(
                "group relative flex items-start gap-5 border-b border-border/70 px-5 py-5 text-left transition-colors outline-none last:border-b-0 focus-visible:bg-muted sm:px-6",
                selected ? "bg-muted/60" : "hover:bg-muted/30"
              )}
            >
              <span className={cn("pt-1 font-mono text-xs tracking-eyebrow", selected ? "text-brand-ink" : "text-muted-foreground")}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="grid gap-1">
                <span className={cn("font-heading text-xl font-semibold tracking-tight", !selected && "text-muted-foreground")}>{s.title}</span>
                <span className="text-sm text-muted-foreground">{selected ? s.detail : s.summary}</span>
              </span>
              {selected && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-border/70">
                  <motion.span
                    key={`${active}-${autoplay}`}
                    className="block h-full bg-brand"
                    initial={{ width: autoplay ? "0%" : "100%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: autoplay ? STEP_MS / 1000 : 0, ease: "linear" }}
                  />
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="border-t border-border/70 bg-dot-grid p-4 sm:p-8 lg:border-t-0 lg:border-l">
        <ProductWindow
          title={`galley / new deployment / ${step.id}`}
          actions={<span className="font-mono text-[0.6875rem] text-muted-foreground">{active + 1} / {deploySteps.length}</span>}
          className="h-full min-h-[26rem]"
        >
          <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${active}`} className="h-full">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
                transition={{ duration: DURATION.fast, ease: EASE_OUT }}
                className="h-full p-5 sm:p-6"
              >
                {step.id === "source" && <SourcePanel />}
                {step.id === "runtime" && <RuntimePanel />}
                {step.id === "configure" && <ConfigurePanel />}
                {step.id === "deploy" && <DeployPanel />}
                {step.id === "live" && <LivePanel />}
              </motion.div>
            </AnimatePresence>
          </div>
        </ProductWindow>
      </div>
    </div>
  )
}

function PanelTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
      <p className="font-heading text-lg font-semibold tracking-tight">{children}</p>
      {hint && <p className="font-mono text-[0.6875rem] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function SourcePanel() {
  const repos = [
    { name: "ada/orders-api", updated: "2 hours ago", selected: true },
    { name: "ada/admin-dashboard", updated: "yesterday" },
    { name: "ada/docs-site", updated: "last week" },
  ]
  return (
    <div className="grid gap-4">
      <PanelTitle hint="github · connected as @ada">Pick a repository</PanelTitle>
      <div className="flex h-10 items-center gap-2 rounded-md border border-border/70 bg-background px-3 text-sm text-muted-foreground">
        <Icon name="search" size="xs" />
        Search repositories
      </div>
      <ul className="grid gap-px border border-border/70 bg-border/70">
        {repos.map((repo) => (
          <li key={repo.name} className={cn("flex items-center justify-between gap-4 px-4 py-3 text-sm", repo.selected ? "bg-foreground text-background" : "bg-card")}>
            <span className="flex items-center gap-2 font-mono text-xs">
              <Icon name="git-branch" size="xs" />
              {repo.name}
            </span>
            <span className={cn("text-xs", repo.selected ? "text-background/60" : "text-muted-foreground")}>{repo.updated}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between rounded-md border border-border/70 bg-card px-4 py-3 text-sm">
        <span className="font-mono text-xs tracking-eyebrow text-muted-foreground uppercase">Branch</span>
        <span className="flex items-center gap-2 font-mono text-xs">
          main <Icon name="chevron-down" size="xs" />
        </span>
      </div>
    </div>
  )
}

function RuntimePanel() {
  return (
    <div>
      <PanelTitle hint="8 runtimes">Your stack, your choice.</PanelTitle>
      <ul className="grid grid-cols-2 gap-px border border-border/70 bg-border/70 sm:grid-cols-4">
        {runtimes.map((runtime) => {
          const selected = runtime.id === "node"
          return (
            <li key={runtime.id} className={cn("relative flex flex-col gap-4 p-4", selected ? "bg-card ring-2 ring-brand ring-inset" : "bg-card/70")}>
              <Icon name={runtime.icon} size="md" className={selected ? "text-brand-ink" : "text-muted-foreground"} />
              <span className="text-sm font-medium">{runtime.name}</span>
              {selected && <Icon name="check" size="xs" className="absolute top-3 right-3 text-brand-ink" />}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ConfigurePanel() {
  const fields = [
    { label: "Project name", value: "orders-api" },
    { label: "Runtime version", value: "Node.js · LTS" },
    { label: "Build command", value: "npm run build" },
    { label: "Start command", value: "node server.js" },
    { label: "Port", value: "8080" },
  ]
  return (
    <div className="grid gap-4">
      <PanelTitle hint="only what you need">Configure</PanelTitle>
      <dl className="grid gap-px border border-border/70 bg-border/70 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.label} className="grid gap-1.5 bg-card px-4 py-3 last:sm:col-span-2">
            <dt className="font-mono text-xs tracking-eyebrow text-muted-foreground uppercase">{field.label}</dt>
            <dd className="font-mono text-sm">{field.value}</dd>
          </div>
        ))}
      </dl>
      <div className="border border-border/70 bg-card">
        <p className="border-b border-border/70 px-4 py-2.5 font-mono text-xs tracking-eyebrow text-muted-foreground uppercase">Environment variables</p>
        {[
          ["DATABASE_URL", "postgres://••••••••"],
          ["SESSION_SECRET", "••••••••••••"],
        ].map(([key, value]) => (
          <p key={key} className="flex justify-between gap-4 border-b border-border/70 px-4 py-2.5 font-mono text-xs last:border-b-0">
            <span>{key}</span>
            <span className="truncate text-muted-foreground">{value}</span>
          </p>
        ))}
      </div>
    </div>
  )
}

function DeployPanel() {
  return (
    <div className="grid gap-5 sm:grid-cols-[13rem_1fr]">
      <div>
        <PanelTitle>Deploying</PanelTitle>
        <ol className="grid gap-px border border-border/70 bg-border/70">
          {lifecycle.map((step) => (
            <li key={step.state} className="flex items-center justify-between gap-3 bg-card px-3 py-2.5">
              <StateBadge state={step.state} />
              <Icon name="check" size="xs" className={step.state === "RUNNING" ? "text-success" : "text-muted-foreground"} />
            </li>
          ))}
        </ol>
      </div>
      <div className="min-w-0 border border-border/70 bg-background p-4 font-mono text-[0.6875rem] leading-relaxed">
        {deployLog.map((line) => (
          <p key={line.at + line.text} className="flex gap-3">
            <span className="text-muted-foreground/60">{line.at}</span>
            <span
              className={cn(
                "truncate",
                line.tone === "muted" && "text-muted-foreground",
                line.tone === "brand" && "text-brand-ink",
                line.tone === "success" && "text-success"
              )}
            >
              {line.text}
            </span>
          </p>
        ))}
      </div>
    </div>
  )
}

function LivePanel() {
  return (
    <div className="grid h-full content-between gap-6">
      <div className="grid gap-4">
        <StateBadge state="RUNNING" className="w-fit" />
        <p className="font-heading text-3xl font-semibold tracking-tight">Your project is live.</p>
        <span className="inline-flex w-fit items-center gap-2 rounded-md border border-border/70 bg-background px-3 py-2 font-mono text-sm">
          <span className="size-1.5 rounded-full bg-success" />
          https://orders-api.{siteConfig.deployDomain}
          <Icon name="arrow-up-right" size="xs" className="text-muted-foreground" />
        </span>
      </div>
      <div className="grid gap-px border border-border/70 bg-border/70 sm:grid-cols-4">
        {(["Visit", "Logs", "Redeploy", "Settings"] as const).map((action, i) => (
          <span
            key={action}
            className={cn(
              "px-4 py-3 text-center text-[0.75rem] font-medium",
              i === 0 ? "bg-foreground text-background" : "bg-card"
            )}
          >
            {action}
          </span>
        ))}
      </div>
    </div>
  )
}
