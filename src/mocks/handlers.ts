import { delay, http, HttpResponse, type HttpHandler } from "msw"

import { deploymentStatusGroups } from "@/features/deployments/deployments"
import { mockCreateProject, mockDeleteProject, mockDeploymentStore, mockRedeploy, mockRollback } from "@/mocks/data/deployments"
import { mockProjectMetrics, mockRecentTraffic, mockRuntimeLogs, toProject, toProjectSummary } from "@/mocks/data/project-api"
import { mockActivity, recordActivity } from "@/mocks/data/activity"
import type { MetricsRange, ProjectUpdate } from "@/features/projects/projects"
import { mockRepositories, toRepository } from "@/mocks/data/git"
import type { CreateProjectInput } from "@/features/deploy/deploy"
import { mockDeploymentLogs } from "@/mocks/data/deployment-logs"
import { mockProjects } from "@/mocks/data/projects"
import { mockViewer } from "@/mocks/data/viewer"
import { generateMockUsage } from "@/mocks/data/usage"
import { mockWorkspace } from "@/mocks/data/workspace"
import { mockPads, mockRuns } from "@/mocks/data/pads"
import { mockStorage } from "@/mocks/data/storage"
import type { PadTemplate } from "@/features/codepad/codepad"

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
    recordActivity({ type: "project.created", actor: { name: accountSettings.name || "You" }, project: { id: result.project.id, name: result.project.name }, detail: `from ${repo.fullName}` })
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
      recordActivity({ type: "project.renamed", actor: { name: accountSettings.name || "You" }, project: { id: project.id, name: update.name }, detail: `from ${project.name}` })
      project.name = update.name
      project.url = `${update.name}.dpl.app`
      for (const d of mockDeploymentStore()) if (d.projectId === project.id) d.projectName = update.name
    }
    if (update.branch || update.config) {
      const what = [update.branch && `branch → ${update.branch}`, ...Object.keys(update.config ?? {}).map((k) => k.replace(/[A-Z]/g, (c) => ` ${c.toLowerCase()}`))].filter(Boolean).join(", ")
      recordActivity({ type: "settings.updated", actor: { name: accountSettings.name || "You" }, project: { id: project.id, name: update.name ?? project.name }, detail: `changed ${what}` })
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
    const gone = findProject(params.id)!
    recordActivity({ type: "project.deleted", actor: { name: accountSettings.name || "You" }, project: { id: null, name: gone.name }, detail: null })
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
    const before = new Set(project.env.map((e) => e.key))
    const after = new Set(vars.map((v) => v.key))
    const added = vars.filter((v) => !before.has(v.key)).map((v) => v.key)
    const replaced = vars.filter((v) => before.has(v.key) && v.value !== null).map((v) => v.key)
    const removed = [...before].filter((k) => !after.has(k))
    const summary = [added.length && `added ${added.join(", ")}`, replaced.length && `replaced ${replaced.join(", ")}`, removed.length && `removed ${removed.join(", ")}`].filter(Boolean).join(" · ")
    if (summary) recordActivity({ type: "env.updated", actor: { name: accountSettings.name || "You" }, project: { id: project.id, name: project.name }, detail: summary })
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

handlers.push(
  http.get("*/v1/traffic", async () => {
    await delay(120)
    const requests = mockProjects.flatMap((p) => mockRecentTraffic(p)).sort((a, b) => a.at.localeCompare(b.at))
    const liveProjects = mockProjects.filter((p) => toProjectSummary(p).url).length
    return HttpResponse.json({ requests, liveProjects })
  }),

  http.get("*/v1/activity", async ({ request }) => {
    await delay(300)
    const url = new URL(request.url)
    return HttpResponse.json(
      mockActivity({
        type: url.searchParams.get("type"),
        project: url.searchParams.get("project"),
        cursor: url.searchParams.get("cursor"),
        limit: Math.min(100, Number(url.searchParams.get("limit")) || 25),
      })
    )
  })
)

/** Names that would collide with platform hosts. */
const reservedNames = ["admin", "api", "app", "www", "dashboard", "deplogram", "status"]

// ── CodePad ─────────────────────────────────────────────────────────────────────

const padNotFound = (what: string) => HttpResponse.json({ error: { message: `That ${what} doesn't exist.` } }, { status: 404 })

handlers.push(
  http.get("*/v1/pads", async () => {
    await delay(250)
    return HttpResponse.json(mockPads.list())
  }),

  http.post("*/v1/pads", async ({ request }) => {
    await delay(400)
    const { name, template } = (await request.json()) as { name: string; template: PadTemplate }
    return HttpResponse.json(mockPads.create(name, template), { status: 201 })
  }),

  http.get("*/v1/pads/:id", async ({ params }) => {
    await delay(300)
    const pad = mockPads.get(String(params.id))
    return pad ? HttpResponse.json(pad) : padNotFound("pad")
  }),

  http.patch("*/v1/pads/:id", async ({ params, request }) => {
    await delay(200)
    const { name } = (await request.json()) as { name: string }
    const pad = mockPads.rename(String(params.id), name)
    return pad ? HttpResponse.json(pad) : padNotFound("pad")
  }),

  http.delete("*/v1/pads/:id", async ({ params }) => {
    await delay(300)
    return mockPads.remove(String(params.id)) ? new HttpResponse(null, { status: 204 }) : padNotFound("pad")
  }),

  http.put("*/v1/pads/:id/files", async ({ params, request }) => {
    await delay(180)
    const { path, content } = (await request.json()) as { path: string; content: string }
    const saved = mockPads.saveFile(String(params.id), path, content)
    return saved ? HttpResponse.json(saved) : padNotFound("pad")
  }),

  http.post("*/v1/pads/:id/files/rename", async ({ params, request }) => {
    await delay(200)
    const { from, to } = (await request.json()) as { from: string; to: string }
    const pad = mockPads.renameFile(String(params.id), from, to)
    if (pad === "exists") return HttpResponse.json({ error: { message: `There's already a file called ${to}.` } }, { status: 409 })
    return pad ? HttpResponse.json(pad) : padNotFound("file")
  }),

  http.delete("*/v1/pads/:id/files", async ({ params, request }) => {
    await delay(200)
    const path = new URL(request.url).searchParams.get("path") ?? ""
    const pad = mockPads.deleteFile(String(params.id), path)
    return pad ? HttpResponse.json(pad) : padNotFound("pad")
  }),

  http.post("*/v1/pads/:id/runs", async ({ params }) => {
    await delay(250)
    const pad = mockPads.get(String(params.id))
    return pad ? HttpResponse.json({ id: mockRuns.start(pad) }, { status: 201 }) : padNotFound("pad")
  }),

  http.post("*/v1/pads/:id/deploy", async ({ params }) => {
    await delay(900)
    const pad = mockPads.get(String(params.id))
    if (!pad) return padNotFound("pad")
    const sha = Math.random().toString(16).slice(2, 9)
    const commit = { sha, message: "Deployed from CodePad", branch: "codepad", author: { name: accountSettings.name || "You", avatarUrl: null } }

    // Deployed before: a new deployment of the same project.
    if (pad.projectId) {
      const project = mockProjects.find((p) => p.id === pad.projectId)
      const latest = mockDeploymentStore().find((d) => d.projectId === pad.projectId)
      const deployment = latest ? mockRedeploy(latest.id) : null
      if (!project || !deployment) return padNotFound("project")
      deployment.commit = commit
      deployment.trigger = "manual"
      return HttpResponse.json({ project: toProjectSummary(project), deployment }, { status: 201 })
    }

    if (reservedNames.includes(pad.name) || mockProjects.some((p) => p.name === pad.name)) {
      return HttpResponse.json({ error: { message: `A project called "${pad.name}" already exists. Rename the pad, then deploy.` } }, { status: 409 })
    }
    const usage = mockUsage.limits.find((l) => l.id === "active_deployments")!
    if (mockDeploymentStore().filter((d) => d.live).length >= usage.limit) {
      return HttpResponse.json({ error: { message: `Your plan allows ${usage.limit} live deployments. Take one offline to deploy another.` } }, { status: 403 })
    }
    const hasRequirements = pad.files.some((f) => f.path === "requirements.txt")
    const config =
      pad.runtime === "node"
        ? { buildCommand: null, startCommand: `node ${pad.entry}`, port: 3000 }
        : pad.runtime === "python"
          ? { buildCommand: hasRequirements ? "pip install -r requirements.txt" : null, startCommand: `python ${pad.entry}`, port: 8000 }
          : { buildCommand: null, startCommand: null, port: null }
    const result = mockCreateProject({
      name: pad.name,
      runtime: pad.runtime,
      branch: "codepad",
      commit: { sha, message: commit.message },
      author: commit.author.name,
      config,
      repository: `codepad/${pad.name}`,
      rootDirectory: null,
      env: [],
    })
    mockPads.linkProject(pad.id, result.project.id)
    recordActivity({ type: "project.created", actor: { name: commit.author.name }, project: { id: result.project.id, name: result.project.name }, detail: "from CodePad" })
    return HttpResponse.json({ project: toProjectSummary(result.project), deployment: result.deployment }, { status: 201 })
  }),

  http.get("*/v1/runs/:id/logs", async ({ params, request }) => {
    await delay(120)
    const after = Number(new URL(request.url).searchParams.get("after")) || 0
    const logs = mockRuns.logs(String(params.id), after)
    return logs ? HttpResponse.json(logs) : padNotFound("run")
  })
)

// ── Storage ─────────────────────────────────────────────────────────────────────

handlers.push(
  http.get("*/v1/storage/list", async ({ request }) => {
    await delay(220)
    const path = new URL(request.url).searchParams.get("path") ?? ""
    if (!mockStorage.exists(path)) return HttpResponse.json({ error: { message: "That folder doesn't exist." } }, { status: 404 })
    return HttpResponse.json({ path, items: mockStorage.list(path) })
  }),

  http.get("*/v1/storage/search", async ({ request }) => {
    await delay(200)
    const q = new URL(request.url).searchParams.get("q") ?? ""
    return HttpResponse.json({ items: q ? mockStorage.search(q) : [] })
  }),

  http.post("*/v1/storage/links", async ({ request }) => {
    await delay(250)
    const { path, expiresIn } = (await request.json()) as { path: string; expiresIn: "1h" | "1d" | "7d" }
    if (!mockStorage.get(path)) return HttpResponse.json({ error: { message: "That file doesn't exist." } }, { status: 404 })
    const ms = { "1h": 3_600_000, "1d": 86_400_000, "7d": 7 * 86_400_000 }[expiresIn]
    const token = Math.random().toString(36).slice(2, 12)
    return HttpResponse.json({ url: `https://files.dpl.app/${encodeURI(path)}?token=${token}`, expiresAt: new Date(Date.now() + ms).toISOString() })
  })
)
