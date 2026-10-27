import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { apiFetch } from "@/lib/api-client"

/**
 * Settings › Security: password, two-factor (an authenticator app, with recovery codes), and the
 * devices signed in. Proposed contract — to confirm with the backend.
 *
 *   GET    /v1/me/security                         → SecurityOverview
 *   POST   /v1/me/password { current, next }       → 204   (422 fields.current when it's wrong)
 *   POST   /v1/me/two-factor/setup                 → { secret, otpauthUrl }
 *   POST   /v1/me/two-factor/enable { code }       → { recoveryCodes }
 *   POST   /v1/me/two-factor/disable { code }      → 204
 *   POST   /v1/me/two-factor/recovery-codes        → { recoveryCodes }   new set; the old ones stop working
 *   GET    /v1/me/sessions                         → { items }
 *   DELETE /v1/me/sessions/:id                     → 204
 *   DELETE /v1/me/sessions                         → 204   every session but this one
 */

export const securityOverviewSchema = z.object({
  passwordChangedAt: z.string().nullable(),
  twoFactor: z.object({
    enabled: z.boolean(),
    enabledAt: z.string().nullable(),
    recoveryCodesLeft: z.number(),
  }),
})
export type SecurityOverview = z.infer<typeof securityOverviewSchema>

export const sessionSchema = z.object({
  id: z.string(),
  browser: z.string(),
  os: z.string(),
  device: z.enum(["desktop", "mobile"]),
  location: z.string().nullable(),
  ip: z.string(),
  lastActiveAt: z.string(),
  createdAt: z.string(),
  current: z.boolean(),
})
export type Session = z.infer<typeof sessionSchema>

export const passwordFormSchema = z
  .object({
    current: z.string().min(1, "Enter your current password"),
    next: z.string().min(10, "Use at least 10 characters").max(128, "Keep it under 128 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { path: ["confirm"], message: "The two passwords don't match" })
  .refine((v) => v.next !== v.current, { path: ["next"], message: "Pick a password you haven't used here" })
export type PasswordForm = z.infer<typeof passwordFormSchema>

const recoveryCodesSchema = z.object({ recoveryCodes: z.array(z.string()) })

const keys = {
  overview: ["account", "security"] as const,
  sessions: ["account", "sessions"] as const,
}

export function useSecurity() {
  return useQuery({ queryKey: keys.overview, queryFn: () => apiFetch("/v1/me/security", { schema: securityOverviewSchema }) })
}

export function useChangePassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ current, next }: PasswordForm) => apiFetch("/v1/me/password", { method: "POST", json: { current, next }, schema: z.null() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.overview }),
  })
}

export function useStartTwoFactor() {
  return useMutation({
    mutationFn: () => apiFetch("/v1/me/two-factor/setup", { method: "POST", schema: z.object({ secret: z.string(), otpauthUrl: z.string() }) }),
  })
}

export function useEnableTwoFactor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => apiFetch("/v1/me/two-factor/enable", { method: "POST", json: { code }, schema: recoveryCodesSchema }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.overview }),
  })
}

export function useDisableTwoFactor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => apiFetch("/v1/me/two-factor/disable", { method: "POST", json: { code }, schema: z.null() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.overview }),
  })
}

export function useNewRecoveryCodes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch("/v1/me/two-factor/recovery-codes", { method: "POST", schema: recoveryCodesSchema }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.overview }),
  })
}

export function useSessions() {
  return useQuery({ queryKey: keys.sessions, queryFn: () => apiFetch("/v1/me/sessions", { schema: z.object({ items: z.array(sessionSchema) }) }) })
}

export function useEndSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/v1/me/sessions/${id}`, { method: "DELETE", schema: z.null() }),
    onSuccess: (_, id) => queryClient.setQueryData<{ items: Session[] }>(keys.sessions, (old) => old && { items: old.items.filter((s) => s.id !== id) }),
  })
}

export function useEndOtherSessions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch("/v1/me/sessions", { method: "DELETE", schema: z.null() }),
    onSuccess: () => queryClient.setQueryData<{ items: Session[] }>(keys.sessions, (old) => old && { items: old.items.filter((s) => s.current) }),
  })
}
