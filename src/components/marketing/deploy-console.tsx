"use client"

import * as React from "react"
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"
import { entrance } from "@/lib/motion"
import { siteConfig } from "@/lib/site"
import { deployLog, lifecycle, type LifecycleState } from "@/content/deploy"
import { Icon } from "@/components/shared/icon"
import { ProductWindow, StateBadge } from "@/components/marketing/product-window"

const LINE_MS = 650
const HOLD_MS = 4200
const states = lifecycle.map((l) => l.state)

/** Which lifecycle state a log line moves the deployment into. */
function stateAt(lineCount: number): LifecycleState {
  let current: LifecycleState = "QUEUED"
  for (const line of deployLog.slice(0, lineCount)) {
    const match = states.find((s) => line.text.startsWith(s))
    if (match) current = match
  }
  return current
}

/**
 * The hero's live deployment: log lines print, the lifecycle advances QUEUED → RUNNING, the URL
 * appears. Loops while on screen; reduced motion shows the finished deployment.
 */
export function DeployConsole({ className }: { className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.25 })
  const reduceMotion = useReducedMotion()
  const [count, setCount] = React.useState(0)

  const shown = reduceMotion ? deployLog.length : count
  const done = shown >= deployLog.length
  const state = stateAt(shown)
  const stateIndex = states.indexOf(state)

  React.useEffect(() => {
    if (reduceMotion || !inView) return
    const id = window.setTimeout(() => setCount((c) => (c >= deployLog.length ? 0 : c + 1)), done ? HOLD_MS : LINE_MS)
    return () => window.clearTimeout(id)
  }, [reduceMotion, inView, count, done])

  const url = `orders-api.${siteConfig.deployDomain}`

  return (
    <div ref={ref} className={className}>
      <ProductWindow
        title="galley / orders-api / deployments / #42"
        actions={<StateBadge state={state} />}
        bodyClassName="grid lg:grid-cols-[1fr_18rem]"
      >
        <div className="flex min-w-0 flex-col border-border/70 lg:border-r">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border/70 px-5 py-4 text-xs">
            <span className="font-heading text-base font-semibold tracking-tight">orders-api</span>
            <Meta icon="hexagon" label="Node.js" />
            <Meta icon="git-branch" label="main · 8c41e0a" />
            <Meta icon="clock" label={done ? "36s" : "building…"} />
          </div>

          <ol aria-label="Deployment lifecycle" className="grid grid-cols-5 border-b border-border/70">
            {lifecycle.map((step, i) => {
              const complete = i < stateIndex || (i === stateIndex && state === "RUNNING")
              const current = i === stateIndex && state !== "RUNNING"
              return (
                <li
                  key={step.state}
                  aria-current={current ? "step" : undefined}
                  className="relative border-border/70 px-2 py-3 not-last:border-r sm:px-3"
                >
                  <span
                    className={cn(
                      "block truncate font-mono text-[0.5625rem] tracking-wider sm:text-[0.625rem]",
                      complete ? "text-foreground" : current ? "text-brand-ink" : "text-muted-foreground/60"
                    )}
                  >
                    {step.state}
                  </span>
                  <span className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-transparent">
                    {(complete || current) && (
                      <motion.span
                        layout
                        className={cn("block h-full", state === "RUNNING" ? "bg-success" : "bg-brand")}
                        initial={{ width: reduceMotion ? "100%" : "0%" }}
                        animate={{ width: complete ? "100%" : "55%" }}
                        transition={entrance}
                      />
                    )}
                  </span>
                </li>
              )
            })}
          </ol>

          <div
            className="h-64 overflow-hidden bg-background/50 px-5 py-4 font-mono text-[0.6875rem] leading-relaxed sm:text-xs"
            aria-live="off"
          >
            <p className="sr-only">{deployLog.map((l) => l.text).join(". ")}</p>
            <ul aria-hidden className="space-y-1">
              {deployLog.map((line, i) => (
                <li
                  key={line.at + line.text}
                  className={cn("flex gap-4 transition-opacity duration-300", i < shown ? "opacity-100" : "opacity-0")}
                >
                  <span className="shrink-0 text-muted-foreground/60">{line.at}</span>
                  <span
                    className={cn(
                      "min-w-0 truncate",
                      line.tone === "muted" && "text-muted-foreground",
                      line.tone === "brand" && "text-brand-ink",
                      line.tone === "success" && "text-success"
                    )}
                  >
                    {line.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-6 border-t border-border/70 p-5 lg:border-t-0">
          <div className="grid gap-2">
            <span className="font-mono text-xs tracking-eyebrow text-muted-foreground uppercase">Deployment URL</span>
            <AnimatePresence mode="wait" initial={false}>
              {done ? (
                <motion.div key="live" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid gap-3">
                  <p className="font-heading text-lg leading-tight font-semibold tracking-tight">Your project is live.</p>
                  <span className="inline-flex w-fit items-center gap-2 rounded-md border border-border/70 bg-background px-2.5 py-1.5 font-mono text-xs">
                    <span className="size-1.5 rounded-full bg-success" />
                    {url}
                  </span>
                </motion.div>
              ) : (
                <motion.p key="pending" exit={{ opacity: 0 }} className="font-mono text-xs text-muted-foreground">
                  Waiting for RUNNING…
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <div className="grid grid-cols-2 gap-px border border-border/70 bg-border/70 text-[0.6875rem] font-medium">
            {(["Visit", "Logs", "Redeploy", "Settings"] as const).map((action) => (
              <span
                key={action}
                className={cn(
                  "bg-card px-3 py-2.5 text-center transition-colors",
                  done ? "text-foreground" : "text-muted-foreground/50"
                )}
              >
                {action}
              </span>
            ))}
          </div>
        </div>
      </ProductWindow>
    </div>
  )
}

function Meta({ icon, label }: { icon: "hexagon" | "git-branch" | "clock"; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-muted-foreground">
      <Icon name={icon} size="xs" />
      {label}
    </span>
  )
}
