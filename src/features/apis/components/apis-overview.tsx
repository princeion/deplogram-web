"use client"

import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { formatCompact, formatNumber } from "@/lib/format"
import { API_BASE_URL, apiCatalog, apiList, useApiUsage, type ApiUsage } from "@/features/apis/apis"
import { RecentRequests, SnippetPane } from "@/features/apis/components/api-parts"
import { BarTimeSeries, ChartCard, ChartLegend, Sparkline, UsageMeter, limitTone, type ChartSeries } from "@/components/charts"
import { CopyButton } from "@/components/shared/copy-button"
import { Icon } from "@/components/shared/icon"
import { Skeleton } from "@/components/ui/skeleton"
import { PageSection } from "@/components/app-shell/page"

const series: ChartSeries<"otp" | "email" | "images" | "qr">[] = [
  { key: "otp", label: "OTP", color: "brand" },
  { key: "email", label: "Email", color: "chart-1" },
  { key: "images", label: "Image transform", color: "chart-3" },
  { key: "qr", label: "QR codes", color: "chart-5" },
]

const quickStart = { method: "POST" as const, path: "/v1/otp/send", body: { to: "+2348012345678", channel: "sms" } }

/** One API's month at a glance; the whole tile opens its page. */
function ApiTile({ usage }: { usage: ApiUsage["apis"][number] }) {
  const api = apiCatalog[usage.id]
  const tone = limitTone(usage.limit ? usage.used / usage.limit : 0)
  return (
    <Link
      href={`/dashboard/apis/${api.id}`}
      className="group grid content-start gap-3 rounded-xl border border-border/70 bg-card p-4 outline-none transition-colors hover:border-border focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <span className="flex items-center gap-2.5">
        <span className="surface-sunken grid size-8 place-items-center rounded-lg text-muted-foreground group-hover:text-foreground">
          <Icon name={api.icon} size="sm" />
        </span>
        <span className="font-medium">{api.name}</span>
        <Icon name="arrow-right" size="xs" className="ml-auto text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
      <span className="font-mono text-sm">
        {formatNumber(usage.used)}
        <span className="text-muted-foreground">
          {" "}
          / {formatCompact(usage.limit)} {api.unit}
        </span>
      </span>
      <UsageMeter used={usage.used} limit={usage.limit} label={`${api.name} used`} />
      <Sparkline values={usage.daily.map((d) => d.requests)} height={32} color={usage.id === "otp" ? "brand" : "chart-1"} />
      <span className="flex items-center justify-between font-mono text-xs text-muted-foreground">
        <span>p50 {usage.p50Ms} ms</span>
        <span className={cn(tone.label !== "ok" && tone.text)}>{tone.label === "ok" ? `${(usage.successRate * 100).toFixed(1)}% ok` : tone.label === "near" ? "near limit" : "limit reached"}</span>
      </span>
    </Link>
  )
}

export function ApisOverview() {
  const { data, isPending, error, refetch } = useApiUsage()

  const daily = React.useMemo(() => {
    if (!data) return []
    const [first] = data.apis
    return (first?.daily ?? []).map((day, i) => ({ date: day.date, ...Object.fromEntries(data.apis.map((a) => [a.id, a.daily[i]?.requests ?? 0])) }))
  }, [data])

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {isPending ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />) : data?.apis.map((usage) => <ApiTile key={usage.id} usage={usage} />)}
      </div>

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
        <ChartCard title="Requests" icon="analytics" action={<span>Last 30 days</span>} loading={isPending} error={error} onRetry={() => refetch()} skeletonHeight={300}>
          {data && (
            <>
              <ChartLegend series={series} />
              <BarTimeSeries data={daily} series={series} stacked height={260} format={formatCompact} />
            </>
          )}
        </ChartCard>

        <section aria-labelledby="quick-start" className="grid gap-3">
          <div className="grid gap-2 rounded-xl border border-border/70 bg-card p-4">
            <h2 id="quick-start" className="text-sm font-medium">
              Quick start
            </h2>
            <ol className="grid gap-1.5 text-sm text-muted-foreground">
              <li>
                <span className="font-mono text-foreground">1</span>{" "}
                <Link href="/dashboard/apis/keys?new=1" className="text-foreground underline-offset-2 hover:underline">
                  Create a key
                </Link>{" "}
                and set it as <span className="font-mono text-foreground">DEPLOGRAM_KEY</span>.
              </li>
              <li>
                <span className="font-mono text-foreground">2</span> Call any API with it as a Bearer token:
              </li>
            </ol>
            <div className="surface-sunken flex items-center gap-2 rounded-lg py-1 pr-1 pl-3 font-mono text-xs">
              <span className="text-muted-foreground">base</span>
              <span className="min-w-0 flex-1 truncate">{API_BASE_URL}</span>
              <CopyButton value={API_BASE_URL} />
            </div>
          </div>
          <SnippetPane request={quickStart} compact />
        </section>
      </div>

      <PageSection
        title="Recent requests"
        description="From every key, newest first."
        actions={
          <span className="hidden gap-3 text-sm sm:flex">
            {apiList.map((api) => (
              <Link key={api.id} href={`/dashboard/apis/${api.id}`} className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
                {api.name}
              </Link>
            ))}
          </span>
        }
      >
        <RecentRequests limit={10} />
      </PageSection>
    </>
  )
}
