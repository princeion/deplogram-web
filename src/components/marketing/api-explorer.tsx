"use client"

import * as React from "react"
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"
import { DURATION, EASE_OUT } from "@/lib/motion"
import type { ApiItem } from "@/content/tools"
import { Icon } from "@/components/shared/icon"
import { GradientStage } from "@/components/marketing/gradient-stage"
import { ProductWindow } from "@/components/marketing/product-window"

const BASE = "https://api.deplogram.app"
const languages = ["cURL", "Node.js", "Python"] as const
type Language = (typeof languages)[number]

function snippet(api: ApiItem, lang: Language) {
  const body = api.request
  if (lang === "cURL")
    return `curl -X ${api.method} ${BASE}${api.endpoint} \\
  -H "Authorization: Bearer dpl_live_••••" \\
  -H "Content-Type: application/json" \\
  -d '${body}'`
  if (lang === "Node.js")
    return `const res = await fetch("${BASE}${api.endpoint}", {
  method: "${api.method}",
  headers: { Authorization: \`Bearer \${process.env.DPL_KEY}\` },
  body: JSON.stringify(${body.replace(/\n/g, "\n  ")}),
})`
  return `import requests, os

res = requests.${api.method.toLowerCase()}(
  "${BASE}${api.endpoint}",
  headers={"Authorization": f"Bearer {os.environ['DPL_KEY']}"},
  json=${body.replace(/\n/g, "\n  ")},
)`
}

const latency: Record<string, number> = { otp: 84, email: 112, images: 236, qr: 41 }
const SEND_MS = 900

/**
 * The four APIs: pick one, see the request in your language, watch it send and the response
 * stream back. Illustrative endpoints — not a live API.
 */
