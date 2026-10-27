import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { ApiError, apiFetch } from "@/lib/api-client"
import type { IconName } from "@/components/shared/icon"

/**
 * Storage: one private drive per workspace, organised in folders. Files are private; sharing is
 * by links that expire — or a folder is made public (website images, downloads) and its files get
 * a permanent address. (Buckets may come later — they'd sit above these folders.) Endpoint
 * shapes are the frontend's proposal until the backend contract is agreed; src/mocks/handlers.ts
 * implements them meanwhile.
 *
 *   GET  /v1/storage/list?path=assets/logos   → { path, items, public, publicFrom }
 *   GET  /v1/storage/search?q=logo            → { items }         across the whole drive
 *   POST /v1/storage/links  { path, expiresIn } → { url, expiresAt }
 *   GET  /v1/storage/folders                  → { folders: string[] }   every folder path, for "Move to…"
 *   POST /v1/storage/folders  { path }        → StorageItem
 *   POST /v1/storage/uploads  { path, size, contentType } → { uploadUrl }   then PUT the file there → StorageItem
 *   PATCH /v1/storage/items  { path, name? , public? }  → StorageItem   (rename; folders: make public)
 *   GET  /v1/storage/preview?path=           → { url, text, truncated }   media → a short-lived URL; text-like → the text
 *   POST /v1/storage/move  { paths, to }      → { moved }
 *   POST /v1/storage/delete  { paths }        → { deleted }   folders go with everything in them
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
  /** Folders: made public. Files: inside a public folder (inherited). */
  public: z.boolean(),
  /** Files in a public folder: their permanent address. */
  publicUrl: z.string().nullable(),
})
export type StorageItem = z.infer<typeof storageItemSchema>

export const storageListSchema = z.object({
  path: z.string(),
  items: z.array(storageItemSchema),
  /** This folder's files are public: it, or a folder above it, was made public. */
  public: z.boolean(),
  /** The folder that made it public ("" never — the top of the drive can't be public). */
  publicFrom: z.string().nullable(),
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

// ── Changing things ─────────────────────────────────────────────────────────────────

/** After any change: the folder lists, search results and the usage figures. */
function useInvalidateStorage() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([queryClient.invalidateQueries({ queryKey: storageKeys.all }), queryClient.invalidateQueries({ queryKey: ["usage"] })])
}

export function useFolders(enabled = true) {
  return useQuery({
    queryKey: [...storageKeys.all, "folders"],
    queryFn: () => apiFetch("/v1/storage/folders", { schema: z.object({ folders: z.array(z.string()) }) }),
    enabled,
  })
}

export function useCreateFolder() {
  const invalidate = useInvalidateStorage()
  return useMutation({
    mutationFn: (path: string) => apiFetch("/v1/storage/folders", { method: "POST", json: { path }, schema: storageItemSchema }),
    onSuccess: invalidate,
  })
}

export const storagePreviewSchema = z.object({
  /** A short-lived URL for images, video, audio and PDFs; null when there's nothing to show. */
  url: z.string().nullable(),
  /** The text of text-like files (code, CSV, JSON, Markdown), up to a limit. */
  text: z.string().nullable(),
  truncated: z.boolean(),
})
export type StoragePreview = z.infer<typeof storagePreviewSchema>

export function useStoragePreview(item: StorageItem | null) {
  return useQuery({
    queryKey: [...storageKeys.all, "preview", item?.path ?? "", item?.updatedAt ?? ""],
    queryFn: () => apiFetch(`/v1/storage/preview?path=${encodeURIComponent(item!.path)}`, { schema: storagePreviewSchema }),
    enabled: item != null && item.kind === "file",
    // Signed URLs last 15 minutes on the backend; refresh well before.
    staleTime: 10 * 60_000,
  })
}

/** Make a folder public (its files get permanent addresses) or private again. */
export function useSetPublic() {
  const invalidate = useInvalidateStorage()
  return useMutation({
    mutationFn: (input: { path: string; public: boolean }) => apiFetch("/v1/storage/items", { method: "PATCH", json: input, schema: storageItemSchema }),
    onSuccess: invalidate,
  })
}

export function useRenameItem() {
  const invalidate = useInvalidateStorage()
  return useMutation({
    mutationFn: (input: { path: string; name: string }) => apiFetch("/v1/storage/items", { method: "PATCH", json: input, schema: storageItemSchema }),
    onSuccess: invalidate,
  })
}

export function useMoveItems() {
  const invalidate = useInvalidateStorage()
  return useMutation({
    mutationFn: (input: { paths: string[]; to: string }) => apiFetch("/v1/storage/move", { method: "POST", json: input, schema: z.object({ moved: z.number() }) }),
    onSuccess: invalidate,
  })
}

export function useDeleteItems() {
  const invalidate = useInvalidateStorage()
  return useMutation({
    mutationFn: (paths: string[]) => apiFetch("/v1/storage/delete", { method: "POST", json: { paths }, schema: z.object({ deleted: z.number() }) }),
    onSuccess: invalidate,
  })
}

/** A name for a file or folder: not empty, no slashes, not "." or "..". */
export function nameProblem(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return "Enter a name."
  if (trimmed.includes("/")) return "Names can't contain “/”."
  if (trimmed === "." || trimmed === "..") return "That name isn't allowed."
  if (trimmed.length > 200) return "200 characters at most."
  return null
}

/** "logo.png" taken in this folder → "logo (1).png", then "logo (2).png"… */
export function uniqueName(name: string, taken: ReadonlySet<string>) {
  if (!taken.has(name)) return name
  const dot = name.lastIndexOf(".")
  const [base, ext] = dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ""]
  for (let n = 1; ; n++) {
    const candidate = `${base} (${n})${ext}`
    if (!taken.has(candidate)) return candidate
  }
}

