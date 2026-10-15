"use client"

import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { useProject, useRuntimeLogs, type RuntimeLogLine } from "@/features/projects/projects"
import { deploymentHref } from "@/features/deployments/components/use-deployment-actions"
import { ProjectGate } from "@/features/projects/components/project-gate"
import { PageHeader } from "@/components/app-shell/page"
import { LogViewer, type LogLine } from "@/components/log-viewer"
import { Segmented } from "@/components/shared/segmented"
import { StatusDot } from "@/components/shared/status-dot"
import { Icon } from "@/components/shared/icon"
import { buttonVariants } from "@/components/ui/button"

type Level = "all" | "warn" | "error"
type Source = "all" | "request" | "app"

const toLine = (l: RuntimeLogLine): LogLine => ({ n: l.n, at: l.at, text: l.text, stream: l.level === "info" ? "stdout" : "stderr", level: l.level, tag: l.source === "request" ? "req" : "app" })

function RuntimeLog({ projectId }: { projectId: string }) {
  const [paused, setPaused] = React.useState(false)
  const [level, setLevel] = React.useState<Level>("all")
  const [source, setSource] = React.useState<Source>("all")
  const { data, isPending } = useRuntimeLogs(projectId, { paused })
  const all = data?.lines ?? []
  const lines = all.filter((l) => (level === "all" || (level === "error" ? l.level === "error" : l.level !== "info")) && (source === "all" || l.source === source)).map(toLine)
  const counts = { errors: all.filter((l) => l.level === "error").length, warnings: all.filter((l) => l.level !== "info").length }
  const live = data?.live ?? true

  return (
    <LogViewer
      loading={isPending}
      lines={lines}
      live={live && !paused}
      liveLabel="Streaming"
      fileName={`${projectId}-runtime`}
      height="min(680px, 70vh)"
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            size="sm"
            label="Severity"
            value={level}
            onChange={setLevel}
            options={[
              { value: "all", label: "All" },
              { value: "warn", label: "Warnings+", count: counts.warnings },
              { value: "error", label: "Errors", count: counts.errors },
            ]}
          />
          <Segmented
            size="sm"
            label="Source"
            value={source}
            onChange={setSource}
            options={[
              { value: "all", label: "All" },
              { value: "request", label: "Requests" },
              { value: "app", label: "App" },
            ]}
          />
          {live && (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-pressed={paused}
              className={cn("surface-raised flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs transition-colors", paused ? "text-muted-foreground" : "text-foreground")}
            >
              <StatusDot tone={paused ? "muted" : "success"} motion={paused ? "still" : "live"} size="sm" />
              {paused ? "Paused — resume" : "Live"}
            </button>
          )}
        </div>
      }
    />
  )
}

/** Project › Logs: the running app's log, live — requests and what the app prints — plus a way to the build logs. */
export function ProjectLogs({ projectId }: { projectId: string }) {
  const query = useProject(projectId)
  return (
    <ProjectGate query={query}>
      {(project) => (
        <div className="grid gap-4">
          <PageHeader
            title="Logs"
            description={project.url ? `What ${project.url} is doing right now — requests and app output, streaming.` : "Runtime logs appear once the project is live."}
            actions={
              project.latest && (
                <Link href={`${deploymentHref({ id: project.latest.id, projectId: project.id })}#logs`} className={cn(buttonVariants({ variant: "outline" }))}>
                  <Icon name="scroll-text" />
                  Latest build log
                </Link>
              )
            }
          />
          <RuntimeLog projectId={project.id} />
        </div>
      )}
    </ProjectGate>
  )
}
