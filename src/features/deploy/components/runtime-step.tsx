"use client"

import { useFormContext } from "react-hook-form"

import { cn } from "@/lib/utils"
import { runtimes } from "@/content/runtimes"
import type { Detection } from "@/features/deploy/deploy"
import type { NewDeploymentValues } from "@/features/deploy/components/schema"
import { Icon } from "@/components/shared/icon"
import { Spinner } from "@/components/ui/spinner"
import { Callout } from "@/components/feedback"
import { RadioCardsField } from "@/components/forms"

const scanLines = ["Reading the file tree", "Looking for package.json, go.mod, requirements.txt, composer.json, Dockerfile", "Matching a runtime"]

/** While detection runs: what we're doing, line by line, with a scan sweeping the panel. */
function Scanning({ target }: { target: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-brand/30 bg-brand/[0.04] p-4" role="status" aria-live="polite">
      <span aria-hidden className="absolute inset-x-0 top-0 h-px overflow-hidden">
        <span className="block h-full w-1/3 animate-scan bg-brand" />
      </span>
      <p className="flex items-center gap-2 text-sm font-medium">
        <Spinner className="size-4 text-brand-ink" />
        Inspecting <span className="font-mono text-[0.8rem]">{target}</span>
      </p>
      <ol className="mt-3 grid gap-1.5 pl-6 font-mono text-xs text-muted-foreground">
        {scanLines.map((line, i) => (
          <li key={line} className="animate-in fill-mode-both duration-500 fade-in slide-in-from-left-1" style={{ animationDelay: `${300 + i * 450}ms` }}>
            <span className="text-brand-ink">›</span> {line}…
          </li>
        ))}
      </ol>
    </div>
  )
}

function Detected({ detection }: { detection: Detection }) {
  const runtime = runtimes.find((r) => r.id === detection.runtime)
  if (!runtime) return null
  return (
    <div className="flex animate-in items-start gap-3 rounded-xl border border-success/30 bg-success/[0.05] p-4 duration-500 fade-in zoom-in-[0.98]">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-success/30 bg-success/10 text-success">
        <Icon name={runtime.icon} filled />
      </span>
      <div className="grid min-w-0 gap-1">
        <p className="text-sm font-medium">
          Detected {runtime.name}
          {detection.evidence && (
            <span className="ml-2 rounded-md border border-border/70 bg-background/50 px-1.5 py-0.5 font-mono text-[0.7rem] font-normal text-muted-foreground">{detection.evidence}</span>
          )}
        </p>
        <p className="text-sm text-muted-foreground">Build and start settings are filled in for you on the next step. You can change them.</p>
      </div>
    </div>
  )
}

/** Step 2 — the runtime: detection first, then every runtime as a card (the detected one marked). */
export function RuntimeStep({ target, detection, detecting, detectionFailed }: { target: string; detection?: Detection; detecting: boolean; detectionFailed: boolean }) {
  const { control } = useFormContext<NewDeploymentValues>()
  const options = runtimes.map((r) => ({
    value: r.id,
    label: r.name,
    description: r.id === detection?.runtime ? `Detected · ${r.detail}` : r.detail,
    icon: r.icon,
  }))

  return (
    <div className="grid gap-5">
      {detecting ? (
        <Scanning target={target} />
      ) : detectionFailed ? (
        <Callout tone="warning" title="We couldn't inspect the repository">
          Pick the runtime yourself — you can check the build and start settings next.
        </Callout>
      ) : detection?.runtime ? (
        <Detected detection={detection} />
      ) : (
        <Callout title="We couldn't tell what this is">No package.json, go.mod, requirements.txt, composer.json or Dockerfile found. Pick the runtime that fits.</Callout>
      )}

      <div className={cn("transition-opacity duration-300", detecting && "pointer-events-none opacity-50")}>
        <RadioCardsField control={control} name="runtime" label="Runtime" required options={options} columns={2} />
      </div>
    </div>
  )
}
