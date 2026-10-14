import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { apiFetch } from "@/lib/api-client"
import { deploymentStateSchema, projectKeys } from "@/features/projects/projects"

export const deploymentTriggerSchema = z.enum(["git", "manual", "redeploy", "rollback"])
export type DeploymentTrigger = z.infer<typeof deploymentTriggerSchema>

export const deploymentSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  projectName: z.string(),
  runtime: z.string(),
  state: deploymentStateSchema,
  /**
   * The project's current live deployment. A RUNNING deployment that is not live has been
   * replaced by a newer one (shown as "Ready"). Proposed contract — to confirm with the backend.
   */
  live: z.boolean(),
  commit: z.object({
    sha: z.string(),
    message: z.string(),
    branch: z.string(),
    author: z.object({ name: z.string(), avatarUrl: z.string().nullable() }),
  }),
  trigger: deploymentTriggerSchema,
  createdAt: z.string(),
  /** Seconds from QUEUED to RUNNING or to the failure; null while in progress. */
  durationSeconds: z.number().nullable(),
  url: z.string().nullable(),
  /**
   * The runtime configuration this deployment was built and started with (brief: version, build
   * command, start command, port). A snapshot — later settings changes don't rewrite it.
   * Proposed contract — to confirm with the backend.
   */
  config: z.object({
    runtimeVersion: z.string(),
    buildCommand: z.string().nullable(),
    startCommand: z.string().nullable(),
    /** null for static sites (served from storage, no container). */
    port: z.number().nullable(),
  }),
})

export type Deployment = z.infer<typeof deploymentSchema>

export const deploymentPageSchema = z.object({
  items: z.array(deploymentSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})

/** Status filter groups (the `status` param). */
export const deploymentStatusGroups = {
  running: ["RUNNING"],
  in_progress: ["QUEUED", "BUILDING", "BUILT", "DEPLOYING"],
  failed: ["BUILD_FAILED", "DEPLOY_FAILED", "CRASHED"],
} as const

export type DeploymentListParams = {
  q?: string
  status?: string[]
  project?: string[]
  branch?: string[]
  trigger?: string[]
  /** "created" | "-created" | "duration" | "-duration" */
  sort?: string
  page: number
  pageSize: number
}

export const deploymentKeys = {
  all: ["deployments"] as const,
  list: (params: DeploymentListParams) => [...deploymentKeys.all, "list", params] as const,
}

function toSearchParams(params: DeploymentListParams) {
  const search = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) })
  if (params.q) search.set("q", params.q)
  if (params.sort) search.set("sort", params.sort)
  for (const key of ["status", "project", "branch", "trigger"] as const) {
    if (params[key]?.length) search.set(key, params[key]!.join(","))
  }
  return search
}

export const deploymentsQuery = (params: DeploymentListParams) =>
  queryOptions({
    queryKey: deploymentKeys.list(params),
    queryFn: () => apiFetch(`/v1/deployments?${toSearchParams(params)}`, { schema: deploymentPageSchema }),
    // Keep the current page on screen while a new filter/page loads.
    placeholderData: keepPreviousData,
    // While anything on screen is building or deploying, keep it moving: poll until it settles.
    // TODO: replace with the realtime channel (SSE/WebSocket) once the backend has one.
    refetchInterval: (query) => (query.state.data?.items.some((d) => isInProgress(d.state)) ? 2000 : false),
  })

export function useDeployments(params: DeploymentListParams) {
  return useQuery(deploymentsQuery(params))
}

const inProgressStates: readonly Deployment["state"][] = deploymentStatusGroups.in_progress
export const isInProgress = (state: Deployment["state"]) => inProgressStates.includes(state)

/** After a deploy action, refresh lists everywhere (deployments and the projects' states). */
function useInvalidateDeployments() {
  const queryClient = useQueryClient()
  return () => Promise.all([queryClient.invalidateQueries({ queryKey: deploymentKeys.all }), queryClient.invalidateQueries({ queryKey: projectKeys.all })])
}

