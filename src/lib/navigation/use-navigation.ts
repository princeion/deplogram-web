"use client"

import * as React from "react"
import { useParams, usePathname } from "next/navigation"

import { isFlagEnabled } from "@/lib/flags"
import { footerNavigation, navigationScopes } from "@/lib/navigation/config"
import { activeTrail, flattenItems, resolveScope, resolveSections } from "@/lib/navigation/resolve"
import type { NavContext, ResolvedNavItem, ResolvedNavScope, ResolvedNavSection } from "@/lib/navigation/types"

/** A reachable link plus where it lives — for search ("JWT decoder · Utilities"). */
export type SearchableNavItem = {
  item: ResolvedNavItem
  scopeId: string
  /** The scope's title, if it has one ("Utilities", "Settings"). */
  scopeTitle?: string
  /** From the footer (help, docs, feedback). */
  help?: boolean
}

export type AppNavigation = {
  /** The scope the sidebar shows for this route (workspace, a project, settings…). */
  scope: ResolvedNavScope | null
  /** Help/docs/feedback, pinned to the bottom in every scope. */
  footer: ResolvedNavSection[]
  /** Active chain inside the current scope — feeds the breadcrumbs. */
  trail: ResolvedNavItem[]
  /** Every link reachable from here, across scopes — feeds the command palette. */
  all: SearchableNavItem[]
}

/** Everything the app shell needs to render navigation for the current route. */
export function useAppNavigation(): AppNavigation {
  const pathname = usePathname()
  const params = useParams()

  return React.useMemo(() => {
    const context: NavContext = { pathname, params, isEnabled: isFlagEnabled }
    const scope = resolveScope(navigationScopes, context)
    const footer = resolveSections(footerNavigation, context)
    // Search covers every scope; links needing a param we don't have (e.g. projectId) drop out.
    const all: SearchableNavItem[] = [
      ...navigationScopes.flatMap((s) =>
        flattenItems(resolveSections(s.sections, context)).map((item) => ({ item, scopeId: s.id, scopeTitle: s.title }))
      ),
      ...flattenItems(footer).map((item) => ({ item, scopeId: "help", help: true })),
    ]
    return { scope, footer, trail: scope ? activeTrail(scope.sections) : [], all }
  }, [pathname, params])
}
