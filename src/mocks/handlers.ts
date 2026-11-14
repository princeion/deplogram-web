import type { HttpHandler } from "msw"

/**
 * Mock Deplogram API handlers.
 *
 * With NEXT_PUBLIC_API_MOCKING=partial, every endpoint the real backend serves is routed there
 * (see src/mocks/live-endpoints.ts) and is filtered out of this worker, so nothing here is used
 * in that mode. Handlers remain only for endpoints the backend does not yet serve.
 */
export const handlers: HttpHandler[] = []