/** POST /v1/deployments/:id/redeploy — build the same commit again. Returns the new deployment. */
export function useRedeploy() {
  const invalidate = useInvalidateDeployments()
  return useMutation({
    mutationFn: (deploymentId: string) => apiFetch(`/v1/deployments/${deploymentId}/redeploy`, { method: "POST", schema: deploymentSchema }),
    onSuccess: invalidate,
  })
}

export const rollbackResultSchema = z.object({
  deployment: deploymentSchema,
  /** The deployment that was live before — roll forward to it to undo. */
  previousLiveId: z.string().nullable(),
})

/**
 * POST /v1/deployments/:id/rollback — make an earlier successful deployment live again, reusing
 * its build (no new build). Proposed contract — to confirm with the backend.
 */
export function useRollback() {
  const invalidate = useInvalidateDeployments()
  return useMutation({
    mutationFn: (deploymentId: string) => apiFetch(`/v1/deployments/${deploymentId}/rollback`, { method: "POST", schema: rollbackResultSchema }),
    onSuccess: invalidate,
  })
}

/** GET /v1/deployments/:id — one deployment. Polls while it's in progress. */
export const deploymentQuery = (deploymentId: string) =>
  queryOptions({
    queryKey: [...deploymentKeys.all, "detail", deploymentId] as const,
    queryFn: () => apiFetch(`/v1/deployments/${deploymentId}`, { schema: deploymentSchema }),
    refetchInterval: (query) => (query.state.data && isInProgress(query.state.data.state) ? 2000 : false),
  })

export function useDeployment(deploymentId: string) {
  return useQuery(deploymentQuery(deploymentId))
}

export const logStepIdSchema = z.enum(["clone", "install", "build", "deploy", "runtime"])
export type LogStepId = z.infer<typeof logStepIdSchema>

export const buildLogLineSchema = z.object({
  /** 1-based line number, stable for the deployment — used as the cursor (`after`). */
  n: z.number(),
  at: z.string(),
  step: logStepIdSchema,
  stream: z.enum(["stdout", "stderr"]),
  /** Raw text; may contain ANSI colour codes. */
  text: z.string(),
})
export type BuildLogLine = z.infer<typeof buildLogLineSchema>

export const buildStepSchema = z.object({
  id: logStepIdSchema,
  label: z.string(),
  state: z.enum(["pending", "running", "succeeded", "failed", "skipped"]),
  startedAt: z.string().nullable(),
  endedAt: z.string().nullable(),
})
export type BuildStep = z.infer<typeof buildStepSchema>

/**
 * GET /v1/deployments/:id/logs?after=n — log lines after line n, the steps' current states, and
 * whether the log is complete. Proposed contract — to confirm with the backend.
 */
export const deploymentLogsSchema = z.object({
  lines: z.array(buildLogLineSchema),
  steps: z.array(buildStepSchema),
  done: z.boolean(),
})
export type DeploymentLogs = z.infer<typeof deploymentLogsSchema>

/**
 * The build log, streamed: each fetch asks only for lines after the last one we have and appends
 * them, polling every second until the log is done.
 * TODO: switch to the realtime channel (SSE/WebSocket) when the backend has one.
 */
export function useDeploymentLogs(deploymentId: string) {
  const queryClient = useQueryClient()
  const queryKey = [...deploymentKeys.all, "logs", deploymentId] as const
  return useQuery({
    queryKey,
    queryFn: async (): Promise<DeploymentLogs> => {
      const previous = queryClient.getQueryData<DeploymentLogs>(queryKey)
      const after = previous?.lines.at(-1)?.n ?? 0
      const next = await apiFetch(`/v1/deployments/${deploymentId}/logs?after=${after}`, { schema: deploymentLogsSchema })
      return { ...next, lines: after ? [...previous!.lines, ...next.lines] : next.lines }
    },
    refetchInterval: (query) => (query.state.data?.done ? false : 1000),
    staleTime: Infinity,
  })
}
