import type { StorageItem, StoragePreview } from "@/features/storage/storage"

/**
 * The mock drive: a folder tree of plausible files, in memory. Images get generated SVG
 * thumbnails (no network). Folder sizes and counts are worked out from what's inside; "public"
 * is inherited from the nearest public folder. Files you upload keep their real bytes (as blob
 * URLs in this tab), so they preview for real; the seeded ones have sample text where it makes
 * sense and no media.
 */

const ago = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString()
const PUBLIC_BASE = "https://files.dpl.app/ada"

/** A soft gradient thumbnail with a few shapes, coloured from the file name. */
function thumbnail(name: string) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h} 70% 62%)"/><stop offset="1" stop-color="hsl(${(h + 50) % 360} 65% 38%)"/></linearGradient></defs><rect width="320" height="200" fill="url(#g)"/><circle cx="${80 + (h % 140)}" cy="70" r="34" fill="white" fill-opacity="0.22"/><rect x="40" y="128" width="${120 + (h % 120)}" height="14" rx="7" fill="white" fill-opacity="0.35"/><rect x="40" y="152" width="${70 + (h % 80)}" height="10" rx="5" fill="white" fill-opacity="0.22"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const sampleText: Record<string, string> = {
  "README.md": `# Storage

Files for the Deplogram projects.

- \`assets/\` — public: logos, images and fonts used by the website
- \`uploads/\` — what customers upload (avatars, invoices)
- \`backups/\` — nightly database dumps, kept for 30 days
- \`exports/\` — CSV and JSON exports from the admin

Share a private file with **Copy link**; links expire.
`,
  "exports/orders-export.csv": `order_id,customer,total_ngn,status,created_at
ORD-10421,Adaeze Okafor,48500,paid,2026-10-14T09:12:00Z
ORD-10422,Tunde Bakare,12000,paid,2026-10-14T09:40:00Z
ORD-10423,Ngozi Eze,7350,refunded,2026-10-14T10:02:00Z
ORD-10424,Ibrahim Musa,99000,paid,2026-10-14T11:15:00Z
ORD-10425,Funke Adebayo,15600,pending,2026-10-14T12:31:00Z
ORD-10426,Chinedu Obi,23900,paid,2026-10-14T13:08:00Z
ORD-10427,Halima Sani,5400,paid,2026-10-14T14:47:00Z
ORD-10428,Segun Ade,61200,failed,2026-10-14T15:20:00Z
`,
  "exports/customers.json": `[
  { "id": "cus_1042", "name": "Adaeze Okafor", "city": "Lagos", "orders": 12, "since": "2025-03-02" },
  { "id": "cus_1077", "name": "Ibrahim Musa", "city": "Abuja", "orders": 4, "since": "2025-11-19" },
  { "id": "cus_1093", "name": "Funke Adebayo", "city": "Ibadan", "orders": 7, "since": "2026-01-08" }
]
`,
}

type Seed = { path: string; size?: number; type?: string; hours: number; public?: boolean }

const seeds: Seed[] = [
  { path: "assets", hours: 3, public: true },
  { path: "assets/logos", hours: 5 },
  { path: "assets/logos/logo-dark.svg", size: 4_812, type: "image/svg+xml", hours: 5 },
  { path: "assets/logos/logo-light.svg", size: 4_790, type: "image/svg+xml", hours: 5 },
  { path: "assets/logos/favicon.png", size: 18_204, type: "image/png", hours: 30 },
  { path: "assets/images", hours: 3 },
  { path: "assets/images/hero.webp", size: 184_320, type: "image/webp", hours: 3 },
  { path: "assets/images/team-offsite.jpg", size: 2_412_544, type: "image/jpeg", hours: 52 },
  { path: "assets/images/product-shot.png", size: 948_211, type: "image/png", hours: 75 },
  { path: "assets/images/og-image.png", size: 312_908, type: "image/png", hours: 120 },
  { path: "assets/fonts", hours: 400 },
  { path: "assets/fonts/inter-variable.woff2", size: 344_516, type: "font/woff2", hours: 400 },
  { path: "uploads", hours: 1 },
  { path: "uploads/avatars", hours: 1 },
  { path: "uploads/avatars/user-1042.jpg", size: 48_211, type: "image/jpeg", hours: 1 },
  { path: "uploads/avatars/user-1077.jpg", size: 51_809, type: "image/jpeg", hours: 6 },
  { path: "uploads/avatars/user-1093.png", size: 72_115, type: "image/png", hours: 26 },
  { path: "uploads/invoices", hours: 20 },
  { path: "uploads/invoices/INV-2026-0912.pdf", size: 128_004, type: "application/pdf", hours: 20 },
  { path: "uploads/invoices/INV-2026-1003.pdf", size: 131_550, type: "application/pdf", hours: 140 },
  { path: "backups", hours: 96 },
  { path: "backups/db-2026-10-15.sql.gz", size: 38_400_512, type: "application/gzip", hours: 96 },
  { path: "backups/backup-2026-10-01.tar.gz", size: 12_400_128, type: "application/gzip", hours: 430 },
  { path: "exports", hours: 22 },
  { path: "exports/orders-export.csv", size: 1_004, type: "text/csv", hours: 22 },
  { path: "exports/customers.json", size: 324, type: "application/json", hours: 48 },
  { path: "launch-video.mp4", size: 24_118_912, type: "video/mp4", hours: 8 },
  { path: "README.md", size: 412, type: "text/markdown", hours: 700 },
]

