"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { formatRelativeTime } from "@/lib/format"
import { runtimes } from "@/content/runtimes"
import { isInProgress, useDeployments, useRedeploy, useRollback, type Deployment, type DeploymentTrigger } from "@/features/deployments/deployments"
import { useProjects } from "@/features/projects/projects"
import { DeploymentStatus } from "@/features/deployments/components/deployment-status"
import { Icon, type IconName } from "@/components/shared/icon"
import { StatusDot, type StatusTone } from "@/components/shared/status-dot"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/app-shell/empty-state"
import { notify, useConfirm } from "@/components/feedback"
import {
  DataTable,
  DataTableToolbar,
  useTableUrlState,
  type DataTableColumn,
  type FilterDefinition,
  type RowAction,
} from "@/components/data-table"

const PAGE_SIZE = 20

const triggerMeta: Record<DeploymentTrigger, { label: string; icon: IconName }> = {
  git: { label: "Git push", icon: "git-commit" },
  manual: { label: "Manual", icon: "user" },
  redeploy: { label: "Redeploy", icon: "refresh" },
  rollback: { label: "Rollback", icon: "undo" },
}

const runtimeIcon = (id: string): IconName => runtimes.find((r) => r.id === id)?.icon ?? "package"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
}

const statusDot = (tone: StatusTone) => <StatusDot tone={tone} size="sm" className="mx-[5px]" />

const baseFilters: FilterDefinition[] = [
  {
    id: "status",
    label: "Status",
    options: [
      { value: "running", label: "Running", leading: statusDot("success") },
      { value: "in_progress", label: "In progress", leading: statusDot("progress") },
      { value: "failed", label: "Failed", leading: statusDot("danger") },
    ],
  },
  {
    id: "trigger",
    label: "Trigger",
    options: (Object.keys(triggerMeta) as DeploymentTrigger[]).map((value) => ({ value, label: triggerMeta[value].label, icon: triggerMeta[value].icon })),
  },
  {
    id: "branch",
    label: "Branch",
    icon: "git-branch",
    options: ["main", "develop", "gh-pages", "feat/webhooks", "feat/audit-log", "fix/reports"].map((value) => ({ value, label: value })),
  },
]

const logsHref = (d: Deployment) => `/dashboard/projects/${d.projectId}/logs?deployment=${d.id}`

/** The commit a deploy action is about, for the confirm dialog. */
function CommitDetails({ deployment }: { deployment: Deployment }) {
  return (
    <span className="grid gap-1">
      <span className="truncate font-medium">{deployment.commit.message}</span>
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
        <span>{deployment.commit.sha}</span>
        <span className="inline-flex items-center gap-1">
          <Icon name="git-branch" size="xs" />
          {deployment.commit.branch}
        </span>
        <span className="font-sans">{formatRelativeTime(deployment.createdAt)}</span>
      </span>
    </span>
  )
}

