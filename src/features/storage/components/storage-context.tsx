"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"

import { cn } from "@/lib/utils"
import { formatBytes } from "@/lib/format"
import { useUsage } from "@/features/usage/usage"
import { kindMeta, kindOf, storageKeys, uploadFile } from "@/features/storage/storage"
import { errorMessage, notify } from "@/components/feedback"
import { Icon } from "@/components/shared/icon"
import { Button } from "@/components/ui/button"

/**
 * Storage's shared state for the page: the folder being viewed, the upload queue (and its tray in
 * the corner), and the "New folder" dialog's open state — so the header buttons, drag-and-drop
 * and the palette all start the same uploads.
 */

type UploadStatus = "queued" | "uploading" | "done" | "failed" | "cancelled"
type Upload = {
  id: string
  file: File
  folder: string
  status: UploadStatus
  progress: number
  error?: string
  savedAs?: string
}

type StorageContext = {
  path: string
  upload: (files: readonly File[], folder?: string) => void
  pickFiles: () => void
  newFolderOpen: boolean
  setNewFolderOpen: (open: boolean) => void
}

const Context = React.createContext<StorageContext | null>(null)

export function useStorage() {
  const context = React.useContext(Context)
  if (!context) throw new Error("useStorage must be used inside <StorageProvider>")
  return context
}

const CONCURRENCY = 3

/** The folder in view, from the URL: /dashboard/storage/assets/logos → "assets/logos". */
function useFolderPath() {
  const pathname = usePathname()
  const rest = pathname.startsWith("/dashboard/storage") ? pathname.slice("/dashboard/storage".length).replace(/^\//, "") : ""
  return rest ? rest.split("/").map((part) => decodeURIComponent(part)).join("/") : ""
}

/** Lives in the Storage layout, so uploads (and their tray) carry on while you change folders. */
export function StorageProvider({ children }: { children: React.ReactNode }) {
  const path = useFolderPath()
  const queryClient = useQueryClient()
  const { data: usage } = useUsage()
  const [uploads, setUploads] = React.useState<Upload[]>([])
  const [newFolderOpen, setNewFolderOpen] = React.useState(false)
  const controllers = React.useRef(new Map<string, AbortController>())
  /** Each attempt starts once, even when effects run twice (development). */
  const started = React.useRef(new Set<string>())
  const inputRef = React.useRef<HTMLInputElement>(null)

  const patch = (id: string, next: Partial<Upload>) => setUploads((list) => list.map((u) => (u.id === id ? { ...u, ...next } : u)))

  // Refresh the lists once a burst of uploads settles, not after every file.
  const refreshTimer = React.useRef<number | undefined>(undefined)
  const refresh = React.useCallback(() => {
    window.clearTimeout(refreshTimer.current)
    refreshTimer.current = window.setTimeout(() => {
      void queryClient.invalidateQueries({ queryKey: storageKeys.all })
      void queryClient.invalidateQueries({ queryKey: ["usage"] })
    }, 300)
  }, [queryClient])

  const run = React.useCallback(
    async (upload: Upload) => {
      const controller = new AbortController()
      controllers.current.set(upload.id, controller)
      patch(upload.id, { status: "uploading", progress: 0, error: undefined })
      try {
        const target = upload.folder ? `${upload.folder}/${upload.file.name}` : upload.file.name
        const item = await uploadFile(target, upload.file, (progress) => patch(upload.id, { progress }), controller.signal)
        patch(upload.id, { status: "done", progress: 1, savedAs: item.name !== upload.file.name ? item.name : undefined })
        refresh()
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") patch(upload.id, { status: "cancelled" })
        else patch(upload.id, { status: "failed", error: errorMessage(caught) })
      } finally {
        controllers.current.delete(upload.id)
      }
    },
    [refresh]
  )

  // The queue: keep up to CONCURRENCY uploads running.
  React.useEffect(() => {
    const running = uploads.filter((u) => u.status === "uploading").length
    const next = uploads.filter((u) => u.status === "queued").slice(0, Math.max(0, CONCURRENCY - running))
    for (const upload of next) {
      const attempt = `${upload.id}:${upload.status}:${upload.error ?? ""}`
      if (started.current.has(attempt)) continue
      started.current.add(attempt)
      void run(upload)
    }
  }, [uploads, run])

  const upload = React.useCallback(
    (files: readonly File[], folder = path) => {
      if (files.length === 0) return
      const limit = usage?.limits.find((l) => l.id === "storage")
      const total = files.reduce((sum, f) => sum + f.size, 0)
      if (limit && limit.used + total > limit.limit) {
        notify.error(new Error(`${files.length === 1 ? "This file needs" : "These files need"} ${formatBytes(total)}, and ${formatBytes(Math.max(0, limit.limit - limit.used))} is left on your plan.`), {
          title: "Not enough space",
        })
        return
      }
      setUploads((list) => [
        // Finished rows from earlier batches make way for the new ones.
        ...list.filter((u) => u.status === "uploading" || u.status === "queued" || u.status === "failed"),
        ...files.map((file) => ({ id: crypto.randomUUID(), file, folder, status: "queued" as const, progress: 0 })),
      ])
    },
    [path, usage]
  )

  const context = React.useMemo<StorageContext>(
    () => ({ path, upload, pickFiles: () => inputRef.current?.click(), newFolderOpen, setNewFolderOpen }),
    [path, upload, newFolderOpen]
  )

  return (
    <Context.Provider value={context}>
      {children}
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          upload([...(e.target.files ?? [])])
          e.target.value = ""
        }}
      />
      <UploadTray
        uploads={uploads}
        onCancel={(id) => {
          const controller = controllers.current.get(id)
          if (controller) controller.abort()
          else patch(id, { status: "cancelled" })
        }}
        onRetry={(id) => {
          // A retry is a new attempt.
          for (const key of started.current) if (key.startsWith(`${id}:`)) started.current.delete(key)
          patch(id, { status: "queued", progress: 0, error: undefined })
        }}
        onCancelAll={() => {
          controllers.current.forEach((c) => c.abort())
          setUploads((list) => list.map((u) => (u.status === "queued" ? { ...u, status: "cancelled" } : u)))
        }}
        onClear={() => setUploads([])}
      />
    </Context.Provider>
  )
}

