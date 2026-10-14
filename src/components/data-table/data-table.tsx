"use client"

import * as React from "react"
import Link from "next/link"
import { rowSortingFeature, tableFeatures, useTable, type ColumnDef, type RowData, type SortingState, type Updater } from "@tanstack/react-table"

import { cn } from "@/lib/utils"
import { Icon } from "@/components/shared/icon"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ErrorState } from "@/components/app-shell/error-state"
import type { DataTableColumn, RowAction, SortState } from "@/components/data-table/types"

const features = tableFeatures({ rowSortingFeature })

// Static strings so Tailwind sees every class.
const hideBelow = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
} as const

type Pagination = { page: number; pageSize: number; total: number; onPageChange: (page: number) => void }

type DataTableProps<T extends RowData> = {
  /** Accessible name for the table (visually hidden caption). */
  caption: string
  columns: readonly DataTableColumn<T>[]
  data: readonly T[] | undefined
  getRowId: (row: T) => string
  /** Make each row a link (keyboard focusable; actions stay clickable). */
  rowHref?: (row: T) => string
  /** Accessible label for the row link, e.g. the deployment's commit message. */
  rowLabel?: (row: T) => string
  /** Items for the row's ⋯ menu. */
  rowActions?: (row: T) => RowAction[]
  /** First load: skeleton rows. */
  isLoading?: boolean
  /** Refetching with old data on screen (filters changed): dims the table. */
  isFetching?: boolean
  error?: unknown
  onRetry?: () => void
  /** Shown when nothing exists yet. */
  empty?: React.ReactNode
  /** Shown when filters/search exclude everything. */
  emptyFiltered?: React.ReactNode
  filtered?: boolean
  sort?: SortState
  onSortChange?: (sort: SortState) => void
  pagination?: Pagination
  skeletonRows?: number
  className?: string
}

