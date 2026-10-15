"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useGitConnection, useRepositories, type Repository } from "@/features/deploy/deploy"
import { Icon } from "@/components/shared/icon"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/app-shell/error-state"

type Tab = "all" | "new" | "deployed"

/** "3h", "2d", "5w" — compact, for a dense list. */
function shortAgo(iso: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
  if (minutes < 60) return `${minutes}m`
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h`
  if (minutes < 60 * 24 * 14) return `${Math.round(minutes / 60 / 24)}d`
  return `${Math.round(minutes / 60 / 24 / 7)}w`
}

function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("rounded-[5px] bg-foreground/[0.06] px-1.5 py-px font-mono text-[0.6875rem] text-muted-foreground", className)}>{children}</span>
}

function Row({ repo, selected, onSelect }: { repo: Repository; selected: boolean; onSelect: () => void }) {
  const [owner, name] = repo.fullName.split("/")
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        "relative grid w-full gap-1.5 rounded-lg px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
        selected ? "bg-foreground/[0.07]" : "hover:bg-foreground/[0.04]"
      )}
    >
      {selected && <span aria-hidden className="metal-brand absolute inset-y-2.5 left-0 w-[3px] rounded-full" />}
      <span className="flex min-w-0 items-center gap-2">
        <Icon name={repo.private ? "shield" : "github"} size="xs" className="shrink-0 text-muted-foreground" />
        <span className="min-w-0 truncate text-sm">
          <span className="text-muted-foreground">{owner}/</span>
          <span className={cn(selected && "font-medium")}>{name}</span>
        </span>
        <span className="ml-auto shrink-0 font-mono text-[0.6875rem] text-muted-foreground tabular-nums">{shortAgo(repo.updatedAt)}</span>
      </span>
      <span className="flex flex-wrap gap-1 pl-5">
        <Tag>{repo.defaultBranch}</Tag>
        {repo.private && <Tag>private</Tag>}
        {repo.projectId && <Tag className="text-success">deployed</Tag>}
      </span>
    </button>
  )
}

/**
 * The master list: your repositories, filterable by whether they're already deployed, searchable,
 * arrow-key navigable. Choosing one opens its configuration beside it.
 */
export function RepoList({ selectedId, onSelect, className }: { selectedId?: string; onSelect: (repo: Repository) => void; className?: string }) {
  const [tab, setTab] = React.useState<Tab>("all")
  const [query, setQuery] = React.useState("")
  const [q, setQ] = React.useState("")
  React.useEffect(() => {
    const id = window.setTimeout(() => setQ(query.trim()), 220)
    return () => window.clearTimeout(id)
  }, [query])

  const connection = useGitConnection()
  const repos = useRepositories(q)
  const all = repos.data ?? []
  const counts = { all: all.length, new: all.filter((r) => !r.projectId).length, deployed: all.filter((r) => r.projectId).length }
  const shown = all.filter((r) => (tab === "all" ? true : tab === "new" ? !r.projectId : Boolean(r.projectId)))
  const listRef = React.useRef<HTMLDivElement>(null)

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
    const items = [...(listRef.current?.querySelectorAll<HTMLButtonElement>("[role=option]") ?? [])]
    const index = items.indexOf(document.activeElement as HTMLButtonElement)
    items[Math.min(items.length - 1, Math.max(0, index + (event.key === "ArrowDown" ? 1 : -1)))]?.focus()
    event.preventDefault()
  }

  return (
    <div className={cn("flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card", className)}>
      <div className="grid gap-3 border-b border-border/60 p-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Icon name="github" size="sm" />
            Repositories
          </span>
          {connection.data?.connected && (
            <span className="flex items-center gap-1.5 font-mono text-[0.6875rem] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success" />
              {connection.data.account}
            </span>
          )}
        </div>

        {/* Segmented filter with counts. */}
        <div role="tablist" aria-label="Filter repositories" className="grid grid-cols-3 gap-0.5 rounded-lg bg-foreground/[0.05] p-0.5 text-xs">
          {(
            [
              ["all", "All"],
              ["new", "New"],
              ["deployed", "Deployed"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "rounded-md px-2 py-1.5 transition-colors",
                tab === id ? "bg-card text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.25),inset_0_1px_0_color-mix(in_oklab,var(--foreground)_8%,transparent)]" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label} <span className="text-muted-foreground tabular-nums">· {repos.isPending ? "–" : counts[id]}</span>
            </button>
          ))}
        </div>

        <label className="relative flex items-center">
          <Icon name="search" size="xs" className="pointer-events-none absolute left-2.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search repositories"
            className="h-8 w-full rounded-md bg-foreground/[0.04] pr-2 pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </label>
      </div>

      <div ref={listRef} role="listbox" aria-label="Repositories" onKeyDown={onKeyDown} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5">
        {repos.isPending ? (
          Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="grid gap-2 px-3 py-2.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="ml-5 h-3.5 w-24" />
            </div>
          ))
        ) : repos.error ? (
          <ErrorState size="compact" title="Repositories didn't load." onRetry={() => repos.refetch()} />
        ) : shown.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">{q ? `Nothing matches “${q}”.` : "Nothing here."}</p>
        ) : (
          shown.map((repo) => <Row key={repo.id} repo={repo} selected={repo.id === selectedId} onSelect={() => onSelect(repo)} />)
        )}
      </div>
    </div>
  )
}
