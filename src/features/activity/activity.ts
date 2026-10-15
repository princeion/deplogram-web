import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { apiFetch } from "@/lib/api-client"
import { deploymentStateSchema } from "@/features/projects/projects"

/**
 * GET /v1/activity — what happened in the workspace, newest first: deployments (started,
 * succeeded, failed, rolled back), projects created/renamed/deleted, variables and settings
 * changed. Cursor-paginated. Proposed contract — to confirm with the backend (it doubles as the
 * audit log, so events are immutable).
 */
export const activityTypeSchema = z.enum([
  "deployment.started",
  "deployment.succeeded",
  "deployment.failed",
  "deployment.rolled_back",
  "project.created",
  "project.renamed",
  "project.deleted",
  "env.updated",
  "settings.updated",
])
export type ActivityType = z.infer<typeof activityTypeSchema>

export const activityEventSchema = z.object({
  id: z.string(),
  at: z.string(),
  type: activityTypeSchema,
  actor: z.object({ name: z.string() }),
  /** Null once the project is deleted (the event keeps its name). */
  project: z.object({ id: z.string().nullable(), name: z.string() }).nullable(),
  deployment: z
    .object({ id: z.string(), sha: z.string(), message: z.string(), branch: z.string(), state: deploymentStateSchema, trigger: z.string() })
    .nullable(),
  /** A short, already-written detail: "added SENTRY_DSN, removed REDIS_URL", "build failed after 18s". */
  detail: z.string().nullable(),
})
export type ActivityEvent = z.infer<typeof activityEventSchema>

export const activityPageSchema = z.object({ items: z.array(activityEventSchema), nextCursor: z.string().nullable() })

/** Filter groups for the `type` param. */
export type ActivityFilter = "all" | "deploys" | "changes" | "failures"

export const activityKeys = {
  all: ["activity"] as const,
  list: (filter: ActivityFilter, project?: string) => [...activityKeys.all, "list", filter, project ?? "all"] as const,
}

const params = (filter: ActivityFilter, project: string | undefined, cursor: string | null, limit: number) => {
  const search = new URLSearchParams({ limit: String(limit) })
  if (filter !== "all") search.set("type", filter)
  if (project) search.set("project", project)
  if (cursor) search.set("cursor", cursor)
  return search
}

/** The activity timeline, paged ("Load more"), refreshed every 10s so new events appear on their own. */
export function useActivity(filter: ActivityFilter = "all", project?: string) {
  return useInfiniteQuery({
    queryKey: activityKeys.list(filter, project),
    queryFn: ({ pageParam }) => apiFetch(`/v1/activity?${params(filter, project, pageParam, 25)}`, { schema: activityPageSchema }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    refetchInterval: 10_000,
  })
}

/** The latest few events — for the Overview. */
export function useRecentActivity(limit = 6) {
  return useQuery({
    queryKey: [...activityKeys.all, "recent", limit],
    queryFn: () => apiFetch(`/v1/activity?${params("all", undefined, null, limit)}`, { schema: activityPageSchema }),
    refetchInterval: 5_000,
  })
}
