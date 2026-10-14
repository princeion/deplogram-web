"use client"

import Link from "next/link"

import { planLabel, useCurrentWorkspace } from "@/features/workspace/workspace"
import { NodeGraph } from "@/components/shared/node-graph"
import { Skeleton } from "@/components/ui/skeleton"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

/** Top of the sidebar: the product and the workspace's plan. Switching lives in the header. */
export function SidebarBrand() {
  const { data: workspace, isPending } = useCurrentWorkspace()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" render={<Link href="/dashboard" />} tooltip="Deplogram" className="group-data-[collapsible=icon]:justify-center">
          <span className="flex size-8 shrink-0 items-center justify-center [&_svg]:size-6!">
            <NodeGraph layout="mark" size="mark" state="live" className="size-6" />
          </span>
          <span className="grid min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold tracking-tight">Deplogram</span>
            {isPending ? (
              <Skeleton className="mt-1 h-3 w-10" />
            ) : (
              <span className="truncate text-xs text-muted-foreground">{workspace ? `${planLabel[workspace.plan]} plan` : "Your Galley"}</span>
            )}
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