const items = new Map<string, StorageItem>()
/** Uploaded bytes: a blob URL, and the text for text-like files. */
const contents = new Map<string, { url: string; text: string | null }>()

for (const seed of seeds) {
  const name = seed.path.split("/").pop()!
  const isFolder = seed.size === undefined
  items.set(seed.path, {
    kind: isFolder ? "folder" : "file",
    name,
    path: seed.path,
    size: seed.size ?? 0,
    contentType: seed.type ?? null,
    items: isFolder ? 0 : null,
    createdAt: ago(seed.hours + 24),
    updatedAt: ago(seed.hours),
    thumbnailUrl: seed.type?.startsWith("image/") ? thumbnail(name) : null,
    public: Boolean(seed.public),
    publicUrl: null,
  })
}

const parentOf = (path: string) => (path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "")

/** The nearest folder at or above `path` that was made public, or null. */
function publicFrom(path: string) {
  for (let p = path; p; p = parentOf(p)) if (items.get(p)?.kind === "folder" && items.get(p)?.public) return p
  return null
}
const isPublic = (path: string) => publicFrom(path) != null

/** An item as the API returns it: totals for folders, inherited public, the public address. */
function view(item: StorageItem): StorageItem {
  const pub = isPublic(item.path)
  if (item.kind === "file") {
    return { ...item, public: pub, publicUrl: pub ? `${PUBLIC_BASE}/${encodeURI(item.path)}` : null }
  }
  const prefix = `${item.path}/`
  let size = 0
  let children = 0
  for (const other of items.values()) {
    if (!other.path.startsWith(prefix)) continue
    if (other.kind === "file") size += other.size
    if (parentOf(other.path) === item.path) children++
  }
  return { ...item, size, items: children, public: pub, publicUrl: null }
}

const isTextLike = (item: StorageItem) => {
  const type = item.contentType ?? ""
  const ext = item.name.split(".").pop()?.toLowerCase() ?? ""
  return type.startsWith("text/") || /json|xml|javascript|yaml/.test(type) || ["md", "txt", "csv", "json", "js", "ts", "py", "html", "css", "sql", "yml", "yaml", "env"].includes(ext)
}

