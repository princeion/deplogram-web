import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { apiFetch } from "@/lib/api-client"
import { runtimes } from "@/content/runtimes"
import { sessionKeys } from "@/features/auth/session"

const runtimeIds = runtimes.map((r) => r.id) as [string, ...string[]]

/** Account settings as the API returns them. */
export const accountSettingsSchema = z.object({
  name: z.string(),
  email: z.string(),
  preferences: z.object({
    defaultRuntime: z.enum(runtimeIds),
    deploymentEmails: z.boolean(),
    productUpdates: z.boolean(),
  }),
})

export type AccountSettings = z.infer<typeof accountSettingsSchema>

/** What the General settings form edits (email is managed by the sign-in provider). */
export const generalSettingsFormSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(64, "Keep it under 64 characters"),
  defaultRuntime: z.enum(runtimeIds, { message: "Pick a runtime" }),
  deploymentEmails: z.boolean(),
  productUpdates: z.boolean(),
})

export type GeneralSettingsForm = z.infer<typeof generalSettingsFormSchema>

export const toGeneralSettingsForm = (settings: AccountSettings): GeneralSettingsForm => ({
  name: settings.name,
  ...settings.preferences,
})

export const accountKeys = {
  settings: ["account", "settings"] as const,
}

export const accountSettingsQuery = () =>
  queryOptions({
    queryKey: accountKeys.settings,
    queryFn: () => apiFetch("/v1/me/settings", { schema: accountSettingsSchema }),
  })

export function useAccountSettings() {
  return useQuery(accountSettingsQuery())
}

export function useUpdateAccountSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ name, ...preferences }: GeneralSettingsForm) =>
      apiFetch("/v1/me/settings", { method: "PATCH", json: { name, preferences }, schema: accountSettingsSchema }),
    onSuccess: (settings) => {
      queryClient.setQueryData(accountKeys.settings, settings)
      // The name also shows in the account menu.
      return queryClient.invalidateQueries({ queryKey: sessionKeys.viewer })
    },
  })
}
