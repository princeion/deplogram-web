import { useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { apiFetch } from "@/lib/api-client"

export const utilityKeys = {
  json: (endpoint: string, json: string) => ["utilities", "json", endpoint, json] as const,
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
