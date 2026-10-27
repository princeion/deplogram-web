import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { apiFetch } from "@/lib/api-client"

/**
 * Settings › Notifications: which emails you get. Proposed contract.
 *
 *   GET   /v1/me/notifications                        → NotificationSettings
 *   PATCH /v1/me/notifications { events?, digest? }   → NotificationSettings
 */

export const notificationEvents = [
  { id: "deploy_failed", group: "Deployments", label: "A deployment fails", description: "With the step that failed and the last lines of its log." },
  { id: "service_crashed", group: "Deployments", label: "A service crashes or keeps restarting", description: "Sent once per incident, not on every restart." },
  { id: "deploy_succeeded", group: "Deployments", label: "A deployment goes live", description: "Every successful deploy — noisy if you push often." },
  { id: "limit_near", group: "Usage", label: "You're close to a plan limit", description: "At 80% of build minutes, bandwidth, storage or an API." },
  { id: "limit_reached", group: "Usage", label: "You reach a plan limit", description: "What stopped and when it resets." },
  { id: "new_sign_in", group: "Security", label: "A new device signs in", description: "Always on — it's how you'd notice someone else in your account.", locked: true },
  { id: "api_keys", group: "Security", label: "An API key is created or revoked", description: "Including by the API." },
  { id: "product_updates", group: "From Deplogram", label: "Product updates", description: "What's new, about once a month." },
  { id: "tips", group: "From Deplogram", label: "Getting-started tips", description: "A few short emails in your first weeks." },
] as const

export type NotificationEvent = (typeof notificationEvents)[number]["id"]
const eventIds = notificationEvents.map((e) => e.id) as [NotificationEvent, ...NotificationEvent[]]

export const notificationSettingsSchema = z.object({
  email: z.string(),
  events: z.record(z.enum(eventIds), z.boolean()),
  digest: z.enum(["off", "weekly"]),
})
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>

export type NotificationUpdate = { events?: Partial<Record<NotificationEvent, boolean>>; digest?: NotificationSettings["digest"] }

const key = ["account", "notifications"] as const

export function useNotificationSettings() {
  return useQuery({ queryKey: key, queryFn: () => apiFetch("/v1/me/notifications", { schema: notificationSettingsSchema }) })
}

/** Saves one change at a time, showing it straight away and rolling back if it fails. */
export function useUpdateNotifications() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (update: NotificationUpdate) => apiFetch("/v1/me/notifications", { method: "PATCH", json: update, schema: notificationSettingsSchema }),
    onMutate: async (update) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<NotificationSettings>(key)
      if (previous) queryClient.setQueryData<NotificationSettings>(key, { ...previous, events: { ...previous.events, ...update.events }, digest: update.digest ?? previous.digest })
      return { previous }
    },
    onError: (_error, _update, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSuccess: (settings) => queryClient.setQueryData(key, settings),
  })
}
