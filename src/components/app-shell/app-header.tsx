"use client"

import { cn } from "@/lib/utils"
import { useParams } from "next/navigation"

import { resolveHref } from "@/lib/navigation"
import { useAppNavigation } from "@/lib/navigation/use-navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { AccountMenu } from "@/components/app-shell/header/account-menu"
import { SearchButton } from "@/components/command-palette/search-button"
import { ProjectCommands } from "@/features/projects/components/project-commands"
import { CrumbLink, CrumbSeparator } from "@/components/app-shell/header/crumb"
import { PageSwitcher } from "@/components/app-shell/header/page-switcher"
import { ProjectSwitcher } from "@/components/app-shell/header/project-switcher"
import { WorkspaceSwitcher } from "@/components/app-shell/header/workspace-switcher"

/**
 * Top bar of every Galley page. The breadcrumb is a row of switchers — workspace (with plan),
 * project (inside one), the scope (Utilities, APIs, Settings) and the current page with its
 * siblings — all derived from the navigation registry and the route.
 */
export function AppHeader() {
  const { scope, trail } = useAppNavigation()
  const params = useParams()

  const projectId = typeof params.projectId === "string" ? params.projectId : undefined
  const current = trail.at(-1)
  const scopeRoot = scope?.title ? resolveHref(scope.match, params) : null

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 bg-app-frame px-3 sm:px-4">
      <SidebarTrigger className="shrink-0" />

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-0.5">
          <WorkspaceSwitcher />

          {scope?.id === "project" && projectId && (
            <>
              <CrumbSeparator />
              <ProjectSwitcher projectId={projectId} />
            </>
          )}

          {scope?.title && scopeRoot && (
            <>
              <CrumbSeparator className="hidden md:block" />
              <li className="hidden min-w-0 md:block">
                <CrumbLink href={scopeRoot}>{scope.title}</CrumbLink>
              </li>
            </>
          )}

          {/* On phones a project crumb leaves no room for the page; the sidebar has it. */}
          {scope && current && (
            <>
              <CrumbSeparator className={cn(projectId && "max-sm:hidden")} />
              <PageSwitcher scope={scope} current={current} className={cn(projectId && "max-sm:hidden")} />
            </>
          )}
        </ol>
      </nav>

      {projectId && <ProjectCommands projectId={projectId} />}

      <div className="flex shrink-0 items-center gap-1.5">
        <SearchButton />
        <ThemeToggle />
        <AccountMenu />
      </div>
    </header>
  )
}
