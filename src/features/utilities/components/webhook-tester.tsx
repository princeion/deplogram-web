"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { formatBytes, formatRelativeTime } from "@/lib/format"
import {
  useClearRequests,
  useReplay,
  useRotateEndpoint,
  useSendSample,
  useWebhookEndpoint,
  useWebhookRequests,
  webhookSamples,
  type WebhookRequest,
} from "@/features/utilities/webhooks"
import { CodeEditor } from "@/components/code-editor/code-editor"
import { notify, useConfirm } from "@/components/feedback"
import { Icon } from "@/components/shared/icon"
import { Segmented } from "@/components/shared/segmented"
import { StatusDot } from "@/components/shared/status-dot"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/app-shell/empty-state"
import { CopyButton, Pane } from "@/features/utilities/components/utility-shell"

const METHOD_TONE: Record<string, string> = {
  GET: "text-success",
  POST: "text-brand-ink",
  PUT: "text-chart-2",
  PATCH: "text-chart-2",
  DELETE: "text-destructive",
}

/**
 * A URL that catches whatever is sent to it: requests arrive in the list as they come (the page
 * listens while open), each opens to its body, headers and query, and can be replayed at your
 * own server. Samples (GitHub, Paystack, a form) show what to expect before wiring anything.
 */
export function WebhookTester() {
  const endpoint = useWebhookEndpoint()
  const requests = useWebhookRequests()
  const rotate = useRotateEndpoint()
  const clear = useClearRequests()
  const sendSample = useSendSample()
  const confirm = useConfirm()
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  const items = requests.data?.items ?? []
  const selected = items.find((r) => r.id === selectedId) ?? items[0] ?? null

  // A new request arriving takes the focus only when nothing was picked by hand.
  const pickedByHand = React.useRef(false)
  React.useEffect(() => {
    if (!pickedByHand.current && items[0]) setSelectedId(items[0].id)
  }, [items])

  return (
    <div className="grid gap-4">
      {/* The capture URL. */}
      <section className="grid gap-3 rounded-xl border border-border/70 bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="flex items-center gap-2 text-sm font-medium">
            <StatusDot tone="success" motion="live" size="sm" /> Listening
          </h2>
          <span className="text-sm text-muted-foreground">Send anything to this address and it appears below.</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="surface-sunken flex h-11 min-w-0 flex-1 items-center gap-2 rounded-lg px-3.5">
            <Icon name="webhook" size="sm" className="shrink-0 text-muted-foreground" />
            {endpoint.data ? <span className="truncate font-mono text-sm">{endpoint.data.url}</span> : <Skeleton className="h-4 w-72" />}
          </div>
          <CopyButton value={endpoint.data?.url ?? ""} label="Copy URL" />
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button loading={sendSample.isPending} />}>
              {!sendSample.isPending && <Icon name="play" />} Send a test request
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>Send a sample to your URL</DropdownMenuLabel>
              {webhookSamples.map((s) => (
                <DropdownMenuItem
                  key={s.id}
                  onClick={() =>
                    sendSample.mutate(s.id, {
                      onSuccess: (request) => {
                        pickedByHand.current = false
                        setSelectedId(request.id)
                      },
                      onError: (error) => notify.error(error, { title: "Couldn't send the sample" }),
                    })
                  }
                >
                  <Icon name="webhook" /> {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            Try it: <span className="font-mono text-foreground/85">curl -X POST {endpoint.data?.url ?? "…"} -d &apos;{`{"hello":"world"}`}&apos;</span>
          </span>
          <button
            type="button"
            className="ml-auto underline-offset-2 hover:text-foreground hover:underline"
            onClick={() =>
              void confirm({
                title: "Get a new URL?",
                description: "The current URL stops working straight away and its requests are cleared. Update anything that sends to it.",
                confirmLabel: "Get a new URL",
                action: async () => {
                  await rotate.mutateAsync()
                  notify.success("New URL ready")
                },
              })
            }
          >
            New URL
          </button>
        </div>
      </section>

      {/* Requests: the list, and the one selected. */}
      {requests.isPending ? (
        <div className="grid gap-3 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon="webhook" title="Nothing received yet." description="Point a service at the URL above, or send a test request to see what arrives." />
      ) : (
        <div className="grid items-start gap-3 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <Pane
            title={`${items.length} ${items.length === 1 ? "request" : "requests"}`}
            icon="list"
            actions={
              <Button variant="ghost" size="xs" onClick={() => clear.mutate()} disabled={clear.isPending}>
                Clear
              </Button>
            }
            bodyClassName="max-h-[34rem] overflow-y-auto"
          >
            <ul className="divide-y divide-border/50">
              {items.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      pickedByHand.current = true
                      setSelectedId(r.id)
                    }}
                    aria-pressed={selected?.id === r.id}
                    className={cn(
                      "relative grid w-full gap-0.5 px-3.5 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
                      selected?.id === r.id ? "bg-muted" : "hover:bg-muted/50"
                    )}
                  >
                    {selected?.id === r.id && <span aria-hidden className="metal-brand absolute inset-y-1.5 left-0 w-[3px] rounded-full" />}
                    <span className="flex items-center gap-2 font-mono text-sm">
                      <span className={cn("font-medium", METHOD_TONE[r.method] ?? "text-foreground")}>{r.method}</span>
                      <span className="truncate">{r.path}</span>
                      <span className="ml-auto shrink-0 font-sans text-xs text-muted-foreground">{formatRelativeTime(r.receivedAt)}</span>
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {sourceOf(r)} · {formatBytes(r.size)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Pane>
          {selected && <RequestDetail key={selected.id} request={selected} />}
        </div>
      )}
    </div>
  )
}

/** "GitHub", "Paystack" — from the user agent, for the list. */
function sourceOf(request: WebhookRequest) {
  const agent = request.headers.find(([name]) => name === "user-agent")?.[1] ?? ""
  if (agent.startsWith("GitHub")) return "GitHub"
  if (agent.startsWith("Paystack")) return "Paystack"
  if (agent.includes("curl")) return "curl"
  return request.contentType ?? "unknown type"
}

function RequestDetail({ request }: { request: WebhookRequest }) {
  const [tab, setTab] = React.useState<"body" | "headers" | "query">("body")
  const replay = useReplay()
  const [target, setTarget] = React.useState("https://")
  const [outcome, setOutcome] = React.useState<{ status: number | null; durationMs: number; error: string | null } | null>(null)
  const isJson = request.contentType?.includes("json")
  const pretty = React.useMemo(() => {
    if (!isJson) return request.body
    try {
      return JSON.stringify(JSON.parse(request.body), null, 2)
    } catch {
      return request.body
    }
  }, [request.body, isJson])

  return (
    <div className="grid min-w-0 gap-3">
      <Pane
        title={
          <span className="flex items-center gap-2 font-mono">
            <span className={cn(METHOD_TONE[request.method])}>{request.method}</span> {request.path}
          </span>
        }
        actions={<CopyButton value={request.body} label="Copy body" />}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3.5 py-2">
          <Segmented
            label="Part"
            size="sm"
            value={tab}
            onChange={setTab}
            options={[
              { value: "body", label: "Body" },
              { value: "headers", label: "Headers", count: request.headers.length },
              { value: "query", label: "Query", count: request.query.length },
            ]}
          />
          <span className="font-mono text-xs text-muted-foreground">
            {request.ip} · {formatBytes(request.size)} · {new Date(request.receivedAt).toLocaleTimeString("en-GB")}
          </span>
        </div>
        {tab === "body" &&
          (request.body ? (
            <div className="h-80">
              <CodeEditor modelPath={`webhooks/${request.id}`} filePath={isJson ? "body.json" : "body.txt"} value={pretty} onChange={() => {}} readOnly minimal />
            </div>
          ) : (
            <p className="px-3.5 py-6 text-sm text-muted-foreground">No body.</p>
          ))}
        {tab !== "body" && (
          <dl className="divide-y divide-border/50">
            {(tab === "headers" ? request.headers : request.query).map(([name, value]) => (
              <div key={name} className="grid grid-cols-[12rem_minmax(0,1fr)] gap-3 px-3.5 py-2 font-mono text-[0.8125rem]">
                <dt className="truncate text-muted-foreground">{name}</dt>
                <dd className="break-all">{value}</dd>
              </div>
            ))}
            {(tab === "headers" ? request.headers : request.query).length === 0 && <p className="px-3.5 py-6 text-sm text-muted-foreground">None.</p>}
          </dl>
        )}
      </Pane>

      <Pane title="Replay" icon="refresh">
        <form
          className="grid gap-2 p-3.5"
          onSubmit={(e) => {
            e.preventDefault()
            setOutcome(null)
            replay.mutate({ id: request.id, url: target.trim() }, { onSuccess: setOutcome, onError: (error) => notify.error(error, { title: "Couldn't replay" }) })
          }}
        >
          <div className="flex gap-2">
            <Input value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Send it to" placeholder="https://your-app.dpl.app/webhooks" className="font-mono" />
            <Button type="submit" variant="outline" loading={replay.isPending} disabled={target.trim().length < 10}>
              Replay
            </Button>
          </div>
          {outcome &&
            (outcome.error ? (
              <p className="flex items-center gap-1.5 text-sm text-destructive">
                <Icon name="circle-x" size="xs" /> {outcome.error}
              </p>
            ) : (
              <p className={cn("flex items-center gap-1.5 text-sm", outcome.status && outcome.status < 400 ? "text-success" : "text-destructive")}>
                <Icon name={outcome.status && outcome.status < 400 ? "check" : "circle-x"} size="xs" />
                Your server answered <span className="font-mono">{outcome.status}</span> in {outcome.durationMs} ms.
              </p>
            ))}
          <p className="text-xs text-muted-foreground">Sends the same method, headers and body again — useful after fixing a handler.</p>
        </form>
      </Pane>
    </div>
  )
}