// ── The tray ───────────────────────────────────────────────────────────────────────

function UploadTray({
  uploads,
  onCancel,
  onRetry,
  onCancelAll,
  onClear,
}: {
  uploads: Upload[]
  onCancel: (id: string) => void
  onRetry: (id: string) => void
  onCancelAll: () => void
  onClear: () => void
}) {
  const [collapsed, setCollapsed] = React.useState(false)
  if (uploads.length === 0) return null

  const active = uploads.filter((u) => u.status === "uploading" || u.status === "queued")
  const done = uploads.filter((u) => u.status === "done").length
  const failed = uploads.filter((u) => u.status === "failed").length
  const totalBytes = uploads.filter((u) => u.status !== "cancelled").reduce((sum, u) => sum + u.file.size, 0)
  const sentBytes = uploads.filter((u) => u.status !== "cancelled").reduce((sum, u) => sum + u.file.size * u.progress, 0)
  const overall = totalBytes ? sentBytes / totalBytes : 0

  const title = active.length
    ? `Uploading ${active.length} ${active.length === 1 ? "file" : "files"}`
    : failed
      ? `${failed} ${failed === 1 ? "upload" : "uploads"} failed`
      : `${done} ${done === 1 ? "file" : "files"} uploaded`

  return (
    <section
      aria-label="Uploads"
      className="fixed right-4 bottom-4 z-40 w-[min(22rem,calc(100vw-2rem))] animate-in overflow-hidden rounded-xl border border-border/70 bg-popover duration-300 fade-in slide-in-from-bottom-2 ease-out-expo"
    >
      <header className="flex items-center gap-2 px-3.5 py-2.5">
        <span className={cn("grid size-6 place-items-center rounded-full", active.length ? "text-brand-ink" : failed ? "text-destructive" : "text-success")}>
          <Icon name={active.length ? "upload" : failed ? "circle-alert" : "check"} size="sm" />
        </span>
        <div className="grid min-w-0 flex-1">
          <p role="status" aria-live="polite" className="truncate text-sm font-medium">
            {title}
          </p>
          {active.length > 0 && (
            <p className="text-xs text-muted-foreground tabular-nums">
              {Math.round(overall * 100)}% · {formatBytes(sentBytes)} of {formatBytes(totalBytes)}
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon-xs" aria-label={collapsed ? "Show uploads" : "Hide uploads"} onClick={() => setCollapsed((c) => !c)}>
          <Icon name="chevron-down" className={cn("transition-transform", collapsed && "rotate-180")} />
        </Button>
        {active.length ? (
          <Button variant="ghost" size="xs" onClick={onCancelAll}>
            Cancel all
          </Button>
        ) : (
          <Button variant="ghost" size="icon-xs" aria-label="Close" onClick={onClear}>
            <Icon name="x" />
          </Button>
        )}
      </header>
      {active.length > 0 && (
        <div className="h-0.5 bg-foreground/10">
          <div className="metal-brand h-full transition-[width] duration-300" style={{ width: `${overall * 100}%` }} />
        </div>
      )}
      {!collapsed && (
        <ul className="max-h-64 divide-y divide-border/50 overflow-y-auto border-t border-border/60">
          {uploads.map((u) => (
            <UploadRow key={u.id} upload={u} onCancel={() => onCancel(u.id)} onRetry={() => onRetry(u.id)} />
          ))}
        </ul>
      )}
    </section>
  )
}

function UploadRow({ upload, onCancel, onRetry }: { upload: Upload; onCancel: () => void; onRetry: () => void }) {
  const kind = kindOf({ kind: "file", name: upload.file.name, contentType: upload.file.type || null })
  const where = upload.folder ? `/${upload.folder}` : "Storage"
  let detail: React.ReactNode
  switch (upload.status) {
    case "queued":
      detail = "Waiting…"
      break
    case "uploading":
      detail = `${Math.round(upload.progress * 100)}% · ${formatBytes(upload.file.size * upload.progress)} of ${formatBytes(upload.file.size)}`
      break
    case "done":
      detail = upload.savedAs ? `Saved as ${upload.savedAs} in ${where}` : `Uploaded to ${where}`
      break
    case "failed":
      detail = <span className="text-destructive">{upload.error ?? "Didn't upload."}</span>
      break
    case "cancelled":
      detail = "Cancelled"
      break
  }
  return (
    <li className="flex items-center gap-3 px-3.5 py-2.5">
      <span className="surface-sunken grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground">
        <Icon name={kindMeta[kind].icon} size="xs" />
      </span>
      <div className="grid min-w-0 flex-1 gap-1">
        <p className={cn("truncate text-sm", upload.status === "cancelled" && "text-muted-foreground line-through")}>{upload.file.name}</p>
        {upload.status === "uploading" && (
          <div className="h-1 overflow-hidden rounded-full bg-foreground/10">
            <div className="h-full rounded-full bg-brand transition-[width] duration-200" style={{ width: `${upload.progress * 100}%` }} />
          </div>
        )}
        <p className="truncate text-xs text-muted-foreground tabular-nums">{detail}</p>
      </div>
      {(upload.status === "uploading" || upload.status === "queued") && (
        <Button variant="ghost" size="icon-xs" aria-label={`Cancel ${upload.file.name}`} onClick={onCancel}>
          <Icon name="x" />
        </Button>
      )}
      {upload.status === "failed" && (
        <Button variant="ghost" size="xs" onClick={onRetry}>
          Retry
        </Button>
      )}
      {upload.status === "done" && <Icon name="check" size="sm" className="shrink-0 text-success" />}
    </li>
  )
}
