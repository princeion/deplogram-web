import { useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { apiFetch } from "@/lib/api-client"

export const utilityKeys = {
  json: (endpoint: string, json: string) => ["utilities", "json", endpoint, json] as const,
  base64: (mode: "encode" | "decode", value: string) => ["utilities", "base64", mode, value] as const,
}

const base64EncodeSchema = z.object({ encoded: z.string() })
const base64DecodeSchema = z.object({ decoded: z.string() })

/**
 * Hook to encode or decode Base64 via the backend API.
 * Calls POST /utils/base64/encode with { data } or POST /utils/base64/decode with { encoded }.
 */
export function useApiBase64(mode: "encode" | "decode", value: string, enabled = true) {
  return useQuery({
    queryKey: utilityKeys.base64(mode, value),
    queryFn: async (): Promise<string> => {
      if (mode === "encode") {
        const res = await apiFetch<{ encoded: string }>("/utils/base64/encode", {
          method: "POST",
          json: { data: value },
          schema: base64EncodeSchema,
        })
        return res.encoded
      }
      const res = await apiFetch<{ decoded: string }>("/utils/base64/decode", {
        method: "POST",
        json: { encoded: value },
        schema: base64DecodeSchema,
      })
      return res.decoded
    },
    enabled: enabled && value.length > 0,
    staleTime: 60_000,
  })
}

/**
 * Hook to format or minify JSON via the backend API.
 *
 * Calls POST /utils/json/formatter or POST /utils/json/minify with body { json }.
 * Handles parsed responses from apiFetch and returns the result as a string.
 */
export function useApiJson(endpoint: string, json: string, enabled = true) {
  return useQuery({
    queryKey: utilityKeys.json(endpoint, json),
    queryFn: async (): Promise<string> => {
      const data = await apiFetch<unknown>(endpoint, {
        method: "POST",
        json: { json },
        schema: z.unknown(),
      })

      if (typeof data === "string") return data

      if (endpoint.includes("minify")) {
        return JSON.stringify(data)
      }

      return JSON.stringify(data, null, 2)
    },
    enabled: enabled && json.trim().length > 0,
    staleTime: 60_000,
  })
}
