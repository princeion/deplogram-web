"use client"

import Link from "next/link"

import { formatRelativeTime } from "@/lib/format"
import { GITHUB_APP_INSTALL_URL, useConnectGitHub, useDisconnectGitHub, useInstallations, type Installation } from "@/features/account/git"
import { useGitConnection } from "@/features/deploy/deploy"
import { useProjects } from "@/features/projects/projects"
import { notify, useConfirm } from "@/components/feedback"
import { Icon } from "@/components/shared/icon"
import { SettingRow, SettingsTable } from "@/components/shared/settings-table"
import { StatusDot } from "@/components/shared/status-dot"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/app-shell/error-state"
import { PageSection } from "@/components/app-shell/page"

/** Settings › Git connections: the GitHub account, where the app is installed, and what deploys from it. */
export function GitSettings() {
  const connection = useGitConnection()
  const connected = connection.data?.connected ?? false

  return (
    <>
      <PageSection title="GitHub" description="Pushes to a project's branch deploy it. Deplogram only reads code and posts deploy statuses.">
        {connection.isPending ? (
          <Skeleton className="h-14 rounded-xl" />
        ) : connection.isError ? (
          <ErrorState size="compact" title="Couldn't check your GitHub connection." onRetry={() => connection.refetch()} />
        ) : (
          <AccountRow connected={connected} account={connection.data.account} />
        )}
      </PageSection>
      {connected && <Installations />}
      {connected && <LinkedProjects />}
      <PageSection title="Other providers">
        <ul className="surface-raised divide-y divide-border/50 overflow-hidden rounded-xl">
          {["GitLab", "Bitbucket"].map((name) => (
            <li key={name} className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground">
              <Icon name="git-branch" size="sm" />
              {name}
              <span className="ml-auto rounded-full border border-border px-2 py-px text-[0.6875rem]">Soon</span>
            </li>
          ))}
        </ul>
      </PageSection>
    </>
  )
}

function AccountRow({ connected, account }: { connected: boolean; account: string | null }) {
  const connect = useConnectGitHub()
  const disconnect = useDisconnectGitHub()
  const confirm = useConfirm()
  return (
    <SettingsTable>
      <SettingRow
        label="Account"
        aside={
          connected ? (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() =>
                void confirm({
                  title: "Disconnect GitHub?",
                  description: "Your projects keep running, but pushes stop deploying and you can't start new projects from GitHub until you reconnect.",
                  confirmLabel: "Disconnect",
                  tone: "destructive",
                  action: async () => {
                    await disconnect.mutateAsync()
                    notify.success("GitHub disconnected")
                  },
                })
              }
            >
              Disconnect
            </Button>
          ) : (
            <Button
              size="sm"
              className="ml-auto"
              loading={connect.isPending}
              onClick={() =>
                connect.mutate(undefined, {
                  onError: (error) => notify.error(error, { title: "Couldn't reach GitHub" }),
                })
              }
            >
              <Icon name="github" /> Connect GitHub
            </Button>
          )
        }
      >
        <span className="flex min-w-0 items-center gap-2 px-2 text-sm">
          <Icon name="github" size="sm" />
          {connected ? (
            <>
              <span className="truncate font-mono">@{account}</span>
              <StatusDot tone="success" size="sm" />
              <span className="text-xs text-muted-foreground">Connected</span>
            </>
          ) : (
            <span className="text-muted-foreground">Not connected</span>
          )}
        </span>
      </SettingRow>
    </SettingsTable>
  )
}

function Installations() {
  const { data, isPending, isError, refetch } = useInstallations()
  return (
    <PageSection
      title="Where the app is installed"
      description="Which accounts and organisations Deplogram can see. Pick repositories on GitHub."
      actions={
        <a href={GITHUB_APP_INSTALL_URL} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
          <Icon name="plus" /> Add an organisation
        </a>
      }
    >
      {isPending ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : isError ? (
        <ErrorState size="compact" title="Installations didn't load." onRetry={() => refetch()} />
      ) : (
        <ul className="surface-raised divide-y divide-border/50 overflow-hidden rounded-xl">
          {data.items.map((installation) => (
            <InstallationRow key={installation.id} installation={installation} />
          ))}
        </ul>
      )}
    </PageSection>
  )
}

function InstallationRow({ installation }: { installation: Installation }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="surface-band grid size-9 shrink-0 place-items-center rounded-lg font-mono text-xs uppercase">{installation.account.slice(0, 2)}</span>
      <div className="grid min-w-0 flex-1 gap-0.5">
        <p className="flex items-center gap-2 text-sm">
          <span className="truncate font-medium">{installation.account}</span>
          <span className="text-xs text-muted-foreground">{installation.type === "organization" ? "organisation" : "personal"}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {installation.repositorySelection === "all" ? `All repositories (${installation.repositories})` : `${installation.repositories} selected repositories`} · installed{" "}
          {formatRelativeTime(installation.installedAt)}
        </p>
      </div>
      <a href={installation.settingsUrl} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "ghost", size: "sm" })}>
        Configure <Icon name="external-link" size="xs" />
      </a>
    </li>
  )
}

function LinkedProjects() {
  const { data, isPending } = useProjects()
  if (isPending) return <Skeleton className="h-32 rounded-xl" />
  if (!data?.length) return null
  return (
    <PageSection title="Deploying from GitHub" description={`${data.length} ${data.length === 1 ? "project" : "projects"} redeploy when their branch changes.`}>
      <ul className="surface-raised divide-y divide-border/50 overflow-hidden rounded-xl">
        {data.map((project) => (
          <li key={project.id}>
            <Link href={`/dashboard/projects/${project.id}/settings`} className="flex items-center gap-3 px-4 py-2.5 text-sm outline-none hover:bg-muted/40 focus-visible:bg-muted/40">
              <span className="w-40 shrink-0 truncate font-medium">{project.name}</span>
              <span className="min-w-0 flex-1 truncate font-mono text-[0.8125rem] text-muted-foreground">
                {project.repository}
                <span className="text-muted-foreground/60"> @ </span>
                {project.branch}
              </span>
              <Icon name="chevron-right" size="xs" className="text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </PageSection>
  )
}