/** Redeploy and roll back: confirm first, run from the dialog, then report back (with Undo for rollbacks). */
function useDeploymentActions() {
  const confirm = useConfirm()
  const router = useRouter()
  const redeploy = useRedeploy()
  const rollback = useRollback()

  const startRedeploy = async (d: Deployment) => {
    let created: Deployment | undefined
    const confirmed = await confirm({
      title: `Redeploy ${d.projectName}?`,
      description: "Builds this commit again with the project's current settings. The live deployment keeps serving traffic until the new one is running.",
      details: <CommitDetails deployment={d} />,
      confirmLabel: "Redeploy",
      icon: "refresh",
      action: async () => {
        created = await redeploy.mutateAsync(d.id)
      },
    })
    if (confirmed && created) {
      const next = created
      notify.success("Redeploy started", {
        description: `${d.projectName} · ${d.commit.sha} is queued to build.`,
        action: { label: "View logs", onClick: () => router.push(logsHref(next)) },
      })
    }
  }

  const rollForward = (deploymentId: string, projectName: string) =>
    notify.promise(rollback.mutateAsync(deploymentId), { loading: `Rolling ${projectName} forward…`, success: "Roll back undone", error: "Couldn't undo the roll back." })

  const startRollback = async (d: Deployment) => {
    let previousLiveId: string | null = null
    const confirmed = await confirm({
      title: `Roll back ${d.projectName} to ${d.commit.sha}?`,
      description: "Traffic moves to this deployment as soon as it's running again. Its existing build is reused, so there's no new build.",
      details: <CommitDetails deployment={d} />,
      confirmLabel: "Roll back",
      icon: "undo",
      action: async () => {
        previousLiveId = (await rollback.mutateAsync(d.id)).previousLiveId
      },
    })
    if (!confirmed) return
    const undoTo = previousLiveId
    if (undoTo) notify.undo(`Rolling back to ${d.commit.sha}`, () => void rollForward(undoTo, d.projectName).catch(() => {}), { description: d.projectName })
    else notify.success(`Rolling back to ${d.commit.sha}`, { description: d.projectName })
  }

  return (deployment: Deployment): RowAction[] => [
    ...(deployment.url ? [{ label: `Visit ${deployment.url}`, icon: "arrow-up-right" as const, href: `https://${deployment.url}`, external: true }] : []),
    { label: "View build logs", icon: "scroll-text", href: logsHref(deployment) },
    {
      label: "Copy commit SHA",
      icon: "copy",
      onSelect: () =>
        navigator.clipboard.writeText(deployment.commit.sha).then(
          () => notify.success("Commit SHA copied", { description: deployment.commit.sha }),
          (error) => notify.error(error, { title: "Couldn't copy" })
        ),
    },
    ...(isInProgress(deployment.state) ? [] : [{ label: "Redeploy", icon: "refresh" as const, separated: true, onSelect: () => void startRedeploy(deployment) }]),
    ...(deployment.state === "RUNNING" && !deployment.live ? [{ label: "Roll back to this", icon: "undo" as const, onSelect: () => void startRollback(deployment) }] : []),
  ]
}

/**
 * Deployments across projects (or one project, with `projectId`): Vercel-style dense rows with
 * status + duration, commit, branch and trigger; filters and paging live in the URL.
 */