export const mockStorage = {
  exists: (path: string) => path === "" || items.get(path)?.kind === "folder",
  list: (path: string) => [...items.values()].filter((item) => parentOf(item.path) === path).map(view),
  search(q: string) {
    const needle = q.toLowerCase()
    return [...items.values()]
      .filter((item) => item.name.toLowerCase().includes(needle))
      .slice(0, 50)
      .map(view)
  },
  publicFrom,
  get: (path: string) => {
    const item = items.get(path)
    return item ? view(item) : null
  },
  folders: () => [...items.values()].filter((i) => i.kind === "folder").map((i) => i.path).sort(),

  preview(path: string): StoragePreview | null {
    const item = items.get(path)
    if (!item || item.kind !== "file") return null
    const uploaded = contents.get(path)
    if (isTextLike(item)) {
      const text = uploaded?.text ?? sampleText[path] ?? null
      const limit = 200_000
      return { url: null, text: text && text.length > limit ? text.slice(0, limit) : text, truncated: Boolean(text && text.length > limit) }
    }
    return { url: uploaded?.url ?? item.thumbnailUrl ?? null, text: null, truncated: false }
  },

  createFolder(path: string): StorageItem | "exists" | "no-parent" {
    if (items.has(path)) return "exists"
    if (!this.exists(parentOf(path))) return "no-parent"
    const now = new Date().toISOString()
    const folder: StorageItem = { kind: "folder", name: path.split("/").pop()!, path, size: 0, contentType: null, items: 0, createdAt: now, updatedAt: now, thumbnailUrl: null, public: false, publicUrl: null }
    items.set(path, folder)
    return view(folder)
  },

  /** A finished upload, with its bytes. Takes "name (1).ext" if the name is taken. */
  addFile(path: string, size: number, contentType: string, bytes: ArrayBuffer | null): StorageItem {
    const folder = parentOf(path)
    const taken = new Set(this.list(folder).map((i) => i.name))
    let name = path.split("/").pop()!
    if (taken.has(name)) {
      const dot = name.lastIndexOf(".")
      const [base, ext] = dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ""]
      let n = 1
      while (taken.has(`${base} (${n})${ext}`)) n++
      name = `${base} (${n})${ext}`
    }
    const full = folder ? `${folder}/${name}` : name
    const now = new Date().toISOString()
    const blobUrl = bytes ? URL.createObjectURL(new Blob([bytes], { type: contentType })) : null
    const file: StorageItem = {
      kind: "file",
      name,
      path: full,
      size,
      contentType,
      items: null,
      createdAt: now,
      updatedAt: now,
      thumbnailUrl: contentType.startsWith("image/") ? (blobUrl ?? thumbnail(name)) : null,
      public: false,
      publicUrl: null,
    }
    items.set(full, file)
    if (blobUrl) {
      const text = isTextLike(file) && bytes && bytes.byteLength < 2_000_000 ? new TextDecoder().decode(bytes) : null
      contents.set(full, { url: blobUrl, text })
    }
    return view(file)
  },

  /** Rename in place; a folder takes everything inside with it. */
  rename(path: string, name: string): StorageItem | "missing" | "exists" {
    const item = items.get(path)
    if (!item) return "missing"
    const parent = parentOf(path)
    const to = parent ? `${parent}/${name}` : name
    if (to !== path && items.has(to)) return "exists"
    this.relocate(path, to)
    return view(items.get(to)!)
  },

  setPublic(path: string, value: boolean): StorageItem | null {
    const item = items.get(path)
    if (!item || item.kind !== "folder") return null
    items.set(path, { ...item, public: value, updatedAt: new Date().toISOString() })
    return view(items.get(path)!)
  },

  /** Move items into a folder; returns how many moved. */
  move(paths: string[], to: string): number | "bad-target" {
    if (!this.exists(to)) return "bad-target"
    if (paths.some((p) => to === p || to.startsWith(`${p}/`))) return "bad-target"
    let moved = 0
    for (const path of paths) {
      const item = items.get(path)
      if (!item || parentOf(path) === to) continue
      const taken = new Set(this.list(to).map((i) => i.name))
      let name = item.name
      for (let n = 1; taken.has(name); n++) name = `${item.name} (${n})`
      this.relocate(path, to ? `${to}/${name}` : name)
      moved++
    }
    return moved
  },

  /** Delete items; folders with everything in them. Returns bytes freed. */
  remove(paths: string[]) {
    let freed = 0
    let deleted = 0
    for (const path of paths) {
      for (const [key, item] of [...items]) {
        if (key === path || key.startsWith(`${path}/`)) {
          if (item.kind === "file") freed += item.size
          items.delete(key)
          const content = contents.get(key)
          if (content) URL.revokeObjectURL(content.url)
          contents.delete(key)
          if (key === path) deleted++
        }
      }
    }
    return { deleted, freed }
  },

  relocate(from: string, to: string) {
    const now = new Date().toISOString()
    for (const [key, item] of [...items]) {
      if (key !== from && !key.startsWith(`${from}/`)) continue
      const next = to + key.slice(from.length)
      items.delete(key)
      items.set(next, { ...item, path: next, name: next.split("/").pop()!, updatedAt: key === from ? now : item.updatedAt })
      const content = contents.get(key)
      if (content) {
        contents.delete(key)
        contents.set(next, content)
      }
    }
  },
}
