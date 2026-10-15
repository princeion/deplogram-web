"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Icon } from "@/components/shared/icon"
import { StatusDot, type StatusMotion, type StatusTone } from "@/components/shared/status-dot"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { notify } from "@/components/feedback"
import { parseAnsi, stripAnsi } from "@/components/log-viewer/ansi"

export type LogLine = {
  n: number
  at: string
  text: string
  stream: "stdout" | "stderr"
  group?: string
  /** Explicit severity (runtime logs); otherwise inferred from stderr + "warn". */
  level?: "info" | "warn" | "error"
  /** A short source label shown before the text ("req", "app"). */
  tag?: string
}
export type LogGroup = { id: string; label: string; state: "pending" | "running" | "succeeded" | "failed" | "skipped"; startedAt: string | null; endedAt: string | null }

const groupDot: Record<LogGroup["state"], { tone: StatusTone; motion: StatusMotion; dim?: boolean }> = {
  pending: { tone: "muted", motion: "still", dim: true },
  running: { tone: "progress", motion: "progress" },
  succeeded: { tone: "success", motion: "still" },
  failed: { tone: "danger", motion: "still" },
  skipped: { tone: "muted", motion: "still", dim: true },
}

const clock = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })

/** 2840 → "2.8s", 74_000 → "1m 14s". */
function formatMs(ms: number) {
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`
}

/** Seconds ticking while a step runs. */
function useNow(active: boolean) {
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(id)
  }, [active])
  return now
}

function GroupDuration({ group }: { group: LogGroup }) {
  const now = useNow(group.state === "running")
  if (!group.startedAt) return <span className="text-muted-foreground/60">{group.state === "skipped" ? "Skipped" : "Waiting"}</span>
  const end = group.endedAt ? new Date(group.endedAt).getTime() : now
  return <span className="tabular-nums">{formatMs(Math.max(0, end - new Date(group.startedAt).getTime()))}</span>
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"))
  return (
    <>
      {parts.map((part, i) =>
        i % 2 ? (
          <mark key={i} className="rounded-[3px] bg-brand/30 px-px text-foreground">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

const Line = React.memo(function Line({
  line,
  query,
  showTime,
  wrap,
  fresh,
  selected,
  onSelect,
}: {
  line: LogLine
  query: string
  showTime: boolean
  wrap: boolean
  fresh: boolean
  selected: boolean
  onSelect: (n: number) => void
}) {
  const plain = stripAnsi(line.text)
  const level = line.level ?? (line.stream === "stderr" ? (/\bwarn(ing)?\b/i.test(plain) ? "warn" : "error") : "info")
  return (
    <div
      data-line={line.n}
      className={cn(
        "group/line flex gap-3 px-3 hover:bg-foreground/[0.035] sm:px-4",
        level === "warn" && "bg-brand/[0.05] text-brand-ink",
        level === "error" && "bg-destructive/[0.07] text-destructive",
        selected && "bg-foreground/[0.07] shadow-[inset_2px_0_0_var(--brand)]",
        fresh && "animate-in duration-300 fade-in slide-in-from-bottom-1 motion-reduce:animate-none"
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(line.n)}
        className="h-[1.6rem] w-8 shrink-0 self-start text-right text-muted-foreground/50 tabular-nums select-none hover:text-foreground"
        aria-label={`Line ${line.n}`}
      >
        {line.n}
      </button>
      {showTime && <time className="shrink-0 text-muted-foreground/60 tabular-nums select-none max-sm:hidden">{clock.format(new Date(line.at))}</time>}
      {line.tag && <span className="w-7 shrink-0 text-muted-foreground/70 select-none">{line.tag}</span>}
      <span className={cn("min-w-0 flex-1", wrap ? "break-words whitespace-pre-wrap" : "whitespace-pre")}>
        {query ? (
          <Highlight text={plain} query={query} />
        ) : (
          parseAnsi(line.text).map((segment, i) => (
            <span key={i} className={segment.className}>
              {segment.text}
            </span>
          ))
        )}
      </span>
    </div>
  )
})

/**
 * A log, live. Lines group under collapsible steps with their state and duration; while `live`,
 * new lines slide in, a cursor blinks at the end, and the view follows the newest line — scroll up
 * to read and it stops following, with a pill to jump back. Search filters to matching lines and
 * highlights them; lines can be selected, and the whole log copied or downloaded.
 */
export function LogViewer({
  lines,
  groups,
  live = false,
  liveLabel = "Running",
  loading = false,
  fileName = "log",
  height = "min(640px, 72vh)",
  toolbar,
  className,
}: {
  lines: readonly LogLine[]
  groups?: readonly LogGroup[]
  live?: boolean
  /** Shown beside the cursor while live: "Building", "Deploying". */
  liveLabel?: string
  loading?: boolean
  /** Extra controls in the toolbar, after search (filters, pause). */
  toolbar?: React.ReactNode
  /** Download name, without extension. */
  fileName?: string
  height?: string
  className?: string
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [query, setQuery] = React.useState("")
  const [wrap, setWrap] = React.useState(true)
  const [showTime, setShowTime] = React.useState(true)
  const [following, setFollowing] = React.useState(true)
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set())
  const [selected, setSelected] = React.useState<number | null>(null)
  const [unseen, setUnseen] = React.useState(0)

  // Lines present on first paint appear instantly; only lines that arrive later animate in.
  const firstBatch = React.useRef<number | null>(null)
  if (firstBatch.current === null && !loading) firstBatch.current = lines.at(-1)?.n ?? 0
  const lastSeen = React.useRef(lines.at(-1)?.n ?? 0)

  const needle = query.trim().toLowerCase()
  const visible = React.useMemo(() => (needle ? lines.filter((l) => stripAnsi(l.text).toLowerCase().includes(needle)) : lines), [lines, needle])

  // Follow the end while following; otherwise count what arrived since.
  React.useLayoutEffect(() => {
    const el = scrollRef.current
    const newest = lines.at(-1)?.n ?? 0
    if (!el) return
    if (following) {
      el.scrollTop = el.scrollHeight
      lastSeen.current = newest
      setUnseen(0)
    } else if (newest > lastSeen.current) {
      setUnseen(newest - lastSeen.current)
    }
  }, [lines, following, collapsed, needle])

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 32
    if (atBottom !== following) setFollowing(atBottom)
  }

  const jumpToLatest = () => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
    setFollowing(true)
  }

  const plainText = () => lines.map((l) => `${l.at}  ${stripAnsi(l.text)}`).join("\n")
  const copyAll = () =>
    navigator.clipboard.writeText(plainText()).then(
      () => notify.success("Log copied", { description: `${lines.length} lines` }),
      (error) => notify.error(error, { title: "Couldn't copy the log" })
    )
  const download = () => {
    const url = URL.createObjectURL(new Blob([plainText() + "\n"], { type: "text/plain" }))
    const a = Object.assign(document.createElement("a"), { href: url, download: `${fileName}.log` })
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleGroup = (id: string) =>
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const renderLine = (line: LogLine) => (
    <Line
      key={line.n}
      line={line}
      query={needle}
      showTime={showTime}
      wrap={wrap}
      fresh={line.n > (firstBatch.current ?? Infinity)}
      selected={selected === line.n}
      onSelect={(n) => setSelected((current) => (current === n ? null : n))}
    />
  )

  const sections = groups?.length
    ? groups.map((group) => ({ group, lines: visible.filter((l) => l.group === group.id) })).filter((section) => !needle || section.lines.length > 0)
    : [{ group: null, lines: visible }]

  return (
    <div className={cn("flex min-w-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-card", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/70 px-3 py-2 sm:px-4">
        <label className="relative flex min-w-40 flex-1 items-center sm:max-w-72">
          <Icon name="search" size="xs" className="pointer-events-none absolute left-2.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search log"
            aria-label="Search log"
            className="h-8 w-full rounded-full border border-border/70 bg-transparent pr-3 pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          />
        </label>
        {needle && (
          <span className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
            {visible.length} {visible.length === 1 ? "match" : "matches"}
          </span>
        )}
        {toolbar}
        <div className="ml-auto flex items-center gap-0.5">
          <Button variant="ghost" size="xs" aria-pressed={showTime} onClick={() => setShowTime((v) => !v)} className={cn(!showTime && "text-muted-foreground")}>
            <Icon name="clock" />
            <span className="hidden sm:inline">Time</span>
          </Button>
          <Button variant="ghost" size="xs" aria-pressed={wrap} onClick={() => setWrap((v) => !v)} className={cn(!wrap && "text-muted-foreground")}>
            <Icon name="layout" />
            <span className="hidden sm:inline">Wrap</span>
          </Button>
          <Button variant="ghost" size="icon-xs" aria-label="Copy log" onClick={copyAll} disabled={!lines.length}>
            <Icon name="copy" />
          </Button>
          <Button variant="ghost" size="icon-xs" aria-label="Download log" onClick={download} disabled={!lines.length}>
            <Icon name="upload" className="rotate-180" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          role="log"
          aria-live={live ? "polite" : "off"}
          aria-busy={loading}
          className="overflow-auto pb-2 font-mono text-[0.78rem] leading-[1.6rem]"
          style={{ height }}
        >
          {loading ? (
            <div className="grid gap-2.5 px-4 py-2">
              {Array.from({ length: 12 }, (_, i) => (
                <Skeleton key={i} className="h-3.5" style={{ width: `${30 + ((i * 37) % 55)}%` }} />
              ))}
            </div>
          ) : (
            <>
              {sections.map(({ group, lines: groupLines }) =>
                group ? (
                  <section key={group.id} className={cn(group.state === "pending" && "opacity-55")}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      aria-expanded={!collapsed.has(group.id)}
                      disabled={!groupLines.length && !needle}
                      className="sticky top-0 z-10 flex w-full items-center gap-2.5 bg-card px-3 py-1 font-sans text-sm shadow-[0_1px_0_var(--border)] hover:bg-[color-mix(in_oklab,var(--card),var(--foreground)_4%)] disabled:cursor-default disabled:hover:bg-card sm:px-4"
                    >
                      <Icon name="chevron-right" size="xs" className={cn("text-muted-foreground transition-transform duration-200", !collapsed.has(group.id) && groupLines.length > 0 && "rotate-90", groupLines.length === 0 && "invisible")} />
                      <StatusDot {...groupDot[group.state]} size="sm" />
                      <span className={cn("font-medium", group.state === "failed" && "text-destructive")}>{group.label}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        <GroupDuration group={group} />
                      </span>
                    </button>
                    {!collapsed.has(group.id) && groupLines.length > 0 && <div className="pb-1.5">{groupLines.map(renderLine)}</div>}
                  </section>
                ) : (
                  <div key="all">{groupLines.map(renderLine)}</div>
                )
              )}
              {needle && visible.length === 0 && <p className="px-4 py-6 font-sans text-sm text-muted-foreground">No lines match “{query.trim()}”.</p>}
              {live && !needle && (
                <div className="flex items-center gap-3 px-3 sm:px-4" aria-hidden>
                  <span className="w-8" />
                  <span className="inline-block h-3.5 w-[0.55rem] animate-blink bg-foreground/80" />
                  <span className="animate-text-shimmer bg-[linear-gradient(110deg,var(--muted-foreground)_40%,var(--brand)_50%,var(--muted-foreground)_60%)] bg-size-[250%_100%] bg-clip-text font-sans text-xs text-transparent motion-reduce:animate-none">
                    {liveLabel}…
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {!following && (
          <button
            type="button"
            onClick={jumpToLatest}
            className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 animate-in items-center gap-1.5 rounded-full border border-border/70 bg-popover/95 px-3 py-1.5 text-xs font-medium backdrop-blur-md duration-200 fade-in slide-in-from-bottom-2 hover:bg-muted"
          >
            <Icon name="arrow-up" size="xs" className="rotate-180" />
            {unseen > 0 ? `${unseen} new ${unseen === 1 ? "line" : "lines"}` : "Jump to latest"}
          </button>
        )}
      </div>
    </div>
  )
}
