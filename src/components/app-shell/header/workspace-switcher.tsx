"use client"

import Link from "next/link"

import { planLabel, useCurrentWorkspace } from "@/features/workspace/workspace"
import { Icon } from "@/components/shared/icon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { CrumbTrigger } from "@/components/app-shell/header/crumb"

function PlanBadge({ plan }: { plan: string }) {
  return <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[0.6875rem] leading-none font-medium text-brand-ink">{plan}</span>
}

/** First breadcrumb segment: the workspace and its plan. Teams come after the MVP. */
export function WorkspaceSwitcher() {
  const { data: workspace, isPending } = useCurrentWorkspace()
  const name = workspace?.name ?? "Your Galley"

  return (
    <li className="min-w-0">
      <DropdownMenu>
        <CrumbTrigger label={`Workspace: ${name}`}>
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand to-amber-400 text-[0.625rem] font-semibold text-white">
            {name.replace(/^your\s+/i, "").charAt(0).toUpperCase()}
          </span>
          {isPending ? (
            <Skeleton className="h-4 w-20" />
          ) : (
            <>
              <span className="hidden truncate sm:inline">{name}</span>
              {workspace && <PlanBadge plan={planLabel[workspace.plan]} />}
            </>
          )}
        </CrumbTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground">Workspace</DropdownMenuLabel>
            <DropdownMenuItem render={<Link href="/dashboard" />}>
              <span className="truncate">{name}</span>
              {workspace && <PlanBadge plan={planLabel[workspace.plan]} />}
              <Icon name="check" size="xs" className="ml-auto" />
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/dashboard/usage" />}>
            <Icon name="gauge" />
            Usage & limits
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
            <Icon name="settings" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <Icon name="users" />
            Create a team
            <span className="ml-auto text-xs text-muted-foreground">Soon</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}
