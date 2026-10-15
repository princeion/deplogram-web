import type { Usage } from "@/features/usage/usage"

/** Deterministic pseudo-random numbers, so the mock charts look the same on every load. */
function random(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const isoDay = (time: number) => new Date(time).toISOString().slice(0, 10)

/** A month of plausible usage for a small workspace on the Free plan. */
export function generateMockUsage(now = Date.now()): Usage {
  const rand = random(7)
  const day = 86_400_000
  const today = Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate())

  // Requests: a weekday rhythm on a slow upward trend, with one launch spike.
  const requests = Array.from({ length: 30 }, (_, i) => {
    const date = today - (29 - i) * day
    const weekday = new Date(date).getUTCDay()
    const weekend = weekday === 0 || weekday === 6 ? 0.72 : 1
    const trend = 9_000 + i * 230
    const spike = i === 21 ? 1.55 : i === 22 ? 1.22 : 1
    const value = Math.round(trend * weekend * spike * (0.9 + rand() * 0.2))
    return { date: isoDay(date), requests: value, previous: Math.round(value * (0.78 + rand() * 0.12)) }
  })

  const builds = Array.from({ length: 14 }, (_, i) => {
    const date = today - (13 - i) * day
    const weekday = new Date(date).getUTCDay()
    const busy = weekday === 0 || weekday === 6 ? 0.4 : 1
    const succeeded = Math.round((3 + rand() * 7) * busy)
    return { date: isoDay(date), succeeded, failed: rand() < 0.45 ? 1 + Math.floor(rand() * 2) : 0 }
  })

  // Traffic: quiet nights, a working-day plateau, an evening peak; weekends softer.
  const trafficByHour = Array.from({ length: 7 }, (_, weekday) =>
    Array.from({ length: 24 }, (_, hour) => {
      const curve = hour < 6 ? 0.12 : hour < 9 ? 0.35 + (hour - 6) * 0.15 : hour < 18 ? 0.75 : hour < 22 ? 0.95 - (hour - 18) * 0.05 : 0.45
      const weekend = weekday >= 5 ? 0.6 : 1
      const peak = weekday === 3 && hour === 20 ? 1.35 : 1
      return Math.round(620 * curve * weekend * peak * (0.85 + rand() * 0.3))
    })
  )

  const monthStart = new Date(Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), 1))
  const monthEnd = new Date(Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth() + 1, 0))

  return {
    period: { start: isoDay(monthStart.getTime()), end: isoDay(monthEnd.getTime()) },
    limits: [
      { id: "active_deployments", label: "Active deployments", used: 3, limit: 5, unit: "count" },
      { id: "build_minutes", label: "Build minutes", used: 212, limit: 300, unit: "minutes" },
      { id: "bandwidth", label: "Bandwidth", used: 8_420_000_000, limit: 10_000_000_000, unit: "bytes" },
      { id: "storage", label: "Storage", used: 1_240_000_000, limit: 5_000_000_000, unit: "bytes" },
    ],
    requests,
    builds,
    bandwidthByProject: [
      { projectId: "prj_orders", name: "orders-api", bytes: 4_960_000_000 },
      { projectId: "prj_admin", name: "admin-dashboard", bytes: 2_310_000_000 },
      { projectId: "prj_docs", name: "docs-site", bytes: 1_150_000_000 },
    ],
    storageByKind: [
      { kind: "Build artifacts", bytes: 640_000_000 },
      { kind: "Images", bytes: 380_000_000 },
      { kind: "Documents", bytes: 150_000_000 },
      { kind: "Other", bytes: 70_000_000 },
    ],
    trafficByHour,
    uptime: 0.9994,
  }
}
