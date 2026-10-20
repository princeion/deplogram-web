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
  useStorageList,
  useStorageSearch,
  type LinkExpiry,
  type StorageItem,
  type StorageSort,
} from "@/features/storage/storage"
import { UsageMeter } from "@/components/charts"
import { notify } from "@/components/feedback"
import { FolderShape } from "@/components/shared/folder-shape"
import { Icon } from "@/components/shared/icon"
import { Segmented } from "@/components/shared/segmented"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
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
        <section aria-label={searching ? "Search results" : "Files"} className="min-w-0">
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
              <EmptyState icon="folder" title={path ? "This folder is empty." : "Nothing stored yet."} description="Files you upload appear here." />
            )
          ) : view === "grid" ? (
            <GridView items={items} selected={selected} onSelect={select} showFolder={searching} />
          ) : (
            <ListView items={items} selected={selected} onSelect={select} showFolder={searching} />
          )}
        </section>

        {/* Details: beside the files on wide screens, a sheet below that. */}
        <aside aria-label="File details" className="sticky top-20 hidden lg:block">
          {selected ? (
            <FileDetails item={selected} onClose={() => select(null)} />
          ) : (
            <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
              <Icon name="file" className="text-muted-foreground/70" />
              Select a file to see its details and share it.
            </div>
          )}
        </aside>
        <Sheet open={selected != null && !wide} onOpenChange={(open) => !open && select(null)}>
          <SheetContent side="right" className="w-full max-w-sm overflow-y-auto p-4" showCloseButton={false}>
            <SheetTitle className="sr-only">{selected?.name ?? "File"}</SheetTitle>
            {selected && <FileDetails item={selected} onClose={() => select(null)} />}
          </SheetContent>
        </Sheet>
      </div>
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

/** "1.24 GB of 5 GB", the meter, and what the space is used by. */
function UsageStrip() {
  const { data } = useUsage()
  const limit = data?.limits.find((l) => l.id === "storage")
  if (!data || !limit) return <Skeleton className="h-[74px] rounded-xl" />
  return (
    <div className="grid gap-3 rounded-xl border border-border/70 bg-card px-4 py-3.5 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:items-center sm:gap-6 sm:px-5">
      <div className="grid gap-2">
        <p className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Storage</span>
          <span className="font-mono tabular-nums">
            {formatBytes(limit.used)} <span className="text-muted-foreground">of {formatBytes(limit.limit)}</span>
          </span>
        </p>
        <UsageMeter used={limit.used} limit={limit.limit} label="Storage used" />
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {data.storageByKind.map((k) => (
          <li key={k.kind}>
            {k.kind} <span className="font-mono text-foreground/80 tabular-nums">{formatBytes(k.bytes)}</span>
          </li>
        ))}
        <li>
          <Link href="/dashboard/usage" className="underline-offset-2 hover:text-foreground hover:underline">
            Usage &amp; limits →
          </Link>
        </li>
      </ul>
    </div>
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
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as StorageSort)}>
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
}

const folderSummary = (item: StorageItem) => `${item.items ?? 0} ${item.items === 1 ? "item" : "items"} · ${formatBytes(item.size)}`

function FolderIn({ item }: { item: StorageItem }) {
  const parent = parentOf(item.path)
  return <span className="truncate text-xs text-muted-foreground">in {parent ? `/${parent}` : "Storage"}</span>
}

