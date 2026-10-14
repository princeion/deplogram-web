"use client"

import { useRouter } from "next/navigation"

import { formatRelativeTime } from "@/lib/format"
import { isInProgress, useRedeploy, useRollback, type Deployment } from "@/features/deployments/deployments"
import { Icon } from "@/components/shared/icon"
import { notify, useConfirm } from "@/components/feedback"
import type { RowAction } from "@/components/data-table"

/** The deployment's page; its build log is on it (`#logs`). */
export const deploymentHref = (d: Pick<Deployment, "id" | "projectId">) => `/dashboard/projects/${d.projectId}/deployments/${d.id}`
const logsHref = (d: Deployment) => `${deploymentHref(d)}#logs`

/** The commit a deploy action is about, for the confirm dialog. */
export function CommitDetails({ deployment }: { deployment: Deployment }) {
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

/**
 * Redeploy and roll back: confirm first, run from the dialog, then report back (with Undo for
 * rollbacks). `rowActions` builds the ⋯ menu for a deployment row.
 */
export function useDeploymentActions() {
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

  const rowActions = (deployment: Deployment): RowAction[] => [
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

  return { rowActions, startRedeploy, startRollback, pending: redeploy.isPending || rollback.isPending }
}

