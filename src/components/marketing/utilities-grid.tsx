"use client"

import * as React from "react"
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"
import { utilities } from "@/content/tools"
import { Icon } from "@/components/shared/icon"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"

/** Steps 0 → n-1 on a loop while on screen; reduced motion holds the last step. */
function useCycle(n: number, ms: number) {
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.5 })
  const reduceMotion = useReducedMotion()
  const [step, setStep] = React.useState(0)
  React.useEffect(() => {
    if (reduceMotion || !inView) return
    const id = window.setInterval(() => setStep((s) => (s + 1) % n), ms)
    return () => window.clearInterval(id)
  }, [reduceMotion, inView, n, ms])
  return { ref, step: reduceMotion ? n - 1 : step }
}

const fade = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 }, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } }

function Well({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="relative flex h-44 flex-col overflow-hidden rounded-xl border border-border/70 bg-background font-mono text-[0.6875rem] leading-5">
      <div className="flex items-center justify-between border-b border-border/70 px-3 py-1.5 text-[0.625rem] text-muted-foreground">
        <span>{label}</span>
        <span className="flex gap-1">
          <span className="size-1.5 rounded-full bg-border" />
          <span className="size-1.5 rounded-full bg-border" />
        </span>
      </div>
      <div className="relative flex-1 p-3">{children}</div>
    </div>
  )
}

function JsonDemo() {
  const { ref, step } = useCycle(2, 2400)
  return (
    <div ref={ref}>
      <Well label={step ? "formatted · valid" : "input.json"}>
        <AnimatePresence mode="wait" initial={false}>
          {step === 0 ? (
            <motion.p key="min" {...fade} className="break-all text-muted-foreground">
              {'{"id":1042,"status":"paid","items":[{"sku":"A-12","qty":2}]}'}
            </motion.p>
          ) : (
            <motion.pre key="pretty" {...fade}>
              <span className="text-muted-foreground">{"{"}</span>
              {"\n  "}
              <span className="text-brand-ink">&quot;id&quot;</span>: <span className="text-success">1042</span>,{"\n  "}
              <span className="text-brand-ink">&quot;status&quot;</span>: <span className="text-success">&quot;paid&quot;</span>,{"\n  "}
              <span className="text-brand-ink">&quot;items&quot;</span>: [ <span className="text-muted-foreground">1 item</span> ]{"\n"}
              <span className="text-muted-foreground">{"}"}</span>
            </motion.pre>
          )}
        </AnimatePresence>
      </Well>
    </div>
  )
}

