import { delay, http, HttpResponse, type HttpHandler } from "msw"

import { deploymentStatusGroups } from "@/features/deployments/deployments"
import { mockCreateProject, mockDeleteProject, mockDeploymentStore, mockRedeploy, mockRollback } from "@/mocks/data/deployments"
import { mockProjectMetrics, mockRuntimeLogs, toProject, toProjectSummary } from "@/mocks/data/project-api"
import type { MetricsRange, ProjectUpdate } from "@/features/projects/projects"
import { mockRepositories, toRepository } from "@/mocks/data/git"
import type { CreateProjectInput } from "@/features/deploy/deploy"
import { mockDeploymentLogs } from "@/mocks/data/deployment-logs"
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

  http.get("*/v1/deployments/:id", async ({ params }) => {
    await delay(250)
    const deployment = mockDeploymentStore().find((d) => d.id === params.id)
    return deployment ? HttpResponse.json(deployment) : HttpResponse.json({ error: { message: "That deployment doesn't exist." } }, { status: 404 })
  }),

  http.get("*/v1/deployments/:id/logs", async ({ params, request }) => {
    await delay(200)
    const deployment = mockDeploymentStore().find((d) => d.id === params.id)
    if (!deployment) return HttpResponse.json({ error: { message: "That deployment doesn't exist." } }, { status: 404 })
    const after = Number(new URL(request.url).searchParams.get("after")) || 0
    return HttpResponse.json(mockDeploymentLogs(deployment, after))
  }),

  http.get("*/v1/projects", async () => {
    await delay(300)
    const summaries = mockProjects.map(toProjectSummary)
    return HttpResponse.json(summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
  }),

  http.get("*/v1/usage", async () => {
    await delay(700)
    // Active deployments follow the store, so creating a project moves the meter.
    const live = mockDeploymentStore().filter((d) => d.live).length
    return HttpResponse.json({ ...mockUsage, limits: mockUsage.limits.map((l) => (l.id === "active_deployments" ? { ...l, used: live } : l)) })
  }),

  // ── New deployment flow ──────────────────────────────────────────────────────
  http.get("*/v1/git/connection", async () => {
    await delay(200)
    return HttpResponse.json({ provider: "github", connected: true, account: "ada" })
  }),

  http.get("*/v1/git/repositories", async ({ request }) => {
    await delay(450)
    const q = new URL(request.url).searchParams.get("q")?.toLowerCase().trim() ?? ""
    const repos = mockRepositories.filter((r) => !q || r.fullName.toLowerCase().includes(q))
    return HttpResponse.json([...repos].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(toRepository))
  }),

  http.get("*/v1/git/repositories/:id/branches", async ({ params }) => {
    await delay(300)
    const repo = mockRepositories.find((r) => r.id === params.id)
    return repo ? HttpResponse.json(repo.branches) : HttpResponse.json({ error: { message: "Repository not found." } }, { status: 404 })
  }),

  http.get("*/v1/git/repositories/:id/detect", async ({ params }) => {
    // Detection reads the repository, so it takes a moment.
    await delay(1600)
    const repo = mockRepositories.find((r) => r.id === params.id)
    return repo ? HttpResponse.json(repo.detection) : HttpResponse.json({ error: { message: "Repository not found." } }, { status: 404 })
  }),

  http.get("*/v1/projects/name-availability", async ({ request }) => {
    await delay(350)
    const name = new URL(request.url).searchParams.get("name") ?? ""
    const taken = reservedNames.includes(name) || mockProjects.some((p) => p.name === name)
    let suggestion: string | null = null
    if (taken) for (let n = 2; !suggestion; n++) if (!mockProjects.some((p) => p.name === `${name}-${n}`)) suggestion = `${name}-${n}`
    return HttpResponse.json({ available: !taken, url: `${name}.dpl.app`, suggestion })
  }),

  http.post("*/v1/projects", async ({ request }) => {
    await delay(1100)
    const input = (await request.json()) as CreateProjectInput
    if (reservedNames.includes(input.name) || mockProjects.some((p) => p.name === input.name)) {
      return HttpResponse.json({ error: { message: "That project name is taken.", fields: { name: `"${input.name}" is already used. Try another name.` } } }, { status: 409 })
    }
    const usage = mockUsage.limits.find((l) => l.id === "active_deployments")!
    if (mockDeploymentStore().filter((d) => d.live).length >= usage.limit) {
      return HttpResponse.json({ error: { message: `Your plan allows ${usage.limit} live deployments. Take one offline to deploy another.` } }, { status: 403 })
    }
    const repo = mockRepositories.find((r) => r.id === input.repositoryId)
    const branch = repo?.branches.find((b) => b.name === input.branch)
    if (!repo || !branch) return HttpResponse.json({ error: { message: "That repository or branch no longer exists." } }, { status: 422 })
    const result = mockCreateProject({
      name: input.name,
      runtime: input.runtime,
      branch: branch.name,
      commit: branch.commit,
      author: accountSettings.name || "You",
      config: { buildCommand: input.config.buildCommand, startCommand: input.config.startCommand, port: input.config.port },
      repository: repo.fullName,
      rootDirectory: input.config.rootDirectory,
      env: input.env,
    })
    repo.projectId ??= result.project.id
    return HttpResponse.json({ project: toProjectSummary(result.project), deployment: result.deployment }, { status: 201 })
  }),
]

