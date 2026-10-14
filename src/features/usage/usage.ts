import { queryOptions, useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { apiFetch } from "@/lib/api-client"

/**
 * GET /v1/usage — the workspace's plan limits and what's been used this period, plus the
 * activity behind it. Proposed contract (to agree with the backend); limits, never prices.
 */
export const usageLimitSchema = z.object({
  id: z.enum(["active_deployments", "build_minutes", "bandwidth", "storage"]),
  label: z.string(),
  used: z.number(),
  limit: z.number(),
  unit: z.enum(["count", "minutes", "bytes"]),
})
export type UsageLimit = z.infer<typeof usageLimitSchema>

export const usageSchema = z.object({
  period: z.object({ start: z.string(), end: z.string() }),
  limits: z.array(usageLimitSchema),
  /** Requests served across all projects, per day, this period and the one before. */
  requests: z.array(z.object({ date: z.string(), requests: z.number(), previous: z.number() })),
  /** Builds per day, by outcome. */
  builds: z.array(z.object({ date: z.string(), succeeded: z.number(), failed: z.number() })),
  bandwidthByProject: z.array(z.object({ projectId: z.string(), name: z.string(), bytes: z.number() })),
  storageByKind: z.array(z.object({ kind: z.string(), bytes: z.number() })),
  /** Requests by weekday (Mon first) and hour of day, UTC — 7 rows × 24 columns. */
  trafficByHour: z.array(z.array(z.number()).length(24)).length(7),
  /** Share of the period every running deployment answered health checks, 0–1. */
  uptime: z.number(),
})
export type Usage = z.infer<typeof usageSchema>

export const usageKeys = {
  all: ["usage"] as const,
  current: () => [...usageKeys.all, "current"] as const,
}

export const usageQuery = () =>
  queryOptions({
    queryKey: usageKeys.current(),
    queryFn: () => apiFetch("/v1/usage", { schema: usageSchema }),
  })

export function useUsage() {
  return useQuery(usageQuery())
}
