"use client"

import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { formatDuration, formatRelativeTime } from "@/lib/format"
import { ApiError } from "@/lib/api-client"
import { isInProgress, useDeployment, useDeploymentLogs, type Deployment } from "@/features/deployments/deployments"
import { DeploymentStatus, ElapsedTime, deploymentStatusMeta } from "@/features/deployments/components/deployment-status"
import { DeploymentPipeline } from "@/features/deployments/components/deployment-pipeline"
import { useDeploymentActions } from "@/features/deployments/components/use-deployment-actions"
import { Icon, type IconName } from "@/components/shared/icon"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/app-shell/empty-state"
import { ErrorState } from "@/components/app-shell/error-state"
import { PageHeader } from "@/components/app-shell/page"
import { LogViewer } from "@/components/log-viewer"

const createdFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

const triggerLabel: Record<Deployment["trigger"], string> = { git: "Git push", manual: "Manual", redeploy: "Redeploy", rollback: "Rollback" }

function Meta({ icon, label, children }: { icon: IconName; label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 gap-1">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon name={icon} size="xs" />
        {label}
      </dt>
      <dd className="truncate text-sm">{children}</dd>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true">
      <div className="grid gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-80 max-w-full" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-[480px] rounded-xl" />
    </div>
  )
}

/**
 * One deployment: what it is (commit, branch, trigger), where it is in its lifecycle, and its
 * build log streaming live. Everything polls until the deployment settles.
 */
export function DeploymentDetail({ deploymentId }: { deploymentId: string }) {
  const { data: deployment, error, isPending, refetch } = useDeployment(deploymentId)
  const logs = useDeploymentLogs(deploymentId)
  const { startRedeploy, startRollback } = useDeploymentActions()

  // Arriving from "View build logs" (…#logs): bring the log into view once it's rendered.
  React.useEffect(() => {
    if (deployment && window.location.hash === "#logs") document.getElementById("logs")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [deployment])

  if (isPending) return <DetailSkeleton />
  if (error && !deployment) {
    return error instanceof ApiError && error.status === 404 ? (
      <EmptyState
        icon="rocket"
        title="This deployment doesn't exist."
        description="It may have been removed, or the link is wrong."
        actions={
          <Link href="/dashboard/deployments" className={cn(buttonVariants({ variant: "outline" }))}>
            All deployments
          </Link>
        }
      />
    ) : (
      <ErrorState title="This deployment didn't load." onRetry={() => refetch()} />
    )
  }

  const { label } = deploymentStatusMeta(deployment.state, deployment.live)
  const working = isInProgress(deployment.state)
  const canRollBack = deployment.state === "RUNNING" && !deployment.live

  return (
    <div className="grid gap-6">
      <PageHeader
        back={{ label: "Deployments", href: "/dashboard/deployments" }}
        title={deployment.commit.message}
        meta={
          <span className="flex items-center gap-2">
            <DeploymentStatus state={deployment.state} live={deployment.live} appearance="pill" />
            {deployment.live && <span className="rounded-full border border-success/40 px-2 py-0.5 text-xs font-medium text-success">Current</span>}
          </span>
        }
        description={
          <>
            {deployment.projectName} · <span className="font-mono">{deployment.commit.sha}</span> · {formatRelativeTime(deployment.createdAt)}
          </>
        }
        actions={
          <>
            {deployment.url && (
              <a href={`https://${deployment.url}`} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline" }))}>
                Visit
                <Icon name="arrow-up-right" />
              </a>
            )}
            {canRollBack && (
              <Button variant="outline" onClick={() => void startRollback(deployment)}>
                <Icon name="undo" />
                Roll back to this
              </Button>
            )}
            <Button variant={deployment.live || canRollBack ? "outline" : "default"} disabled={working} onClick={() => void startRedeploy(deployment)}>
              <Icon name="refresh" />
              Redeploy
            </Button>
          </>
        }
      />

      <DeploymentPipeline deployment={deployment} steps={logs.data?.steps}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          <Meta icon="folder" label="Project">
            <Link href={`/dashboard/projects/${deployment.projectId}`} className="hover:underline">
              {deployment.projectName}
            </Link>
          </Meta>
          <Meta icon="zap" label="Trigger">
            {triggerLabel[deployment.trigger]} by {deployment.commit.author.name}
          </Meta>
          <Meta icon="clock" label="Duration">
            {deployment.durationSeconds != null ? formatDuration(deployment.durationSeconds) : working ? <ElapsedTime since={deployment.createdAt} /> : "—"}
          </Meta>
          <Meta icon="calendar-clock" label="Created">
            <time dateTime={deployment.createdAt}>{createdFormat.format(new Date(deployment.createdAt))}</time>
          </Meta>
        </dl>
      </DeploymentPipeline>

      <section id="logs" aria-labelledby="logs-title" className="grid scroll-mt-20 gap-3">
        <div className="flex items-end justify-between gap-4">
          <h2 id="logs-title" className="text-base font-medium tracking-tight">
            {deployment.trigger === "rollback" ? "Deploy log" : "Build log"}
          </h2>
          {logs.data && <span className="text-xs text-muted-foreground tabular-nums">{logs.data.lines.length} lines</span>}
        </div>
        {logs.error && !logs.data ? (
          <ErrorState size="compact" title="The log didn't load." onRetry={() => logs.refetch()} />
        ) : (
          <LogViewer
            loading={logs.isPending}
            lines={logs.data?.lines.map((l) => ({ n: l.n, at: l.at, text: l.text, stream: l.stream, group: l.step })) ?? []}
            groups={logs.data?.steps}
            live={!logs.data?.done}
            liveLabel={label}
            fileName={`${deployment.projectName}-${deployment.id}`}
          />
        )}
      </section>
    </div>
  )
}
