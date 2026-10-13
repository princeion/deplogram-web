"use client"

import * as React from "react"
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/site"
import { codepadActions, codepadFiles, codepadSource } from "@/content/workspace"
import { Icon, type IconName } from "@/components/shared/icon"
import { ProductWindow, StateBadge } from "@/components/marketing/product-window"

const tokenTone = {
  kw: "text-brand-ink",
  str: "text-success",
  fn: "text-foreground font-medium",
  cm: "text-muted-foreground italic",
  plain: "text-foreground/80",
} as const

const TICK_MS = 55
/** The line that gets typed live. */
const TYPED_LINE = 6
const typedLength = codepadSource[TYPED_LINE].reduce((n, [text]) => n + text.length, 0)

// Timeline, in ticks after typing finishes.
const T = {
  save: typedLength + 10,
  run: typedLength + 18,
  out: [typedLength + 24, typedLength + 32, typedLength + 40],
  deploy: typedLength + 54,
  live: typedLength + 84,
  end: typedLength + 130,
}

const activityBar: IconName[] = ["file", "search", "git-branch", "play", "settings"]

/**
 * CodePad — a line is typed, saved, run (terminal streams output), then deployed from the editor.
 * Loops while on screen; reduced motion shows the finished state.
 */
export function CodePadMock({ className }: { className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.3 })
  const reduceMotion = useReducedMotion()
  const [tick, setTick] = React.useState(0)

  React.useEffect(() => {
    if (reduceMotion || !inView) return
    const id = window.setInterval(() => setTick((t) => (t >= T.end ? 0 : t + 1)), TICK_MS)
    return () => window.clearInterval(id)
  }, [reduceMotion, inView])

  const t = reduceMotion ? T.end : tick
  const typed = Math.min(t, typedLength)
  const typing = t < typedLength
  const dirty = t > 0 && t < T.save
  const running = t >= T.run && t < T.out[2]
  const outLines = T.out.filter((at) => t >= at).length
  const deploying = t >= T.deploy
  const live = t >= T.live

  return (
    <div ref={ref} className={className}>
      <ProductWindow
        title="codepad / orders-api / src / server.ts"
        bodyClassName="grid md:grid-cols-[2.75rem_11rem_1fr]"
        actions={
          <span className="hidden items-center gap-1 sm:flex">
            {codepadActions.map((action) => {
              const pressed = (action.label === "Run" && running) || (action.label === "Save" && t >= T.save && t < T.save + 4) || (action.label === "Deploy" && deploying && !live)
              return (
                <motion.span
                  key={action.label}
                  animate={{ scale: pressed ? 0.94 : 1 }}
                  className={cn(
                    "inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-[0.625rem] font-medium transition-colors",
                    action.label === "Deploy" ? "bg-brand text-white" : action.label === "Run" ? "bg-foreground text-background" : "border border-border/70 bg-card text-muted-foreground",
                    pressed && "ring-2 ring-brand/30"
                  )}
                >
                  {action.label === "Run" && running ? <Icon name="loader" className="size-3 animate-spin" /> : <Icon name={action.icon} className="size-3" />}
                  {action.label}
                </motion.span>
              )
            })}
          </span>
        }
      >
        {/* Activity bar */}
        <aside aria-hidden className="hidden flex-col items-center gap-1 border-r border-border/70 bg-background/60 py-2 md:flex">
          {activityBar.map((icon, i) => (
            <span key={icon} className={cn("relative flex size-8 items-center justify-center rounded-md", i === 0 ? "text-foreground" : "text-muted-foreground/60")}>
              {i === 0 && <span className="absolute top-1.5 bottom-1.5 -left-1.5 w-0.5 rounded-full bg-foreground" />}
              <Icon name={icon} size="sm" />
            </span>
          ))}
        </aside>

        {/* File tree */}
        <aside aria-hidden className="hidden border-r border-border/70 bg-background/40 py-3 md:block">
          <p className="px-3.5 pb-2 text-[0.6875rem] font-medium text-muted-foreground">Explorer</p>
          <ul className="text-xs">
            {codepadFiles.map((file) => (
              <li
                key={file.name}
                className={cn("flex items-center gap-2 py-1 pr-3", file.active ? "bg-muted text-foreground" : "text-muted-foreground")}
                style={{ paddingLeft: `${0.875 + file.depth * 0.75}rem` }}
              >
                {file.folder ? <Icon name="chevron-down" className="size-3" /> : <span className="w-3" />}
                <Icon name={file.folder ? "folder" : "file-code"} className="size-3.5" />
                <span className="flex-1 truncate">{file.name}</span>
                {file.active && dirty && <span className="size-1.5 rounded-full bg-foreground" />}
              </li>
            ))}
          </ul>
        </aside>

        {/* Editor + panel */}
        <div className="relative flex min-w-0 flex-col">
          <div className="flex border-b border-border/70 text-[0.6875rem]">
            <span className="flex items-center gap-2 border-r border-border/70 bg-card px-4 py-2 text-foreground">
              <Icon name="file-code" className="size-3 text-brand-ink" />
              server.ts
              <span className="flex size-3 items-center justify-center">
                {dirty ? <span className="size-1.5 rounded-full bg-foreground" /> : <Icon name="x" className="size-3 text-muted-foreground" />}
              </span>
            </span>
            <span className="flex items-center gap-2 border-r border-border/70 px-4 py-2 text-muted-foreground">
              <Icon name="file-code" className="size-3" />
              routes.ts
            </span>
          </div>

          <pre className="overflow-x-auto bg-card py-3 font-mono text-[0.75rem] leading-6" aria-label="Example code in CodePad">
            {codepadSource.map((line, i) => (
              <div key={i} className={cn("flex pr-6", i === TYPED_LINE && "bg-muted/60")}>
                <span aria-hidden className={cn("w-12 shrink-0 pr-4 text-right select-none", i === TYPED_LINE ? "text-foreground/70" : "text-muted-foreground/40")}>
                  {i + 1}
                </span>
                <code>
                  {i === TYPED_LINE ? (
                    <TypedLine line={line} count={typed} cursor={!live} blink={!typing} />
                  ) : line.length === 0 ? (
                    " "
                  ) : (
                    line.map(([text, kind], j) => (
                      <span key={j} className={tokenTone[kind]}>
                        {text}
                      </span>
                    ))
                  )}
                </code>
              </div>
            ))}
          </pre>

          {/* Terminal */}
          <div className="border-t border-border/70 bg-background/60">
            <div className="flex items-center gap-4 border-b border-border/70 px-4 text-[0.6875rem]">
              <span className="relative py-2 font-medium text-foreground">
                Terminal
                <span className="absolute inset-x-0 -bottom-px h-px bg-foreground" />
              </span>
              <span className="py-2 text-muted-foreground">Preview</span>
              <span className="py-2 text-muted-foreground">Problems</span>
            </div>
            <div className="h-[5.5rem] space-y-1 px-4 py-3 font-mono text-[0.6875rem]" aria-hidden>
              {t >= T.run ? (
                <>
                  <p className="text-muted-foreground">$ run server.ts</p>
                  {outLines >= 1 && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}>listening on :8080</motion.p>}
                  {outLines >= 2 && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-success">GET /orders → 200 · 3ms · [&quot;#1042&quot;,&quot;#1043&quot;]</motion.p>}
                  {outLines >= 3 && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground">ready · press Deploy to ship</motion.p>}
                </>
              ) : (
                <p className="text-muted-foreground/60">
                  $ <span className="inline-block h-3 w-1.5 translate-y-0.5 animate-blink bg-muted-foreground/60" />
                </p>
              )}
            </div>
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-background/60 px-4 py-1.5 font-mono text-[0.625rem] text-muted-foreground">
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Icon name="git-branch" className="size-3" /> main
              </span>
              <span>{dirty ? "● unsaved" : "✓ saved"}</span>
            </span>
            <span className="flex gap-3">
              <span>
                Ln {TYPED_LINE + 1}, Col {typed + 1}
              </span>
              <span className="hidden sm:inline">TypeScript</span>
            </span>
          </div>

          {/* Deploy toast */}
          <AnimatePresence>
            {deploying && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-4 bottom-12 w-64 rounded-xl border border-border/70 bg-card p-3 shadow-2xl shadow-black/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">{live ? "Deployed" : "Deploying orders-api"}</span>
                  <StateBadge state={live ? "RUNNING" : "BUILDING"} />
                </div>
                <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className={cn("h-full rounded-full", live ? "bg-success" : "bg-brand")}
                    initial={{ width: reduceMotion ? "100%" : "0%" }}
                    animate={{ width: live ? "100%" : "70%" }}
                    transition={{ duration: live ? 0.4 : (T.live - T.deploy) * (TICK_MS / 1000), ease: "easeOut" }}
                  />
                </div>
                <p className="mt-2 truncate font-mono text-[0.625rem] text-muted-foreground">
                  {live ? `orders-api.${siteConfig.deployDomain}` : "building from CodePad…"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ProductWindow>
    </div>
  )
}

/** Renders the first `count` characters of a token line, keeping token colours, with a caret. */
function TypedLine({
  line,
  count,
  cursor,
  blink,
}: {
  line: (typeof codepadSource)[number]
  count: number
  cursor: boolean
  blink: boolean
}) {
  let remaining = count
  return (
    <>
      {line.map(([text, kind], j) => {
        const visible = text.slice(0, Math.max(0, remaining))
        remaining -= text.length
        return visible ? (
          <span key={j} className={tokenTone[kind]}>
            {visible}
          </span>
        ) : null
      })}
      {cursor && <span className={cn("ml-px inline-block h-4 w-px translate-y-0.5 bg-foreground", blink && "animate-blink")} />}
    </>
  )
}
