import type { StorageItem } from "@/features/storage/storage"

/**
 * The mock drive: a folder tree of plausible files, in memory. Images get generated SVG
 * thumbnails (no network). Folder sizes and counts are worked out from what's inside.
 */

const ago = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString()

/** A soft gradient thumbnail with a few shapes, coloured from the file name. */
function thumbnail(name: string) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h} 70% 62%)"/><stop offset="1" stop-color="hsl(${(h + 50) % 360} 65% 38%)"/></linearGradient></defs><rect width="320" height="200" fill="url(#g)"/><circle cx="${80 + (h % 140)}" cy="70" r="34" fill="white" fill-opacity="0.22"/><rect x="40" y="128" width="${120 + (h % 120)}" height="14" rx="7" fill="white" fill-opacity="0.35"/><rect x="40" y="152" width="${70 + (h % 80)}" height="10" rx="5" fill="white" fill-opacity="0.22"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

type Seed = { path: string; size?: number; type?: string; hours: number }

const seeds: Seed[] = [
  { path: "assets", hours: 3 },
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
  { path: "exports/orders-export.csv", size: 42_160, type: "text/csv", hours: 22 },
  { path: "exports/customers.json", size: 96_771, type: "application/json", hours: 48 },
  { path: "launch-video.mp4", size: 24_118_912, type: "video/mp4", hours: 8 },
  { path: "README.md", size: 1_204, type: "text/markdown", hours: 700 },
]

const items = new Map<string, StorageItem>()
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
  })
}

const parentOf = (path: string) => (path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "")

/** A folder with its size and count worked out from its contents. */
function withTotals(folder: StorageItem): StorageItem {
  const prefix = `${folder.path}/`
  let size = 0
  let children = 0
  for (const item of items.values()) {
    if (!item.path.startsWith(prefix)) continue
    if (item.kind === "file") size += item.size
    if (parentOf(item.path) === folder.path) children++
  }
  return { ...folder, size, items: children }
}

export const mockStorage = {
  exists: (path: string) => path === "" || items.get(path)?.kind === "folder",
  list(path: string) {
    return [...items.values()].filter((item) => parentOf(item.path) === path).map((item) => (item.kind === "folder" ? withTotals(item) : item))
  },
  search(q: string) {
    const needle = q.toLowerCase()
    return [...items.values()]
      .filter((item) => item.name.toLowerCase().includes(needle))
      .slice(0, 50)
      .map((item) => (item.kind === "folder" ? withTotals(item) : item))
  },
  get: (path: string) => items.get(path) ?? null,
  folders: () => [...items.values()].filter((i) => i.kind === "folder").map((i) => i.path).sort(),

  createFolder(path: string): StorageItem | "exists" | "no-parent" {
    if (items.has(path)) return "exists"
    if (!this.exists(parentOf(path))) return "no-parent"
    const now = new Date().toISOString()
    const folder: StorageItem = { kind: "folder", name: path.split("/").pop()!, path, size: 0, contentType: null, items: 0, createdAt: now, updatedAt: now, thumbnailUrl: null }
    items.set(path, folder)
    return folder
  },

  /** A finished upload. Takes "name (1).ext" if the name is taken. */
  addFile(path: string, size: number, contentType: string): StorageItem {
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
    const file: StorageItem = { kind: "file", name, path: full, size, contentType, items: null, createdAt: now, updatedAt: now, thumbnailUrl: contentType.startsWith("image/") ? thumbnail(name) : null }
    items.set(full, file)
    return file
  },

  /** Rename in place; a folder takes everything inside with it. */
  rename(path: string, name: string): StorageItem | "missing" | "exists" {
    const item = items.get(path)
    if (!item) return "missing"
    const parent = parentOf(path)
    const to = parent ? `${parent}/${name}` : name
    if (to !== path && items.has(to)) return "exists"
    this.relocate(path, to)
    return items.get(to)!
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
    }
  },
}
