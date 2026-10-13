"use client"

import * as React from "react"
import { motion, useInView, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/site"
import { lifecycle } from "@/content/deploy"
import { runtimes } from "@/content/runtimes"
import { roadmap, roadmapStatusLabel, type RoadmapStatus } from "@/content/roadmap"
import { Icon } from "@/components/shared/icon"

/**
 * Small looping illustrations of each product, drawn as `glass` UI for a GradientStage.
 * Each one runs off a tick counter: pauses off-screen, shows its final frame for reduced motion.
 */
function useTicker(total: number, ms: number) {
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.4 })
  const reduceMotion = useReducedMotion()
  const [tick, setTick] = React.useState(0)

  React.useEffect(() => {
    if (reduceMotion || !inView) return
    const id = window.setInterval(() => setTick((t) => (t + 1) % total), ms)
    return () => window.clearInterval(id)
  }, [reduceMotion, inView, total, ms])

  return { ref, tick: reduceMotion ? total - 1 : tick }
}

function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("glass w-full max-w-sm overflow-hidden", className)}>{children}</div>
}

function PanelBar({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5 text-[0.6875rem] text-white/60">
      <span className="truncate font-mono">{title}</span>
      {right}
    </div>
  )
}

/** Deploy: the lifecycle advancing to RUNNING, then the URL appears. */
export function DeployIllustration({ className }: { className?: string }) {
  const steps = lifecycle.length
  const { ref, tick } = useTicker(steps + 4, 850)
  const current = Math.min(tick, steps - 1)
  const running = tick >= steps - 1

  return (
    <div ref={ref} className="flex w-full justify-center">
      <Panel className={className}>
        <PanelBar title="orders-api · main" right={<span className={running ? "text-emerald-400" : "text-orange-300"}>{running ? "Live" : "Deploying"}</span>} />
        <ol className="grid gap-1 p-3">
          {lifecycle.map((step, i) => {
            const done = i < current || running
            const active = i === current && !running
            return (
              <li key={step.state} className={cn("flex items-center justify-between rounded-lg px-3 py-2 font-mono text-xs transition-colors", active && "bg-white/10")}>
                <span className={cn(done || active ? "text-white" : "text-white/35")}>{step.state}</span>
                {done ? (
                  <Icon name="check" size="xs" className={step.state === "RUNNING" ? "text-emerald-400" : "text-white/70"} />
                ) : active ? (
                  <span className="size-1.5 animate-pulse-dot rounded-full bg-orange-400" />
                ) : null}
              </li>
            )
          })}
        </ol>
        <div className="border-t border-white/10 px-4 py-3">
          <motion.div
            animate={{ opacity: running ? 1 : 0.35 }}
            className="flex items-center gap-2 font-mono text-xs"
          >
            <span className={cn("size-1.5 rounded-full", running ? "bg-emerald-400" : "bg-white/40")} />
            <span className="truncate">orders-api.{siteConfig.deployDomain}</span>
          </motion.div>
        </div>
      </Panel>
    </div>
  )
}

