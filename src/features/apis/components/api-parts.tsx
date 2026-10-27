"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { formatNumber, formatPercent, formatRelativeTime } from "@/lib/format"
import { API_BASE_URL, apiCatalog, useApiRequests, useApiUsage, type ApiId, type ApiRequest, type TryRequest, type TryResult } from "@/features/apis/apis"
import { snippet, snippetLanguages, type SnippetLanguage } from "@/features/apis/snippets"
import { useLocalPreference } from "@/hooks/use-local-preference"
import { CodeEditor } from "@/components/code-editor/code-editor"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { Sparkline, UsageMeter, limitTone } from "@/components/charts"
import { CopyButton } from "@/components/shared/copy-button"
import { Icon } from "@/components/shared/icon"
import { Pane } from "@/components/shared/pane"
import { Segmented } from "@/components/shared/segmented"
import { StatusDot } from "@/components/shared/status-dot"
import { Skeleton } from "@/components/ui/skeleton"

const LANGUAGES = snippetLanguages.map((l) => l.value)

/** "POST" in its colour. */
export function MethodTag({ method, className }: { method: string; className?: string }) {
  return <span className={cn("font-mono font-medium", method === "GET" ? "text-success" : "text-brand-ink", className)}>{method}</span>
}

/** The request as code — curl, JavaScript or Python — following the form as it changes. */
export function SnippetPane({ request, compact = false, className }: { request: TryRequest; compact?: boolean; className?: string }) {
  const [language, setLanguage] = useLocalPreference<SnippetLanguage>("apis:language", "curl", LANGUAGES)
  const code = snippet(language, request)
  const file = snippetLanguages.find((l) => l.value === language)!.file
  return (
    <Pane title="Code" icon="code" actions={<CopyButton value={code} />} className={className} bodyClassName="flex flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3.5 py-2">
        <Segmented label="Language" size="sm" value={language} onChange={setLanguage} options={snippetLanguages.map(({ value, label }) => ({ value, label }))} />
        {!compact && <span className="hidden font-mono text-xs text-muted-foreground sm:inline">DEPLOGRAM_KEY from your environment</span>}
      </div>
      <div className={cn("min-h-0 grow", compact ? "h-40" : "h-72")}>
        <CodeEditor modelPath={`apis/snippet/${file}`} filePath={file} value={code} onChange={() => {}} readOnly minimal />
      </div>
    </Pane>
  )
}

