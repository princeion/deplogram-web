"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useActivity, type ActivityEvent, type ActivityFilter } from "@/features/activity/activity"
import { ActivityItem } from "@/features/activity/components/activity-item"
import { useProjects } from "@/features/projects/projects"
import { Segmented } from "@/components/shared/segmented"
import { Icon } from "@/components/shared/icon"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EmptyState } from "@/components/app-shell/empty-state"
import { ErrorState } from "@/components/app-shell/error-state"

const dayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" })
const dayKey = (iso: string) => iso.slice(0, 10)

/** "Today", "Yesterday", else "Monday 12 October". */
function dayLabel(key: string) {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
  return key === today ? "Today" : key === yesterday ? "Yesterday" : dayFormat.format(new Date(`${key}T12:00:00Z`))
}

function ProjectFilter({ value, onChange }: { value?: string; onChange: (id?: string) => void }) {
  const { data: projects } = useProjects()
  const current = projects?.find((p) => p.id === value)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button type="button" className="surface-sunken flex h-9 items-center gap-2 rounded-xl px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            <Icon name="folder" size="xs" className="text-muted-foreground" />
            <span className={cn(!current && "text-muted-foreground")}>{current?.name ?? "All projects"}</span>
            <Icon name="chevrons-up-down" size="xs" className="text-muted-foreground" />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => onChange(undefined)}>
          All projects
          {!value && <Icon name="check" size="xs" className="ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {projects?.map((p) => (
          <DropdownMenuItem key={p.id} onClick={() => onChange(p.id)}>
            <span className="truncate">{p.name}</span>
            {p.id === value && <Icon name="check" size="xs" className="ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * The workspace's activity — who deployed what, what went live or failed, which variables and
 * settings changed — as a timeline grouped by day, newest first. Filter by kind and project; new
 * events appear on their own; older ones load on demand.
 */
export function ActivityFeed() {
  const [filter, setFilter] = React.useState<ActivityFilter>("all")
  const [project, setProject] = React.useState<string | undefined>()
  const query = useActivity(filter, project)
  const events = React.useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data])

  // Events that weren't there on the previous render glide in.
  const seen = React.useRef<Set<string> | null>(null)
  const fresh = new Set(seen.current ? events.filter((e) => !seen.current!.has(e.id)).map((e) => e.id) : [])
  React.useEffect(() => {
    seen.current = new Set(events.map((e) => e.id))
  }, [events])

  const days = React.useMemo(() => {
    const groups: { key: string; events: ActivityEvent[] }[] = []
    for (const event of events) {
      const key = dayKey(event.at)
      const last = groups.at(-1)
      if (last?.key === key) last.events.push(event)
      else groups.push({ key, events: [event] })
    }
    return groups
  }, [events])

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Kind of activity"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "deploys", label: "Deploys" },
            { value: "changes", label: "Changes" },
            { value: "failures", label: "Failures" },
          ]}
        />
        <span className="ml-auto">
          <ProjectFilter value={project} onChange={setProject} />
        </span>
      </div>

      {query.isPending ? (
        <div className="grid gap-2 rounded-2xl border border-border/70 bg-card p-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      ) : query.error && !query.data ? (
        <ErrorState title="Activity didn't load." onRetry={() => query.refetch()} />
      ) : events.length === 0 ? (
        <EmptyState icon="activity" title="Nothing here yet." description={filter === "all" && !project ? "Deployments, variable and settings changes show up here as they happen." : "Nothing matches these filters."} />
      ) : (
        <div className="grid gap-5">
          {days.map((day) => (
            <section key={day.key} className="grid gap-2">
              <h2 className="sticky top-14 z-10 -mx-1 flex items-center gap-3 bg-app-panel/90 px-1 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                {dayLabel(day.key)}
                <span className="h-px flex-1 bg-border/70" />
                <span className="font-mono tabular-nums">{day.events.length}</span>
              </h2>
              <ol className="relative rounded-2xl border border-border/70 bg-card px-4 py-1.5 before:absolute before:top-5 before:bottom-5 before:left-8 before:w-px before:bg-border/80">
                {day.events.map((event) => (
                  <ActivityItem key={event.id} event={event} className={cn(fresh.has(event.id) && "animate-in duration-500 fade-in slide-in-from-top-2 ease-out-expo")} />
                ))}
              </ol>
            </section>
          ))}
          {query.hasNextPage && (
            <div className="flex justify-center">
              <Button variant="outline" loading={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
                Load older activity
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