/** Runtimes: a picker whose selection moves through the eight runtimes. */
export function RuntimesIllustration({ className }: { className?: string }) {
  const { ref, tick } = useTicker(runtimes.length, 1100)
  const shown = runtimes.slice(0, 5)
  const selected = tick % shown.length

  return (
    <div ref={ref} className="flex w-full justify-center">
      <Panel className={className}>
        <p className="px-4 pt-3 pb-1 text-xs text-white/55">Runtime</p>
        <ul className="grid gap-0.5 p-2 pt-1">
          {shown.map((runtime, i) => (
            <li
              key={runtime.id}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-300",
                i === selected ? "bg-white/10 text-white" : "text-white/45"
              )}
            >
              <Icon name={runtime.icon} size="sm" />
              <span className="flex-1">{runtime.name}</span>
              {i === selected && <Icon name="check" size="sm" />}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}

const codeLines = ['app.get("/orders", (c) =>', "  c.json(await db.orders())", ")"]
const codeLength = codeLines.join("\n").length

/** CodePad: code types itself, Run is pressed, output appears. */
export function CodePadIllustration({ className }: { className?: string }) {
  const total = codeLength + 22
  const { ref, tick } = useTicker(total, 70)
  const typed = Math.min(tick, codeLength)
  const running = tick > codeLength + 4
  const done = tick > codeLength + 10

  let remaining = typed
  return (
    <div ref={ref} className="flex w-full justify-center">
      <Panel className={className}>
        <PanelBar
          title="server.ts"
          right={
            <span className={cn("rounded-md px-2 py-0.5 text-[0.625rem] font-medium transition-colors", running ? "bg-white text-neutral-950" : "bg-white/10 text-white/70")}>
              Run
            </span>
          }
        />
        <pre className="min-h-24 px-4 py-3 font-mono text-xs leading-6">
          {codeLines.map((line, i) => {
            const visible = line.slice(0, Math.max(0, remaining))
            remaining -= line.length + 1
            const isCursorLine = remaining < 0 && remaining + line.length + 1 >= 0
            return (
              <div key={i} className="flex">
                <span className="w-6 shrink-0 text-white/25 select-none">{i + 1}</span>
                <code className="text-white/85">
                  {visible}
                  {isCursorLine && !done && <span className="ml-px inline-block h-3.5 w-1.5 translate-y-0.5 animate-blink bg-orange-400" />}
                </code>
              </div>
            )
          })}
        </pre>
        <div className="border-t border-white/10 px-4 py-2.5 font-mono text-[0.6875rem]">
          {done ? (
            <span className="text-emerald-400">GET /orders → 200 OK · 18ms</span>
          ) : running ? (
            <span className="text-white/60">running…</span>
          ) : (
            <span className="text-white/30">output</span>
          )}
        </div>
      </Panel>
    </div>
  )
}

const uploads = [
  { name: "product-hero.webp", size: "184 KB" },
  { name: "orders-export.csv", size: "42 KB" },
  { name: "backup.tar.gz", size: "12.4 MB" },
]

/** Storage: three uploads fill in, one after another. */
export function StorageIllustration({ className }: { className?: string }) {
  const { ref, tick } = useTicker(18, 260)

  return (
    <div ref={ref} className="flex w-full justify-center">
      <Panel className={className}>
        <PanelBar title="storage / uploads" right={<Icon name="upload" size="xs" />} />
        <ul className="grid gap-3 p-4">
          {uploads.map((file, i) => {
            const progress = Math.max(0, Math.min(1, (tick - i * 3) / 5))
            return (
              <li key={file.name} className="grid gap-1.5">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="flex min-w-0 items-center gap-2">
                    <Icon name={i === 0 ? "image" : i === 1 ? "file-text" : "file-archive"} size="xs" className="text-white/60" />
                    <span className="truncate font-mono">{file.name}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-white/50">
                    {progress >= 1 ? <Icon name="check" size="xs" className="text-emerald-400" /> : null}
                    {file.size}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-white transition-[width] duration-300 ease-out" style={{ width: `${progress * 100}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      </Panel>
    </div>
  )
}

const command = "curl -X POST /v1/otp/send"
const response = ['{ "id": "otp_8Kd2",', '  "status": "sent",', '  "expires_in": 300 }']

/** APIs: a request types itself, the response prints line by line. */
export function ApiIllustration({ className }: { className?: string }) {
  const total = command.length + response.length * 5 + 16
  const { ref, tick } = useTicker(total, 65)
  const typed = Math.min(tick, command.length)
  const linesShown = Math.max(0, Math.floor((tick - command.length - 4) / 5))

  return (
    <div ref={ref} className="flex w-full justify-center">
      <Panel className={className}>
        <PanelBar title="api.deplogram.app" right={<span className="text-emerald-400">{linesShown > 0 ? "200" : ""}</span>} />
        <div className="min-h-36 px-4 py-3 font-mono text-xs leading-6">
          <p>
            <span className="text-orange-300">$ </span>
            {command.slice(0, typed)}
            {typed < command.length && <span className="ml-px inline-block h-3.5 w-1.5 translate-y-0.5 animate-blink bg-orange-400" />}
          </p>
          {response.slice(0, linesShown).map((line) => (
            <p key={line} className="text-white/70">
              {line}
            </p>
          ))}
        </div>
      </Panel>
    </div>
  )
}

const phaseProgress: Record<RoadmapStatus, number> = { done: 1, now: 0.62, next: 0.06, later: 0 }

/** Roadmap: the four phases with their progress filling in; the current phase keeps moving. */
export function RoadmapIllustration({ className }: { className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.4, once: true })
  const reduceMotion = useReducedMotion()

  return (
    <div ref={ref} className="flex w-full justify-center">
      <Panel className={cn("max-w-xl", className)}>
        <PanelBar title="deplogram / roadmap" right={<span className="text-orange-300">building</span>} />
        <ol className="grid gap-1 p-3">
          {roadmap.map((phase, i) => {
            const progress = phaseProgress[phase.status]
            const now = phase.status === "now"
            return (
              <li key={phase.phase} className={cn("grid gap-2.5 rounded-lg px-3 py-3", now && "bg-white/[0.07]")}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-[0.5625rem]",
                        phase.status === "done" ? "border-white bg-white text-neutral-950" : now ? "border-orange-400 text-orange-300" : "border-white/20 text-white/40"
                      )}
                    >
                      {phase.status === "done" ? <Icon name="check" className="size-3" /> : i + 1}
                    </span>
                    <span className={cn("truncate", phase.status === "later" || phase.status === "next" ? "text-white/55" : "text-white")}>{phase.title}</span>
                  </span>
                  <span className={cn("shrink-0 font-mono text-[0.625rem]", now ? "text-orange-300" : "text-white/45")}>{roadmapStatusLabel[phase.status]}</span>
                </div>
                <div className="relative ml-8 h-1 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className={cn("h-full rounded-full", now ? "bg-orange-400" : "bg-white")}
                    initial={{ width: reduceMotion ? `${progress * 100}%` : "0%" }}
                    animate={{ width: inView ? `${progress * 100}%` : "0%" }}
                    transition={{ duration: 1.4, delay: 0.2 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                  />
                  {now && !reduceMotion && <span className="absolute inset-y-0 left-0 w-1/3 animate-scan bg-gradient-to-r from-transparent via-white/40 to-transparent" />}
                </div>
              </li>
            )
          })}
        </ol>
      </Panel>
    </div>
  )
}
