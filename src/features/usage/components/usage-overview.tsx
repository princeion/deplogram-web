"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { formatBytes, formatCompact, formatNumber, formatPercent } from "@/lib/format"
import { useUsage, type Usage, type UsageLimit } from "@/features/usage/usage"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/app-shell/error-state"
import {
  AreaTimeSeries,
  BarTimeSeries,
  ChartCard,
  ChartLegend,
  Delta,
  DotProgressList,
  Heatmap,
  SegmentedMeter,
  Stat,
  StatGroup,
  TickGauge,
  TickMeter,
  UsageMeter,
  limitTone,
  type ChartSeries,
} from "@/components/charts"

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const HOURS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`)

const requestSeries: ChartSeries<"requests" | "previous">[] = [
  { key: "requests", label: "This period", color: "chart-1" },
  { key: "previous", label: "Previous period", color: "chart-4" },
]
const buildSeries: ChartSeries<"succeeded" | "failed">[] = [
  { key: "succeeded", label: "Succeeded", color: "chart-2" },
  { key: "failed", label: "Failed", color: "destructive" },
]

function formatLimitValue(limit: Pick<UsageLimit, "unit">, value: number) {
  if (limit.unit === "bytes") return formatBytes(value)
  if (limit.unit === "minutes") return `${formatNumber(value)} min`
  return formatNumber(value)
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

function daysUntil(isoDate: string) {
  const end = new Date(`${isoDate}T23:59:59Z`).getTime()
  return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000))
}

/** One plan limit: used vs limit, a status line, and the meter. */
function LimitStat({ limit }: { limit: UsageLimit }) {
  const ratio = limit.limit > 0 ? limit.used / limit.limit : 0
  const tone = limitTone(ratio)
  const [value, ...unitParts] = formatLimitValue(limit, limit.used).split(" ")
  return (
    <Stat
      label={limit.label}
      value={value}
      unit={`${unitParts.join(" ")} of ${formatLimitValue(limit, limit.limit)}`.trim()}
      hint={
        <span className={cn(tone.label !== "ok" && tone.text)}>
          {tone.label === "reached" ? "Limit reached" : tone.label === "near" ? `${formatPercent(ratio, 0)} used — nearly at the limit` : `${formatPercent(ratio, 0)} used`}
        </span>
      }
    >
      <UsageMeter used={limit.used} limit={limit.limit} label={`${limit.label} used`} />
    </Stat>
  )
}

function LimitsSkeleton() {
  return (
    <StatGroup>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="grid gap-2.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
        </div>
      ))}
    </StatGroup>
  )
}

/** Headline number at the top of a chart card. */
function Headline({ value, caption, delta, className }: { value: React.ReactNode; caption?: React.ReactNode; delta?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-4 gap-y-2", className)}>
      <div className="grid gap-0.5">
        <p className="text-2xl font-medium tracking-tight tabular-nums sm:text-3xl">{value}</p>
        {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
      </div>
      {delta}
    </div>
  )
}

function peakOf(traffic: Usage["trafficByHour"]) {
  let best = { row: 0, column: 0, value: -1 }
  traffic.forEach((row, r) => row.forEach((value, c) => value > best.value && (best = { row: r, column: c, value })))
  return best
}

/**
 * Usage & limits: the plan's limits up top, then the activity behind them — requests, builds,
 * bandwidth, traffic by hour and storage. Limits only; nothing here is a price (brief §6).
 */
export function UsageOverview() {
  const { data, isPending, error, refetch } = useUsage()

  if (error && !data) return <ErrorState title="Usage didn't load." onRetry={() => refetch()} />

  const loading = isPending
  const limit = (id: UsageLimit["id"]) => data?.limits.find((l) => l.id === id)

  const totalRequests = data ? sum(data.requests.map((d) => d.requests)) : 0
  const previousRequests = data ? sum(data.requests.map((d) => d.previous)) : 0
  const totalBuilds = data ? sum(data.builds.map((d) => d.succeeded + d.failed)) : 0
  const failedBuilds = data ? sum(data.builds.map((d) => d.failed)) : 0
  const buildMinutes = limit("build_minutes")
  const bandwidth = limit("bandwidth")
  const storage = limit("storage")
  const peak = data ? peakOf(data.trafficByHour) : null
  const hourlyAverage = data ? sum(data.trafficByHour.flat()) / (7 * 24) : 0
  const resetsIn = data ? daysUntil(data.period.end) : null

  return (
    <div className="grid gap-4">
      {loading || !data ? (
        <LimitsSkeleton />
      ) : (
        <StatGroup>
          {data.limits.map((l) => (
            <LimitStat key={l.id} limit={l} />
          ))}
        </StatGroup>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Requests" icon="activity" action={<span>Last 30 days</span>} loading={loading} skeletonHeight={260} className="lg:col-span-2">
          {data && (
            <>
              <Headline
                value={formatNumber(totalRequests)}
                caption="Requests served across all projects"
                delta={<Delta value={(totalRequests - previousRequests) / Math.max(1, previousRequests)} suffix="vs previous 30 days" />}
              />
              <ChartLegend series={requestSeries} />
              <AreaTimeSeries data={data.requests} series={requestSeries} format={formatCompact} height={260} />
            </>
          )}
        </ChartCard>

        <ChartCard title="Build minutes" icon="hammer" action={resetsIn != null && <span>Resets in {resetsIn}d</span>} loading={loading} skeletonHeight={300}>
          {buildMinutes && (
            <div className="grid flex-1 content-center gap-4 py-2">
              <TickGauge
                value={buildMinutes.used / buildMinutes.limit}
                color={limitTone(buildMinutes.used / buildMinutes.limit).label === "ok" ? "chart-1" : "brand"}
                label="Build minutes used"
                size={232}
              >
                <span className="text-xs text-muted-foreground">Used this period</span>
                <span className="text-3xl font-medium tracking-tight tabular-nums">{formatNumber(buildMinutes.used)}</span>
                <span className="text-xs text-muted-foreground tabular-nums">of {formatNumber(buildMinutes.limit)} minutes</span>
              </TickGauge>
              <p className="text-center text-xs text-muted-foreground">
                {formatNumber(buildMinutes.limit - buildMinutes.used)} minutes left · about {Math.round(buildMinutes.used / Math.max(1, totalBuilds))} min per build
              </p>
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Builds" icon="rocket" action={<span>Last 14 days</span>} loading={loading} skeletonHeight={220}>
          {data && (
            <>
              <Headline
                value={formatNumber(totalBuilds)}
                caption={`${formatPercent((totalBuilds - failedBuilds) / Math.max(1, totalBuilds), 0)} succeeded`}
                delta={<ChartLegend series={buildSeries} />}
              />
              <BarTimeSeries data={data.builds} series={buildSeries} stacked height={220} format={(v) => String(Math.round(v))} />
            </>
          )}
        </ChartCard>

        <ChartCard title="Bandwidth by project" icon="network" action={<span>This period</span>} loading={loading} skeletonHeight={220}>
          {data && bandwidth && (
            <>
              <Headline value={formatBytes(bandwidth.used)} caption={`of ${formatBytes(bandwidth.limit)} included`} />
              <TickMeter value={bandwidth.used / bandwidth.limit} color={limitTone(bandwidth.used / bandwidth.limit).label === "ok" ? "chart-1" : "brand"} label="Bandwidth used" className="mt-5" />
              <DotProgressList
                className="mt-2"
                items={data.bandwidthByProject.map((p) => ({ key: p.projectId, label: p.name, value: p.bytes }))}
                format={(v) => formatBytes(v)}
              />
            </>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Traffic by hour" icon="clock" action={<span>Last 7 days · UTC</span>} loading={loading} skeletonHeight={200} className="lg:col-span-2">
          {data && peak && (
            <>
              <Headline
                value={formatCompact(peak.value)}
                caption={`Peak · ${WEEKDAYS[peak.row]} ${HOURS[peak.column]}–${HOURS[(peak.column + 1) % 24]}`}
                delta={
                  <div className="grid text-right">
                    <span className="text-lg font-medium tabular-nums">{formatCompact(Math.round(hourlyAverage))}</span>
                    <span className="text-xs text-muted-foreground">Avg / hour</span>
                  </div>
                }
              />
              <Heatmap
                rows={WEEKDAYS}
                columns={HOURS}
                values={data.trafficByHour}
                format={(v) => `${formatNumber(v)} requests`}
                columnTicks={{ 0: "12a", 6: "6a", 12: "12p", 18: "6p", 23: "11p" }}
              />
            </>
          )}
        </ChartCard>

        <div className="grid gap-4">
          <ChartCard title="Storage" icon="database" loading={loading} skeletonHeight={90}>
            {data && storage && (
              <>
                <Headline value={formatBytes(storage.used)} caption={`of ${formatBytes(storage.limit)} · ${formatPercent(storage.used / storage.limit, 0)} used`} />
                <SegmentedMeter segments={data.storageByKind.map((s) => ({ key: s.kind, label: s.kind, value: s.bytes }))} format={(v) => formatBytes(v)} />
              </>
            )}
          </ChartCard>
          <ChartCard title="Uptime" icon="heart-pulse" action={<span>This period</span>} loading={loading} skeletonHeight={60}>
            {data && (
              <>
                <Headline value={formatPercent(data.uptime, 2)} caption="Running deployments answering health checks" />
                <TickMeter value={data.uptime} color="success" showLabel={false} height={28} label="Uptime" />
              </>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  )
}