function JwtDemo() {
  const { ref, step } = useCycle(2, 2600)
  return (
    <div ref={ref}>
      <Well label={step ? "decoded" : "token"}>
        <AnimatePresence mode="wait" initial={false}>
          {step === 0 ? (
            <motion.p key="tok" {...fade} className="break-all">
              <span className="text-brand-ink">eyJhbGciOiJIUzI1NiJ9</span>.<span className="text-foreground">eyJzdWIiOiJhZGEiLCJyb2xlIjoiYWRtaW4ifQ</span>.
              <span className="text-muted-foreground">Xk9q2…</span>
            </motion.p>
          ) : (
            <motion.div key="dec" {...fade} className="grid gap-0.5">
              <p>
                <span className="text-muted-foreground">alg </span>HS256
              </p>
              <p>
                <span className="text-muted-foreground">sub </span>&quot;ada&quot;
              </p>
              <p>
                <span className="text-muted-foreground">role </span>&quot;admin&quot;
              </p>
              <p className="mt-1.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-success/10 px-2 text-success">
                <Icon name="check" className="size-3" /> expires in 59 min
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </Well>
    </div>
  )
}

function Base64Demo() {
  const plain = "deplogram"
  const encoded = "ZGVwbG9ncmFt"
  const { ref, step } = useCycle(encoded.length + 14, 110)
  const shown = Math.min(step, encoded.length)
  return (
    <div ref={ref}>
      <Well label="encode">
        <div className="grid gap-2">
          <div className="grid gap-1">
            <span className="text-[0.625rem] text-muted-foreground">Text</span>
            <span className="rounded-md border border-border/70 px-2 py-1">{plain}</span>
          </div>
          <div className="grid gap-1">
            <span className="text-[0.625rem] text-muted-foreground">Base64</span>
            <span className="rounded-md border border-brand/40 bg-brand/5 px-2 py-1">
              {encoded.slice(0, shown)}
              {shown < encoded.length && <span className="ml-px inline-block h-3 w-px translate-y-0.5 bg-foreground" />}
            </span>
          </div>
        </div>
      </Well>
    </div>
  )
}

function RegexDemo() {
  const tests = [
    ["orders-api", true],
    ["admin-dashboard", true],
    ["Docs_Site", false],
    ["image-worker", true],
  ] as const
  const { ref, step } = useCycle(tests.length + 4, 600)
  return (
    <div ref={ref}>
      <Well label="/^[a-z-]+$/g">
        <ul className="grid gap-0.5">
          {tests.map(([text, ok], i) => {
            const checked = i < step
            return (
              <li key={text} className="flex items-center justify-between gap-2">
                <span className={cn("rounded px-1 transition-colors duration-300", checked && (ok ? "bg-success/15 text-success" : "text-muted-foreground line-through"))}>{text}</span>
                <span className={cn("transition-opacity", checked ? "opacity-100" : "opacity-0")}>
                  <Icon name={ok ? "check" : "x"} className={cn("size-3", ok ? "text-success" : "text-destructive")} />
                </span>
              </li>
            )
          })}
        </ul>
      </Well>
    </div>
  )
}

function CronDemo() {
  const fields = [
    ["0", "minute"],
    ["9", "hour"],
    ["*", "day"],
    ["*", "month"],
    ["1-5", "weekday"],
  ] as const
  const { ref, step } = useCycle(fields.length + 3, 700)
  const active = step < fields.length ? step : -1
  return (
    <div ref={ref}>
      <Well label="schedule">
        <div className="flex gap-1.5">
          {fields.map(([value, label], i) => (
            <span key={label} className="grid flex-1 justify-items-center gap-1">
              <span className={cn("w-full rounded-md border py-1 text-center text-xs transition-colors duration-300", i === active ? "border-brand bg-brand/10 text-brand-ink" : "border-border/70")}>{value}</span>
              <span className={cn("text-[0.5625rem] transition-colors", i === active ? "text-foreground" : "text-muted-foreground/60")}>{label}</span>
            </span>
          ))}
        </div>
        <p className={cn("mt-3 font-sans text-xs transition-opacity duration-500", active === -1 ? "opacity-100" : "opacity-40")}>At 09:00, Monday through Friday.</p>
        <p className="mt-1 text-[0.625rem] text-muted-foreground">next · Mon 09:00 · Tue 09:00</p>
      </Well>
    </div>
  )
}

function WebhookDemo() {
  const requests = [
    { method: "POST", path: "/hook/orders", status: 200, ms: 12 },
    { method: "POST", path: "/hook/payments", status: 200, ms: 9 },
    { method: "POST", path: "/hook/orders", status: 500, ms: 31 },
    { method: "POST", path: "/hook/orders", status: 200, ms: 11 },
  ]
  const { ref, step } = useCycle(requests.length + 3, 900)
  const shown = requests.slice(0, Math.min(step + 1, requests.length)).reverse()
  return (
    <div ref={ref}>
      <Well label="listening · hook.dpl.app/ada">
        <ul className="grid gap-1">
          <AnimatePresence initial={false}>
            {shown.map((r, i) => (
              <motion.li
                key={`${r.path}-${requests.length - 1 - i}`}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <span className={cn("rounded px-1", r.status === 200 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>{r.status}</span>
                <span className="text-muted-foreground">{r.method}</span>
                <span className="min-w-0 flex-1 truncate">{r.path}</span>
                <span className="text-muted-foreground">{r.ms}ms</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </Well>
    </div>
  )
}

const demos = [JsonDemo, JwtDemo, Base64Demo, RegexDemo, CronDemo, WebhookDemo]

/** The six utilities, each card running a small live demo of what the tool does. */
export function UtilitiesGrid() {
  return (
    <StaggerGroup as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {utilities.map((utility, i) => {
        const Demo = demos[i] ?? JsonDemo
        return (
          <StaggerItem as="li" key={utility.title} className="group flex flex-col gap-5 rounded-2xl bg-card p-2.5 pb-5 ring-1 ring-border/60">
            <div aria-hidden>
              <Demo />
            </div>
            <div className="flex items-start gap-3 px-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
                <Icon name={utility.icon} size="sm" />
              </span>
              <div className="grid gap-1">
                <p className="font-heading text-lg leading-tight font-medium tracking-tight">{utility.title}</p>
                <p className="text-sm text-muted-foreground">{utility.description}</p>
              </div>
            </div>
          </StaggerItem>
        )
      })}
    </StaggerGroup>
  )
}