function GridView({ items, selected, onSelect, showFolder }: ItemsProps) {
  const folders = items.filter((i) => i.kind === "folder")
  const files = items.filter((i) => i.kind === "file")
  return (
    <div className="grid gap-6">
      {folders.length > 0 && (
        <ul aria-label="Folders" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {folders.map((folder) => (
            <li key={folder.path}>
              <FolderShape bodyClassName="flex-row items-center gap-3 p-3.5">
                <span className="surface-sunken flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground">
                  <Icon name="folder" size="sm" />
                </span>
                <Link href={folderHref(folder.path)} className="grid min-w-0 flex-1 outline-none after:absolute after:inset-0 after:rounded-[inherit] focus-visible:after:ring-2 focus-visible:after:ring-ring/60 focus-visible:after:ring-inset">
                  <span className="truncate text-sm font-medium">{folder.name}</span>
                  {showFolder ? <FolderIn item={folder} /> : <span className="truncate text-xs text-muted-foreground tabular-nums">{folderSummary(folder)}</span>}
                </Link>
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
            return (
              <li key={file.path}>
                <button
                  type="button"
                  onClick={() => onSelect(file)}
                  aria-pressed={active}
                  className={cn(
                    "group/file grid w-full overflow-hidden rounded-xl border bg-card text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                    active ? "border-brand/60 ring-1 ring-brand/40" : "border-border/70 hover:border-foreground/20"
                  )}
                >
                  <span className="surface-sunken relative grid aspect-[16/10] place-items-center overflow-hidden">
                    {file.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- generated or signed thumbnails, not optimisable
                      <img src={file.thumbnailUrl} alt="" className="size-full object-cover transition-transform duration-500 ease-out-expo group-hover/file:scale-[1.03]" />
                    ) : (
                      <Icon name={kindMeta[kind].icon} size="lg" className="text-muted-foreground/70" />
                    )}
                    <span className="absolute bottom-2 left-2 rounded-md bg-background/80 px-1.5 py-0.5 font-mono text-[0.625rem] text-muted-foreground backdrop-blur-sm">{typeLabel(file)}</span>
                  </span>
                  <span className="grid gap-0.5 px-3 py-2.5">
                    <span className="truncate text-sm font-medium">{file.name}</span>
                    {showFolder ? <FolderIn item={file} /> : <span className="text-xs text-muted-foreground tabular-nums">{formatBytes(file.size)} · {formatRelativeTime(file.updatedAt)}</span>}
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

function ListView({ items, selected, onSelect, showFolder }: ItemsProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
      <div className="surface-band hidden grid-cols-[minmax(0,1fr)_6rem_5rem_7rem] gap-4 border-b border-border/60 px-4 py-2 text-xs font-medium text-muted-foreground sm:grid">
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
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- generated or signed thumbnails
                    <img src={item.thumbnailUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <Icon name={kindMeta[kind].icon} size="xs" />
                  )}
                </span>
                <span className="grid min-w-0">
                  <span className="truncate text-sm font-medium">{item.name}</span>
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
            <li key={item.path} className="relative">
              {active && <span aria-hidden className="metal-brand absolute inset-y-1.5 left-0 w-[3px] rounded-full" />}
              {item.kind === "folder" ? (
                <Link href={folderHref(item.path)} className={rowClass}>
                  {content}
                </Link>
              ) : (
                <button type="button" aria-pressed={active} onClick={() => onSelect(item)} className={rowClass}>
                  {content}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ── Details ────────────────────────────────────────────────────────────────────────

const expiryFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

/** One file: preview, facts, and the two ways out — a link that expires, or a download. */
function FileDetails({ item, onClose }: { item: StorageItem; onClose: () => void }) {
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
    <div className="grid gap-4 rounded-xl border border-border/70 bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="grid min-w-0 flex-1 gap-0.5">
          <p className="text-sm font-medium break-all">{item.name}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon name="shield" size="xs" /> Private
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Close details" onClick={onClose} className="-mt-1 -mr-1">
          <Icon name="x" />
        </Button>
      </div>

      <div className="surface-sunken grid aspect-[16/10] place-items-center overflow-hidden rounded-lg">
        {item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- generated or signed previews
          <img src={item.thumbnailUrl} alt={`Preview of ${item.name}`} className="size-full object-contain" />
        ) : (
          <span className="grid justify-items-center gap-2 text-xs text-muted-foreground">
            <Icon name={kindMeta[kind].icon} size="lg" className="text-muted-foreground/70" />
            {kindMeta[kind].label} · no preview
          </span>
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
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button className="w-full" loading={createLink.isPending} />}>
            {!createLink.isPending && <Icon name="link" />}
            Copy link
            <Icon name="chevron-down" size="xs" className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>The link stops working after</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {linkExpiries.map((e) => (
              <DropdownMenuItem key={e.value} onClick={() => void share(e.value)}>
                <Icon name="clock" /> {e.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" className="w-full" onClick={() => void download()} disabled={createLink.isPending}>
          <Icon name="download" />
          Download
        </Button>
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
