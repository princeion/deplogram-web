import { delay, http, HttpResponse, type HttpHandler } from "msw"

import { mockProjects } from "@/mocks/data/projects"
import { mockViewer } from "@/mocks/data/viewer"
import { mockWorkspace } from "@/mocks/data/workspace"

// Mock session: signed in by default; sign-in / sign-out toggle it for the browser tab.
let signedIn = true

/**
 * Mock Deplogram API, used in development while the real backend is being built
 * (NEXT_PUBLIC_API_MOCKING=enabled). Handlers mirror the agreed API contract — when an endpoint
 * ships for real, delete its handler here; nothing in the app changes.
 */
export const handlers: HttpHandler[] = [
  // Smoke test: GET /v1/health → { status: "ok" }
  http.get("*/v1/health", async () => {
    await delay(150)
    return HttpResponse.json({ status: "ok" })
  }),

  http.get("*/v1/me", async () => {
    await delay(150)
    return signedIn ? HttpResponse.json(mockViewer) : HttpResponse.json({ error: "unauthenticated" }, { status: 401 })
  }),

  http.post("*/v1/auth/sign-in", async ({ request }) => {
    await delay(400)
    const { email, password } = (await request.json()) as { email?: string; password?: string }
    if (!email || !password) return HttpResponse.json({ error: "invalid_credentials" }, { status: 401 })
    signedIn = true
    return HttpResponse.json({ ...mockViewer, email })
  }),

  http.post("*/v1/auth/sign-out", async () => {
    await delay(150)
    signedIn = false
    return new HttpResponse(null, { status: 204 })
  }),

  http.get("*/v1/workspace", async () => {
    await delay(200)
    return HttpResponse.json(mockWorkspace)
  }),

  http.get("*/v1/projects", async () => {
    await delay(300)
    return HttpResponse.json(mockProjects)
  }),
]
