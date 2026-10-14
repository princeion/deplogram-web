import type * as React from "react"

import type { IconName } from "@/components/shared/icon"

/**
 * A column, in Deplogram's terms. The table engine (TanStack Table) stays an implementation
 * detail of <DataTable>; features only describe what to show.
 */
export type DataTableColumn<T> = {
  id: string
  header: React.ReactNode
  cell: (row: T) => React.ReactNode
  /** Server sort key — makes the header a sort toggle (the URL's `sort` param). */
  sortKey?: string
  /** Hide on narrow screens; keep the essentials visible on phones. */
  hideBelow?: "sm" | "md" | "lg" | "xl"
  align?: "start" | "end"
  /** Width/truncation classes for the header and cells, e.g. "w-40" or "max-w-96". */
  className?: string
  /** Skeleton bar width while loading (Tailwind width class). */
  skeleton?: string
}

/** An item in a row's ⋯ menu. */
export type RowAction = {
  label: string
  icon?: IconName
  href?: string
  external?: boolean
  onSelect?: () => void
  destructive?: boolean
  disabled?: boolean
  /** Draws a separator above this item. */
  separated?: boolean
}

export type FilterOption = {
  value: string
  label: string
  icon?: IconName
  /** Custom leading visual, e.g. a status dot. */
  leading?: React.ReactNode
}

/** A filter shown as a chip in the toolbar ("Status  Failed, Crashed"). Values live in the URL. */
export type FilterDefinition = {
  /** URL param name. */
  id: string
  label: string
  icon?: IconName
  options: readonly FilterOption[]
  /** Allow several values (default true). */
  multiple?: boolean
}

export type SortState = { key: string; desc: boolean } | null
