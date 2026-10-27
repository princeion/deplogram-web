/**
 * Endpoints the real backend serves (from its OpenAPI spec at
 * https://deplogram-backend.vercel.app/api/docs-json, checked 27 Oct 2026). With
 * NEXT_PUBLIC_API_MOCKING=partial, these go to the backend and every other /v1 endpoint stays
 * mocked — so areas the backend hasn't built yet (CodePad, Storage, webhooks, the APIs pages,
 * security, notifications) keep working. When the backend ships an endpoint, add it here.
 *
 * Paths use `:param` for path parameters; the name doesn't matter.
 */
export const liveEndpoints = [
  "POST /v1/auth/sign-in",
  "POST /v1/auth/sign-up",
  "POST /v1/auth/sign-out",
  "GET /v1/me",
  "DELETE /v1/me",
  "GET /v1/me/settings",
  "PATCH /v1/me/settings",
  "GET /v1/workspace",
  "GET /v1/traffic",
  "GET /v1/usage",
  "GET /v1/projects",
  "POST /v1/projects",
  "GET /v1/projects/name-availability",
  "GET /v1/projects/:id",
  "PATCH /v1/projects/:id",
  "DELETE /v1/projects/:id",
  "GET /v1/projects/:id/env",
  "PUT /v1/projects/:id/env",
  "GET /v1/projects/:id/logs",
  "GET /v1/projects/:id/metrics",
  "GET /v1/deployments",
  "GET /v1/deployments/:id",
  "GET /v1/deployments/:id/logs",
  "POST /v1/deployments/:id/redeploy",
  "POST /v1/deployments/:id/rollback",
  "GET /v1/activity",
  "GET /v1/git/connection",
  "GET /v1/git/repositories",
  "GET /v1/git/repositories/:id/branches",
  "GET /v1/git/repositories/:id/detect",
] as const

// A handler's "*/v1/projects/:projectId" → "GET /v1/projects/:", so param names and the origin wildcard don't matter.
export const endpointKey = (method: string, path: string) => `${method.toUpperCase()} ${path.replace(/^\*/, "").replace(/:[^/]+/g, ":")}`

const live = new Set<string>(liveEndpoints.map((e) => endpointKey(e.split(" ")[0], e.split(" ")[1])))

export const isLive = (method: string, path: string) => live.has(endpointKey(method, path))
