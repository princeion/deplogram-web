"use client"

import * as React from "react"
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"
import { DURATION, EASE_OUT } from "@/lib/motion"
import { siteConfig } from "@/lib/site"
import { deployLog, deploySteps, lifecycle } from "@/content/deploy"
import { runtimes } from "@/content/runtimes"
import { Icon } from "@/components/shared/icon"
import { GradientStage } from "@/components/marketing/gradient-stage"
import { ProductWindow } from "@/components/marketing/product-window"
import { LogText, Stepper, stateAt } from "@/components/marketing/deploy-console"

const STEP_MS = 5600
const states = lifecycle.map((l) => l.state)

/** Primary action shown in the wizard footer for each step. */
const nextAction: Record<string, string> = {
  source: "Import",
  runtime: "Continue",
  configure: "Deploy",
  deploy: "Deploying…",
  live: "Visit",
}

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
                "group relative flex flex-1 items-start gap-5 border-b border-border/70 px-5 py-5 text-left transition-colors outline-none last:border-b-0 focus-visible:bg-muted sm:px-6",
                selected ? "bg-muted/60" : "hover:bg-muted/30"
              )}
            >
              <span className={cn("pt-1 font-mono text-xs tracking-eyebrow", selected ? "text-brand-ink" : "text-muted-foreground")}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="grid gap-1">
                <span className={cn("font-heading text-xl font-medium tracking-tight", !selected && "text-muted-foreground")}>{s.title}</span>
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

      <GradientStage variant="a" source="flow" className="rounded-none p-3 sm:p-8 lg:p-10">
        <ProductWindow
          title={`galley / new deployment / ${step.id}`}
          actions={<WizardDots active={active} />}
          className="h-full min-h-120"
          bodyClassName="flex flex-col"
        >
          <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${active}`} className="relative flex-1">
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

          <div className="flex items-center justify-between border-t border-border/70 px-5 py-3 sm:px-6">
            <span className={cn("rounded-full px-3 py-1.5 text-xs text-muted-foreground", active === 0 && "opacity-40")}>Back</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={step.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DURATION.fast, ease: EASE_OUT }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium",
                  step.id === "deploy" ? "bg-muted text-muted-foreground" : "bg-foreground text-background"
                )}
              >
                {step.id === "deploy" && <Icon name="loader" size="xs" className="animate-spin" />}
                {nextAction[step.id]}
                {step.id === "live" ? <Icon name="arrow-up-right" size="xs" /> : step.id !== "deploy" && <Icon name="arrow-right" size="xs" />}
              </motion.span>
            </AnimatePresence>
          </div>
        </ProductWindow>
      </GradientStage>
    </div>
  )
}

function WizardDots({ active }: { active: number }) {
  return (
    <span className="flex items-center gap-1" aria-hidden>
      {deploySteps.map((s, i) => (
        <span
          key={s.id}
          className={cn("h-1.5 rounded-full transition-all duration-500", i === active ? "w-4 bg-foreground" : i < active ? "w-1.5 bg-foreground/50" : "w-1.5 bg-border")}
        />
      ))}
    </span>
  )
}

/** Counts 0 → total while mounted; reduced motion jumps straight to the end. */
function useTick(total: number, ms: number, delay = 0) {
  const reduceMotion = useReducedMotion()
  const [tick, setTick] = React.useState(0)
  React.useEffect(() => {
    if (reduceMotion) return
    let interval: number | undefined
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => setTick((t) => (t >= total ? t : t + 1)), ms)
    }, delay)
    return () => {
      window.clearTimeout(start)
      window.clearInterval(interval)
    }
  }, [reduceMotion, total, ms, delay])
  return reduceMotion ? total : tick
}

function PanelTitle({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
      <p className="font-heading text-lg font-medium tracking-tight">{children}</p>
      {hint && <div className="font-mono text-[0.6875rem] text-muted-foreground">{hint}</div>}
    </div>
  )
}

function SourcePanel() {
  const repos = [
    { name: "orders-api", lang: "TypeScript", updated: "2h ago" },
    { name: "admin-dashboard", lang: "TypeScript", updated: "yesterday" },
    { name: "docs-site", lang: "MDX", updated: "last week" },
    { name: "image-worker", lang: "Go", updated: "2 weeks ago" },
  ]
  const tick = useTick(3, 450, 300)
  const selected = tick >= 3 ? 0 : -1
  const query = "ord".slice(0, tick)

  return (
    <div className="grid gap-4">
      <PanelTitle
        hint={
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success" /> GitHub · @ada
          </span>
        }
      >
        Import a repository
      </PanelTitle>
      <div className="flex gap-1 rounded-full bg-muted p-1 text-xs">
        {["GitHub", "GitLab", "Upload"].map((p, i) => (
          <span key={p} className={cn("flex-1 rounded-full py-1.5 text-center", i === 0 ? "bg-background font-medium text-foreground" : "text-muted-foreground")}>
            {p}
          </span>
        ))}
      </div>
      <div className="flex h-10 items-center gap-2 rounded-lg border border-border/70 bg-background px-3 text-sm">
        <Icon name="search" size="xs" className="text-muted-foreground" />
        {query ? <span>{query}</span> : <span className="text-muted-foreground">Search repositories</span>}
        {tick < 3 && <span className="h-4 w-px animate-blink bg-foreground" />}
      </div>
      <ul className="grid gap-1">
        {repos.map((repo, i) => {
          const matches = !query || repo.name.startsWith(query)
          return (
            <motion.li
              key={repo.name}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: matches ? 1 : 0.3, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="relative flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-sm"
            >
              {selected === i && <motion.span layoutId="repo-selection" className="absolute inset-0 rounded-lg bg-muted ring-1 ring-border" />}
              <span className="relative flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-md border border-border/70 bg-background">
                  <Icon name="git-branch" size="xs" />
                </span>
                <span className="grid">
                  <span className="font-medium">ada/{repo.name}</span>
                  <span className="text-[0.6875rem] text-muted-foreground">
                    {repo.lang} · {repo.updated}
                  </span>
                </span>
              </span>
              <span
                className={cn(
                  "relative rounded-full px-2.5 py-1 text-[0.6875rem] font-medium transition-colors",
                  selected === i ? "bg-foreground text-background" : "border border-border/70 text-muted-foreground"
                )}
              >
                {selected === i ? "Selected" : "Import"}
              </span>
            </motion.li>
          )
        })}
      </ul>
    </div>
  )
}

function RuntimePanel() {
  const node = runtimes.findIndex((r) => r.id === "node")
  const scan = [0, 1, 3, 5, node]
  const tick = useTick(scan.length - 1, 380, 200)
  const detected = tick >= scan.length - 1
  const selected = scan[tick]

  return (
    <div>
      <PanelTitle
        hint={
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={String(detected)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
              {detected ? (
                <>
                  <Icon name="sparkles" size="xs" className="text-brand-ink" /> Detected from package.json
                </>
              ) : (
                <>
                  <Icon name="loader" size="xs" className="animate-spin" /> Detecting…
                </>
              )}
            </motion.span>
          </AnimatePresence>
        }
      >
        Choose a runtime
      </PanelTitle>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {runtimes.map((runtime, i) => {
          const isSelected = i === selected
          return (
            <li key={runtime.id} className="relative flex flex-col gap-5 rounded-xl border border-border/70 bg-background/50 p-4">
              {isSelected && (
                <motion.span
                  layoutId="runtime-selection"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className={cn("absolute -inset-px rounded-xl ring-2", detected ? "bg-brand/5 ring-brand" : "ring-foreground/30")}
                />
              )}
              <Icon name={runtime.icon} size="md" className={cn("relative transition-colors", isSelected && detected ? "text-brand-ink" : "text-muted-foreground")} />
              <span className="relative text-sm font-medium">{runtime.name}</span>
              {isSelected && detected && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3 flex size-4 items-center justify-center rounded-full bg-brand text-white">
                  <Icon name="check" size="xs" className="size-2.5" />
                </motion.span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const configFields = [
  { label: "Project name", value: "orders-api" },
  { label: "Build command", value: "npm run build" },
  { label: "Start command", value: "node server.js" },
  { label: "Port", value: "8080" },
]
const configLength = configFields.reduce((n, f) => n + f.value.length, 0)

function ConfigurePanel() {
  const tick = useTick(configLength + 6, 45, 250)
  let remaining = tick

  return (
    <div className="grid gap-4">
      <PanelTitle hint="Node.js · LTS">Configure project</PanelTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        {configFields.map((field) => {
          const typed = field.value.slice(0, Math.max(0, remaining))
          const focused = remaining > 0 && remaining <= field.value.length && tick < configLength
          remaining -= field.value.length
          return (
            <label key={field.label} className="grid gap-1.5">
              <span className="text-xs text-muted-foreground">{field.label}</span>
              <span
                className={cn(
                  "flex h-9 items-center rounded-lg border bg-background px-3 font-mono text-xs transition-shadow",
                  focused ? "border-brand/60 ring-3 ring-brand/15" : "border-border/70"
                )}
              >
                {typed}
                {focused && <span className="ml-px h-3.5 w-px animate-blink bg-foreground" />}
              </span>
            </label>
          )
        })}
      </div>
      <div className="overflow-hidden rounded-lg border border-border/70">
        <div className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-3 py-2 text-xs">
          <span className="font-medium">Environment variables</span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Icon name="plus" size="xs" /> Add
          </span>
        </div>
        {[
          ["DATABASE_URL", "postgres://••••••••"],
          ["SESSION_SECRET", "••••••••••••"],
        ].map(([key, value], i) => (
          <motion.p
            key={key}
            initial={{ opacity: 0 }}
            animate={{ opacity: tick > configLength + 2 * i ? 1 : 0.25 }}
            className="grid grid-cols-2 gap-4 border-b border-border/70 px-3 py-2 font-mono text-[0.6875rem] last:border-b-0"
          >
            <span>{key}</span>
            <span className="flex items-center justify-between gap-2 truncate text-muted-foreground">
              {value}
              <Icon name="eye" size="xs" />
            </span>
          </motion.p>
        ))}
      </div>
    </div>
  )
}

function DeployPanel() {
  const reduceMotion = useReducedMotion()
  const shown = Math.max(1, useTick(deployLog.length, 480, 150))
  const state = stateAt(shown)

  return (
    <div className="flex h-full flex-col gap-4">
      <PanelTitle hint={`${deployLog[shown - 1].at}`}>Deploying orders-api</PanelTitle>
      <div className="-mx-5 -mt-2 sm:-mx-6 [&>ol]:px-5 sm:[&>ol]:px-6">
        <Stepper stateIndex={states.indexOf(state)} running={state === "RUNNING"} reduceMotion={!!reduceMotion} />
      </div>
      <ol className="min-h-56 flex-1 overflow-hidden rounded-lg border border-border/70 bg-background py-2.5 font-mono text-[0.6875rem] leading-6" aria-label="Build log">
        {deployLog.slice(0, shown).map((line) => (
          <motion.li
            key={line.at + line.text}
            initial={reduceMotion ? false : { opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className={cn("flex gap-3 px-3", line.tone === "success" && "bg-success/10")}
          >
            <span className="shrink-0 text-muted-foreground/60">{line.at}</span>
            <LogText text={line.text} tone={line.tone} />
          </motion.li>
        ))}
      </ol>
    </div>
  )
}

function LivePanel() {
  const url = `orders-api.${siteConfig.deployDomain}`
  return (
    <div className="grid h-full gap-5 sm:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col gap-4">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 20 }}
          className="flex size-10 items-center justify-center rounded-full bg-success/15 text-success"
        >
          <Icon name="check" size="md" />
        </motion.span>
        <div className="grid gap-1.5">
          <p className="font-heading text-2xl font-medium tracking-tight">Your project is live.</p>
          <p className="text-sm text-muted-foreground">Deployed in 36s from main · 8c41e0a</p>
        </div>
        <span className="flex w-full items-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-2.5 font-mono text-xs">
          <span className="relative flex size-1.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-success/60 motion-reduce:animate-none" />
            <span className="relative size-1.5 rounded-full bg-success" />
          </span>
          <span className="min-w-0 flex-1 truncate">{url}</span>
          <Icon name="arrow-up-right" size="xs" className="text-muted-foreground" />
        </span>
        <div className="mt-auto grid grid-cols-3 gap-2 text-center text-[0.6875rem] font-medium">
          {["Logs", "Redeploy", "Settings"].map((a) => (
            <span key={a} className="rounded-full border border-border/70 py-1.5">
              {a}
            </span>
          ))}
        </div>
      </div>

      {/* Preview of the running app */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease: EASE_OUT }}
        className="flex min-h-48 flex-col overflow-hidden rounded-lg border border-border/70 bg-background"
      >
        <div className="flex items-center gap-2 border-b border-border/70 px-3 py-2">
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-1.5 rounded-full bg-muted-foreground/30" />
            ))}
          </span>
          <span className="flex-1 truncate rounded-md bg-muted px-2 py-0.5 text-center font-mono text-[0.625rem] text-muted-foreground">https://{url}/orders</span>
        </div>
        <pre className="flex-1 p-3 font-mono text-[0.6875rem] leading-5 text-muted-foreground">
          {[
            "[",
            '  { "id": 1042, "status": "paid",',
            '    "total": 84.00 },',
            '  { "id": 1043, "status": "pending",',
            '    "total": 19.50 }',
            "]",
          ].map((l, i) => (
            <motion.span key={i} className="block" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 + i * 0.08 }}>
              {l}
            </motion.span>
          ))}
        </pre>
        <div className="flex justify-between border-t border-border/70 px-3 py-1.5 font-mono text-[0.625rem] text-muted-foreground">
          <span className="text-success">200 OK</span>
          <span>14 ms</span>
        </div>
      </motion.div>
    </div>
  )
}
