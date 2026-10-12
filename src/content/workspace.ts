import type { IconName } from "@/content/types"

/** Galley navigation (brief §3) — technical names, not cuisine terms. */
export const galleyNav: readonly { label: string; icon: IconName }[] = [
  { label: "Projects", icon: "folder" },
  { label: "Deployments", icon: "rocket" },
  { label: "CodePad", icon: "code" },
  { label: "Storage", icon: "database" },
  { label: "Utilities", icon: "wrench" },
  { label: "APIs", icon: "plug" },
  { label: "Settings", icon: "settings" },
]

export type MockProject = {
  name: string
  runtime: string
  branch: string
  state: "RUNNING" | "BUILDING" | "QUEUED" | "BUILD_FAILED"
  updated: string
}

// Illustrative data for the Galley mock — not real customers.
export const galleyProjects: readonly MockProject[] = [
  { name: "orders-api", runtime: "Node.js", branch: "main", state: "RUNNING", updated: "2m ago" },
  { name: "admin-dashboard", runtime: "Next.js", branch: "main", state: "BUILDING", updated: "just now" },
  { name: "docs-site", runtime: "Static Sites", branch: "gh-pages", state: "BUILD_FAILED", updated: "1h ago" },
]

/** CodePad — primary actions (brief §3): Run, Save, Deploy, with Preview where applicable. */
export const codepadActions: readonly { label: string; icon: IconName; shortcut: string }[] = [
  { label: "Run", icon: "play", shortcut: "⌘ ↵" },
  { label: "Save", icon: "save", shortcut: "⌘ S" },
  { label: "Preview", icon: "eye", shortcut: "⌘ P" },
  { label: "Deploy", icon: "rocket", shortcut: "⌘ D" },
]

export const codepadFiles: readonly { name: string; depth: number; folder?: boolean; active?: boolean }[] = [
  { name: "orders-api", depth: 0, folder: true },
  { name: "src", depth: 1, folder: true },
  { name: "routes.ts", depth: 2 },
  { name: "server.ts", depth: 2, active: true },
  { name: "package.json", depth: 1 },
  { name: ".env", depth: 1 },
]

/** The code shown in the CodePad mock. Tokens are pre-split so the mock renders without a highlighter. */
export const codepadSource: readonly (readonly [string, "kw" | "str" | "fn" | "cm" | "plain"][])[] = [
  [["import", "kw"], [" { Hono } ", "plain"], ["from", "kw"], [' "hono"', "str"]],
  [],
  [["const", "kw"], [" app = ", "plain"], ["new", "kw"], [" Hono", "fn"], ["()", "plain"]],
  [],
  [["// list recent orders", "cm"]],
  [["app.", "plain"], ["get", "fn"], ["(", "plain"], ['"/orders"', "str"], [", (c) => {", "plain"]],
  [["  return", "kw"], [" c.", "plain"], ["json", "fn"], ["([", "plain"], ['"#1042"', "str"], [", ", "plain"], ['"#1043"', "str"], ["])", "plain"]],
  [["})", "plain"]],
  [],
  [["export default", "kw"], [" { port: ", "plain"], ["8080", "str"], [", fetch: app.", "plain"], ["fetch", "fn"], [" }", "plain"]],
]

export const codepadFeatures: readonly { title: string; description: string; icon: IconName }[] = [
  { title: "A familiar editor", description: "Built on an open-source editor foundation, so the keys you know already work.", icon: "code" },
  { title: "Run in place", description: "Run your code and read the output without leaving the tab.", icon: "play" },
  { title: "Preview", description: "See a web project render as you work, where it applies.", icon: "eye" },
  { title: "Deploy from the editor", description: "When it's ready, send it through the same deploy flow.", icon: "rocket" },
]

/** Storage — the mechanics stay conventional (brief §3). */
export const storageActions: readonly { label: string; icon: IconName }[] = [
  { label: "Upload", icon: "upload" },
  { label: "New folder", icon: "folder-plus" },
  { label: "Search", icon: "search" },
  { label: "Sort", icon: "arrow-up-down" },
  { label: "Delete", icon: "trash" },
]

export const storageFiles: readonly { name: string; kind: "folder" | "image" | "file" | "archive"; size: string; modified: string }[] = [
  { name: "assets", kind: "folder", size: "—", modified: "Today" },
  { name: "uploads", kind: "folder", size: "—", modified: "Today" },
  { name: "product-hero.webp", kind: "image", size: "184 KB", modified: "Today" },
  { name: "orders-export.csv", kind: "file", size: "42 KB", modified: "Yesterday" },
  { name: "backup-2026-10-01.tar.gz", kind: "archive", size: "12.4 MB", modified: "Oct 1" },
]

export const storageFeatures: readonly { title: string; description: string; icon: IconName }[] = [
  { title: "See your usage", description: "How much you've stored, always visible.", icon: "gauge" },
  { title: "Files and folders", description: "Upload, organise into folders, and find things again with search and sort.", icon: "folder" },
  { title: "Delete with clarity", description: "Clear confirmation before anything is removed. No surprises.", icon: "trash" },
  { title: "Next to your projects", description: "Storage lives in the same Galley as your deployments and code.", icon: "layout" },
]