export function DeploymentsTable({ projectId }: { projectId?: string }) {
  const { data: projects } = useProjects()
  const rowActions = useDeploymentActions()

  const filters = React.useMemo<FilterDefinition[]>(
    () =>
      projectId
        ? baseFilters
        : [
            {
              id: "project",
              label: "Project",
              icon: "folder",
              options: (projects ?? []).map((p) => ({ value: p.id, label: p.name, icon: runtimeIcon(p.runtime) })),
            },
            ...baseFilters,
          ],
    [projectId, projects]
  )

  const state = useTableUrlState({ filters, defaultSort: { key: "created", desc: true } })
  const query = useDeployments({
    q: state.search || undefined,
    status: state.filters.status,
    project: projectId ? [projectId] : state.filters.project,
    branch: state.filters.branch,
    trigger: state.filters.trigger,
    sort: state.sort ? `${state.sort.desc ? "-" : ""}${state.sort.key}` : undefined,
    page: state.page,
    pageSize: PAGE_SIZE,
  })

  const columns = React.useMemo<DataTableColumn<Deployment>[]>(
    () => [
      ...(projectId
        ? []
        : [
            {
              id: "project",
              header: "Project",
              hideBelow: "sm" as const,
              className: "w-44",
              skeleton: "w-28",
              cell: (d: Deployment) => (
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/50">
                    <Icon name={runtimeIcon(d.runtime)} size="xs" />
                  </span>
                  <span className="truncate font-medium">{d.projectName}</span>
                </span>
              ),
            },
          ]),
      {
        id: "commit",
        header: "Commit",
        skeleton: "w-56",
        cell: (d) => (
          <span className="grid min-w-0 gap-0.5">
            <span className="truncate">{d.commit.message}</span>
            {/* On small screens the hidden columns' essentials fold in here. */}
            <span className="truncate font-mono text-xs text-muted-foreground md:hidden">
              {!projectId && <span className="font-sans sm:hidden">{d.projectName} · </span>}
              {d.commit.sha} · {d.commit.branch}
            </span>
          </span>
        ),
        className: "max-w-0 w-full",
      },
      {
        id: "status",
        header: "Status",
        sortKey: "duration",
        className: "sm:w-40",
        skeleton: "w-24",
        cell: (d) => (
          <span className="flex items-center gap-2">
            <DeploymentStatus state={d.state} live={d.live} durationSeconds={d.durationSeconds} startedAt={d.createdAt} compactOnMobile />
            {d.live && <span className="hidden rounded-full sm:inline border border-success/40 px-1.5 text-[0.625rem] font-medium text-success">Current</span>}
          </span>
        ),
      },
      {
        id: "trigger",
        header: "Trigger",
        hideBelow: "xl",
        className: "w-32",
        skeleton: "w-20",
        cell: (d) => (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Icon name={triggerMeta[d.trigger].icon} size="xs" />
            {triggerMeta[d.trigger].label}
          </span>
        ),
      },
      {
        id: "sha",
        header: "Commit SHA",
        hideBelow: "md",
        className: "w-28",
        skeleton: "w-16",
        cell: (d) => <span className="font-mono text-xs">{d.commit.sha}</span>,
      },
      {
        id: "branch",
        header: "Branch",
        hideBelow: "lg",
        className: "w-36",
        skeleton: "w-16",
        cell: (d) => (
          <span className="inline-flex min-w-0 items-center gap-1.5 font-mono text-xs">
            <Icon name="git-branch" size="xs" className="shrink-0 text-muted-foreground" />
            <span className="truncate">{d.commit.branch}</span>
          </span>
        ),
      },
      {
        id: "created",
        header: "Created",
        sortKey: "created",
        align: "end",
        className: "w-32",
        skeleton: "w-16",
        cell: (d) => (
          <span className="inline-flex items-center justify-end gap-2 text-muted-foreground">
            <time dateTime={d.createdAt} title={new Date(d.createdAt).toLocaleString()} className="whitespace-nowrap">
              {formatRelativeTime(d.createdAt)}
            </time>
            <span title={d.commit.author.name} className="hidden size-6 items-center justify-center rounded-full bg-muted text-[0.625rem] font-medium text-foreground sm:flex">
              {initials(d.commit.author.name)}
            </span>
          </span>
        ),
      },
    ],
    [projectId]
  )

  return (
    <div className="grid gap-4">
      <DataTableToolbar state={state} filters={filters} searchPlaceholder="Search commits, SHAs, branches…" />
      <DataTable
        caption="Deployments"
        columns={columns}
        data={query.data?.items}
        getRowId={(d) => d.id}
        rowHref={(d) => `/dashboard/projects/${d.projectId}/deployments/${d.id}`}
        rowLabel={(d) => `${d.projectName}: ${d.commit.message}`}
        rowActions={rowActions}
        isLoading={query.isPending}
        isFetching={query.isPlaceholderData}
        error={query.error}
        onRetry={() => query.refetch()}
        filtered={state.hasFilters}
        empty={<EmptyState variant="plain" icon="rocket" title="No deployments yet." description="Deployments appear here as soon as you deploy a project." />}
        emptyFiltered={
          <EmptyState
            variant="plain"
            size="compact"
            icon="search"
            title="No deployments match."
            description="Try a different search, or remove some filters."
            actions={
              <Button variant="outline" size="sm" onClick={state.clearFilters}>
                Clear filters
              </Button>
            }
          />
        }
        sort={state.sort}
        onSortChange={state.setSort}
        pagination={query.data ? { page: query.data.page, pageSize: query.data.pageSize, total: query.data.total, onPageChange: state.setPage } : undefined}
      />
    </div>
  )
}
