import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { apiFetch } from "@/lib/api-client"
import { runtimes } from "@/content/runtimes"
import { deploymentKeys, deploymentQuery, deploymentSchema } from "@/features/deployments/deployments"
import { projectKeys, projectSummarySchema } from "@/features/projects/projects"

/*
 * The new-deployment flow's API. All proposed contracts — to agree with the backend:
 *   GET  /v1/git/connection                          → which Git account is connected
 *   GET  /v1/git/repositories?q=                     → importable repositories
 *   GET  /v1/git/repositories/:id/branches           → branches with their head commit
 *   GET  /v1/git/repositories/:id/detect?branch=     → detected runtime + default settings
 *   GET  /v1/projects/name-availability?name=        → is the name (and its URL) free
 *   POST /v1/projects                                → create the project and its first deployment
 */

export const runtimeIds = runtimes.map((r) => r.id) as [string, ...string[]]

export const gitConnectionSchema = z.object({
  provider: z.literal("github"),
  connected: z.boolean(),
  account: z.string().nullable(),
})

export const repositorySchema = z.object({
  id: z.string(),
  /** "owner/name" */
  fullName: z.string(),
  private: z.boolean(),
  defaultBranch: z.string(),
  updatedAt: z.string(),
  /** Already imported as a project — importing again creates a second project. */
  projectId: z.string().nullable(),
})
export type Repository = z.infer<typeof repositorySchema>

export const branchSchema = z.object({
  name: z.string(),
  commit: z.object({ sha: z.string(), message: z.string() }),
})
export type Branch = z.infer<typeof branchSchema>

export const detectionSchema = z.object({
  runtime: z.enum(runtimeIds).nullable(),
  /** What gave it away: "package.json (next)", "go.mod", "Dockerfile"… */
  evidence: z.string().nullable(),
  buildCommand: z.string().nullable(),
  startCommand: z.string().nullable(),
  port: z.number().nullable(),
  /** Variable names from .env.example, if the repo has one. Values are never read. */
  envExample: z.array(z.string()),
})
export type Detection = z.infer<typeof detectionSchema>

export const nameAvailabilitySchema = z.object({
  available: z.boolean(),
  /** The project's URL if the name is used. */
  url: z.string(),
  suggestion: z.string().nullable(),
})

export const createProjectResultSchema = z.object({
  project: projectSummarySchema,
  deployment: deploymentSchema,
})

export const gitKeys = {
  all: ["git"] as const,
  connection: () => [...gitKeys.all, "connection"] as const,
  repositories: (q: string) => [...gitKeys.all, "repositories", q] as const,
  branches: (repositoryId: string) => [...gitKeys.all, "branches", repositoryId] as const,
  detection: (repositoryId: string, branch: string) => [...gitKeys.all, "detect", repositoryId, branch] as const,
}

export function useGitConnection() {
  return useQuery({ queryKey: gitKeys.connection(), queryFn: () => apiFetch("/v1/git/connection", { schema: gitConnectionSchema }) })
}

export function useRepositories(q: string) {
  return useQuery({
    queryKey: gitKeys.repositories(q),
    queryFn: () => apiFetch(`/v1/git/repositories?q=${encodeURIComponent(q)}`, { schema: z.array(repositorySchema) }),
    placeholderData: keepPreviousData,
  })
}

export function useBranches(repositoryId: string | undefined) {
  return useQuery({
    queryKey: gitKeys.branches(repositoryId ?? ""),
    queryFn: () => apiFetch(`/v1/git/repositories/${repositoryId}/branches`, { schema: z.array(branchSchema) }),
    enabled: Boolean(repositoryId),
  })
}

export const detectionQuery = (repositoryId: string, branch: string) =>
  queryOptions({
    queryKey: gitKeys.detection(repositoryId, branch),
    queryFn: () => apiFetch(`/v1/git/repositories/${repositoryId}/detect?branch=${encodeURIComponent(branch)}`, { schema: detectionSchema }),
    staleTime: 5 * 60_000,
  })

export function useDetection(repositoryId: string | undefined, branch: string | undefined) {
  return useQuery({ ...detectionQuery(repositoryId ?? "", branch ?? ""), enabled: Boolean(repositoryId && branch) })
}

export function useNameAvailability(name: string) {
  return useQuery({ ...nameAvailabilityQuery(name), enabled: /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(name) })
}

export type CreateProjectInput = {
  name: string
  repositoryId: string
  branch: string
  runtime: string
  config: { buildCommand: string | null; startCommand: string | null; port: number | null; rootDirectory: string | null }
  env: { key: string; value: string }[]
}

/** POST /v1/projects — creates the project and starts its first deployment. */
export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProjectInput) => apiFetch("/v1/projects", { method: "POST", json: input, schema: createProjectResultSchema }),
    onSuccess: ({ deployment }) => {
      // The deployment page opens next: give it the deployment now instead of a loading state.
      queryClient.setQueryData(deploymentQuery(deployment.id).queryKey, deployment)
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: projectKeys.all }),
        queryClient.invalidateQueries({ queryKey: deploymentKeys.all }),
        queryClient.invalidateQueries({ queryKey: gitKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["usage"] }),
      ])
    },
  })
}

/** Runtimes that serve built files rather than running a process (no start command, no port). */
export const staticRuntimes: readonly string[] = ["static", "vite"]

export const nameAvailabilityQuery = (name: string) =>
  queryOptions({
    queryKey: ["projects", "name-availability", name],
    queryFn: () => apiFetch(`/v1/projects/name-availability?name=${encodeURIComponent(name)}`, { schema: nameAvailabilitySchema }),
    staleTime: 30_000,
  })
