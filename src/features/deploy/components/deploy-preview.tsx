"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { runtimes } from "@/content/runtimes"
import { staticRuntimes, type Repository } from "@/features/deploy/deploy"
import type { NewDeploymentValues } from "@/features/deploy/components/schema"
import { Icon, type IconName } from "@/components/shared/icon"
import { StatusDot } from "@/components/shared/status-dot"

/** `revealKey` changes when the value does, so the new value eases in. */
type Stage = { id: string; label: string; icon: IconName; value: React.ReactNode | null; revealKey: string; current: boolean }

/** A value that eases in each time it changes. */
function Reveal({ children, valueKey }: { children: React.ReactNode; valueKey: string }) {
  return (
    <span key={valueKey} className="block min-w-0 animate-in truncate duration-500 fade-in slide-in-from-left-1 ease-out-expo">
      {children}
    </span>
  )
}

/**
 * The deployment taking shape: a mini pipeline that fills in as each step is answered, ending
 * with the URL it will live at. Sticky beside the form on large screens.
 */
export function DeployPreview({ values, repository, step }: { values: NewDeploymentValues; repository?: Repository; step: string }) {
  const runtime = runtimes.find((r) => r.id === values.runtime)
  const isStatic = staticRuntimes.includes(values.runtime)
  const name = values.name?.trim()

  const stages: Stage[] = [
    {
      id: "source",
      label: "Source",
      icon: "github",
      current: step === "source",
      revealKey: `${repository?.id}:${values.branch}`,
      value: repository ? (
        <>
          {repository.fullName} <span className="text-muted-foreground">· {values.branch}</span>
        </>
      ) : null,
    },
    { id: "runtime", label: "Runtime", icon: runtime?.icon ?? "package", current: step === "runtime", revealKey: values.runtime, value: runtime ? runtime.name : null },
    {
      id: "configure",
      label: "Build & start",
      icon: "hammer",
      current: step === "configure",
      revealKey: `${values.buildCommand}:${values.startCommand}:${values.port}`,
      value:
        values.buildCommand || values.startCommand ? (
          <span className="font-mono text-[0.72rem]">
            {values.buildCommand || "no build"}
            {!isStatic && <> → {values.startCommand || "image CMD"}{values.port ? ` :${values.port}` : ""}</>}
          </span>
        ) : null,
    },
  ]

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dot-grid opacity-50 mask-fade-edges" />
      <div className="relative grid gap-5 p-5">
        <p className="text-[0.6875rem] font-medium tracking-[0.08em] text-muted-foreground uppercase">Preview</p>

        <ol className="grid">
          {stages.map((stage, i) => {
            const done = stage.value != null && !stage.current
            return (
              <li key={stage.id} className="relative grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3 pb-5 last:pb-0">
                {i < stages.length - 1 && (
                  <span aria-hidden className={cn("absolute top-6 bottom-1 left-[0.6rem] w-px transition-colors duration-500", done ? "bg-foreground/35" : "bg-border")} />
                )}
                <span className="flex size-5 items-center justify-center pt-0.5">
                  <StatusDot tone={stage.current ? "progress" : done ? "success" : "muted"} motion={stage.current ? "progress" : stage.value ? "still" : "waiting"} size="sm" />
                </span>
                <div className="grid min-w-0 gap-0.5">
                  <span className={cn("flex items-center gap-1.5 text-xs", stage.current ? "text-brand-ink" : "text-muted-foreground")}>
                    <Icon name={stage.icon} size="xs" />
                    {stage.label}
                  </span>
                  <span className="min-h-5 text-sm">
                    {stage.value ? <Reveal valueKey={stage.revealKey}>{stage.value}</Reveal> : <span className="text-muted-foreground/60">Not chosen yet</span>}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>

        <div className={cn("grid gap-1.5 rounded-xl border p-3.5 transition-colors duration-500", name ? "border-success/30 bg-success/[0.05]" : "border-dashed border-border/80")}>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon name="network" size="xs" />
            Will be live at
          </span>
          <span className={cn("truncate font-mono text-sm", !name && "text-muted-foreground/60")}>
            {name ? <Reveal valueKey={name}>https://{name}.dpl.app</Reveal> : "https://your-project.dpl.app"}
          </span>
        </div>
      </div>
    </div>
  )
}
