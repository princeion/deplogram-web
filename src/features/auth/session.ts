import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { ApiError, apiFetch } from "@/lib/api-client"

/**
 * Authentication is owned by the Deplogram backend (session cookie). The frontend only reads who
 * is signed in and calls sign-in / sign-out. Endpoint shapes are the frontend's proposal until
 * the backend contract is agreed.
 */
export const viewerSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string(),
  image: z.string().nullable(),
})

export type Viewer = z.infer<typeof viewerSchema>

export const sessionKeys = {
  viewer: ["session", "viewer"] as const,
}

/** The signed-in user, or null when signed out (401). */
export const viewerQuery = () =>
  queryOptions({
    queryKey: sessionKeys.viewer,
    queryFn: async () => {
      try {
        return await apiFetch("/v1/me", { schema: viewerSchema })
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null
        throw error
      }
    },
    staleTime: 5 * 60_000,
    // "Signed out" is an answer, not a failure — only retry real errors (network, 5xx), once.
    retry: (failureCount, error) => !(error instanceof ApiError && error.status === 401) && failureCount < 1,
  })

export function useViewer() {
  return useQuery(viewerQuery())
}

/**
 * POST /v1/auth/sign-in { email, password, code? } → Viewer. With two-factor on, the first try
 * (no code) answers 401 { error: "two_factor_required" }; send again with the code from the
 * authenticator app or a recovery code. Wrong credentials: 401 { error: "invalid_credentials" };
 * wrong code: 401 { error: "invalid_code" }.
 */
export type SignInInput = { email: string; password: string; code?: string }

/** The reason a sign-in was refused, from the 401's body. */
export function signInRefusal(error: unknown): "two_factor_required" | "invalid_code" | "invalid_credentials" | null {
  if (!(error instanceof ApiError) || error.status !== 401) return null
  const reason = (error.body as { error?: unknown } | null)?.error
  return reason === "two_factor_required" || reason === "invalid_code" ? reason : "invalid_credentials"
}

export function useSignIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SignInInput) => apiFetch("/v1/auth/sign-in", { method: "POST", json: input, schema: viewerSchema }),
    onSuccess: (viewer) => queryClient.setQueryData(sessionKeys.viewer, viewer),
  })
}

export function useSignOut() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch("/v1/auth/sign-out", { method: "POST", schema: z.null() }),
    // Drop everything cached for this user, then mark the session empty.
    onSuccess: () => {
      queryClient.clear()
      queryClient.setQueryData(sessionKeys.viewer, null)
    },
  })
}