// ── Uploading ───────────────────────────────────────────────────────────────────────

const MOCKING = process.env.NEXT_PUBLIC_API_MOCKING === "enabled" || process.env.NEXT_PUBLIC_API_MOCKING === "partial"
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ""

/**
 * Upload one file: ask for an upload URL, then PUT the bytes there with progress. Rejects with an
 * ApiError (e.g. 413, not enough space) or an AbortError when cancelled.
 *
 * The mock API can't report real progress (MSW answers instantly), so with mocking on, progress
 * is simulated at a believable speed before the PUT. Against the real API this is pure XHR.
 */
export async function uploadFile(path: string, file: File, onProgress: (ratio: number) => void, signal: AbortSignal): Promise<StorageItem> {
  const { uploadUrl } = await apiFetch("/v1/storage/uploads", {
    method: "POST",
    json: { path, size: file.size, contentType: file.type || "application/octet-stream" },
    schema: z.object({ uploadUrl: z.string() }),
    signal,
  })

  if (MOCKING) {
    const duration = Math.min(9000, 700 + file.size / 6_000) // ~6 MB/s
    const started = performance.now()
    await new Promise<void>((resolve, reject) => {
      const tick = () => {
        if (signal.aborted) return reject(new DOMException("Upload cancelled", "AbortError"))
        const ratio = Math.min(1, (performance.now() - started) / duration)
        onProgress(ratio * 0.97)
        if (ratio >= 1) resolve()
        else window.setTimeout(tick, 120)
      }
      tick()
    })
  }

  return new Promise<StorageItem>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", uploadUrl.startsWith("http") ? uploadUrl : `${API_URL}${uploadUrl}`)
    xhr.withCredentials = true
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream")
    if (!MOCKING) xhr.upload.onprogress = (event) => event.lengthComputable && onProgress(event.loaded / event.total)
    xhr.onload = () => {
      let body: unknown = null
      try {
        body = JSON.parse(xhr.responseText)
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(1)
        resolve(storageItemSchema.parse(body))
      } else reject(new ApiError(xhr.status, body))
    }
    xhr.onerror = () => reject(new TypeError("Network error"))
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"))
    signal.addEventListener("abort", () => xhr.abort(), { once: true })
    xhr.send(file)
  })
}
