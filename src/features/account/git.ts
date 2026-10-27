import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { apiFetch } from "@/lib/api-client"
import { gitKeys } from "@/features/deploy/deploy"

/**
 * Settings › Git connections: the GitHub account behind deploys, and where the Deplogram GitHub
 * App is installed (your account, organisations) with the repositories it can see. Changing which
 * repositories happens on GitHub. Proposed contract.
 *
 *   GET    /v1/git/connection        → { provider, connected, account }   (shared with New project)
 *   GET    /v1/git/installations     → { items }
 *   POST   /v1/git/connection        → { url }   GitHub's authorise page to send the browser to
 *   DELETE /v1/git/connection        → 204
 */

/** Where to add the app to another account or organisation. */
export const GITHUB_APP_INSTALL_URL = "https://github.com/apps/deplogram/installations/new"

export const installationSchema = z.object({
  id: z.number(),
  account: z.string(),
  type: z.enum(["user", "organization"]),
  repositorySelection: z.enum(["all", "selected"]),
  repositories: z.number(),
  installedAt: z.string(),
  /** github.com page to change the app's access for this account. */
  settingsUrl: z.string(),
})
export type Installation = z.infer<typeof installationSchema>

const installationsKey = ["git", "installations"] as const

export function useInstallations(enabled = true) {
  return useQuery({
    queryKey: installationsKey,
    queryFn: () => apiFetch("/v1/git/installations", { schema: z.object({ items: z.array(installationSchema) }) }),
    enabled,
  })
}

/** Starts connecting. Real: returns GitHub's authorise URL to send the browser to (it comes back here). */
export function useConnectGitHub() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch("/v1/git/connection", { method: "POST", schema: z.object({ url: z.string() }) }),
    onSuccess: ({ url }) => {
      if (/^https?:/.test(url)) return window.location.assign(url)
      // Connected without leaving (the mock): refresh what depends on it.
      return queryClient.invalidateQueries({ queryKey: ["git"] })
    },
  })
}

export function useDisconnectGitHub() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch("/v1/git/connection", { method: "DELETE", schema: z.null() }),
    onSuccess: () => {
      queryClient.setQueryData(installationsKey, { items: [] })
      return queryClient.invalidateQueries({ queryKey: gitKeys.connection() })
    },
  })
}
