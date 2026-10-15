import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { apiFetch } from "@/lib/api-client"

/** Brief §5: lifecycle states plus explicit failure states. */
export const deploymentStateSchema = z.enum([
  "QUEUED",
  "BUILDING",
  "BUILT",
  "DEPLOYING",
  "RUNNING",
  "BUILD_FAILED",
  "DEPLOY_FAILED",
  "CRASHED",
])

/**
 * A project as lists show it (projects page, switcher, palette). Proposed contract for
 * GET /v1/projects — to confirm with the backend.
 */
export const projectSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  runtime: z.string(),
  /** State of the latest deployment. */
  state: deploymentStateSchema,
  /** Deployment URL host while RUNNING, else null. */
  url: z.string().nullable(),
  /** "owner/name" of the connected repository. */
  repository: z.string(),
  /** The branch it deploys from. */
  branch: z.string(),
  /** Last activity (latest deployment, or creation). */
  updatedAt: z.string(),
  latest: z
    .object({
      id: z.string(),
      state: deploymentStateSchema,
      live: z.boolean(),
      sha: z.string(),
      message: z.string(),
      createdAt: z.string(),
    })
    .nullable(),
  /** States of the most recent deployments, newest first (up to 10) — for a history strip. */
  recent: z.array(deploymentStateSchema),
})
export type ProjectSummary = z.infer<typeof projectSummarySchema>

/** GET /v1/projects/:id — the project with its settings. */
export const projectSchema = projectSummarySchema.extend({
  createdAt: z.string(),
  liveDeploymentId: z.string().nullable(),
  envCount: z.number(),
  config: z.object({
    runtimeVersion: z.string(),
    buildCommand: z.string().nullable(),
    startCommand: z.string().nullable(),
    port: z.number().nullable(),
    rootDirectory: z.string().nullable(),
  }),
})
export type Project = z.infer<typeof projectSchema>

/** An environment variable as the API shows it: the name, never the value once saved. */
export const envVarRecordSchema = z.object({ key: z.string(), updatedAt: z.string() })
export type EnvVarRecord = z.infer<typeof envVarRecordSchema>

/** Query keys for everything project-related — invalidate `projectKeys.all` after a mutation. */
export const projectKeys = {
  all: ["projects"] as const,
  list: () => [...projectKeys.all, "list"] as const,
  detail: (id: string) => [...projectKeys.all, "detail", id] as const,
  env: (id: string) => [...projectKeys.all, "env", id] as const,
  logs: (id: string) => [...projectKeys.all, "logs", id] as const,
  metrics: (id: string, range: string) => [...projectKeys.all, "metrics", id, range] as const,
}

const isWorking = (state: ProjectSummary["state"]) => ["QUEUED", "BUILDING", "BUILT", "DEPLOYING"].includes(state)

export const projectsQuery = () =>
  queryOptions({
    queryKey: projectKeys.list(),
    queryFn: () => apiFetch("/v1/projects", { schema: z.array(projectSummarySchema) }),
    // Keep building projects moving in lists.
    refetchInterval: (query) => (query.state.data?.some((p) => isWorking(p.state)) ? 3000 : false),
  })

export function useProjects() {
  return useQuery(projectsQuery())
}

export const projectQuery = (id: string) =>
  queryOptions({
    queryKey: projectKeys.detail(id),
    queryFn: () => apiFetch(`/v1/projects/${id}`, { schema: projectSchema }),
    refetchInterval: (query) => (query.state.data && isWorking(query.state.data.state) ? 2000 : false),
  })

export function useProject(id: string) {
  return useQuery(projectQuery(id))
}

// ── Environment ──────────────────────────────────────────────────────────────────

export function useProjectEnv(id: string) {
  return useQuery({ queryKey: projectKeys.env(id), queryFn: () => apiFetch(`/v1/projects/${id}/env`, { schema: z.array(envVarRecordSchema) }) })
}

/**
 * PUT /v1/projects/:id/env — the whole set. `value: null` keeps a variable's saved value (we never
 * have it to send back); a string replaces it. Keys left out are deleted. Applies from the next
 * deployment.
 */
export function useSaveProjectEnv(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { key: string; value: string | null }[]) => apiFetch(`/v1/projects/${id}/env`, { method: "PUT", json: vars, schema: z.array(envVarRecordSchema) }),
    onSuccess: (saved) => {
      queryClient.setQueryData(projectKeys.env(id), saved)
      return queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) })
    },
  })
}

