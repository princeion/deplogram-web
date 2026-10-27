"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { formatBytes, formatRelativeTime } from "@/lib/format"
import { ApiError } from "@/lib/api-client"
import { useUsage } from "@/features/usage/usage"
import {
  kindMeta,
  kindOf,
  linkExpiries,
  sortItems,
  storageSorts,
  typeLabel,
  useCreateLink,
  useDeleteItems,
  useSetPublic,
  useStorageList,
  useStorageSearch,
  type LinkExpiry,
  type StorageItem,
  type StorageSort,
} from "@/features/storage/storage"
import { chartColor, limitTone, type ChartColor } from "@/components/charts"
import { useEntered } from "@/components/charts/meters"
import { notify, useConfirm } from "@/components/feedback"
import { useStorage } from "@/features/storage/components/storage-context"
import { MoveDialog, NewFolderDialog, RenameDialog } from "@/features/storage/components/storage-dialogs"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FilePreview, previewKindOf } from "@/features/storage/components/file-preview"
import { useRegisterCommands } from "@/components/command-palette/command-palette-provider"
import type { CommandSource } from "@/components/command-palette/types"
import { useIsMobile } from "@/hooks/use-mobile"
import { FolderShape } from "@/components/shared/folder-shape"
import { Icon } from "@/components/shared/icon"
import { Segmented } from "@/components/shared/segmented"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/app-shell/empty-state"
import { ErrorState } from "@/components/app-shell/error-state"
import { useLocalPreference } from "@/hooks/use-local-preference"

/**
 * Storage: the workspace's private drive. Folders are pages (the path is in the URL, so a folder
 * can be bookmarked or shared with the team); search, sort and the selected file are URL params;
 * the layout (grid or list) is remembered on this device. Selecting a file opens its details
 * beside the list — or as a sheet on smaller screens — with its preview and a link that expires.
 * Drop files anywhere on the page to upload them here; tick items to move or delete several.
 * Keys: Delete, F2 (rename), ⌘A / Ctrl+A (select all), Esc. A folder can be made public; its
 * files then have permanent addresses instead of expiring links.
 */

const VIEWS = ["grid", "list"] as const
const SORTS = storageSorts.map((s) => s.value)

export const folderHref = (path: string) => `/dashboard/storage${path ? `/${path.split("/").map(encodeURIComponent).join("/")}` : ""}`
const parentOf = (path: string) => (path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "")

