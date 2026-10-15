"use client"

import * as React from "react"
import { useFormContext, useFormState, useWatch } from "react-hook-form"

import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format"
import { useBranches, useGitConnection, useRepositories, type Repository } from "@/features/deploy/deploy"
import type { NewDeploymentValues } from "@/features/deploy/components/schema"
import { Icon } from "@/components/shared/icon"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { SelectField } from "@/components/forms"
import { ErrorState } from "@/components/app-shell/error-state"

function useDebounced<T>(value: T, ms = 250) {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), ms)
    return () => window.clearTimeout(id)
  }, [value, ms])
  return debounced
}

function ConnectionBar() {
  const { data, isPending } = useGitConnection()
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/30 px-3.5 py-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
        <Icon name="github" size="sm" />
      </span>
      <div className="grid min-w-0 flex-1 text-sm">
        {isPending ? (
          <Skeleton className="h-4 w-40" />
        ) : data?.connected ? (
          <>
            <span className="font-medium">GitHub</span>
            <span className="truncate text-xs text-muted-foreground">
              Connected as <span className="text-foreground">{data.account}</span>
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">GitHub isn&apos;t connected yet.</span>
        )}
      </div>
      {data?.connected && (
        <span className="flex items-center gap-1.5 text-xs text-success">
          <span className="size-1.5 rounded-full bg-success" />
          Connected
        </span>
      )}
    </div>
  )
}

function RepositoryRow({ repo, selected, onSelect }: { repo: Repository; selected: boolean; onSelect: () => void }) {
  const [owner, name] = repo.fullName.split("/")
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "group/repo relative flex w-full items-center gap-3 px-3.5 py-3 text-left outline-none transition-colors focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
        selected ? "bg-brand/[0.07]" : "hover:bg-muted/30"
      )}
    >
      {selected && <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-brand" />}
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background/40", selected && "border-brand/40 text-brand-ink")}>
        <Icon name={repo.private ? "shield" : "github"} size="sm" />
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="truncate text-sm">
          <span className="text-muted-foreground">{owner}/</span>
          <span className="font-medium">{name}</span>
        </span>
        <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          {repo.private && <span>Private</span>}
          {repo.private && <span aria-hidden>·</span>}
          <span>Updated {formatRelativeTime(repo.updatedAt)}</span>
          {repo.projectId && (
            <>
              <span aria-hidden>·</span>
              <span className="text-foreground/70">Already deployed</span>
            </>
          )}
        </span>
      </span>
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          selected ? "border-brand bg-brand text-brand-foreground" : "border-border group-hover/repo:border-foreground/40"
        )}
      >
        {selected && <Icon name="check" size="xs" />}
      </span>
    </button>
  )
}

/** Step 1 — which repository and branch. Picking a repository presets the branch and the project name. */
export function SourceStep({ onRepositoryChange }: { onRepositoryChange: (repo: Repository) => void }) {
  const { control, setValue } = useFormContext<NewDeploymentValues>()
  const { errors } = useFormState({ control, name: "repositoryId" })
  const repositoryId = useWatch({ control, name: "repositoryId" })
  const branch = useWatch({ control, name: "branch" })
  const [query, setQuery] = React.useState("")
  const q = useDebounced(query.trim())
  const repos = useRepositories(q)
  const branches = useBranches(repositoryId || undefined)
  const listRef = React.useRef<HTMLDivElement>(null)

  const select = (repo: Repository) => {
    setValue("repositoryId", repo.id, { shouldDirty: true, shouldValidate: true })
    setValue("branch", repo.defaultBranch, { shouldDirty: true })
    onRepositoryChange(repo)
  }

  // Arrow keys move through the list, like any radio group.
  const onListKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
    const items = [...(listRef.current?.querySelectorAll<HTMLButtonElement>("[role=radio]") ?? [])]
    const index = items.indexOf(document.activeElement as HTMLButtonElement)
    items[Math.min(items.length - 1, Math.max(0, index + (event.key === "ArrowDown" ? 1 : -1)))]?.focus()
    event.preventDefault()
  }

  const head = branches.data?.find((b) => b.name === branch)

  return (
    <div className="grid gap-5">
      <ConnectionBar />

      <div className="grid gap-2">
        <label htmlFor="repo-search" className="text-sm font-medium">
          Repository <span className="text-destructive">*</span>
        </label>
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
          <div className="relative border-b border-border/70">
            <Icon name="search" size="xs" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="repo-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your repositories"
              autoComplete="off"
              className="h-11 rounded-none border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
            {repos.isFetching && !repos.isPending && <span className="absolute inset-x-0 bottom-0 h-px overflow-hidden"><span className="block h-full w-1/3 animate-scan bg-brand" /></span>}
          </div>
          <div
            ref={listRef}
            role="radiogroup"
            aria-label="Repositories"
            aria-invalid={Boolean(errors.repositoryId)}
            onKeyDown={onListKeyDown}
            className="max-h-[22rem] divide-y divide-border/50 overflow-y-auto overscroll-contain"
          >
            {repos.isPending ? (
              Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex items-center gap-3 px-3.5 py-3">
                  <Skeleton className="size-9 rounded-lg" />
                  <div className="grid flex-1 gap-1.5">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              ))
            ) : repos.error ? (
              <ErrorState size="compact" title="Your repositories didn't load." onRetry={() => repos.refetch()} />
            ) : repos.data?.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No repositories match “{q}”.</p>
            ) : (
              repos.data?.map((repo) => <RepositoryRow key={repo.id} repo={repo} selected={repo.id === repositoryId} onSelect={() => select(repo)} />)
            )}
          </div>
        </div>
        {errors.repositoryId && (
          <p role="alert" className="text-sm text-destructive">
            {errors.repositoryId.message}
          </p>
        )}
      </div>

      {repositoryId && (
        <div className="grid animate-in gap-2 duration-300 fade-in slide-in-from-top-1">
          <SelectField
            control={control}
            name="branch"
            label="Branch"
            required
            disabled={branches.isPending}
            placeholder={branches.isPending ? "Loading branches…" : "Choose a branch"}
            options={(branches.data ?? []).map((b) => ({ value: b.name, label: b.name, icon: "git-branch" as const }))}
          />
          {head && (
            <p className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              <Icon name="git-commit" size="xs" className="shrink-0" />
              <span className="font-mono text-foreground">{head.commit.sha}</span>
              <span className="truncate">{head.commit.message}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
