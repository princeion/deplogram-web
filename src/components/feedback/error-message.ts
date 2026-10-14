import { ApiError } from "@/lib/api-client"

type ErrorBody = { message?: string; error?: { message?: string } | string }

/**
 * Turns anything thrown into one plain sentence for a person to read. The API's own message wins
 * (`{ error: { message } }` or `{ message }`); otherwise a sensible line for the status.
 */
export function errorMessage(error: unknown, fallback = "Something went wrong. Try again."): string {
  if (error instanceof ApiError) {
    const body = (error.body ?? {}) as ErrorBody
    const message = typeof body.error === "object" ? body.error?.message : body.message
    if (message) return message
    if (error.status === 401) return "Your session has ended. Sign in again."
    if (error.status === 403) return "You don't have access to do that."
    if (error.status === 404) return "That no longer exists."
    if (error.status === 409) return "Something changed in the meantime. Refresh and try again."
    if (error.status === 429) return "Too many requests. Wait a moment and try again."
    if (error.status >= 500) return "Deplogram had a problem. Try again in a moment."
    return fallback
  }
  // fetch() rejects with a TypeError when the network is down or the API is unreachable.
  if (error instanceof TypeError) return "Can't reach Deplogram. Check your connection."
  if (error instanceof Error && error.message) return error.message
  return fallback
}