function RowActionsMenu({ actions, label }: { actions: RowAction[]; label: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${label}`} />}>
        <Icon name="more" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {actions.map((action) => (
          <React.Fragment key={action.label}>
            {action.separated && <DropdownMenuSeparator />}
            <DropdownMenuItem
              variant={action.destructive ? "destructive" : "default"}
              disabled={action.disabled}
              onClick={action.onSelect}
              render={
                action.href ? (
                  action.external ? <a href={action.href} target="_blank" rel="noreferrer" /> : <Link href={action.href} />
                ) : undefined
              }
            >
              {action.icon && <Icon name={action.icon} />}
              {action.label}
              {action.external && <Icon name="arrow-up-right" size="xs" className="ml-auto text-muted-foreground" />}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * The list/table for Your Galley. Server-driven: give it the current page of rows plus the URL
 * state (sort, pagination) — loading, refetching, error, empty and "no matches" are built in.
 * Rows can link somewhere and carry a ⋯ menu; secondary columns hide on small screens.
 */
export function DataTable<T extends RowData>({
  caption,
  columns,
  data,
  getRowId,
  rowHref,
  rowLabel,
  rowActions,
  isLoading = false,
  isFetching = false,
  error,
  onRetry,
  empty,
  emptyFiltered,
  filtered = false,
  sort = null,
  onSortChange,
  pagination,
  skeletonRows = 8,
  className,
}: DataTableProps<T>) {
  const tableColumns = React.useMemo<ColumnDef<typeof features, T>[]>(
    () =>
      columns.map((column) => ({
        id: column.id,
        accessorFn: (row: T) => row,
        header: () => column.header,
        cell: ({ row }) => column.cell(row.original),
        enableSorting: Boolean(column.sortKey),
      })),
    [columns]
  )

  // The URL owns sorting; map between its sort key and the column it belongs to.
  const sorting = React.useMemo<SortingState>(() => {
    const column = sort && columns.find((c) => c.sortKey === sort.key)
    return column ? [{ id: column.id, desc: sort.desc }] : []
  }, [sort, columns])

  const onSortingChange = (updater: Updater<SortingState>) => {
    const next = typeof updater === "function" ? updater(sorting) : updater
    const first = next[0]
    const column = first && columns.find((c) => c.id === first.id)
    onSortChange?.(column?.sortKey ? { key: column.sortKey, desc: first.desc } : null)
  }

  const rows = React.useMemo(() => (data ?? []) as T[], [data])
  const table = useTable({
    features,
    columns: tableColumns,
    data: rows,
    getRowId: (row) => getRowId(row),
    state: { sorting },
    onSortingChange,
    manualSorting: true,
    enableSortingRemoval: true,
  })

  const columnMeta = new Map(columns.map((column) => [column.id, column]))
  const cellClass = (id: string) => {
    const column = columnMeta.get(id)
    return cn(column?.hideBelow && hideBelow[column.hideBelow], column?.align === "end" && "text-right", column?.className)
  }
  const span = columns.length + (rowActions ? 1 : 0)

  if (error && !data) {
    return (
      <div className={cn("rounded-xl border border-border/70 bg-card", className)}>
        <ErrorState size="compact" title="This list didn't load." onRetry={onRetry} />
      </div>
    )
  }

  return (
    <div className={cn("grid gap-3", className)}>
      <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card">
        {isFetching && !isLoading && (
          <span aria-hidden className="absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden">
            <span className="block h-full w-1/3 animate-scan bg-brand" />
          </span>
        )}
        <Table className={cn("transition-opacity", isFetching && !isLoading && "opacity-60")} aria-busy={isLoading || isFetching}>
          <caption className="sr-only">{caption}</caption>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="bg-muted/30 hover:bg-muted/30">
                {group.headers.map((header) => {
                  const sortable = header.column.getCanSort()
                  const direction = header.column.getIsSorted()
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : sortable ? "none" : undefined}
                      className={cn("h-10 text-xs font-medium text-muted-foreground", cellClass(header.column.id))}
                    >
                      {sortable ? (
                        <button
                          type="button"
                          // Newest/largest first on the first click — what lists are usually sorted for.
                          onClick={() => header.column.toggleSorting(direction === "desc" ? false : true)}
                          className={cn("inline-flex items-center gap-1 rounded outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50", direction && "text-foreground")}
                        >
                          <table.FlexRender header={header} />
                          <Icon name={direction === "asc" ? "sort-asc" : "sort-desc"} size="xs" className={cn(!direction && "opacity-0")} />
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  )
                })}
                {rowActions && (
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                )}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: skeletonRows }, (_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  {columns.map((column) => (
                    <TableCell key={column.id} className={cellClass(column.id)}>
                      <Skeleton className={cn("h-4", column.skeleton ?? "w-24", column.align === "end" && "ml-auto")} />
                    </TableCell>
                  ))}
                  {rowActions && <TableCell />}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={span} className="p-0">
                  {filtered ? emptyFiltered : empty}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row, rowIndex) => {
                const href = rowHref?.(row.original)
                const actions = rowActions?.(row.original) ?? []
                return (
                  <TableRow
                    key={row.id}
                    // Rows rise in as the data lands, a few ms apart (capped so long pages stay quick).
                    className="relative animate-in fade-in slide-in-from-bottom-1 duration-500 fill-mode-both ease-out-expo motion-reduce:animate-none"
                    style={{ animationDelay: `${Math.min(rowIndex, 12) * 30}ms` }}
                  >
                    {row.getAllCells().map((cell, index) => (
                      <TableCell key={cell.id} className={cn("py-3", cellClass(cell.column.id))}>
                        {/* The row link: covers the row, sits under interactive cells. */}
                        {href && index === 0 && (
                          <Link
                            href={href}
                            aria-label={rowLabel?.(row.original)}
                            className="absolute inset-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-inset"
                          />
                        )}
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                    {rowActions && (
                      <TableCell className="relative z-10 w-12 py-2 text-right">
                        {actions.length > 0 && <RowActionsMenu actions={actions} label={rowLabel?.(row.original) ?? "row"} />}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.total > pagination.pageSize && (
        <DataTablePagination {...pagination} />
      )}
    </div>
  )
}

/** "21–40 of 46" with previous/next. */
export function DataTablePagination({ page, pageSize, total, onPageChange }: Pagination) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
      <span className="tabular-nums">
        {from}–{to} of {total}
      </span>
      <span className="flex items-center gap-1">
        <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <Icon name="chevron-right" className="rotate-180" />
          Previous
        </Button>
        <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
          Next
          <Icon name="chevron-right" />
        </Button>
      </span>
    </nav>
  )
}
