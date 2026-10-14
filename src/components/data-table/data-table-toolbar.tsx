"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Icon } from "@/components/shared/icon"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { FilterDefinition, FilterOption } from "@/components/data-table/types"
import type { TableUrlState } from "@/components/data-table/use-table-url-state"

function OptionItems({
  definition,
  selected,
  onChange,
}: {
  definition: FilterDefinition
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const multiple = definition.multiple ?? true
  const toggle = (option: FilterOption, checked: boolean) => {
    if (!multiple) return onChange(checked ? [option.value] : [])
    onChange(checked ? [...selected, option.value] : selected.filter((v) => v !== option.value))
  }
  return definition.options.map((option) => (
    <DropdownMenuCheckboxItem
      key={option.value}
      checked={selected.includes(option.value)}
      onCheckedChange={(checked) => toggle(option, checked === true)}
      closeOnClick={!multiple}
    >
      {option.leading ?? (option.icon ? <Icon name={option.icon} /> : null)}
      {option.label}
    </DropdownMenuCheckboxItem>
  ))
}

/** An active filter as a chip: "Status  Failed, Crashed  ×". Click to change, × to remove. */
function FilterChip({ definition, values, onChange }: { definition: FilterDefinition; values: string[]; onChange: (values: string[]) => void }) {
  const labels = values.map((value) => definition.options.find((o) => o.value === value)?.label ?? value)
  const summary = labels.length > 2 ? `${labels.length} selected` : labels.join(", ")

  return (
    <span className="inline-flex h-8 items-center rounded-full border border-dashed border-border bg-muted/20 text-sm">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-full items-center gap-1.5 rounded-l-full pr-1.5 pl-3 outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-muted/50">
          <span className="text-muted-foreground">{definition.label}</span>
          <span className="max-w-48 truncate font-medium">{summary}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground">{definition.label}</DropdownMenuLabel>
            <OptionItems definition={definition} selected={values} onChange={onChange} />
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <button
        type="button"
        onClick={() => onChange([])}
        aria-label={`Remove ${definition.label} filter`}
        className="flex h-full items-center rounded-r-full pr-2.5 pl-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Icon name="x" size="xs" />
      </button>
    </span>
  )
}

/** Debounced search box bound to the URL's `q`. */
function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  const [draft, setDraft] = React.useState(value)
  // Follow URL changes (back/forward, "Clear filters").
  React.useEffect(() => setDraft(value), [value])
  React.useEffect(() => {
    if (draft === value) return
    const timer = window.setTimeout(() => onChange(draft), 300)
    return () => window.clearTimeout(timer)
  }, [draft, value, onChange])

  return (
    <label className="relative flex h-8 min-w-0 flex-1 items-center sm:max-w-72">
      <Icon name="search" className="pointer-events-none absolute left-3 text-muted-foreground" />
      <span className="sr-only">{placeholder}</span>
      <input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        className="h-full w-full rounded-full border border-border/70 bg-transparent pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-search-cancel-button]:hidden"
      />
    </label>
  )
}

/**
 * Search + filters for a DataTable: "Add filter" lists every filter not yet applied; applied ones
 * become chips. Everything reads and writes the URL (useTableUrlState).
 */
export function DataTableToolbar({
  state,
  filters = [],
  searchPlaceholder = "Search…",
  actions,
  className,
}: {
  state: TableUrlState
  filters?: readonly FilterDefinition[]
  searchPlaceholder?: string
  /** Extra controls on the right (e.g. a primary button). */
  actions?: React.ReactNode
  className?: string
}) {
  const inactive = filters.filter((definition) => !state.filters[definition.id]?.length)
  const active = filters.filter((definition) => state.filters[definition.id]?.length)

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <SearchBox value={state.search} onChange={state.setSearch} placeholder={searchPlaceholder} />

      {inactive.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
            <Icon name="plus" />
            Add filter
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {inactive.map((definition) => (
              <DropdownMenuSub key={definition.id}>
                <DropdownMenuSubTrigger>
                  {definition.icon && <Icon name={definition.icon} />}
                  {definition.label}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-56">
                  <OptionItems definition={definition} selected={[]} onChange={(values) => state.setFilter(definition.id, values)} />
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {active.map((definition) => (
        <FilterChip
          key={definition.id}
          definition={definition}
          values={state.filters[definition.id] ?? []}
          onChange={(values) => state.setFilter(definition.id, values)}
        />
      ))}

      {state.hasFilters && (
        <Button variant="ghost" size="sm" onClick={state.clearFilters}>
          Clear
        </Button>
      )}

      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  )
}
