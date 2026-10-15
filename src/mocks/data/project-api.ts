import type { MetricsRange, Project, ProjectMetrics, ProjectSummary, RuntimeLogLine } from "@/features/projects/projects"
import { mockDeploymentStore } from "@/mocks/data/deployments"
import type { MockProject } from "@/mocks/data/projects"

const deploymentsOf = (projectId: string) =>
  mockDeploymentStore()
    .filter((d) => d.projectId === projectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

export function toProjectSummary(p: MockProject): ProjectSummary {
  const deployments = deploymentsOf(p.id)
  const latest = deployments[0]
  const live = deployments.find((d) => d.live)
  return {
    id: p.id,
    name: p.name,
    runtime: p.runtime,
    state: latest?.state ?? "QUEUED",
    url: live?.url ?? null,
    repository: p.repository,
    branch: p.branch,
    updatedAt: latest?.createdAt ?? p.createdAt,
    latest: latest ? { id: latest.id, state: latest.state, live: latest.live, sha: latest.commit.sha, message: latest.commit.message, createdAt: latest.createdAt } : null,
    recent: deployments.slice(0, 10).map((d) => d.state),
  }
}

export function toProject(p: MockProject): Project {
  const deployments = deploymentsOf(p.id)
  const live = deployments.find((d) => d.live)
  const base = (live ?? deployments[0])?.config
  return {
    ...toProjectSummary(p),
    createdAt: p.createdAt,
    liveDeploymentId: live?.id ?? null,
    envCount: p.env.length,
    config: {
      runtimeVersion: base?.runtimeVersion ?? p.runtime,
      buildCommand: base?.buildCommand ?? null,
      startCommand: base?.startCommand ?? null,
      port: base?.port ?? null,
      ...p.configOverride,
      rootDirectory: p.rootDirectory,
    },
  }
}

// ── Runtime logs ──────────────────────────────────────────────────────────────────
// Line n of a project's log is a pure function of (project, n), so `after` cursors stay consistent.

function hash(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}
const rand = (seed: number) => {
  let t = (seed + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), 1 | t)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const pathsFor: Record<string, string[]> = {
  node: ["/api/orders", "/api/orders/:id", "/api/customers", "/api/webhooks/paystack", "/healthz"],
  nextjs: ["/", "/orders", "/settings", "/api/auth/session", "/_next/data/build/orders.json"],
  static: ["/", "/docs/getting-started", "/docs/storage", "/assets/main.css", "/img/logo.svg"],
}
const appLines = [
  { level: "info" as const, text: "[worker] processed 12 jobs in 340ms" },
  { level: "info" as const, text: "[cache] warmed 214 keys" },
  { level: "warn" as const, text: "[db] slow query 812ms: SELECT * FROM orders WHERE customer_id = $1" },
  { level: "warn" as const, text: "[http] retrying upstream request (attempt 2 of 3)" },
  { level: "error" as const, text: "Error: upstream timeout after 10000ms\n    at fetchRates (src/rates.ts:41:11)" },
]

/** Lines start two minutes before the mock loaded, so there's history to scroll. */
const logOrigin = Date.now() - 120_000
/*
 * Traffic comes in waves: the gap before line n swings between ~120ms (a burst) and ~1.6s (a lull),
 * so the live signal on the overview has shape. Times are a prefix sum, cached per project.
 */
const gapsCache = new Map<string, number[]>()
function lineTime(projectId: string, n: number) {
  let times = gapsCache.get(projectId)
  if (!times) gapsCache.set(projectId, (times = [logOrigin]))
  const seed = hash(projectId)
  while (times.length <= n) {
    const i = times.length
    const wave = (Math.sin(i / 23) + Math.sin(i / 7.3) * 0.6 + 1.6) / 3.2
    const gap = 120 + (1 - wave) ** 2 * 1500 + rand(seed + i * 19) * 260
    times.push(times[i - 1] + gap)
  }
  return times[n]
}
function newestLine(projectId: string, now = Date.now()) {
  let n = 0
  while (lineTime(projectId, n + 1) <= now) n++
  return n
}

function logLine(p: MockProject, n: number): RuntimeLogLine {
  const r = rand(hash(p.id) + n)
  const at = new Date(lineTime(p.id, n)).toISOString()
  if (r < 0.14) {
    const app = appLines[Math.floor(rand(n * 7 + 3) * (r < 0.02 ? appLines.length : appLines.length - 1))]
    return { n, at, level: app.level, source: "app", text: app.text }
  }
  const paths = pathsFor[p.runtime] ?? pathsFor.node
  const path = paths[Math.floor(rand(n * 13 + 1) * paths.length)].replace(":id", String(1000 + (n % 97)))
  const method = path.startsWith("/api/") && rand(n * 5) < 0.25 ? "POST" : "GET"
  const roll = rand(n * 11 + 2)
  const status = roll < 0.02 ? 500 : roll < 0.07 ? 404 : roll < 0.1 ? 304 : 200
  const ms = Math.round(8 + rand(n * 17) ** 3 * 600)
  return { n, at, level: status >= 500 ? "error" : status >= 400 ? "warn" : "info", source: "request", text: `${method} ${path} ${status} ${ms}ms` }
}

export function mockRuntimeLogs(p: MockProject, after: number) {
  const live = deploymentsOf(p.id).some((d) => d.live)
  const newest = newestLine(p.id)
  const start = Math.max(after + 1, newest - 199)
  const lines = live ? Array.from({ length: Math.max(0, newest - start + 1) }, (_, i) => logLine(p, start + i)) : []
  return { lines, live }
}

// ── Metrics ───────────────────────────────────────────────────────────────────────

const buckets: Record<MetricsRange, { count: number; ms: number }> = {
  "1h": { count: 12, ms: 5 * 60_000 },
  "24h": { count: 24, ms: 3_600_000 },
  "7d": { count: 28, ms: 6 * 3_600_000 },
}

export function mockProjectMetrics(p: MockProject, range: MetricsRange): ProjectMetrics {
  const live = deploymentsOf(p.id).some((d) => d.live)
  const { count, ms } = buckets[range]
  const scale = live ? (p.runtime === "static" ? 0.6 : 1) * (range === "1h" ? 90 : range === "24h" ? 1100 : 6400) : 0
  const now = Date.now()
  const seed = hash(p.id + range)
  const series = Array.from({ length: count }, (_, i) => {
    const t = now - (count - 1 - i) * ms
    const hour = new Date(t).getUTCHours()
    const daily = 0.45 + 0.55 * Math.sin(((hour - 6) / 24) * Math.PI * 2) ** 2
    const requests = Math.round(scale * daily * (0.85 + rand(seed + i) * 0.3))
    const errors = Math.round(requests * (0.004 + rand(seed + i * 3) * 0.012))
    const p50 = Math.round(28 + rand(seed + i * 5) * 18)
    return {
      t: new Date(t).toISOString(),
      requests,
      errors,
      p50,
      p95: Math.round(p50 * (3 + rand(seed + i * 7) * 2.2)),
      cpu: live ? Math.round((12 + daily * 38 + rand(seed + i * 9) * 10) * 10) / 10 : 0,
      memory: live ? Math.round(180 + daily * 120 + rand(seed + i * 11) * 40) : 0,
    }
  })
  const requests = series.reduce((a, s) => a + s.requests, 0)
  const errors = series.reduce((a, s) => a + s.errors, 0)
  const sorted = [...series].sort((a, b) => a.p95 - b.p95)
  const paths = (pathsFor[p.runtime] ?? pathsFor.node).map((path, i) => ({
    path,
    requests: Math.round((requests * [0.42, 0.23, 0.16, 0.11, 0.08][i]) || 0),
    p95: Math.round(60 + rand(seed + i * 13) * 400),
  }))
  return {
    range,
    summary: { requests, errorRate: requests ? errors / requests : 0, p95: sorted[Math.floor(sorted.length * 0.95)]?.p95 ?? 0, uptime: live ? 0.9991 + rand(seed) * 0.0008 : 0 },
    series,
    statuses: {
      ok: Math.round(requests * 0.9),
      redirect: Math.round(requests * 0.04),
      clientError: Math.round(requests * 0.05),
      serverError: errors,
    },
    paths,
    memoryLimit: 512,
  }
}

/** Requests in the last `windowMs` for a live project — feeds GET /v1/traffic. */
export function mockRecentTraffic(p: MockProject, windowMs = 65_000) {
  if (!deploymentsOf(p.id).some((d) => d.live)) return []
  const since = Date.now() - windowMs
  const out: { at: string; projectId: string; error: boolean; city: string }[] = []
  for (let n = newestLine(p.id); n > 0 && lineTime(p.id, n) >= since; n--) {
    const line = logLine(p, n)
    if (line.source === "request") out.push({ at: line.at, projectId: p.id, error: line.level === "error", city: cityFor(p.id, n) })
  }
  return out.reverse()
}

/** Where request n came from — weighted toward Nigeria, then the rest of Africa, Europe and the Americas. */
const cityWeights: [string, number][] = [
  ["LOS", 30], ["ABV", 10], ["ACC", 6], ["NBO", 5], ["JNB", 4], ["CAI", 3], ["LON", 10], ["FRA", 5],
  ["NYC", 8], ["SFO", 4], ["TOR", 3], ["GRU", 3], ["DXB", 3], ["BOM", 2], ["SIN", 2], ["TYO", 1], ["SYD", 1],
]
const totalWeight = cityWeights.reduce((a, [, w]) => a + w, 0)
function cityFor(projectId: string, n: number) {
  let roll = rand(hash(projectId) + n * 23) * totalWeight
  for (const [city, w] of cityWeights) if ((roll -= w) < 0) return city
  return "LOS"
}