/** What came back: status, time, and the JSON — with an optional rendered preview above it. */
export function ResponsePane({ result, pending, preview }: { result: TryResult | null; pending: boolean; preview?: React.ReactNode }) {
  const ok = result && result.status < 400
  const body = result ? JSON.stringify(result.body, null, 2) : ""
  return (
    <Pane
      title={
        result ? (
          <span className="flex items-center gap-2">
            Response
            <span className={cn("rounded px-1.5 py-px font-mono text-[0.6875rem]", ok ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive")}>{result.status}</span>
            <span className="font-mono text-muted-foreground">{result.durationMs} ms</span>
          </span>
        ) : (
          "Response"
        )
      }
      icon="arrow-left"
      actions={result && <CopyButton value={body} />}
    >
      {pending ? (
        <div className="grid gap-2 p-3.5">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/5" />
        </div>
      ) : result ? (
        <>
          {preview && ok && <div className="border-b border-border/60">{preview}</div>}
          <div className="h-48">
            <CodeEditor modelPath="apis/response.json" filePath="response.json" value={body} onChange={() => {}} readOnly minimal />
          </div>
        </>
      ) : (
        <p className="px-3.5 py-6 text-sm text-muted-foreground">Send the request to see what comes back.</p>
      )}
    </Pane>
  )
}

/** Every endpoint of one API, with the base URL. */
export function EndpointList({ api }: { api: ApiId }) {
  return (
    <Pane title="Endpoints" icon="plug" actions={<CopyButton value={API_BASE_URL} label="Base URL" />}>
      <ul className="divide-y divide-border/50">
        {apiCatalog[api].endpoints.map((e) => (
          <li key={e.path} className="grid gap-0.5 px-3.5 py-2.5">
            <span className="flex items-center gap-2 font-mono text-[0.8125rem]">
              <MethodTag method={e.method} className="w-10 shrink-0" />
              <span className="truncate">{e.path}</span>
            </span>
            <span className="pl-12 text-xs text-muted-foreground">{e.summary}</span>
          </li>
        ))}
      </ul>
    </Pane>
  )
}

/** One API's period: used of its limit, success rate, p50, and the last 30 days. */
export function ApiUsageStrip({ api }: { api: ApiId }) {
  const { data, isPending } = useApiUsage()
  const usage = data?.apis.find((a) => a.id === api)
  if (isPending) return <Skeleton className="h-[5.5rem] rounded-xl" />
  if (!usage) return null
  const tone = limitTone(usage.limit ? usage.used / usage.limit : 0)
  const resets = data && new Date(data.period.end).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
  return (
    <section aria-label="Usage this period" className="grid gap-x-8 gap-y-4 rounded-xl border border-border/70 bg-card p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,0.6fr))_minmax(0,1fr)] sm:p-5">
      <div className="grid content-start gap-2">
        <p className="text-xs text-muted-foreground">This period · resets {resets}</p>
        <p className="font-mono text-sm">
          <span className="text-lg text-foreground">{formatNumber(usage.used)}</span>
          <span className="text-muted-foreground">
            {" "}
            of {formatNumber(usage.limit)} {apiCatalog[api].unit}
          </span>
        </p>
        <UsageMeter used={usage.used} limit={usage.limit} label={`${apiCatalog[api].name} used`} />
        {tone.label !== "ok" && <p className={cn("text-xs", tone.text)}>{tone.label === "reached" ? "Limit reached — requests are refused until it resets." : "Nearly at the limit."}</p>}
      </div>
      <Figure label="Succeeded" value={formatPercent(usage.successRate)} />
      <Figure label="Median time" value={`${usage.p50Ms} ms`} />
      <div className="grid content-start gap-2">
        <p className="text-xs text-muted-foreground">Requests, last 30 days</p>
        <Sparkline values={usage.daily.map((d) => d.requests)} height={40} />
      </div>
    </section>
  )
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-mono text-lg tabular-nums">{value}</p>
    </div>
  )
}

/** The latest calls — for one API, or across all of them. */
export function RecentRequests({ api, limit = 12 }: { api?: ApiId; limit?: number }) {
  const { data, isPending, error, refetch } = useApiRequests(api)
  const columns = React.useMemo<DataTableColumn<ApiRequest>[]>(
    () => [
      ...(api
        ? []
        : [
            {
              id: "api",
              header: "API",
              className: "w-40",
              hideBelow: "sm" as const,
              skeleton: "w-20",
              cell: (r: ApiRequest) => (
                <span className="inline-flex items-center gap-2">
                  <Icon name={apiCatalog[r.api].icon} size="xs" className="text-muted-foreground" />
                  {apiCatalog[r.api].name}
                </span>
              ),
            },
          ]),
      {
        id: "request",
        header: "Request",
        className: "max-w-0 w-full",
        skeleton: "w-48",
        cell: (r) => (
          <span className="flex min-w-0 items-center gap-2 font-mono text-[0.8125rem]">
            <MethodTag method={r.method} className="w-9 shrink-0" />
            <span className="truncate">{r.path}</span>
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        className: "w-24",
        skeleton: "w-10",
        cell: (r) => (
          <span className="inline-flex items-center gap-2 font-mono text-[0.8125rem]">
            <StatusDot tone={r.status < 400 ? "success" : "danger"} size="sm" />
            {r.status}
          </span>
        ),
      },
      {
        id: "time",
        header: "Time",
        className: "w-24",
        hideBelow: "md",
        skeleton: "w-12",
        cell: (r) => <span className="font-mono text-[0.8125rem] text-muted-foreground tabular-nums">{r.durationMs} ms</span>,
      },
      {
        id: "key",
        header: "Key",
        className: "w-40",
        hideBelow: "lg",
        skeleton: "w-24",
        cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.keyPrefix}…</span>,
      },
      {
        id: "at",
        header: "When",
        align: "end",
        className: "w-28",
        skeleton: "w-14",
        cell: (r) => (
          <time dateTime={r.at} title={new Date(r.at).toLocaleString()} className="whitespace-nowrap text-muted-foreground">
            {formatRelativeTime(r.at)}
          </time>
        ),
      },
    ],
    [api]
  )
  return (
    <DataTable
      caption={api ? `Recent ${apiCatalog[api].name} requests` : "Recent API requests"}
      columns={columns}
      data={data?.items.slice(0, limit)}
      getRowId={(r) => r.id}
      isLoading={isPending}
      error={error}
      onRetry={() => refetch()}
      skeletonRows={5}
      empty={<p className="px-4 py-8 text-center text-sm text-muted-foreground">No requests yet. Try one above, or call the API with a key.</p>}
    />
  )
}
