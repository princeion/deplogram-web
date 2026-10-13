"use client"

import * as React from "react"
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"
import { storageFiles } from "@/content/workspace"
import { Icon, type IconName } from "@/components/shared/icon"
import { ProductWindow } from "@/components/marketing/product-window"

type Kind = "folder" | "image" | "file" | "archive" | "video"

const kindIcon: Record<Kind, IconName> = {
  folder: "folder",
  image: "image",
  file: "file-text",
  archive: "file-archive",
  video: "play",
}

const TICK_MS = 100
// Timeline in ticks: drag a file in, upload it, then delete an old backup with a confirmation.
const T = { drop: 8, upload: 20, uploaded: 46, select: 60, confirm: 66, deleted: 86, end: 118 }

const UPLOAD = { name: "launch-video.mp4", kind: "video" as const, size: "24 MB", mb: 24 }
const DELETE_NAME = storageFiles.find((f) => f.kind === "archive")?.name ?? ""
const BASE_MB = 312
const DELETE_MB = 12.4

/**
 * Storage — conventional mechanics (brief §3): usage, folders, upload, search, sort, delete with a
 * clear confirmation. Loops while on screen; reduced motion shows a settled view.
 */
export function StorageMock({ className }: { className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.3 })
  const reduceMotion = useReducedMotion()
  const [tick, setTick] = React.useState(0)

  React.useEffect(() => {
    if (reduceMotion || !inView) return
    const id = window.setInterval(() => setTick((t) => (t >= T.end ? 0 : t + 1)), TICK_MS)
    return () => window.clearInterval(id)
  }, [reduceMotion, inView])

  const t = reduceMotion ? 0 : tick
  const dragging = t >= T.drop && t < T.upload
  const uploading = t >= T.upload
  const progress = Math.min(1, Math.max(0, (t - T.upload) / (T.uploaded - T.upload)))
  const uploaded = t >= T.uploaded
  const selected = t >= T.select && t < T.deleted
  const confirming = t >= T.confirm && t < T.deleted
  const deleted = t >= T.deleted

  const used = BASE_MB + (uploaded ? UPLOAD.mb : 0) - (deleted ? DELETE_MB : 0)

  const files = [
    ...(uploading ? [{ name: UPLOAD.name, kind: UPLOAD.kind as Kind, size: UPLOAD.size, modified: "Just now" }] : []),
    ...storageFiles.filter((f) => !(deleted && f.name === DELETE_NAME)).map((f) => ({ ...f, kind: f.kind as Kind })),
  ]

  return (
    <div ref={ref} className={className}>
      <ProductWindow title="your galley / storage / uploads" bodyClassName="relative">
        {/* Usage */}
        <div className="grid gap-3 border-b border-border/70 px-5 py-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-heading text-lg font-medium tracking-tight">Storage</span>
            <span className="font-mono text-xs text-muted-foreground">
              <motion.span key={used} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="text-foreground tabular-nums">
                {used.toFixed(used % 1 ? 1 : 0)} MB
              </motion.span>{" "}
              of 1 GB
            </span>
          </div>
          <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${used} MB of 1 GB used`}>
            <motion.div className="h-full rounded-full bg-foreground" animate={{ width: `${18 + (uploaded ? 2.4 : 0)}%` }} transition={{ duration: 0.6 }} />
            <motion.div className="h-full rounded-full bg-brand" animate={{ width: "9%" }} />
            <motion.div className="h-full rounded-full bg-muted-foreground/50" animate={{ width: deleted ? "2.8%" : "4%" }} transition={{ duration: 0.6 }} />
          </div>
          <div className="flex gap-4 text-[0.6875rem] text-muted-foreground">
            <Legend className="bg-foreground" label="Media" />
            <Legend className="bg-brand" label="Documents" />
            <Legend className="bg-muted-foreground/50" label="Archives" />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-border/70 px-4 py-2.5">
          <span className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-full border border-border/70 bg-background px-3 text-xs text-muted-foreground">
            <Icon name="search" size="xs" />
            <span className="truncate">Search files</span>
          </span>
          <span className="hidden h-8 items-center gap-1.5 rounded-full border border-border/70 px-3 text-xs text-muted-foreground sm:flex">
            <Icon name="arrow-up-down" size="xs" /> Modified
          </span>
          <span className="flex size-8 items-center justify-center rounded-full border border-border/70 text-muted-foreground">
            <Icon name="folder-plus" size="xs" />
          </span>
          <motion.span
            animate={{ scale: dragging ? 0.95 : 1 }}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-xs font-medium text-background"
          >
            <Icon name="upload" size="xs" /> Upload
          </motion.span>
        </div>

        {/* Files */}
        <div className="relative">
          <div className="grid grid-cols-[1fr_4.5rem_4.5rem] border-b border-border/70 px-5 py-2 text-[0.6875rem] text-muted-foreground sm:grid-cols-[1fr_5.5rem_5.5rem]">
            <span>Name</span>
            <span className="text-right">Size</span>
            <span className="text-right">Modified</span>
          </div>
          <ul className="h-74 overflow-hidden" aria-label="Files (illustrative)">
            <AnimatePresence initial={false}>
              {files.map((file) => {
                const isUpload = file.name === UPLOAD.name
                const isSelected = selected && file.name === DELETE_NAME
                return (
                  <motion.li
                    key={file.name}
                    layout={!reduceMotion}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0, backgroundColor: "var(--destructive)" }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div
                      className={cn(
                        "relative grid grid-cols-[1fr_4.5rem_4.5rem] items-center border-b border-border/50 px-5 py-2.5 transition-colors sm:grid-cols-[1fr_5.5rem_5.5rem]",
                        isSelected && "bg-destructive/10",
                        isUpload && !uploaded && "bg-muted/40"
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                            isSelected ? "border-destructive bg-destructive text-white" : "border-border"
                          )}
                        >
                          {isSelected && <Icon name="check" className="size-2.5" />}
                        </span>
                        <span
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-md border border-border/70",
                            file.kind === "folder" ? "bg-brand/10 text-brand-ink" : "bg-background text-muted-foreground"
                          )}
                        >
                          <Icon name={kindIcon[file.kind]} size="xs" />
                        </span>
                        <span className="grid min-w-0 gap-1">
                          <span className={cn("truncate text-xs", file.kind === "folder" && "font-medium")}>{file.name}</span>
                          {isUpload && !uploaded && (
                            <span className="block h-1 w-full max-w-40 overflow-hidden rounded-full bg-muted">
                              <span className="block h-full rounded-full bg-brand transition-[width] duration-100" style={{ width: `${progress * 100}%` }} />
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="text-right font-mono text-[0.6875rem] text-muted-foreground">
                        {isUpload && !uploaded ? `${Math.round(progress * 100)}%` : file.size}
                      </span>
                      <span className="flex items-center justify-end gap-1.5 text-right text-[0.6875rem] text-muted-foreground">
                        {isUpload && uploaded && <Icon name="check" size="xs" className="text-success" />}
                        {file.modified}
                      </span>
                    </div>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>

          {/* Drop zone */}
          <AnimatePresence>
            {dragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-2 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-brand/60 bg-card/90 backdrop-blur-sm"
              >
                <motion.span
                  initial={{ y: -24, rotate: -6, opacity: 0 }}
                  animate={{ y: 0, rotate: -3, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="flex items-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-xs"
                >
                  <Icon name="play" size="xs" className="text-brand-ink" />
                  {UPLOAD.name}
                </motion.span>
                <span className="text-xs text-muted-foreground">Drop to upload to /uploads</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Delete confirmation */}
        <AnimatePresence>
          {confirming && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center bg-background/60 p-4 backdrop-blur-[2px]">
              <motion.div
                initial={{ scale: 0.96, y: 8 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-xs rounded-xl border border-border/70 bg-card p-4"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <Icon name="trash" size="xs" />
                </span>
                <p className="mt-3 text-sm font-medium">Delete 1 file?</p>
                <p className="mt-1 text-xs text-pretty text-muted-foreground">
                  <span className="font-mono text-foreground">{DELETE_NAME}</span> ({DELETE_MB} MB) will be removed permanently.
                </p>
                <div className="mt-4 flex justify-end gap-2 text-xs font-medium">
                  <span className="rounded-full border border-border/70 px-3 py-1.5">Cancel</span>
                  <motion.span
                    animate={{ scale: t >= T.deleted - 4 ? 0.94 : 1 }}
                    className="rounded-full bg-destructive px-3 py-1.5 text-white"
                  >
                    Delete
                  </motion.span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </ProductWindow>
    </div>
  )
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-1.5 rounded-full", className)} />
      {label}
    </span>
  )
}
