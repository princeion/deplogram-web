"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { kindMeta, kindOf, typeLabel, useStoragePreview, type StorageItem } from "@/features/storage/storage"
import { CodeEditor } from "@/components/code-editor/code-editor"
import { Icon } from "@/components/shared/icon"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * A file, shown the way it should be read: images as pictures, video and audio with players,
 * PDFs in a frame, CSV as a table, and code, JSON and Markdown in the read-only editor. Anything
 * else — or a preview that fails to load — says so and points at Download.
 * `size="panel"` fits the details column; `size="large"` fills the preview dialog.
 */

export type PreviewKind = "image" | "video" | "audio" | "pdf" | "table" | "text" | "none"

export function previewKindOf(item: StorageItem): PreviewKind {
  const kind = kindOf(item)
  const ext = item.name.split(".").pop()?.toLowerCase()
  if (kind === "image") return "image"
  if (kind === "video") return "video"
  if (kind === "audio") return "audio"
  if (kind === "pdf") return "pdf"
  if (ext === "csv") return "table"
  if (kind === "code" || kind === "data") return "text"
  return "none"
}

export function FilePreview({ item, size = "panel", className }: { item: StorageItem; size?: "panel" | "large"; className?: string }) {
  const preview = useStoragePreview(item)
  const kind = previewKindOf(item)
  const [failed, setFailed] = React.useState(false)
  React.useEffect(() => setFailed(false), [item.path])
  const large = size === "large"

  if (kind === "none") return <NoPreview item={item} reason="no-type" className={className} large={large} />
  if (preview.isPending) return <Skeleton className={cn("w-full rounded-lg", large ? "h-[60vh]" : "aspect-[16/10]", className)} />
  const data = preview.data
  if (preview.isError || !data || failed) return <NoPreview item={item} reason="unavailable" className={className} large={large} />

  switch (kind) {
    case "image": {
      const src = data.url ?? item.thumbnailUrl
      if (!src) return <NoPreview item={item} reason="unavailable" className={className} large={large} />
      return (
        <div className={cn("surface-sunken grid place-items-center overflow-hidden rounded-lg", large ? "h-[65vh]" : "aspect-[16/10]", className)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- signed preview URLs, not optimisable */}
          <img src={src} alt={`Preview of ${item.name}`} onError={() => setFailed(true)} className="size-full object-contain" />
        </div>
      )
    }
    case "video":
      if (!data.url) return <NoPreview item={item} reason="unavailable" className={className} large={large} />
      return (
        <video src={data.url} controls preload="metadata" onError={() => setFailed(true)} className={cn("w-full rounded-lg bg-black", large ? "max-h-[65vh]" : "aspect-video", className)}>
          <track kind="captions" />
        </video>
      )
    case "audio":
      if (!data.url) return <NoPreview item={item} reason="unavailable" className={className} large={large} />
      return (
        <div className={cn("surface-sunken grid gap-3 rounded-lg p-4", className)}>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="play" size="sm" /> {item.name}
          </span>
          <audio src={data.url} controls preload="metadata" onError={() => setFailed(true)} className="w-full" />
        </div>
      )
    case "pdf":
      if (!data.url) return <NoPreview item={item} reason="unavailable" className={className} large={large} />
      return <iframe src={data.url} title={`Preview of ${item.name}`} className={cn("w-full rounded-lg border border-border/70 bg-white", large ? "h-[70vh]" : "aspect-[3/4]", className)} />
    case "table":
      if (data.text == null) return <NoPreview item={item} reason="unavailable" className={className} large={large} />
      return <CsvTable text={data.text} truncated={data.truncated} large={large} className={className} />
    case "text":
      if (data.text == null) return <NoPreview item={item} reason="unavailable" className={className} large={large} />
      return (
        <div className={cn("overflow-hidden rounded-lg border border-border/70", className)}>
          <div style={{ height: large ? "65vh" : 240 }}>
            <CodeEditor modelPath={`storage/${item.path}`} filePath={item.name} value={data.text} onChange={() => {}} readOnly minimal />
          </div>
          {data.truncated && <p className="border-t border-border/60 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">Showing the start of the file — download it for the rest.</p>}
        </div>
      )
  }
}

function NoPreview({ item, reason, large, className }: { item: StorageItem; reason: "no-type" | "unavailable"; large: boolean; className?: string }) {
  const kind = kindOf(item)
  return (
    <div className={cn("surface-sunken relative grid place-items-center overflow-hidden rounded-lg text-center", large ? "h-[40vh]" : "aspect-[16/10]", className)}>
      <span aria-hidden className="absolute inset-0 bg-dot-grid opacity-60 mask-fade-edges" />
      <span className="relative grid justify-items-center gap-1.5 px-4">
        <Icon name={kindMeta[kind].icon} size="md" className="text-muted-foreground/80" />
        <span className="font-mono text-2xl font-medium tracking-tight text-foreground/25">{typeLabel(item)}</span>
        <span className="text-xs text-muted-foreground">{reason === "no-type" ? "No preview for this type — download to open it." : "Preview isn't available — download to view it."}</span>
      </span>
    </div>
  )
}

/** CSV as a table: the header row, then up to 100 rows. Handles quoted fields. */
function CsvTable({ text, truncated, large, className }: { text: string; truncated: boolean; large: boolean; className?: string }) {
  const rows = React.useMemo(() => parseCsv(text).slice(0, 101), [text])
  const [head, ...body] = rows
  if (!head) return null
  return (
    <div className={cn("overflow-hidden rounded-lg border border-border/70", className)}>
      <div className="overflow-auto" style={{ maxHeight: large ? "65vh" : 240 }}>
        <table className="w-full border-collapse font-mono text-[0.6875rem]">
          <thead className="surface-band sticky top-0">
            <tr>
              {head.map((cell, i) => (
                <th key={i} className="border-b border-border/60 px-2.5 py-1.5 text-left font-medium whitespace-nowrap text-muted-foreground">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, r) => (
              <tr key={r} className="border-b border-border/40 last:border-0 hover:bg-muted/40">
                {row.map((cell, c) => (
                  <td key={c} className="px-2.5 py-1.5 whitespace-nowrap tabular-nums">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-border/60 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
        {body.length} {body.length === 1 ? "row" : "rows"}
        {truncated || rows.length > 100 ? " shown — download the file for the rest" : ""}
      </p>
    </div>
  )
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ",") {
      row.push(cell)
      cell = ""
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++
      row.push(cell)
      if (row.some((v) => v !== "")) rows.push(row)
      row = []
      cell = ""
    } else cell += c
  }
  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}
