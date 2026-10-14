/**
 * Deplogram's data tables: server-driven lists with URL state (search, filter chips, sort, page),
 * built-in loading/refetching/error/empty states, row links and ⋯ menus, responsive columns.
 * The Deployments page (features/deployments) is the reference implementation.
 */
export { DataTable, DataTablePagination } from "@/components/data-table/data-table"
export { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
export { useTableUrlState, type TableUrlState } from "@/components/data-table/use-table-url-state"
export type { DataTableColumn, FilterDefinition, FilterOption, RowAction, SortState } from "@/components/data-table/types"
