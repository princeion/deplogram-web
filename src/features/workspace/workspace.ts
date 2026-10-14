import { queryOptions, useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { apiFetch } from "@/lib/api-client"

/** Plans are defined by limits, not metering (brief §6). */
export const planSchema = z.enum(["free", "plus", "pro", "enterprise"])
export type Plan = z.infer<typeof planSchema>

export const planLabel: Record<Plan, string> = { free: "Free", plus: "Plus", pro: "Pro", enterprise: "Enterprise" }

export const workspaceSchema = z.object({
  id: z.string(),
  /** "Your Galley" for a personal workspace — the name only, no slogan (brief §3). */
  name: z.string(),
  kind: z.enum(["personal", "team"]),
  plan: planSchema,
})

export type Workspace = z.infer<typeof workspaceSchema>

export const workspaceKeys = {
  all: ["workspace"] as const,
  current: () => [...workspaceKeys.all, "current"] as const,
}

export const currentWorkspaceQuery = () =>
  queryOptions({
    queryKey: workspaceKeys.current(),
    queryFn: () => apiFetch("/v1/workspace", { schema: workspaceSchema }),
    // Changes rarely — plan upgrades invalidate it explicitly.
    staleTime: 5 * 60_000,
  })

export function useCurrentWorkspace() {
  return useQuery(currentWorkspaceQuery())
}
