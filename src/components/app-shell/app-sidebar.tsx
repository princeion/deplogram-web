"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "motion/react"

import type { ResolvedNavScope } from "@/lib/navigation"
import { useAppNavigation } from "@/lib/navigation/use-navigation"
import { Icon } from "@/components/shared/icon"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { SidebarBrand } from "@/components/app-shell/sidebar-brand"
import { SidebarNav } from "@/components/app-shell/sidebar-nav"

/** Workspace is the root; every other scope sits one level in. */
const depthOf = (scope: ResolvedNavScope | null) => (scope && scope.id !== "workspace" ? 1 : 0)

/**
 * Remembers which way the sidebar moved: +1 going into a scope (slide from the right), -1 going
 * back out (slide from the left), 0 on first render (no animation).
 */
function useScopeDirection(scope: ResolvedNavScope | null) {
  const [state, setState] = React.useState({ id: scope?.id, depth: depthOf(scope), direction: 0 })
  if (scope?.id !== state.id) {
    const depth = depthOf(scope)
    setState({ id: scope?.id, depth, direction: depth >= state.depth ? 1 : -1 })
  }
  return state.direction
}

function BackLink({ back }: { back: NonNullable<ResolvedNavScope["back"]> }) {
  const { isMobile, setOpenMobile } = useSidebar()
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          render={<Link href={back.href} onClick={() => isMobile && setOpenMobile(false)} />}
          tooltip={back.label}
          className="text-muted-foreground"
        >
          <Icon name="arrow-left" />
          <span>{back.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

/**
 * Your Galley's sidebar. Context-switching: it shows one scope at a time — the workspace, a
 * project, settings, utilities or APIs — chosen from the URL, with a link back to the parent
 * scope. Help links stay pinned at the bottom. Collapses to an icon rail (⌘B); a sheet on mobile.
 */
export function AppSidebar({ footer }: { footer?: React.ReactNode }) {
  const { scope, footer: footerSections } = useAppNavigation()
  const direction = useScopeDirection(scope)

  return (
    <Sidebar collapsible="icon" className="border-r-0!">
      <SidebarHeader>
        <SidebarBrand />
      </SidebarHeader>

      <SidebarContent>
        {scope && (
          <motion.div
            key={scope.id}
            className="flex flex-col"
            initial={direction === 0 ? false : { opacity: 0, x: direction * 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {scope.back && (
              <SidebarGroup className="pb-0">
                <BackLink back={scope.back} />
              </SidebarGroup>
            )}
            {scope.title && (
              <SidebarGroup className="py-0">
                <SidebarGroupLabel className="text-sm font-medium text-sidebar-foreground">{scope.title}</SidebarGroupLabel>
              </SidebarGroup>
            )}
            <SidebarNav sections={scope.sections} />
          </motion.div>
        )}
        {/* Help, docs and feedback sit at the bottom in every scope. */}
        <SidebarNav sections={footerSections} className="mt-auto" />
      </SidebarContent>

      {footer && <SidebarFooter>{footer}</SidebarFooter>}
      <SidebarRail />
    </Sidebar>
  )
}
