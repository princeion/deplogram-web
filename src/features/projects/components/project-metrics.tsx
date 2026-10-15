"use client"

import * as React from "react"

import { formatCompact, formatNumber, formatPercent } from "@/lib/format"
import { useProject, useProjectMetrics, type MetricsRange, type ProjectMetrics as Metrics } from "@/features/projects/projects"
import { ProjectGate } from "@/features/projects/components/project-gate"
import { PageHeader } from "@/components/app-shell/page"
import { EmptyState } from "@/components/app-shell/empty-state"
import { Segmented } from "@/components/shared/segmented"
import { AreaTimeSeries, ChartCard, ChartLegend, DotProgressList, SegmentedMeter, Stat, StatGroup, TickMeter, type ChartSeries } from "@/components/charts"

const timeOf = (range: MetricsRange) => (v: string) =>
  range === "7d"
    ? new Date(v).toLocaleDateString("en-GB", { weekday: "short", day: "numeric" })
    : new Date(v).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
const longTime = (v: string) => new Date(v).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

const trafficSeries: ChartSeries<"requests" | "errors">[] = [
  { key: "requests", label: "Requests", color: "chart-1" },
  { key: "errors", label: "Errors", color: "destructive" },
]
const latencySeries: ChartSeries<"p95" | "p50">[] = [
  { key: "p95", label: "p95", color: "chart-1" },
  { key: "p50", label: "p50", color: "chart-4" },
]

function Charts({ data, range }: { data: Metrics; range: MetricsRange }) {
  const series = data.series.map((s) => ({ date: s.t, ...s }))
  const xFormat = timeOf(range)
  const latestMemory = data.series.at(-1)?.memory ?? 0
  const total = Object.values(data.statuses).reduce((a, b) => a + b, 0)
  return (
    <div className="grid gap-4">
      <StatGroup>
        <Stat label="Requests" value={formatCompact(data.summary.requests)} hint={`in the last ${range}`} />
        <Stat label="Error rate" value={formatPercent(data.summary.errorRate, 2)} hint="5xx responses" />
        <Stat label="p95 latency" value={`${data.summary.p95}`} unit="ms" hint="95% of requests faster" />
        <Stat label="Uptime" value={formatPercent(data.summary.uptime, 2)} hint="health checks answered" />
      </StatGroup>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Requests" icon="activity" action={<ChartLegend series={trafficSeries} />}>
          <AreaTimeSeries data={series} series={trafficSeries} format={formatCompact} xFormat={xFormat} tooltipLabelFormat={longTime} height={210} />
        </ChartCard>
        <ChartCard title="Latency" icon="clock" action={<ChartLegend series={latencySeries} />}>
          <AreaTimeSeries data={series} series={latencySeries} format={(v) => `${Math.round(v)}ms`} xFormat={xFormat} tooltipLabelFormat={longTime} height={210} />
        </ChartCard>
        <ChartCard title="CPU" icon="cpu" action={<span className="font-mono text-xs">0.5 vCPU</span>}>
          <AreaTimeSeries data={series} series={[{ key: "cpu", label: "CPU", color: "chart-2" }]} format={(v) => `${Math.round(v)}%`} xFormat={xFormat} tooltipLabelFormat={longTime} height={180} />
        </ChartCard>
        <ChartCard title="Memory" icon="server" action={<span className="font-mono text-xs">{formatNumber(latestMemory)} / {data.memoryLimit} MB</span>}>
          <TickMeter value={latestMemory / data.memoryLimit} label="Memory used" className="mt-4" />
          <AreaTimeSeries data={series} series={[{ key: "memory", label: "Memory", color: "chart-2" }]} format={(v) => `${Math.round(v)} MB`} xFormat={xFormat} tooltipLabelFormat={longTime} height={150} />
        </ChartCard>
        <ChartCard title="Responses" icon="layers" action={<span className="font-mono text-xs">{formatCompact(total)} total</span>}>
          <SegmentedMeter
            segments={[
              { key: "ok", label: "2xx", value: data.statuses.ok, color: "success" },
              { key: "redirect", label: "3xx", value: data.statuses.redirect, color: "chart-3" },
              { key: "client", label: "4xx", value: data.statuses.clientError, color: "brand" },
              { key: "server", label: "5xx", value: data.statuses.serverError, color: "destructive" },
            ]}
            format={formatCompact}
          />
        </ChartCard>
        <ChartCard title="Busiest paths" icon="network" action={<span className="font-mono text-xs">p95</span>}>
          <DotProgressList
            items={data.paths.map((p) => ({
              key: p.path,
              label: (
                <span className="flex min-w-0 items-baseline justify-between gap-3">
                  <span className="truncate font-mono text-[0.8rem]">{p.path}</span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">{p.p95}ms</span>
                </span>
              ),
              value: p.requests,
            }))}
            format={formatCompact}
            dots={32}
          />
        </ChartCard>
      </div>
    </div>
  )
}

/** Project › Metrics: traffic, latency and resources of the live deployment, over 1h / 24h / 7d. */
export function ProjectMetrics({ projectId }: { projectId: string }) {
  const query = useProject(projectId)
  const [range, setRange] = React.useState<MetricsRange>("24h")
  const metrics = useProjectMetrics(projectId, range)
  return (
    <ProjectGate query={query}>
      {(project) => (
        <div className="grid gap-4">
          <PageHeader
            title="Metrics"
            description={project.url ? `Traffic and resources for ${project.url}.` : "Metrics start once the project is live."}
            actions={
              <Segmented
                label="Time range"
                value={range}
                onChange={setRange}
                options={[
                  { value: "1h", label: "1h" },
                  { value: "24h", label: "24h" },
                  { value: "7d", label: "7d" },
                ]}
              />
            }
          />
          {!project.url && metrics.data?.summary.requests === 0 ? (
            <EmptyState icon="analytics" title="Nothing to measure yet." description="Requests, latency and resources appear here once the project is serving traffic." />
          ) : metrics.isPending ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 4 }, (_, i) => (
                <ChartCard key={i} title="…" loading skeletonHeight={200} />
              ))}
            </div>
          ) : metrics.data ? (
            <div className={metrics.isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
              <Charts data={metrics.data} range={range} />
            </div>
          ) : null}
        </div>
      )}
    </ProjectGate>
  )
}