// ── Projects ───────────────────────────────────────────────────────────────────────
// Registered after /v1/projects/name-availability so ":id" doesn't swallow it.
const findProject = (id: unknown) => mockProjects.find((p) => p.id === id)
const notFound = () => HttpResponse.json({ error: { message: "That project doesn't exist." } }, { status: 404 })

handlers.push(
  http.get("*/v1/projects/:id", async ({ params }) => {
    await delay(250)
    const project = findProject(params.id)
    return project ? HttpResponse.json(toProject(project)) : notFound()
  }),

  http.patch("*/v1/projects/:id", async ({ params, request }) => {
    await delay(500)
    const project = findProject(params.id)
    if (!project) return notFound()
    const update = (await request.json()) as ProjectUpdate
    if (update.name && update.name !== project.name) {
      if (reservedNames.includes(update.name) || mockProjects.some((p) => p.name === update.name)) {
        return HttpResponse.json({ error: { message: "That name is taken.", fields: { name: `"${update.name}" is already used.` } } }, { status: 409 })
      }
      project.name = update.name
      project.url = `${update.name}.dpl.app`
      for (const d of mockDeploymentStore()) if (d.projectId === project.id) d.projectName = update.name
    }
    if (update.branch) project.branch = update.branch
    if (update.config) {
      const { rootDirectory, ...rest } = update.config
      if (rootDirectory !== undefined) project.rootDirectory = rootDirectory
      project.configOverride = { ...project.configOverride, ...rest }
    }
    return HttpResponse.json(toProject(project))
  }),

  http.delete("*/v1/projects/:id", async ({ params }) => {
    await delay(900)
    if (!findProject(params.id)) return notFound()
    mockDeleteProject(String(params.id))
    for (const repo of mockRepositories) if (repo.projectId === params.id) repo.projectId = null
    return new HttpResponse(null, { status: 204 })
  }),

  http.get("*/v1/projects/:id/env", async ({ params }) => {
    await delay(300)
    const project = findProject(params.id)
    return project ? HttpResponse.json(project.env.map(({ key, updatedAt }) => ({ key, updatedAt }))) : notFound()
  }),

  http.put("*/v1/projects/:id/env", async ({ params, request }) => {
    await delay(600)
    const project = findProject(params.id)
    if (!project) return notFound()
    const vars = (await request.json()) as { key: string; value: string | null }[]
    const now = new Date().toISOString()
    project.env = vars.map((v) => {
      const existing = project.env.find((e) => e.key === v.key)
      return v.value === null && existing ? existing : { key: v.key, value: v.value ?? "", updatedAt: now }
    })
    return HttpResponse.json(project.env.map(({ key, updatedAt }) => ({ key, updatedAt })))
  }),

  http.get("*/v1/projects/:id/logs", async ({ params, request }) => {
    await delay(150)
    const project = findProject(params.id)
    if (!project) return notFound()
    const after = Number(new URL(request.url).searchParams.get("after")) || 0
    return HttpResponse.json(mockRuntimeLogs(project, after))
  }),

  http.get("*/v1/projects/:id/metrics", async ({ params, request }) => {
    await delay(500)
    const project = findProject(params.id)
    if (!project) return notFound()
    const range = (new URL(request.url).searchParams.get("range") ?? "24h") as MetricsRange
    return HttpResponse.json(mockProjectMetrics(project, ["1h", "24h", "7d"].includes(range) ? range : "24h"))
  })
)

/** Names that would collide with platform hosts. */
const reservedNames = ["admin", "api", "app", "www", "dashboard", "deplogram", "status"]
