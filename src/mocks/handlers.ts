import { delay, http, HttpResponse, type HttpHandler } from "msw"

import { deploymentStatusGroups } from "@/features/deployments/deployments"
import { mockDeploymentStore, mockRedeploy, mockRollback } from "@/mocks/data/deployments"
import { mockProjects } from "@/mocks/data/projects"
import { mockViewer } from "@/mocks/data/viewer"
import { generateMockUsage } from "@/mocks/data/usage"
import { mockWorkspace } from "@/mocks/data/workspace"

// Mock session: signed in by default; sign-in / sign-out toggle it for the browser tab.
let signedIn = true

const mockUsage = generateMockUsage()

let accountSettings = {
  name: mockViewer.name ?? "",
  email: mockViewer.email,
  preferences: { defaultRuntime: "node", deploymentEmails: true, productUpdates: false },
}

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

  http.delete("*/v1/me", async () => {
    await delay(900)
    signedIn = false
    return new HttpResponse(null, { status: 204 })
  }),

  http.get("*/v1/me/settings", async () => {
    await delay(300)
    return HttpResponse.json(accountSettings)
  }),

  http.patch("*/v1/me/settings", async ({ request }) => {
    await delay(600)
    const body = (await request.json()) as Partial<typeof accountSettings>
    const name = body.name?.trim() ?? accountSettings.name
    // Lets the form demo server-side errors: reserved names are rejected on the field.
    if (["admin", "root", "deplogram"].includes(name.toLowerCase())) {
      return HttpResponse.json({ error: { message: "Check the highlighted field.", fields: { name: "That name is reserved." } } }, { status: 422 })
    }
    accountSettings = { ...accountSettings, name, preferences: { ...accountSettings.preferences, ...body.preferences } }
    mockViewer.name = name
    return HttpResponse.json(accountSettings)
  }),

  http.get("*/v1/workspace", async () => {
    await delay(200)
    return HttpResponse.json(mockWorkspace)
  }),

  // Filtering, search, sorting and paging happen "server-side", like the real API will.
  http.get("*/v1/deployments", async ({ request }) => {
    await delay(350)
    const url = new URL(request.url)
    const list = (key: string) => url.searchParams.get(key)?.split(",").filter(Boolean) ?? []
    const q = url.searchParams.get("q")?.toLowerCase() ?? ""
    const statuses = list("status").flatMap((group) => deploymentStatusGroups[group as keyof typeof deploymentStatusGroups] ?? [])
    const [projects, branches, triggers] = [list("project"), list("branch"), list("trigger")]
    const sort = url.searchParams.get("sort") ?? "-created"
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1)
    const pageSize = Math.min(100, Number(url.searchParams.get("pageSize")) || 20)

    let items = mockDeploymentStore().filter(
      (d) =>
        (!statuses.length || (statuses as readonly string[]).includes(d.state)) &&
        (!projects.length || projects.includes(d.projectId)) &&
        (!branches.length || branches.includes(d.commit.branch)) &&
        (!triggers.length || triggers.includes(d.trigger)) &&
        (!q || [d.commit.message, d.commit.sha, d.commit.branch, d.projectName].some((v) => v.toLowerCase().includes(q)))
    )
    const desc = sort.startsWith("-")
    const key = sort.replace(/^-/, "")
    items = items.sort((a, b) => {
      const value = key === "duration" ? (a.durationSeconds ?? -1) - (b.durationSeconds ?? -1) : a.createdAt.localeCompare(b.createdAt)
      return desc ? -value : value
    })
    return HttpResponse.json({ items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize })
  }),

  http.post("*/v1/deployments/:id/redeploy", async ({ params }) => {
    await delay(600)
    const deployment = mockRedeploy(String(params.id))
    return deployment
      ? HttpResponse.json(deployment, { status: 201 })
      : HttpResponse.json({ error: { message: "That deployment no longer exists." } }, { status: 404 })
  }),

  http.post("*/v1/deployments/:id/rollback", async ({ params }) => {
    await delay(600)
    const result = mockRollback(String(params.id))
    return "error" in result
      ? HttpResponse.json({ error: { message: result.error } }, { status: 409 })
      : HttpResponse.json(result, { status: 201 })
  }),

  http.get("*/v1/projects", async () => {
    await delay(300)
    mockDeploymentStore() // advance simulated deployments so project states stay in step
    return HttpResponse.json(mockProjects)
  }),

  http.get("*/v1/usage", async () => {
    await delay(700)
    return HttpResponse.json(mockUsage)
  }),
]
