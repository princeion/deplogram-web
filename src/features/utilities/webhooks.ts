import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { apiFetch } from "@/lib/api-client"

/**
 * Webhook tester: a capture URL per workspace that records whatever is sent to it, so you can
 * see exactly what a provider (GitHub, Paystack…) sends, and replay it at your own server.
 * Endpoint shapes are the frontend's proposal until the backend contract is agreed.
 *
 *   GET    /v1/webhooks/endpoint                   → { url, createdAt }
 *   POST   /v1/webhooks/endpoint                   → { url, createdAt }   a new URL; the old one stops
 *   GET    /v1/webhooks/requests                   → { items }            newest first, last 50
 *   DELETE /v1/webhooks/requests                   → 204                  clear
 *   POST   /v1/webhooks/test  { sample }           → WebhookRequest       sends a sample to your URL
 *   POST   /v1/webhooks/requests/:id/replay { url } → { status, durationMs, error }
 */

export const webhookRequestSchema = z.object({
  id: z.string(),
  method: z.string(),
  path: z.string(),
  query: z.array(z.tuple([z.string(), z.string()])),
  headers: z.array(z.tuple([z.string(), z.string()])),
  body: z.string(),
  contentType: z.string().nullable(),
  size: z.number(),
  ip: z.string(),
  receivedAt: z.string(),
})
export type WebhookRequest = z.infer<typeof webhookRequestSchema>

export const webhookEndpointSchema = z.object({ url: z.string(), createdAt: z.string() })

export const webhookSamples = [
  { id: "github-push", label: "GitHub · push" },
  { id: "paystack-charge", label: "Paystack · charge.success" },
  { id: "form", label: "A form post" },
] as const
export type WebhookSample = (typeof webhookSamples)[number]["id"]

const keys = {
  endpoint: ["webhooks", "endpoint"] as const,
  requests: ["webhooks", "requests"] as const,
}

export function useWebhookEndpoint() {
  return useQuery({ queryKey: keys.endpoint, queryFn: () => apiFetch("/v1/webhooks/endpoint", { schema: webhookEndpointSchema }) })
}

export function useRotateEndpoint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch("/v1/webhooks/endpoint", { method: "POST", schema: webhookEndpointSchema }),
    onSuccess: (endpoint) => {
      queryClient.setQueryData(keys.endpoint, endpoint)
      void queryClient.invalidateQueries({ queryKey: keys.requests })
    },
  })
}

/** What's arrived, polled while the page is open. */
export function useWebhookRequests() {
  return useQuery({
    queryKey: keys.requests,
    queryFn: () => apiFetch("/v1/webhooks/requests", { schema: z.object({ items: z.array(webhookRequestSchema) }) }),
    refetchInterval: 3000,
  })
}

export function useClearRequests() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch("/v1/webhooks/requests", { method: "DELETE", schema: z.null() }),
    onSuccess: () => queryClient.setQueryData(keys.requests, { items: [] }),
  })
}

export function useSendSample() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sample: WebhookSample) => apiFetch("/v1/webhooks/test", { method: "POST", json: { sample }, schema: webhookRequestSchema }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.requests }),
  })
}

export function useReplay() {
  return useMutation({
    mutationFn: (input: { id: string; url: string }) =>
      apiFetch(`/v1/webhooks/requests/${input.id}/replay`, {
        method: "POST",
        json: { url: input.url },
        schema: z.object({ status: z.number().nullable(), durationMs: z.number(), error: z.string().nullable() }),
      }),
  })
}
