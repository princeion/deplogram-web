"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format"
import { cronPresets, describeCron, nextRuns, parseCron } from "@/features/utilities/lib/cron"
import { Segmented } from "@/components/shared/segmented"
import { Icon } from "@/components/shared/icon"
import { CopyButton, Pane, StatusLine } from "@/features/utilities/components/utility-shell"

const FIELD_LABELS = ["minute", "hour", "day", "month", "weekday"]

/** A cron expression read back in plain English, with its next runs — or what's wrong with it. */
export function CronHelper() {
  const [expression, setExpression] = React.useState("0 9 * * 1-5")
  const [zone, setZone] = React.useState<"local" | "utc">("local")

  const result = React.useMemo(() => {
    if (!expression.trim()) return { state: "idle" as const }
    try {
      const cron = parseCron(expression)
      return { state: "ok" as const, description: describeCron(cron), runs: nextRuns(cron, 8, new Date(), zone === "utc"), raw: cron.raw }
    } catch (error) {
      return { state: "error" as const, message: error instanceof Error ? error.message : "Not a cron expression" }
    }
  }, [expression, zone])

  const format = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: zone === "utc" ? "UTC" : undefined })
  const fields = expression.trim().split(/\s+/)

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 rounded-xl border border-border/70 bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="surface-sunken flex h-14 min-w-0 flex-1 items-center rounded-xl px-4">
            <input
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              spellCheck={false}
              aria-label="Cron expression"
              placeholder="* * * * *"
              className="min-w-0 flex-1 bg-transparent font-mono text-2xl tracking-wide outline-none placeholder:text-muted-foreground/40"
            />
          </label>
          <CopyButton value={expression.trim()} />
        </div>
        {/* What each position means, under the expression. */}
        <div className="flex flex-wrap gap-1.5">
          {FIELD_LABELS.map((label, i) => (
            <span key={label} className={cn("surface-sunken rounded-md px-2 py-1 font-mono text-xs", fields[i] ? "text-foreground" : "text-muted-foreground")}>
              <span className="text-muted-foreground">{label}</span> {fields[i] ?? "—"}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {cronPresets.map((preset) => (
            <button
              key={preset.expression}
              type="button"
              onClick={() => setExpression(preset.expression)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                expression.trim() === preset.expression ? "border-brand/50 bg-brand/10 text-foreground" : "border-border/70 text-muted-foreground hover:text-foreground"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {result.state === "idle" && <StatusLine tone="idle">Type a cron expression, or pick one above.</StatusLine>}
      {result.state === "error" && <StatusLine tone="error">{result.message}</StatusLine>}
      {result.state === "ok" && (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Pane title="In plain English" icon="calendar-clock">
            <p className="px-4 py-5 text-xl leading-snug font-medium tracking-tight text-balance">{result.description}</p>
            <p className="border-t border-border/60 px-4 py-2.5 text-xs text-muted-foreground">
              Runs on the server&apos;s clock — on Deplogram, that&apos;s UTC.
            </p>
          </Pane>
          <Pane
            title="Next runs"
            icon="clock"
            actions={
              <Segmented
                label="Time zone"
                size="sm"
                value={zone}
                onChange={setZone}
                options={[
                  { value: "local", label: "Your time" },
                  { value: "utc", label: "UTC" },
                ]}
              />
            }
          >
            {result.runs.length === 0 ? (
              <p className="px-4 py-5 text-sm text-muted-foreground">It never runs — no date matches every field.</p>
            ) : (
              <ol className="divide-y divide-border/50">
                {result.runs.map((run, i) => (
                  <li key={run.toISOString()} className="flex items-center gap-3 px-4 py-2">
                    <span className="w-5 font-mono text-xs text-muted-foreground">{i + 1}</span>
                    <span className="font-mono text-sm tabular-nums">{format.format(run)}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{formatRelativeTime(run.toISOString())}</span>
                  </li>
                ))}
              </ol>
            )}
          </Pane>
        </div>
      )}
      {result.state === "ok" && (
        <StatusLine tone="ok">
          Valid cron · <span className="text-foreground">{result.raw.join(" ")}</span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Icon name="circle-alert" size="xs" /> Paste it into your crontab or scheduler.
          </span>
        </StatusLine>
      )}
    </div>
  )
}
