"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import type { FilterDefinition, SortState } from "@/components/data-table/types"

/**
 * A list's view state — search, filters, sort, page — kept in the URL, so a filtered view can be
 * shared, bookmarked and survives refresh. Params: `q`, one per filter id (comma-separated),
 * `sort` ("created" ascending, "-created" descending), `page` (1-based).
 */
export function useTableUrlState({
  filters: definitions = [],
  defaultSort = null,
}: {
  filters?: readonly FilterDefinition[]
  defaultSort?: SortState
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const search = searchParams.get("q") ?? ""

  const filters = React.useMemo(() => {
    const values: Record<string, string[]> = {}
    for (const definition of definitions) {
      const raw = searchParams.get(definition.id)
      if (raw) values[definition.id] = raw.split(",").filter(Boolean)
    }
    return values
  }, [definitions, searchParams])

  const sortParam = searchParams.get("sort")
  const sort: SortState = sortParam ? { key: sortParam.replace(/^-/, ""), desc: sortParam.startsWith("-") } : defaultSort
  const page = Math.max(1, Number(searchParams.get("page")) || 1)

  /** Writes params; any change except paging returns to page 1. */
  const update = React.useCallback(
    (changes: Record<string, string | null>, { keepPage = false } = {}) => {
      const next = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === "") next.delete(key)
        else next.set(key, value)
      }
      if (!keepPage) next.delete("page")
      const query = next.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  return {
    search,
    setSearch: (value: string) => update({ q: value.trim() || null }),
    filters,
    setFilter: (id: string, values: string[]) => update({ [id]: values.length ? values.join(",") : null }),
    clearFilters: () => update(Object.fromEntries([["q", null], ...definitions.map((d) => [d.id, null])])),
    hasFilters: Boolean(search) || Object.keys(filters).length > 0,
    sort,
    setSort: (next: SortState) => update({ sort: next ? `${next.desc ? "-" : ""}${next.key}` : null }),
    page,
    setPage: (value: number) => update({ page: value > 1 ? String(value) : null }, { keepPage: true }),
  }
}

export type TableUrlState = ReturnType<typeof useTableUrlState>