// ── Settings ─────────────────────────────────────────────────────────────────────

export type ProjectUpdate = { name?: string; branch?: string; config?: Partial<Omit<Project["config"], "runtimeVersion">> }

/** PATCH /v1/projects/:id — rename, change branch or build/start settings (used from the next deployment). */
export function useUpdateProject(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (update: ProjectUpdate) => apiFetch(`/v1/projects/${id}`, { method: "PATCH", json: update, schema: projectSchema }),
    onSuccess: (project) => {
      queryClient.setQueryData(projectKeys.detail(id), project)
      return queryClient.invalidateQueries({ queryKey: projectKeys.list() })
    },
  })
}

/** DELETE /v1/projects/:id — takes it offline and removes its deployments, logs and variables. */
export function useDeleteProject(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch(`/v1/projects/${id}`, { method: "DELETE", schema: z.null() }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) })
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: projectKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["deployments"] }),
        queryClient.invalidateQueries({ queryKey: ["usage"] }),
      ])
    },
  })
}

// ── Runtime logs ─────────────────────────────────────────────────────────────────

export const runtimeLogLineSchema = z.object({
  n: z.number(),
  at: z.string(),
  level: z.enum(["info", "warn", "error"]),
  /** "request" lines are the platform's access log; "app" lines are what the app printed. */
  source: z.enum(["request", "app"]),
  text: z.string(),
})
export type RuntimeLogLine = z.infer<typeof runtimeLogLineSchema>

export const runtimeLogsSchema = z.object({
  lines: z.array(runtimeLogLineSchema),
  /** False when nothing is running — the log is history only. */
  live: z.boolean(),
})
type RuntimeLogs = z.infer<typeof runtimeLogsSchema>

/**
 * GET /v1/projects/:id/logs?after=n — the live deployment's runtime log, streamed by appending
 * lines after the last one we have (polling for now). Keeps the newest 1,000 lines.
 * TODO: switch to the realtime channel (SSE/WebSocket) when the backend has one.
 */
export function useRuntimeLogs(id: string, { paused = false }: { paused?: boolean } = {}) {
  const queryClient = useQueryClient()
  const queryKey = projectKeys.logs(id)
  return useQuery({
    queryKey,
    queryFn: async (): Promise<RuntimeLogs> => {
      const previous = queryClient.getQueryData<RuntimeLogs>(queryKey)
      const after = previous?.lines.at(-1)?.n ?? 0
      const next = await apiFetch(`/v1/projects/${id}/logs?after=${after}`, { schema: runtimeLogsSchema })
      return { ...next, lines: [...(after ? previous!.lines : []), ...next.lines].slice(-1000) }
    },
    refetchInterval: (query) => (paused || query.state.data?.live === false ? false : 1500),
    staleTime: Infinity,
  })
}

// ── Metrics ──────────────────────────────────────────────────────────────────────

export const metricsRangeSchema = z.enum(["1h", "24h", "7d"])
export type MetricsRange = z.infer<typeof metricsRangeSchema>

export const projectMetricsSchema = z.object({
  range: metricsRangeSchema,
  summary: z.object({ requests: z.number(), errorRate: z.number(), p95: z.number(), uptime: z.number() }),
  /** One point per bucket (5 min for 1h, 1 h for 24h, 6 h for 7d). */
  series: z.array(
    z.object({
      t: z.string(),
      requests: z.number(),
      errors: z.number(),
      p50: z.number(),
      p95: z.number(),
      cpu: z.number(),
      memory: z.number(),
    })
  ),
  /** Requests by status class over the range. */
  statuses: z.object({ ok: z.number(), redirect: z.number(), clientError: z.number(), serverError: z.number() }),
  /** Busiest paths. */
  paths: z.array(z.object({ path: z.string(), requests: z.number(), p95: z.number() })),
  /** Container memory limit in MB. */
  memoryLimit: z.number(),
})
export type ProjectMetrics = z.infer<typeof projectMetricsSchema>

/** GET /v1/projects/:id/metrics?range= — traffic, latency and resources for the live deployment. */
export function useProjectMetrics(id: string, range: MetricsRange) {
  return useQuery({
    queryKey: projectKeys.metrics(id, range),
    queryFn: () => apiFetch(`/v1/projects/${id}/metrics?range=${range}`, { schema: projectMetricsSchema }),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  })
}