export function StorageBrowser({ path }: { path: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [view, setView] = useLocalPreference("storage:view", "grid", VIEWS)
  const wide = useWideScreen()

  const q = params.get("q") ?? ""
  const sortParam = params.get("sort") as StorageSort | null
  const sort: StorageSort = sortParam && SORTS.includes(sortParam) ? sortParam : "name"
  const selectedPath = params.get("file")

  const setParams = React.useCallback(
    (next: Record<string, string | null>) => {
      const search = new URLSearchParams(params.toString())
      for (const [key, value] of Object.entries(next)) {
        if (value) search.set(key, value)
        else search.delete(key)
      }
      const query = search.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [params, pathname, router]
  )

  const list = useStorageList(path)
  const search = useStorageSearch(q)
  const searching = q.length > 0
  const source = searching ? search : list
  const items = React.useMemo(() => sortItems(source.data?.items ?? [], sort), [source.data, sort])
  const selected = selectedPath ? (items.find((i) => i.path === selectedPath) ?? null) : null
  const select = (item: StorageItem | null) => setParams({ file: item?.path ?? null })

  const { upload, pickFiles, setNewFolderOpen } = useStorage()
  const confirm = useConfirm()
  const deleteItems = useDeleteItems()
  const [checked, setChecked] = React.useState<ReadonlySet<string>>(new Set())
  const [renaming, setRenaming] = React.useState<StorageItem | null>(null)
  const [moving, setMoving] = React.useState<StorageItem[] | null>(null)
  // A new folder or search starts with nothing ticked.
  React.useEffect(() => setChecked(new Set()), [path, q])
  const toggle = (item: StorageItem) =>
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(item.path)) next.delete(item.path)
      else next.add(item.path)
      return next
    })
  const checkedItems = items.filter((i) => checked.has(i.path))

  const requestDelete = (targets: StorageItem[]) => {
    const folders = targets.filter((t) => t.kind === "folder")
    const bytes = targets.reduce((sum, t) => sum + t.size, 0)
    const one = targets.length === 1 ? targets[0] : null
    void confirm({
      title: one ? `Delete “${one.name}”?` : `Delete ${targets.length} items?`,
      description: [
        folders.length ? (one ? "The folder is deleted with everything inside it." : "Folders are deleted with everything inside them.") : null,
        `This frees ${formatBytes(bytes)} and can't be undone. Shared links stop working.`,
      ]
        .filter(Boolean)
        .join(" "),
      confirmLabel: one ? `Delete ${one.kind === "folder" ? "folder" : "file"}` : `Delete ${targets.length} items`,
      tone: "destructive",
      action: async () => {
        await deleteItems.mutateAsync(targets.map((t) => t.path))
        if (selected && targets.some((t) => t.path === selected.path)) select(null)
        setChecked(new Set())
        notify.success(one ? `“${one.name}” was deleted` : `${targets.length} items deleted`)
      },
    })
  }
  const itemMenu = (item: StorageItem) => (
    <ItemMenu
      item={item}
      onDetails={() => select(item)}
      onRename={() => setRenaming(item)}
      onMove={() => setMoving([item])}
      onDelete={() => requestDelete([item])}
      onTogglePublic={() => togglePublic(item.path, !item.public)}
    />
  )

  // Drag files over the page to upload them into this folder.
  const [dragging, setDragging] = React.useState(false)
  const dragDepth = React.useRef(0)
  const hasFiles = (event: React.DragEvent) => event.dataTransfer.types.includes("Files")
  const dropProps = searching
    ? {}
    : {
        onDragEnter: (event: React.DragEvent) => {
          if (!hasFiles(event)) return
          event.preventDefault()
          dragDepth.current++
          setDragging(true)
        },
        onDragOver: (event: React.DragEvent) => {
          if (hasFiles(event)) event.preventDefault()
        },
        onDragLeave: () => {
          dragDepth.current = Math.max(0, dragDepth.current - 1)
          if (dragDepth.current === 0) setDragging(false)
        },
        onDrop: (event: React.DragEvent) => {
          if (!hasFiles(event)) return
          event.preventDefault()
          dragDepth.current = 0
          setDragging(false)
          upload([...event.dataTransfer.files], path)
        },
      }
  const viewProps = { checked, onToggle: toggle, menu: itemMenu, anyChecked: checked.size > 0 }

  // ── Public folders ──────────────────────────────────────────────────────────
  const setPublic = useSetPublic()
  const togglePublic = (folderPath: string, makePublic: boolean) => {
    const name = folderPath.split("/").pop() || "Storage"
    void confirm({
      title: makePublic ? `Make “${name}” public?` : `Make “${name}” private?`,
      description: makePublic
        ? "Anyone with a file's address can open every file in this folder and its subfolders — including files added later. Addresses never expire."
        : "Public addresses stop working right away. Share files with links that expire instead.",
      confirmLabel: makePublic ? "Make public" : "Make private",
      tone: makePublic ? "destructive" : "default",
      icon: makePublic ? "network" : "shield",
      action: async () => {
        await setPublic.mutateAsync({ path: folderPath, public: makePublic })
        notify.success(makePublic ? `“${name}” is public` : `“${name}” is private`)
      },
    })
  }

  // ── Preview, large ──────────────────────────────────────────────────────────
  const [previewing, setPreviewing] = React.useState<StorageItem | null>(null)

  // ── Keyboard: Delete, F2, ⌘A / Ctrl+A, Esc (not while typing or in a dialog) ──
  const keys = React.useRef({ checkedItems, selected, items, requestDelete, setRenaming, setChecked, select })
  keys.current = { checkedItems, selected, items, requestDelete, setRenaming, setChecked, select }
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null
      if (target?.closest("input, textarea, select, [contenteditable=true], [role=menu], .monaco-editor")) return
      if (document.querySelector('[data-slot="dialog-content"], [data-slot="sheet-content"]')) return
      const k = keys.current
      const targets = k.checkedItems.length ? k.checkedItems : k.selected ? [k.selected] : []
      if ((event.key === "Delete" || event.key === "Backspace") && targets.length) {
        event.preventDefault()
        k.requestDelete(targets)
      } else if (event.key === "F2" && targets.length === 1) {
        event.preventDefault()
        k.setRenaming(targets[0])
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a" && k.items.length) {
        event.preventDefault()
        k.setChecked(new Set(k.items.map((i) => i.path)))
      } else if (event.key === "Escape") {
        if (k.checkedItems.length) k.setChecked(new Set())
        else if (k.selected) k.select(null)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  // ── ⌘K: act on this folder ──────────────────────────────────────────────────
  const here = path ? `/${path}` : "Storage"
  const commands = React.useMemo<CommandSource>(
    () => ({
      commands: [
        { id: "storage-upload-here", label: `Upload files to ${here}`, group: "This folder", kind: "action", icon: "upload", keywords: ["storage", "add", "file"], perform: pickFiles },
        { id: "storage-new-folder-here", label: `New folder in ${here}`, group: "This folder", kind: "action", icon: "folder-plus", keywords: ["storage", "create"], perform: () => setNewFolderOpen(true) },
      ],
    }),
    [here, pickFiles, setNewFolderOpen]
  )
  useRegisterCommands("storage-here", commands)

  const isMobile = useIsMobile()

  return (
    <div className="grid gap-5">
      <UsageStrip />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <Breadcrumbs path={path} />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <SearchBox value={q} onChange={(value) => setParams({ q: value || null, file: null })} />
          <SortMenu value={sort} onChange={(value) => setParams({ sort: value === "name" ? null : value })} />
          <Segmented
            label="Layout"
            size="sm"
            value={view}
            onChange={setView}
            options={[
              { value: "grid", label: <LayoutLabel icon="grid" text="Grid" /> },
              { value: "list", label: <LayoutLabel icon="list" text="List" /> },
            ]}
          />
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-label={searching ? "Search results" : "Files"} className="relative min-w-0" {...dropProps}>
          {dragging && (
            <div className="pointer-events-none absolute -inset-2 z-20 grid place-items-center rounded-2xl border-2 border-dashed border-brand/60 bg-brand/5">
              <p className="flex items-center gap-2 rounded-full bg-popover px-4 py-2 text-sm font-medium ring-1 ring-border">
                <Icon name="upload" className="text-brand-ink" /> Drop to upload to {path ? `/${path}` : "Storage"}
              </p>
            </div>
          )}
          {!searching && list.data?.public && (
            <PublicNotice here={path} from={list.data.publicFrom} onMakePrivate={() => list.data?.publicFrom && togglePublic(list.data.publicFrom, false)} />
          )}
          {checkedItems.length > 0 && (
            <BulkBar
              count={checkedItems.length}
              allChecked={checkedItems.length === items.length}
              onAll={() => setChecked(new Set(items.map((i) => i.path)))}
              onClear={() => setChecked(new Set())}
              onMove={() => setMoving(checkedItems)}
              onDelete={() => requestDelete(checkedItems)}
            />
          )}
          {searching && (
            <p className="mb-3 text-sm text-muted-foreground">
              {search.data ? `${items.length} ${items.length === 1 ? "result" : "results"}` : "Searching"} for “{q}” across your storage
            </p>
          )}
          {source.isPending ? (
            <BrowserSkeleton view={view} />
          ) : source.isError ? (
            source.error instanceof ApiError && source.error.status === 404 ? (
              <EmptyState
                icon="folder"
                title="That folder doesn't exist."
                description="It may have been moved or deleted."
                actions={
                  <Link href={folderHref("")} className={buttonVariants({ variant: "outline" })}>
                    Back to Storage
                  </Link>
                }
              />
            ) : (
              <ErrorState title="This folder didn't load." onRetry={() => source.refetch()} retrying={source.isRefetching} />
            )
          ) : items.length === 0 ? (
            searching ? (
              <EmptyState variant="plain" size="compact" icon="search" title={`Nothing matches “${q}”.`} description="Try another name, or clear the search." />
            ) : (
              <EmptyState
                icon="folder"
                title={path ? "This folder is empty." : "Nothing stored yet."}
                description="Upload files, or drop them anywhere on this page."
                actions={
                  <>
                    <Button onClick={pickFiles}>
                      <Icon name="upload" /> Upload
                    </Button>
                    <Button variant="outline" onClick={() => setNewFolderOpen(true)}>
                      <Icon name="folder-plus" /> New folder
                    </Button>
                  </>
                }
              />
            )
          ) : view === "grid" ? (
            <GridView items={items} selected={selected} onSelect={select} showFolder={searching} {...viewProps} />
          ) : (
            <ListView items={items} selected={selected} onSelect={select} showFolder={searching} {...viewProps} />
          )}
        </section>

        {/* Details: beside the files on wide screens, a sheet below that. */}
        <aside aria-label="File details" className="sticky top-20 hidden lg:block">
          {selected ? (
            <FileDetails item={selected} onClose={() => select(null)} onRename={() => setRenaming(selected)} onMove={() => setMoving([selected])} onDelete={() => requestDelete([selected])} onPreview={() => setPreviewing(selected)} />
          ) : (
            <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
              <Icon name="file" className="text-muted-foreground/70" />
              Select a file to see its details and share it.
            </div>
          )}
        </aside>
        <Sheet open={selected != null && !wide} onOpenChange={(open) => !open && select(null)}>
          <SheetContent
            side={isMobile ? "bottom" : "right"}
            className={cn("overflow-y-auto p-4", isMobile ? "max-h-[88svh] rounded-t-2xl" : "w-full max-w-sm")}
            showCloseButton={false}
          >
            <SheetTitle className="sr-only">{selected?.name ?? "File"}</SheetTitle>
            {selected && <FileDetails item={selected} onClose={() => select(null)} onRename={() => setRenaming(selected)} onMove={() => setMoving([selected])} onDelete={() => requestDelete([selected])} onPreview={() => setPreviewing(selected)} />}
          </SheetContent>
        </Sheet>
      </div>

      <NewFolderDialog />
      <PreviewDialog item={previewing} onClose={() => setPreviewing(null)} />
      <RenameDialog
        item={renaming}
        onClose={(renamed) => {
          if (renamed && selected && selected.path === renaming?.path) select(renamed)
          setRenaming(null)
        }}
      />
      <MoveDialog
        items={moving}
        onClose={(moved) => {
          if (moved) {
            setChecked(new Set())
            if (selected && moving?.some((m) => m.path === selected.path)) select(null)
          }
          setMoving(null)
        }}
      />
    </div>
  )
}

