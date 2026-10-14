import type {
  NavContext,
  NavItem,
  NavScope,
  NavSection,
  ResolvedNavItem,
  ResolvedNavScope,
  ResolvedNavSection,
  RouteParams,
} from "@/lib/navigation/types"

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/** "/dashboard/projects/[projectId]" → matches that path and everything under it, any projectId. */
function patternToRegExp(pattern: string) {
  const source = pattern
    .split("/")
    .map((segment) => (/^\[[^\]]+\]$/.test(segment) ? "[^/]+" : escapeRegExp(segment)))
    .join("/")
  return new RegExp(`^${source}(?:/|$)`)
}

const segmentCount = (pattern: string) => pattern.split("/").filter(Boolean).length

/** The most specific scope whose pattern covers the path (more segments wins). */
export function matchScope(scopes: readonly NavScope[], pathname: string): NavScope | undefined {
  return scopes
    .filter((scope) => patternToRegExp(scope.match).test(pathname))
    .sort((a, b) => segmentCount(b.match) - segmentCount(a.match))[0]
}

/** The scope for the current route, with its links resolved. */
export function resolveScope(scopes: readonly NavScope[], context: NavContext): ResolvedNavScope | null {
  const scope = matchScope(scopes, context.pathname)
  if (!scope) return null
  return {
    ...scope,
    back: scope.back && { ...scope.back, href: resolveHref(scope.back.href, context.params) ?? scope.back.href },
    sections: resolveSections(scope.sections, context),
  }
}

/**
 * Fills `[param]` segments of a route pattern from route params.
 * Returns null when a param is missing — the link doesn't apply on this route.
 *
 *   resolveHref("/dashboard/projects/[projectId]/logs", { projectId: "prj_1" }) → "/dashboard/projects/prj_1/logs"
 */
export function resolveHref(pattern: string, params: RouteParams = {}): string | null {
  let missing = false
  const href = pattern.replace(/\[([^\]]+)\]/g, (_, key: string) => {
    const value = params[key]
    const segment = Array.isArray(value) ? value.map(encodeURIComponent).join("/") : value && encodeURIComponent(value)
    if (!segment) missing = true
    return segment ?? ""
  })
  return missing ? null : href
}

const withinPath = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`)

/** Whether a link is the current page (or, with "prefix" matching, an ancestor of it). */
export function isActiveHref(
  href: string,
  pathname: string,
  { match = "prefix", activeFor = [] }: Pick<NavItem, "match" | "activeFor"> = {}
): boolean {
  const self = match === "exact" ? pathname === href : withinPath(pathname, href)
  return self || activeFor.some((prefix) => withinPath(pathname, prefix))
}

function resolveItem(item: NavItem, context: NavContext): ResolvedNavItem | null {
  if (item.flag && !context.isEnabled(item.flag)) return null
  const href = item.external ? item.href : resolveHref(item.href, context.params)
  if (href === null) return null

  const items = item.items?.map((child) => resolveItem(child, context)).filter((child) => child !== null)
  const active =
    !item.external && !item.soon && (isActiveHref(href, context.pathname, item) || Boolean(items?.some((child) => child.active)))

  return { ...item, href, active, items }
}

/** Resolves a navigation config for the current route: flags applied, hrefs filled, active state set. */
export function resolveSections(sections: readonly NavSection[], context: NavContext): ResolvedNavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.map((item) => resolveItem(item, context)).filter((item) => item !== null),
    }))
    .filter((section) => section.items.length > 0)
}

/** Every resolved link, depth-first — for search and lookups. */
export function flattenItems(sections: readonly ResolvedNavSection[]): ResolvedNavItem[] {
  const walk = (items: readonly ResolvedNavItem[]): ResolvedNavItem[] => items.flatMap((item) => [item, ...walk(item.items ?? [])])
  return sections.flatMap((section) => walk(section.items))
}

/**
 * The chain of active links from the top level down to the current page — the basis for
 * breadcrumbs. When several top-level items are active (e.g. through `activeFor`), the one with
 * the longest matching href wins.
 */
export function activeTrail(sections: readonly ResolvedNavSection[]): ResolvedNavItem[] {
  const deepest = (items: readonly ResolvedNavItem[]): ResolvedNavItem[] => {
    const candidates = items.filter((item) => item.active)
    const best = candidates.sort((a, b) => b.href.length - a.href.length)[0]
    return best ? [best, ...deepest(best.items ?? [])] : []
  }
  return deepest(sections.flatMap((section) => section.items))
}
