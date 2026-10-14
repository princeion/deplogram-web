import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { apiFetch } from "@/lib/api-client"
import { deploymentStateSchema } from "@/features/projects/projects"

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
  })

export function useDeployments(params: DeploymentListParams) {
  return useQuery(deploymentsQuery(params))
}