/** True at `lg` and up, where details sit beside the files instead of in a sheet. */
function useWideScreen() {
  const [wide, setWide] = React.useState(false)
  React.useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)")
    const update = () => setWide(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])
  return wide
}

// ── Header pieces ──────────────────────────────────────────────────────────────────

const hatch = "bg-[repeating-linear-gradient(135deg,color-mix(in_oklab,var(--foreground)_10%,transparent)_0_3px,transparent_3px_7px)]"

/** Ruler marks that land on round numbers: 0, 1 GB, 2 GB… — at most six. */
function rulerTicks(limit: number) {
  const steps = [1e8, 2.5e8, 5e8, 1e9, 2e9, 2.5e9, 5e9, 1e10, 2e10, 2.5e10, 5e10, 1e11, 2.5e11, 5e11, 1e12]
  const step = steps.find((s) => limit / s <= 6) ?? limit / 5
  const ticks: number[] = []
  for (let t = 0; t < limit - step / 2; t += step) ticks.push(t)
  return [...ticks, limit]
}

/**
 * Storage as a capacity gauge: the figure first, then one track split by what fills it (greys,
 * strongest first), free space hatched, and a ruler under it so the bar reads as a measurement.
 * The used figure turns orange from 80% and red when full.
 */
function UsageStrip() {
  const { data } = useUsage()
  const entered = useEntered()
  const limit = data?.limits.find((l) => l.id === "storage")
  if (!data || !limit) return <Skeleton className="h-[146px] rounded-xl" />

  const tone = limitTone(limit.used / limit.limit)
  const shades: ChartColor[] = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"]
  const kinds = data.storageByKind.map((k, i) => ({ ...k, color: shades[i % shades.length] }))
  // Anything the breakdown hasn't caught up with yet (a fresh upload) still shows as used.
  const unaccounted = limit.used - kinds.reduce((sum, k) => sum + k.bytes, 0)
  if (unaccounted > 0) kinds.push({ kind: "Recent uploads", bytes: unaccounted, color: shades[kinds.length % shades.length] })
  const free = Math.max(0, limit.limit - limit.used)
  const ticks = rulerTicks(limit.limit)

  return (
    <section aria-label="Storage used" className="rounded-xl border border-border/70 bg-card px-4 pt-4 pb-3.5 sm:px-5">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="grid gap-1">
          <p className="text-[0.6875rem] font-medium tracking-[0.08em] text-muted-foreground uppercase">Storage</p>
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className={cn("font-mono text-2xl font-medium tracking-tight tabular-nums", tone.label !== "ok" && tone.text)}>{formatBytes(limit.used, 2)}</span>
            <span className="text-sm text-muted-foreground">used of {formatBytes(limit.limit)}</span>
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-mono text-foreground tabular-nums">{formatBytes(free, 2)}</span> free
          <span className="mx-2 text-border">|</span>
          <Link href="/dashboard/usage" className="underline-offset-2 hover:text-foreground hover:underline">
            Usage &amp; limits →
          </Link>
        </p>
      </div>

      <div role="meter" aria-label="Storage used" aria-valuemin={0} aria-valuemax={limit.limit} aria-valuenow={limit.used} aria-valuetext={`${formatBytes(limit.used)} of ${formatBytes(limit.limit)}`} className="mt-4">
        {/* The track: one segment per kind, then the free space. */}
        <div className="surface-sunken flex h-3.5 gap-[2px] rounded-full p-[3px]">
          {kinds.map((k, i) => (
            <span
              key={k.kind}
              title={`${k.kind}: ${formatBytes(k.bytes)}`}
              className="h-full origin-left rounded-full transition-transform duration-700 ease-out-expo motion-reduce:transition-none"
              style={{ width: `${(k.bytes / limit.limit) * 100}%`, background: chartColor(k.color), transform: `scaleX(${entered ? 1 : 0})`, transitionDelay: `${i * 90}ms` }}
            />
          ))}
          <span className={cn("h-full flex-1 rounded-full", hatch)} />
        </div>
        {/* The ruler. */}
        <div aria-hidden className="relative mx-[3px] mt-1 h-5">
          {ticks.map((t, i) => (
            <span
              key={t}
              className={cn("absolute top-0 grid justify-items-center", i === 0 ? "justify-items-start" : i === ticks.length - 1 ? "-translate-x-full justify-items-end" : "-translate-x-1/2")}
              style={{ left: `${(t / limit.limit) * 100}%` }}
            >
              <span className="h-1.5 w-px bg-foreground/20" />
              <span className="font-mono text-[0.625rem] whitespace-nowrap text-muted-foreground tabular-nums">{t === 0 ? "0" : formatBytes(t, 0)}</span>
            </span>
          ))}
        </div>
      </div>

      <ul className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
        {kinds.map((k) => (
          <li key={k.kind} className="flex items-center gap-1.5">
            <span className="size-2 rounded-[3px]" style={{ background: chartColor(k.color) }} />
            {k.kind}
            <span className="font-mono text-foreground/85 tabular-nums">{formatBytes(k.bytes)}</span>
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-[3px] ring-1 ring-foreground/15", hatch)} />
          Free
          <span className="font-mono text-foreground/85 tabular-nums">{formatBytes(free)}</span>
        </li>
      </ul>
    </section>
  )
}

function Breadcrumbs({ path }: { path: string }) {
  const parts = path ? path.split("/") : []
  return (
    <nav aria-label="Folder" className="min-w-0">
      <ol className="flex min-w-0 flex-wrap items-center gap-1 text-sm">
        <li>
          {parts.length ? (
            <Link href={folderHref("")} className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-muted-foreground hover:bg-muted hover:text-foreground">
              <Icon name="database" size="xs" /> Storage
            </Link>
          ) : (
            <span aria-current="page" className="flex items-center gap-1.5 px-1.5 py-1 font-medium">
              <Icon name="database" size="xs" /> Storage
            </span>
          )}
        </li>
        {parts.map((part, i) => {
          const last = i === parts.length - 1
          const href = folderHref(parts.slice(0, i + 1).join("/"))
          return (
            <li key={href} className="flex min-w-0 items-center gap-1">
              <Icon name="chevron-right" size="xs" className="text-muted-foreground/60" />
              {last ? (
                <span aria-current="page" className="truncate px-1.5 py-1 font-medium">
                  {part}
                </span>
              ) : (
                <Link href={href} className="truncate rounded-md px-1.5 py-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                  {part}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/** Search across the whole drive. Typing waits a moment before it updates the URL. */
function SearchBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = React.useState(value)
  React.useEffect(() => setDraft(value), [value])
  React.useEffect(() => {
    if (draft === value) return
    const id = window.setTimeout(() => onChange(draft.trim()), 250)
    return () => window.clearTimeout(id)
  }, [draft, value, onChange])
  return (
    <label className="surface-sunken relative flex h-8 w-full items-center gap-2 rounded-lg px-2.5 sm:w-56">
      <Icon name="search" size="xs" className="shrink-0 text-muted-foreground" />
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setDraft("")}
        placeholder="Search all files"
        aria-label="Search all files"
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      {draft && (
        <button type="button" aria-label="Clear search" onClick={() => setDraft("")} className="text-muted-foreground hover:text-foreground">
          <Icon name="x" size="xs" />
        </button>
      )}
    </label>
  )
}

function SortMenu({ value, onChange }: { value: StorageSort; onChange: (value: StorageSort) => void }) {
  const current = storageSorts.find((s) => s.value === value)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <Icon name="sort-desc" />
        <span className="text-muted-foreground">Sort:</span> {current?.label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as StorageSort)}>
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          {storageSorts.map((s) => (
            <DropdownMenuRadioItem key={s.value} value={s.value}>
              {s.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function LayoutLabel({ icon, text }: { icon: "grid" | "list"; text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon name={icon} size="xs" />
      {text}
    </span>
  )
}

// ── Items ──────────────────────────────────────────────────────────────────────────

type ItemsProps = {
  items: StorageItem[]
  selected: StorageItem | null
  onSelect: (item: StorageItem) => void
  /** Search results come from anywhere: show which folder each is in. */
  showFolder: boolean
  checked: ReadonlySet<string>
  onToggle: (item: StorageItem) => void
  /** The ⋯ menu for an item. */
  menu: (item: StorageItem) => React.ReactNode
  /** Something is ticked: show every checkbox, not just on hover. */
  anyChecked: boolean
}

const folderSummary = (item: StorageItem) => `${item.items ?? 0} ${item.items === 1 ? "item" : "items"} · ${formatBytes(item.size)}`

function FolderIn({ item }: { item: StorageItem }) {
  const parent = parentOf(item.path)
  return <span className="truncate text-xs text-muted-foreground">in {parent ? `/${parent}` : "Storage"}</span>
}

function GridView({ items, selected, onSelect, showFolder, checked, onToggle, menu, anyChecked }: ItemsProps) {
  const folders = items.filter((i) => i.kind === "folder")
  const files = items.filter((i) => i.kind === "file")
  return (
    <div className="grid gap-6">
      {folders.length > 0 && (
        <ul aria-label="Folders" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {folders.map((folder) => (
            <li key={folder.path}>
              <FolderShape bodyClassName={cn("flex-row items-center gap-3 p-3.5", checked.has(folder.path) && "border-brand/60")}>
                {/* The checkbox takes the icon's place on hover, or while anything is ticked. */}
                <span className="surface-sunken relative flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground">
                  <Icon name="folder" size="sm" className={cn("transition-opacity", anyChecked || checked.has(folder.path) ? "opacity-0" : "group-hover/folder:opacity-0")} />
                  <span className="absolute inset-0 grid place-items-center">
                    <ItemCheckbox item={folder} checked={checked.has(folder.path)} onToggle={onToggle} visible={anyChecked} />
                  </span>
                </span>
                <Link href={folderHref(folder.path)} className="grid min-w-0 flex-1 outline-none after:absolute after:inset-0 after:rounded-[inherit] focus-visible:after:ring-2 focus-visible:after:ring-ring/60 focus-visible:after:ring-inset">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{folder.name}</span>
                    {folder.public && <PublicChip />}
                  </span>
                  {showFolder ? <FolderIn item={folder} /> : <span className="truncate text-xs text-muted-foreground tabular-nums">{folderSummary(folder)}</span>}
                </Link>
                <span className="relative z-10 -mr-1.5">{menu(folder)}</span>
              </FolderShape>
            </li>
          ))}
        </ul>
      )}
      {files.length > 0 && (
        <ul aria-label="Files" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {files.map((file) => {
            const kind = kindOf(file)
            const active = selected?.path === file.path
            const ticked = checked.has(file.path)
            return (
              <li key={file.path} className="group/tile relative">
                <span className={cn("absolute top-3 left-3 z-10 flex rounded-md bg-background/85 p-1 backdrop-blur-sm", !anyChecked && !ticked && "opacity-0 group-hover/tile:opacity-100 focus-within:opacity-100")}>
                  <ItemCheckbox item={file} checked={ticked} onToggle={onToggle} visible />
                </span>
                <span className="absolute top-2.5 right-2.5 z-10 rounded-md bg-background/85 opacity-0 backdrop-blur-sm group-hover/tile:opacity-100 focus-within:opacity-100 has-aria-expanded:opacity-100">
                  {menu(file)}
                </span>
                <button
                  type="button"
                  onClick={() => onSelect(file)}
                  aria-pressed={active}
                  className={cn(
                    // A file ticket: the preview mounted in a sunken well, a perforated tear line, the stub.
                    "group/file relative grid w-full overflow-hidden rounded-xl border bg-card p-1.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                    active || ticked ? "border-brand/60" : "border-border/70 hover:border-foreground/25"
                  )}
                >
                  {active && <span aria-hidden className="metal-brand absolute inset-x-0 top-0 z-10 h-[3px]" />}
                  <span className="surface-sunken relative grid aspect-[16/10] place-items-center overflow-hidden rounded-lg">
                    <Thumbnail
                      src={file.thumbnailUrl}
                      className="size-full object-cover transition-transform duration-500 ease-out-expo group-hover/file:scale-[1.04]"
                      fallback={
                        // No picture (or it won't load): the type set large over the dot grid.
                        <>
                          <span aria-hidden className="absolute inset-0 bg-dot-grid opacity-70 mask-fade-edges" />
                          <span className="relative grid justify-items-center gap-1.5">
                            <Icon name={kindMeta[kind].icon} size="md" className="text-muted-foreground/80" />
                            <span className="font-mono text-2xl font-medium tracking-tight text-foreground/25 transition-colors group-hover/file:text-foreground/40">{typeLabel(file)}</span>
                          </span>
                        </>
                      }
                    />
                  </span>
                  {/* The tear line, notched where it meets the edges. */}
                  <span aria-hidden className="relative my-2 block h-px">
                    <span className="absolute inset-x-2.5 top-0 border-t border-dashed border-border transition-colors group-hover/file:border-foreground/25" />
                    <span className={cn("absolute top-1/2 -left-[0.85rem] size-[0.85rem] -translate-y-1/2 rounded-full border bg-app-panel", active || ticked ? "border-brand/60" : "border-border/70")} />
                    <span className={cn("absolute top-1/2 -right-[0.85rem] size-[0.85rem] -translate-y-1/2 rounded-full border bg-app-panel", active || ticked ? "border-brand/60" : "border-border/70")} />
                  </span>
                  <span className="grid gap-1 px-1.5 pb-1">
                    <span className="truncate text-sm font-medium">{file.name}</span>
                    {showFolder ? (
                      <FolderIn item={file} />
                    ) : (
                      <span className="flex items-center justify-between gap-2 font-mono text-[0.6875rem] text-muted-foreground tabular-nums">
                        <span className="truncate">
                          {formatBytes(file.size)} · {typeLabel(file)}
                        </span>
                        <span className="shrink-0 font-sans">{formatRelativeTime(file.updatedAt)}</span>
                      </span>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function ListView({ items, selected, onSelect, showFolder, checked, onToggle, menu, anyChecked }: ItemsProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
      <div className="surface-band hidden grid-cols-[minmax(0,1fr)_6rem_5rem_7rem] gap-4 border-b border-border/60 py-2 pr-12 pl-12 text-xs font-medium text-muted-foreground sm:grid">
        <span>Name</span>
        <span className="text-right">Size</span>
        <span>Type</span>
        <span>Modified</span>
      </div>
      <ul className="divide-y divide-border/60">
        {items.map((item) => {
          const kind = kindOf(item)
          const active = selected?.path === item.path
          const content = (
            <>
              <span className="flex min-w-0 items-center gap-3">
                <span className="surface-sunken flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md text-muted-foreground">
                  <Thumbnail src={item.thumbnailUrl} className="size-full object-cover" fallback={<Icon name={kindMeta[kind].icon} size="xs" />} />
                </span>
                <span className="grid min-w-0">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{item.name}</span>
                    {item.kind === "folder" && item.public && <PublicChip />}
                  </span>
                  {showFolder ? <FolderIn item={item} /> : <span className="truncate text-xs text-muted-foreground sm:hidden">{item.kind === "folder" ? folderSummary(item) : formatBytes(item.size)}</span>}
                </span>
              </span>
              <span className="hidden text-right font-mono text-xs text-muted-foreground tabular-nums sm:block">{formatBytes(item.size)}</span>
              <span className="hidden text-xs text-muted-foreground sm:block">{typeLabel(item)}</span>
              <span className="hidden text-xs text-muted-foreground tabular-nums sm:block">{formatRelativeTime(item.updatedAt)}</span>
            </>
          )
          const rowClass = cn(
            "grid w-full grid-cols-[minmax(0,1fr)] items-center gap-4 px-4 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-inset sm:grid-cols-[minmax(0,1fr)_6rem_5rem_7rem]",
            active ? "bg-muted" : "hover:bg-muted/50"
          )
          return (
            <li key={item.path} className={cn("group/row relative flex items-center", checked.has(item.path) && "bg-brand/5")}>
              {active && <span aria-hidden className="metal-brand absolute inset-y-1.5 left-0 w-[3px] rounded-full" />}
              <span className="flex shrink-0 pl-4">
                <ItemCheckbox item={item} checked={checked.has(item.path)} onToggle={onToggle} visible={anyChecked} />
              </span>
              <div className="min-w-0 flex-1">
                {item.kind === "folder" ? (
                  <Link href={folderHref(item.path)} className={rowClass}>
                    {content}
                  </Link>
                ) : (
                  <button type="button" aria-pressed={active} onClick={() => onSelect(item)} className={rowClass}>
                    {content}
                  </button>
                )}
              </div>
              <span className="shrink-0 pr-2">{menu(item)}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** A thumbnail that falls back (to the type, an icon) when there's none or it won't load. */
function Thumbnail({ src, className, fallback }: { src: string | null; className?: string; fallback: React.ReactNode }) {
  const [failed, setFailed] = React.useState(false)
  React.useEffect(() => setFailed(false), [src])
  if (!src || failed) return <>{fallback}</>
  // eslint-disable-next-line @next/next/no-img-element -- generated or signed thumbnails, not optimisable
  return <img src={src} alt="" onError={() => setFailed(true)} className={className} />
}

function ItemCheckbox({ item, checked, onToggle, visible }: { item: StorageItem; checked: boolean; onToggle: (item: StorageItem) => void; visible: boolean }) {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={() => onToggle(item)}
      aria-label={`Select ${item.name}`}
      className={cn("relative z-10", !visible && !checked && "opacity-0 group-hover/row:opacity-100 group-hover/folder:opacity-100 focus-visible:opacity-100")}
    />
  )
}

/** The ⋯ menu on every item. */
function ItemMenu({
  item,
  onDetails,
  onRename,
  onMove,
  onDelete,
  onTogglePublic,
}: {
  item: StorageItem
  onDetails: () => void
  onRename: () => void
  onMove: () => void
  onDelete: () => void
  onTogglePublic: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${item.name}`} />}>
        <Icon name="more" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {item.kind === "folder" ? (
          <DropdownMenuItem render={<Link href={folderHref(item.path)} />}>
            <Icon name="folder" /> Open
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onDetails}>
            <Icon name="file" /> Details &amp; link
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onRename}>
          <Icon name="feather" /> Rename
          <DropdownMenuShortcut>F2</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onMove}>
          <Icon name="folder" /> Move to…
        </DropdownMenuItem>
        {item.kind === "folder" && (
          <DropdownMenuItem onClick={onTogglePublic}>
            <Icon name={item.public ? "shield" : "network"} /> {item.public ? "Make private…" : "Make public…"}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Icon name="trash" /> Delete
          <DropdownMenuShortcut>Del</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Shown while items are ticked: what you can do with all of them. */
function BulkBar({
  count,
  allChecked,
  onAll,
  onClear,
  onMove,
  onDelete,
}: {
  count: number
  allChecked: boolean
  onAll: () => void
  onClear: () => void
  onMove: () => void
  onDelete: () => void
}) {
  return (
    <div className="sticky top-16 z-10 mb-3 flex animate-in flex-wrap items-center gap-2 rounded-xl border border-brand/40 bg-popover px-3 py-2 duration-200 fade-in slide-in-from-top-1">
      <span className="text-sm font-medium tabular-nums">{count} selected</span>
      {!allChecked && (
        <Button variant="ghost" size="xs" onClick={onAll}>
          Select all
        </Button>
      )}
      <span className="ml-auto flex items-center gap-1.5">
        <Button variant="outline" size="sm" onClick={onMove}>
          <Icon name="folder" /> Move to…
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Icon name="trash" /> Delete
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Clear selection" onClick={onClear}>
          <Icon name="x" />
        </Button>
      </span>
    </div>
  )
}

// ── Details ────────────────────────────────────────────────────────────────────────

const expiryFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

/** In a public folder: say so plainly, and how to undo it. */
function PublicNotice({ here, from, onMakePrivate }: { here: string; from: string | null; onMakePrivate: () => void }) {
  const self = from === here
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-success/25 bg-success/[0.06] px-3.5 py-2.5 text-sm">
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-success/15 text-success">
        <Icon name="network" size="sm" />
      </span>
      <p className="min-w-0 flex-1">
        <span className="font-medium">{self ? "This folder is public." : `Public because /${from} is public.`}</span>{" "}
        <span className="text-muted-foreground">Anyone with a file&apos;s address can open it.</span>
      </p>
      {from && (
        <Button variant="outline" size="sm" onClick={onMakePrivate}>
          <Icon name="shield" /> Make {self ? "it" : `/${from}`} private
        </Button>
      )}
    </div>
  )
}

/** The large preview, for reading a file properly. */
function PreviewDialog({ item, onClose }: { item: StorageItem | null; onClose: () => void }) {
  return (
    <Dialog open={item != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-4 sm:max-w-5xl">
        {item && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Icon name={kindMeta[kindOf(item)].icon} size="sm" className="text-muted-foreground" />
                <span className="truncate">{item.name}</span>
              </DialogTitle>
              <DialogDescription className="font-mono text-xs">
                {formatBytes(item.size)} · {item.contentType ?? typeLabel(item)} · {parentOf(item.path) ? `/${parentOf(item.path)}` : "Storage"}
              </DialogDescription>
            </DialogHeader>
            <FilePreview item={item} size="large" />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function PublicChip() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-1.5 py-px text-[0.625rem] font-medium text-success">
      <Icon name="network" className="size-2.5!" /> Public
    </span>
  )
}

/** A public file's permanent address, and copying it. */
function PublicAddress({ url }: { url: string }) {
  return (
    <div className="grid gap-2">
      <Button
        className="w-full"
        onClick={() =>
          void navigator.clipboard
            .writeText(url)
            .then(() => notify.success("Address copied", { description: "It works for anyone, until the folder is made private." }))
            .catch(() => notify.error(new Error("Your browser blocked copying."), { title: "Couldn't copy" }))
        }
      >
        <Icon name="copy" /> Copy address
      </Button>
      <p className="surface-sunken truncate rounded-lg px-2.5 py-2 font-mono text-xs" title={url}>
        {url}
      </p>
    </div>
  )
}

/** One file: preview, facts, and the two ways out — a link that expires, or a download. */
function FileDetails({
  item,
  onClose,
  onRename,
  onMove,
  onDelete,
  onPreview,
}: {
  item: StorageItem
  onClose: () => void
  onRename: () => void
  onMove: () => void
  onDelete: () => void
  onPreview: () => void
}) {
  const kind = kindOf(item)
  const createLink = useCreateLink()
  const [link, setLink] = React.useState<{ url: string; expiresAt: string } | null>(null)
  React.useEffect(() => setLink(null), [item.path])

  const share = async (expiresIn: LinkExpiry) => {
    try {
      const created = await createLink.mutateAsync({ path: item.path, expiresIn })
      setLink(created)
      await navigator.clipboard.writeText(created.url).catch(() => {})
      notify.success("Link copied", { description: `Works until ${expiryFormat.format(new Date(created.expiresAt))}.` })
    } catch (caught) {
      notify.error(caught, { title: "Couldn't create a link" })
    }
  }
  const download = async () => {
    try {
      const created = await createLink.mutateAsync({ path: item.path, expiresIn: "1h" })
      window.open(created.url, "_blank", "noopener")
    } catch (caught) {
      notify.error(caught, { title: "Couldn't start the download" })
    }
  }

  const facts: [string, React.ReactNode][] = [
    ["Size", <span key="s" className="font-mono">{formatBytes(item.size)}</span>],
    ["Type", item.contentType ?? typeLabel(item)],
    ["Modified", formatRelativeTime(item.updatedAt)],
    ["Added", formatRelativeTime(item.createdAt)],
    ["Folder", parentOf(item.path) ? `/${parentOf(item.path)}` : "Storage"],
  ]

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 rounded-xl border border-border/70 bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="grid min-w-0 flex-1 gap-0.5">
          <p className="text-sm font-medium break-all">{item.name}</p>
          {item.public ? (
            <p className="flex items-center gap-1.5 text-xs text-success">
              <Icon name="network" size="xs" /> Public
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon name="shield" size="xs" /> Private
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Close details" onClick={onClose} className="-mt-1 -mr-1">
          <Icon name="x" />
        </Button>
      </div>

      <div className="relative min-w-0">
        <FilePreview item={item} />
        {previewKindOf(item) !== "none" && (
          <Button variant="outline" size="xs" onClick={onPreview} className="absolute top-2 right-2 bg-background/85 backdrop-blur-sm">
            <Icon name="scan-search" /> Open
          </Button>
        )}
      </div>

      <dl className="grid gap-2 text-sm">
        {facts.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 truncate text-right">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-2">
        {item.publicUrl ? (
          <PublicAddress url={item.publicUrl} />
        ) : (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button className="w-full" loading={createLink.isPending} />}>
            {!createLink.isPending && <Icon name="link" />}
            Copy link
            <Icon name="chevron-down" size="xs" className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>The link stops working after</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {linkExpiries.map((e) => (
                <DropdownMenuItem key={e.value} onClick={() => void share(e.value)}>
                  <Icon name="clock" /> {e.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        )}
        <Button variant="outline" className="w-full" onClick={() => void download()} disabled={createLink.isPending}>
          <Icon name="download" />
          Download
        </Button>
        <div className="grid grid-cols-3 gap-1.5">
          <Button variant="ghost" size="sm" onClick={onRename}>
            <Icon name="feather" /> Rename
          </Button>
          <Button variant="ghost" size="sm" onClick={onMove}>
            <Icon name="folder" /> Move
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
            <Icon name="trash" /> Delete
          </Button>
        </div>
      </div>

      {link && (
        <div className="surface-sunken grid gap-1.5 rounded-lg p-2.5">
          <p className="truncate font-mono text-xs" title={link.url}>
            {link.url}
          </p>
          <p className="text-xs text-muted-foreground">Copied · works until {expiryFormat.format(new Date(link.expiresAt))}</p>
        </div>
      )}
    </div>
  )
}

function BrowserSkeleton({ view }: { view: "grid" | "list" }) {
  if (view === "list") {
    return (
      <div className="grid gap-px overflow-hidden rounded-xl border border-border/70 bg-card" aria-busy="true">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="h-3.5 w-48" />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" aria-busy="true">
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
      ))}
    </div>
  )
}
