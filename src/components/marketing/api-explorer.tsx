"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"
import { DURATION, EASE_OUT } from "@/lib/motion"
import type { ApiItem } from "@/content/tools"
import { Icon } from "@/components/shared/icon"
import { ProductWindow } from "@/components/marketing/product-window"

/** The four APIs: pick one on the left, see an illustrative request and response on the right. */
export function ApiExplorer({ apis }: { apis: readonly ApiItem[] }) {
  const reduceMotion = useReducedMotion()
  const [active, setActive] = React.useState(0)
  const id = React.useId()
  const api = apis[active]

  function onKeyDown(event: React.KeyboardEvent) {
    const delta = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 0
    if (!delta) return
    event.preventDefault()
    const next = (active + delta + apis.length) % apis.length
    setActive(next)
    document.getElementById(`${id}-tab-${next}`)?.focus()
  }

  return (
    <div className="grid overflow-hidden rounded-3xl elevation-surface lg:grid-cols-[minmax(0,22rem)_1fr]">
      <div role="tablist" aria-label="APIs" aria-orientation="vertical" onKeyDown={onKeyDown} className="grid grid-cols-2 content-start lg:grid-cols-1">
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
              onClick={() => setActive(i)}
              className={cn(
                "flex items-start gap-4 border-b border-border/70 px-5 py-5 text-left transition-colors outline-none odd:border-r focus-visible:bg-muted sm:px-6 lg:odd:border-r-0",
                selected ? "bg-muted/60" : "hover:bg-muted/30"
              )}
            >
              <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg border", selected ? "border-brand bg-brand text-brand-foreground" : "border-border/70 bg-card text-muted-foreground")}>
                <Icon name={item.icon} />
              </span>
              <span className="grid gap-1">
                <span className="font-heading text-lg font-semibold tracking-tight">{item.title}</span>
                <span className="hidden text-sm text-pretty text-muted-foreground sm:block">{item.description}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="border-t border-border/70 bg-dot-grid p-4 sm:p-8 lg:border-t-0 lg:border-l">
        <ProductWindow
          title={`api.deplogram.app${api.endpoint}`}
          actions={<span className="font-mono text-[0.625rem] text-muted-foreground">illustrative</span>}
        >
          <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${active}`}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={api.id}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DURATION.fast, ease: EASE_OUT }}
                className="grid md:grid-cols-2"
              >
                <div className="border-b border-border/70 md:border-r md:border-b-0">
                  <p className="flex items-center gap-2 border-b border-border/70 px-4 py-2.5 font-mono text-[0.6875rem]">
                    <span className="bg-foreground px-1.5 py-0.5 text-background">{api.method}</span>
                    <span className="truncate">{api.endpoint}</span>
                  </p>
                  <pre className="overflow-x-auto p-4 font-mono text-[0.75rem] leading-relaxed text-foreground/85">
                    <code>{`Authorization: Bearer dpl_live_••••\n\n${api.request}`}</code>
                  </pre>
                </div>
                <div className="bg-background/60">
                  <p className="flex items-center gap-2 border-b border-border/70 px-4 py-2.5 font-mono text-[0.6875rem]">
                    <span className="bg-success/15 px-1.5 py-0.5 text-success">200</span>
                    <span className="text-muted-foreground">application/json</span>
                  </p>
                  <pre className="overflow-x-auto p-4 font-mono text-[0.75rem] leading-relaxed text-foreground/85">
                    <code>{api.response}</code>
                  </pre>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </ProductWindow>
      </div>
    </div>
  )
}
