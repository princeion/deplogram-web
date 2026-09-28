"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"
import { DURATION, EASE_OUT } from "@/lib/motion"
import { NODE_GRAPH_LAYOUTS } from "@/lib/node-graph"
import { BadgePill } from "@/components/shared/badge-pill"
import { Icon } from "@/components/shared/icon"
import { NodeGraph } from "@/components/shared/node-graph"
import { TerminalTyping, type TerminalLine } from "@/components/shared/motion/terminal-typing"
import { TerminalWindow } from "@/components/shared/terminal-window"

const TOTAL = NODE_GRAPH_LAYOUTS.pipeline.order.length

/**
 * Deploy preview: the deploy flow told two ways at once. The terminal types the log;
 * each printed line lights the next node of the pipeline graph until the live node pulses.
 */
export function DeployPreview({ log }: { log: readonly TerminalLine[] }) {
  const [progress, setProgress] = React.useState(0)
  const live = progress >= TOTAL
  const status = live ? "Live" : progress === 0 ? "Waiting for push" : "Building"

  return (
    <div className="relative overflow-hidden rounded-3xl elevation-surface p-2">
      <div className="grid gap-2 lg:grid-cols-[1.35fr_1fr]">
        <div className="relative flex flex-col overflow-hidden rounded-2xl bg-background/60 p-5 sm:p-6">
          <div aria-hidden className="absolute inset-0 bg-dot-grid mask-fade-edges" />
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Icon name="git-branch" className="text-muted-foreground" />
              <span className="font-medium">myapp</span>
              <span className="text-muted-foreground">/ production</span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={status}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: DURATION.fast, ease: EASE_OUT }}
              >
                <BadgePill variant={live ? "brand" : "default"} dot={!live && progress > 0}>
                  {status}
                </BadgePill>
              </motion.span>
            </AnimatePresence>
          </div>

          <NodeGraph
            layout="pipeline"
            progress={progress}
            animated
            showLabels
            title="Deploy pipeline: git push, detect, build, env vars, domain, SSL, deploy, live"
            className="relative my-8 sm:my-10"
          />

          <dl className="relative mt-auto grid grid-cols-3 gap-2 text-xs">
            {[
              { label: "Domain", value: "myapp.dpl.app" },
              { label: "Branch", value: "main" },
              { label: "Runtime", value: "Next.js" },
            ].map((item) => (
              <div key={item.label} className="min-w-0 rounded-lg elevation-control px-3 py-2">
                <dt className="text-muted-foreground">{item.label}</dt>
                <dd
                  className={cn(
                    "truncate font-mono text-foreground transition-colors",
                    item.label === "Domain" && live && "text-brand-ink"
                  )}
                >
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <TerminalWindow title="~/myapp — deplogram" className="rounded-2xl border-0 bg-background/60">
          <TerminalTyping lines={log} onProgress={setProgress} className="min-h-64" />
        </TerminalWindow>
      </div>
    </div>
  )
}