export function ApiExplorer({ apis }: { apis: readonly ApiItem[] }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.35, once: true })
  const reduceMotion = useReducedMotion()
  const [active, setActive] = React.useState(0)
  const [lang, setLang] = React.useState<Language>("cURL")
  const [phase, setPhase] = React.useState<"idle" | "sending" | "done">("idle")
  const [run, setRun] = React.useState(0)
  const id = React.useId()
  const api = apis[active]

  // Every selection (or press of Send) replays the request.
  React.useEffect(() => {
    if (!inView) return
    if (reduceMotion) {
      setPhase("done")
      return
    }
    setPhase("sending")
    const timer = window.setTimeout(() => setPhase("done"), SEND_MS)
    return () => window.clearTimeout(timer)
  }, [active, run, inView, reduceMotion])

  function select(i: number) {
    setActive(i)
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const delta = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 0
    if (!delta) return
    event.preventDefault()
    const next = (active + delta + apis.length) % apis.length
    select(next)
    document.getElementById(`${id}-tab-${next}`)?.focus()
  }

  const responseLines = api.response.split("\n")

  return (
    <div ref={ref} className="grid overflow-hidden rounded-3xl elevation-surface lg:grid-cols-[minmax(0,22rem)_1fr]">
      <div role="tablist" aria-label="APIs" aria-orientation="vertical" onKeyDown={onKeyDown} className="grid grid-cols-2 lg:grid-cols-1">
        {apis.map((item, i) => {
          const selected = i === active
          return (
            <button
              key={item.id}
              id={`${id}-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(i)}
              className={cn(
                "relative flex items-start gap-4 border-b border-border/70 px-5 py-5 text-left transition-colors outline-none odd:border-r focus-visible:bg-muted sm:px-6 lg:odd:border-r-0 lg:last:border-b-0",
                selected ? "bg-muted/60" : "hover:bg-muted/30"
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                  selected ? "bg-foreground text-background" : "border border-border/70 bg-card text-muted-foreground"
                )}
              >
                <Icon name={item.icon} />
              </span>
              <span className="grid gap-1">
                <span className={cn("font-heading text-lg font-medium tracking-tight", !selected && "text-muted-foreground")}>{item.title}</span>
                <span className="hidden text-sm text-pretty text-muted-foreground sm:block">{item.description}</span>
                <span className="mt-1 hidden font-mono text-[0.6875rem] text-muted-foreground sm:block">
                  {item.method} {item.endpoint}
                </span>
              </span>
              {selected && <motion.span layoutId={`${id}-marker`} className="absolute inset-y-0 left-0 w-0.5 bg-brand" />}
            </button>
          )
        })}
      </div>

      <GradientStage variant="b" source="flow" className="rounded-none p-3 sm:p-8 lg:p-10">
        <ProductWindow
          title={`api reference / ${api.title.toLowerCase()}`}
          actions={<span className="font-mono text-[0.625rem] text-muted-foreground">illustrative</span>}
        >
          <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${active}`}>
            {/* Request bar */}
            <div className="flex items-center gap-2 border-b border-border/70 p-3">
              <span className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border/70 bg-background px-2.5 font-mono text-[0.6875rem]">
                <span className="rounded bg-brand/15 px-1.5 py-0.5 font-medium text-brand-ink">{api.method}</span>
                <span className="truncate">
                  <span className="text-muted-foreground">{BASE.replace("https://", "")}</span>
                  {api.endpoint}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setRun((r) => r + 1)}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
              >
                {phase === "sending" ? <Icon name="loader" size="xs" className="animate-spin" /> : <Icon name="play" size="xs" />}
                Send
              </button>
            </div>

            <div className="grid md:grid-cols-[1.15fr_1fr]">
              {/* Request */}
              <div className="min-w-0 border-b border-border/70 md:border-r md:border-b-0">
                <div className="flex gap-4 border-b border-border/70 px-4 text-[0.6875rem]">
                  {languages.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLang(l)}
                      className={cn("relative py-2 transition-colors", l === lang ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}
                    >
                      {l}
                      {l === lang && <motion.span layoutId={`${id}-lang`} className="absolute inset-x-0 -bottom-px h-px bg-foreground" />}
                    </button>
                  ))}
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.pre
                    key={api.id + lang}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: DURATION.fast, ease: EASE_OUT }}
                    className="h-64 overflow-auto p-4 font-mono text-[0.6875rem] leading-relaxed text-foreground/85"
                  >
                    <code>{snippet(api, lang)}</code>
                  </motion.pre>
                </AnimatePresence>
              </div>

              {/* Response */}
              <div className="min-w-0 bg-background/60">
                <div className="flex items-center justify-between gap-2 border-b border-border/70 px-4 py-2 font-mono text-[0.6875rem]">
                  <span className="text-muted-foreground">Response</span>
                  <AnimatePresence mode="wait" initial={false}>
                    {phase === "done" ? (
                      <motion.span key="ok" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                        <span className="rounded bg-success/15 px-1.5 py-0.5 text-success">200 OK</span>
                        <span className="text-muted-foreground">{latency[api.id] ?? 90}ms</span>
                      </motion.span>
                    ) : (
                      <motion.span key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-muted-foreground">
                        {phase === "sending" ? "sending…" : "—"}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <div className="relative h-64 p-4 font-mono text-[0.6875rem] leading-relaxed">
                  {phase === "sending" && (
                    <span className="absolute inset-x-0 top-0 h-px overflow-hidden">
                      <span className="block h-full w-1/3 animate-scan bg-brand" />
                    </span>
                  )}
                  {phase === "done" && (
                    <pre className="text-foreground/85">
                      {responseLines.map((line, i) => (
                        <motion.span
                          key={api.id + run + i}
                          className="block"
                          initial={reduceMotion ? false : { opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07, duration: 0.25 }}
                        >
                          <JsonLine line={line} />
                        </motion.span>
                      ))}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ProductWindow>
      </GradientStage>
    </div>
  )
}

/** Light JSON colouring: keys in brand, string/number values in success. */
function JsonLine({ line }: { line: string }) {
  const match = line.match(/^(\s*)("[^"]+")(:\s*)(.*)$/)
  if (!match) return <span className="text-muted-foreground">{line}</span>
  const [, indent, key, colon, value] = match
  return (
    <>
      {indent}
      <span className="text-brand-ink">{key}</span>
      {colon}
      <span className="text-success">{value}</span>
    </>
  )
}
