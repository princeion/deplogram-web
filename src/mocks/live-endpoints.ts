/**
 * Endpoints the real backend serves (from its OpenAPI spec at
 * https://deplogram-backend.vercel.app/api/docs-json). With
 * NEXT_PUBLIC_API_MOCKING=partial, these go to the backend and every other /v1 endpoint stays
 * mocked — so areas the backend hasn't built yet keep working. When the backend ships an endpoint,
 * add it here.
 *
 * Paths use `:param` for path parameters; the name doesn't matter.
 */
export const liveEndpoints = [
  // Auth
  "POST /v1/auth/sign-in",
  "POST /v1/auth/sign-up",
  "POST /v1/auth/sign-out",

  // Email OTP (under /auth, not /v1/auth)
  "POST /auth/otp/send",
  "POST /auth/otp/verify",

  // Account (/v1/me)
  "GET /v1/me",
  "DELETE /v1/me",
  "GET /v1/me/settings",
  "PATCH /v1/me/settings",
  "GET /v1/me/security",
  "POST /v1/me/password",
  "GET /v1/me/sessions",
  "DELETE /v1/me/sessions",
  "DELETE /v1/me/sessions/:id",
  "POST /v1/me/two-factor/setup",
  "POST /v1/me/two-factor/enable",
  "POST /v1/me/two-factor/disable",
  "POST /v1/me/two-factor/recovery-codes",
  "GET /v1/me/notifications",
  "PATCH /v1/me/notifications",

  // Workspace / traffic / usage
  "GET /v1/workspace",
  "GET /v1/traffic",
  "GET /v1/usage",

  // Projects
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

  // Deployments
  "GET /v1/deployments",
  "GET /v1/deployments/:id",
  "GET /v1/deployments/:id/logs",
  "POST /v1/deployments/:id/redeploy",
  "POST /v1/deployments/:id/rollback",

  // Activity
  "GET /v1/activity",

  // Git
  "GET /v1/git/connection",
  "POST /v1/git/connection",
  "DELETE /v1/git/connection",
  "GET /v1/git/installations",
  "GET /v1/git/repositories",
  "GET /v1/git/repositories/:id/branches",
  "GET /v1/git/repositories/:id/detect",

  // CodePad
  "GET /v1/pads",
  "POST /v1/pads",
  "GET /v1/pads/:id",
  "PATCH /v1/pads/:id",
  "DELETE /v1/pads/:id",
  "PUT /v1/pads/:id/files",
  "POST /v1/pads/:id/files/rename",
  "DELETE /v1/pads/:id/files",
  "POST /v1/pads/:id/runs",
  "POST /v1/pads/:id/deploy",
  "GET /v1/runs/:id/logs",

  // Storage
  "GET /v1/storage/list",
  "GET /v1/storage/search",
  "GET /v1/storage/folders",
  "POST /v1/storage/folders",
  "POST /v1/storage/uploads",
  "PUT /v1/storage/uploads/:token",
  "PATCH /v1/storage/items",
  "POST /v1/storage/move",
  "POST /v1/storage/delete",
  "GET /v1/storage/preview",
  "POST /v1/storage/links",

  // APIs
  "GET /v1/apis/usage",
  "GET /v1/apis/requests",
  "POST /v1/apis/try",
  "GET /v1/api-keys",
  "POST /v1/api-keys",
  "DELETE /v1/api-keys/:id",

  // Webhooks
  "GET /v1/webhooks/endpoint",
  "POST /v1/webhooks/endpoint",
  "GET /v1/webhooks/requests",
  "DELETE /v1/webhooks/requests",
  "POST /v1/webhooks/test",
  "POST /v1/webhooks/requests/:id/replay",

  // Health
  "GET /v1/health",
] as const

// A handler's "*/v1/projects/:projectId" → "GET /v1/projects/:", so param names and the origin wildcard don't matter.
export const endpointKey = (method: string, path: string) => `${method.toUpperCase()} ${path.replace(/^\*/, "").replace(/:[^/]+/g, ":")}`

const live = new Set<string>(liveEndpoints.map((e) => endpointKey(e.split(" ")[0], e.split(" ")[1])))

export const isLive = (method: string, path: string) => live.has(endpointKey(method, path))
