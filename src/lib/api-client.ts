import type { z } from "zod"

/** Base URL of the Deplogram API. Empty = same origin (e.g. while MSW mocks it). */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ""

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
    message = `API request failed with ${status}`
  ) {
    super(message)
    this.name = "ApiError"
  }
}

type ApiFetchOptions<T> = Omit<RequestInit, "body"> & {
  /** Validates the response; the return type comes from it. */
  schema: z.ZodType<T>
  /** Sent as JSON. */
  json?: unknown
}

/**
 * Typed request to the Deplogram API: JSON in, JSON out, response validated with Zod so a
 * contract mismatch fails loudly here instead of deep inside a component. Use it inside
 * TanStack Query `queryFn` / `mutationFn`.
 */
export async function apiFetch<T>(path: string, { schema, json, headers, ...init }: ApiFetchOptions<T>): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    // The backend's session lives in a cookie — send it, also cross-origin.
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      ...(json !== undefined && { "Content-Type": "application/json" }),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : undefined,
  })

  const body: unknown = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(response.status, body)
  return schema.parse(body)
}
