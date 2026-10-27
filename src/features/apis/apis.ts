import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { apiFetch } from "@/lib/api-client"
import type { IconName } from "@/components/shared/icon"

/**
 * Deplogram's four APIs (OTP, Email, Image transform, QR) as the Galley sees them: the catalog,
 * keys, usage this period, recent requests, and "Try it" — which goes through the Galley's own
 * session (the backend signs it with the workspace's test key), so no secret ever reaches the page.
 * Endpoint shapes are the frontend's proposal until the backend contract is agreed.
 *
 *   GET    /v1/apis/usage                     → ApiUsage
 *   GET    /v1/apis/requests?api=             → { items }   newest first, last 50
 *   POST   /v1/apis/try { method, path, body } → { status, durationMs, body }
 *   GET    /v1/api-keys                       → { items }
 *   POST   /v1/api-keys { name, mode, access } → ApiKey & { secret }   the secret, this once
 *   DELETE /v1/api-keys/:id                   → 204
 */

export const API_BASE_URL = "https://api.deplogram.com"

export const apiIds = ["otp", "email", "images", "qr"] as const
export type ApiId = (typeof apiIds)[number]

export type ApiEndpoint = { method: "GET" | "POST"; path: string; summary: string }

export type ApiInfo = {
  id: ApiId
  name: string
  icon: IconName
  description: string
  /** What one unit of usage is: "codes", "emails". */
  unit: string
  endpoints: readonly ApiEndpoint[]
}

export const apiCatalog: Record<ApiId, ApiInfo> = {
  otp: {
    id: "otp",
    name: "OTP",
    icon: "fingerprint",
    description: "Send one-time codes by SMS, WhatsApp or email, and check them.",
    unit: "codes",
    endpoints: [
      { method: "POST", path: "/v1/otp/send", summary: "Send a code" },
      { method: "POST", path: "/v1/otp/verify", summary: "Check a code someone typed" },
      { method: "GET", path: "/v1/otp/:id", summary: "Where a code is — sent, verified, expired" },
    ],
  },
  email: {
    id: "email",
    name: "Email",
    icon: "mail",
    description: "Transactional email — receipts, sign-in links, alerts.",
    unit: "emails",
    endpoints: [
      { method: "POST", path: "/v1/email/send", summary: "Send one email" },
      { method: "POST", path: "/v1/email/batch", summary: "Send up to 100 in one call" },
      { method: "GET", path: "/v1/email/:id", summary: "Delivery status" },
    ],
  },
  images: {
    id: "images",
    name: "Image transform",
    icon: "image",
    description: "Resize, crop and convert images — from Storage or any URL.",
    unit: "transforms",
    endpoints: [
      { method: "POST", path: "/v1/images/transform", summary: "Resize, crop and convert" },
      { method: "GET", path: "/v1/images/:id", summary: "A transformed image's details" },
    ],
  },
  qr: {
    id: "qr",
    name: "QR codes",
    icon: "qr-code",
    description: "QR codes as SVG or PNG — tickets, payments, sign-in links.",
    unit: "codes",
    endpoints: [
      { method: "POST", path: "/v1/qr", summary: "Make a QR code" },
      { method: "GET", path: "/v1/qr/:id", summary: "A QR code you made" },
    ],
  },
}

export const apiList = apiIds.map((id) => apiCatalog[id])

// ── Keys ────────────────────────────────────────────────────────────────────────

export const apiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  /** The visible start of the key, e.g. "dpl_live_3fk2". The rest is never shown again. */
  prefix: z.string(),
  mode: z.enum(["live", "test"]),
  /** Which APIs it may call; empty = all of them. */
  access: z.array(z.enum(apiIds)),
  createdAt: z.string(),
  lastUsedAt: z.string().nullable(),
  createdBy: z.string(),
})
export type ApiKey = z.infer<typeof apiKeySchema>

export const createdApiKeySchema = apiKeySchema.extend({ secret: z.string() })
export type CreatedApiKey = z.infer<typeof createdApiKeySchema>

export type NewApiKey = { name: string; mode: ApiKey["mode"]; access: ApiId[] }

// ── Usage and requests ──────────────────────────────────────────────────────────

export const apiUsageSchema = z.object({
  period: z.object({ start: z.string(), end: z.string() }),
  apis: z.array(
    z.object({
      id: z.enum(apiIds),
      used: z.number(),
      limit: z.number(),
      /** Share of requests that didn't fail, 0–1. */
      successRate: z.number(),
      p50Ms: z.number(),
      daily: z.array(z.object({ date: z.string(), requests: z.number(), errors: z.number() })),
    })
  ),
})
export type ApiUsage = z.infer<typeof apiUsageSchema>

export const apiRequestSchema = z.object({
  id: z.string(),
  api: z.enum(apiIds),
  method: z.enum(["GET", "POST"]),
  path: z.string(),
  status: z.number(),
  durationMs: z.number(),
  keyPrefix: z.string(),
  mode: z.enum(["live", "test"]),
  at: z.string(),
})
export type ApiRequest = z.infer<typeof apiRequestSchema>

export type TryRequest = { method: "GET" | "POST"; path: string; body?: Record<string, unknown> }

export const tryResultSchema = z.object({ status: z.number(), durationMs: z.number(), body: z.unknown() })
export type TryResult = z.infer<typeof tryResultSchema>

const keys = {
  usage: ["apis", "usage"] as const,
  requests: (api?: ApiId) => ["apis", "requests", api ?? "all"] as const,
  keys: ["apis", "keys"] as const,
}

export function useApiUsage() {
  return useQuery({ queryKey: keys.usage, queryFn: () => apiFetch("/v1/apis/usage", { schema: apiUsageSchema }) })
}

export function useApiRequests(api?: ApiId) {
  return useQuery({
    queryKey: keys.requests(api),
    queryFn: () => apiFetch(`/v1/apis/requests${api ? `?api=${api}` : ""}`, { schema: z.object({ items: z.array(apiRequestSchema) }) }),
    refetchInterval: 15_000,
  })
}

export function useTryApi() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: TryRequest) => apiFetch("/v1/apis/try", { method: "POST", json: request, schema: tryResultSchema }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["apis", "requests"] }),
  })
}

export function useApiKeys() {
  return useQuery({ queryKey: keys.keys, queryFn: () => apiFetch("/v1/api-keys", { schema: z.object({ items: z.array(apiKeySchema) }) }) })
}

export function useCreateApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewApiKey) => apiFetch("/v1/api-keys", { method: "POST", json: input, schema: createdApiKeySchema }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.keys }),
  })
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/v1/api-keys/${id}`, { method: "DELETE", schema: z.null() }),
    onSuccess: (_, id) => queryClient.setQueryData<{ items: ApiKey[] }>(keys.keys, (old) => old && { items: old.items.filter((k) => k.id !== id) }),
  })
}

/** "All APIs" or "OTP, Email". */
export const accessLabel = (access: readonly ApiId[]) => (access.length === 0 ? "All APIs" : access.map((id) => apiCatalog[id].name).join(", "))

/** The API a request path belongs to. */
export const apiOfPath = (path: string): ApiId | null => {
  const segment = path.split("/")[2]
  return segment === "otp" || segment === "email" || segment === "images" || segment === "qr" ? segment : null
}
