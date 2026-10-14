import { queryOptions, useQuery } from "@tanstack/react-query"
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

/** A project as lists show it (switcher, projects page). */
export const projectSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  runtime: z.string(),
  /** State of the latest deployment. */
  state: deploymentStateSchema,
  /** Deployment URL host while RUNNING, else null. */
  url: z.string().nullable(),
})

export type ProjectSummary = z.infer<typeof projectSummarySchema>

/** Query keys for everything project-related — invalidate `projectKeys.all` after a mutation. */
export const projectKeys = {
  all: ["projects"] as const,
  list: () => [...projectKeys.all, "list"] as const,
}

export const projectsQuery = () =>
  queryOptions({
    queryKey: projectKeys.list(),
    queryFn: () => apiFetch("/v1/projects", { schema: z.array(projectSummarySchema) }),
  })

export function useProjects() {
  return useQuery(projectsQuery())
}
