import { keepPreviousData, queryOptions, useMutation, useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { apiFetch } from "@/lib/api-client"
import type { IconName } from "@/components/shared/icon"

/**
 * Storage: one private drive per workspace, organised in folders. Files are private; sharing is
 * by links that expire. (Buckets may come later — they'd sit above these folders.) Endpoint
 * shapes are the frontend's proposal until the backend contract is agreed; src/mocks/handlers.ts
 * implements them meanwhile.
 *
 *   GET  /v1/storage/list?path=assets/logos   → { path, items }   folders first
 *   GET  /v1/storage/search?q=logo            → { items }         across the whole drive
 *   POST /v1/storage/links  { path, expiresIn } → { url, expiresAt }
 *
 * Paths have no leading slash; "" is the top of the drive.
 */

export const storageItemSchema = z.object({
  kind: z.enum(["folder", "file"]),
  name: z.string(),
  /** Full path from the top of the drive, e.g. "assets/logos/logo.svg". */
  path: z.string(),
  /** Bytes; for a folder, everything inside it. */
  size: z.number(),
  /** Files only: MIME type. */
  contentType: z.string().nullable(),
  /** Folders only: direct children. */
  items: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  /** Images only: a small thumbnail URL. */
  thumbnailUrl: z.string().nullable(),
})
export type StorageItem = z.infer<typeof storageItemSchema>

export const storageListSchema = z.object({
  path: z.string(),
  items: z.array(storageItemSchema),
})

export const storageLinkSchema = z.object({ url: z.string(), expiresAt: z.string() })
export type LinkExpiry = "1h" | "1d" | "7d"
export const linkExpiries: { value: LinkExpiry; label: string }[] = [
  { value: "1h", label: "1 hour" },
  { value: "1d", label: "1 day" },
  { value: "7d", label: "7 days" },
]

export const storageKeys = {
  all: ["storage"] as const,
  list: (path: string) => [...storageKeys.all, "list", path] as const,
  search: (q: string) => [...storageKeys.all, "search", q] as const,
}

export const storageListQuery = (path: string) =>
  queryOptions({
    queryKey: storageKeys.list(path),
    queryFn: () => apiFetch(`/v1/storage/list?path=${encodeURIComponent(path)}`, { schema: storageListSchema }),
  })

export function useStorageList(path: string) {
  return useQuery(storageListQuery(path))
}

export function useStorageSearch(q: string) {
  return useQuery({
    queryKey: storageKeys.search(q),
    queryFn: () => apiFetch(`/v1/storage/search?q=${encodeURIComponent(q)}`, { schema: z.object({ items: z.array(storageItemSchema) }) }),
    enabled: q.length > 0,
    placeholderData: keepPreviousData,
  })
}

/** A link to one private file that stops working after `expiresIn`. */
export function useCreateLink() {
  return useMutation({
    mutationFn: (input: { path: string; expiresIn: LinkExpiry }) => apiFetch("/v1/storage/links", { method: "POST", json: input, schema: storageLinkSchema }),
  })
}

// ── What a file is, for icons, labels and previews ────────────────────────────────

export type FileKind = "folder" | "image" | "video" | "audio" | "pdf" | "document" | "code" | "data" | "archive" | "other"

export function kindOf(item: Pick<StorageItem, "kind" | "name" | "contentType">): FileKind {
  if (item.kind === "folder") return "folder"
  const type = item.contentType ?? ""
  const ext = item.name.split(".").pop()?.toLowerCase() ?? ""
  if (type.startsWith("image/")) return "image"
  if (type.startsWith("video/")) return "video"
  if (type.startsWith("audio/")) return "audio"
  if (type === "application/pdf") return "pdf"
  if (["zip", "gz", "tgz", "tar", "rar", "7z"].includes(ext)) return "archive"
  if (["csv", "json", "xml", "yaml", "yml", "sql", "parquet"].includes(ext)) return "data"
  if (["js", "ts", "tsx", "jsx", "py", "go", "php", "html", "css", "sh", "md", "txt", "env"].includes(ext)) return "code"
  if (["doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "rtf"].includes(ext)) return "document"
  return "other"
}

export const kindMeta: Record<FileKind, { label: string; icon: IconName }> = {
  folder: { label: "Folder", icon: "folder" },
  image: { label: "Image", icon: "image" },
  video: { label: "Video", icon: "play" },
  audio: { label: "Audio", icon: "play" },
  pdf: { label: "PDF", icon: "file-text" },
  document: { label: "Document", icon: "file-text" },
  code: { label: "Code", icon: "file-code" },
  data: { label: "Data", icon: "database" },
  archive: { label: "Archive", icon: "file-archive" },
  other: { label: "File", icon: "file" },
}

/** "PNG", "MP4", "Folder" — short type for lists. */
export function typeLabel(item: StorageItem) {
  if (item.kind === "folder") return "Folder"
  const ext = item.name.includes(".") ? item.name.split(".").pop()!.toUpperCase() : null
  return ext ?? kindMeta[kindOf(item)].label
}

/** Sort keys; folders always come first. */
export type StorageSort = "name" | "-updated" | "-size" | "type"
export const storageSorts: { value: StorageSort; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "-updated", label: "Last modified" },
  { value: "-size", label: "Size" },
  { value: "type", label: "Type" },
]

export function sortItems(items: readonly StorageItem[], sort: StorageSort) {
  const by: Record<StorageSort, (a: StorageItem, b: StorageItem) => number> = {
    name: (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }),
    "-updated": (a, b) => b.updatedAt.localeCompare(a.updatedAt),
    "-size": (a, b) => b.size - a.size,
    type: (a, b) => typeLabel(a).localeCompare(typeLabel(b)) || a.name.localeCompare(b.name),
  }
  return [...items].sort((a, b) => (a.kind !== b.kind ? (a.kind === "folder" ? -1 : 1) : by[sort](a, b)))
}
