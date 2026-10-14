import type { IconName } from "@/components/shared/icon"
import type { FeatureFlag } from "@/lib/flags"

/** Route params as Next.js provides them (`useParams`, `PageProps["params"]`). */
export type RouteParams = Record<string, string | string[] | undefined>

/**
 * One link in the app. `href` is a route pattern: `[param]` segments are filled from the current
 * route params, so the same entry works for every project ("/dashboard/projects/[projectId]/logs").
 */
export type NavItem = {
  /** Stable id — React keys, analytics, tests. */
  id: string
  label: string
  href: string
  icon?: IconName
  /**
   * "prefix" (default): active on the href and everything under it.
   * "exact": active only on the href itself — for index routes like "/dashboard".
   */
  match?: "prefix" | "exact"
  /** More path prefixes that also mark this item active (e.g. Projects stays active on a project page). */
  activeFor?: readonly string[]
  /** Short text pill, e.g. "New" or a count. */
  badge?: string
  /** Planned but not built: shown, dimmed, not navigable. */
  soon?: boolean
  /** Only shown when this feature flag is on. */
  flag?: FeatureFlag
  /** Opens in a new tab (docs, status page). */
  external?: boolean
  /** Extra search terms for the command palette. */
  keywords?: readonly string[]
  /**
   * The breadcrumb label comes from data, not from `label` — the name of the param whose
   * record supplies it (e.g. "projectId" → the project's name). `label` is the fallback.
   */
  dynamicLabel?: string
  /** Nested links (rendered as a sub-list in the sidebar, flattened in search). */
  items?: readonly NavItem[]
}

/** A titled group of links in the sidebar. */
export type NavSection = {
  id: string
  /** Omit for an untitled first group. */
  label?: string
  items: readonly NavItem[]
}

/** A NavItem with its href filled in and its state computed for the current route. */
export type ResolvedNavItem = Omit<NavItem, "items"> & {
  href: string
  active: boolean
  items?: ResolvedNavItem[]
}

export type ResolvedNavSection = Omit<NavSection, "items"> & {
  items: ResolvedNavItem[]
}

/**
 * A scope is one "level" of the app with its own sidebar: the workspace, a project, settings, the
 * utilities, the APIs. The sidebar shows exactly one scope — the most specific one whose `match`
 * pattern covers the current path — so lists never nest.
 */
export type NavScope = {
  id: string
  /** Route pattern this scope covers, including everything under it ("/dashboard/projects/[projectId]"). */
  match: string
  /** Shown above the links (e.g. "Utilities"). Omit when the scope switcher already names it. */
  title?: string
  /** Link back to the parent scope, pinned at the top of the sidebar. */
  back?: { label: string; href: string }
  sections: readonly NavSection[]
}

export type ResolvedNavScope = Omit<NavScope, "sections" | "back"> & {
  back?: { label: string; href: string }
  sections: ResolvedNavSection[]
}

/** What resolution needs to know about "where we are". */
export type NavContext = {
  pathname: string
  params: RouteParams
  isEnabled: (flag: FeatureFlag) => boolean
}
