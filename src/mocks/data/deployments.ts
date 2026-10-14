import type { Deployment, DeploymentTrigger } from "@/features/deployments/deployments"
import { mockProjects } from "@/mocks/data/projects"

/** Deterministic pseudo-random numbers, so the mock list is the same on every load. */
function random(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const messages: Record<string, string[]> = {
  prj_orders: [
    "feat: add order filters",
    "fix: pagination cursor on large accounts",
    "chore: bump hono to 4.6",
    "feat: retry failed webhooks with backoff",
    "perf: cache order totals per day",
    "fix: timezone in daily reports",
    "refactor: split order service into modules",
    "feat: CSV export for orders",
    "fix: refund amount rounding",
    "feat: idempotency keys on POST /orders",
  ],
  prj_admin: [
    "fix: table pagination",
    "feat: audit log page",
    "feat: role management for staff",
    "fix: chart tooltip overflow",
    "feat: dark mode toggle",
    "chore: upgrade to Next 16",
    "fix: session refresh on idle tabs",
    "feat: bulk actions on orders table",
  ],
  prj_docs: ["docs: storage guide", "docs: runtime versions table", "fix: broken links in API reference", "docs: API keys page", "docs: getting started rewrite"],
}

const authors = ["Ada Obi", "Tobi Adeyemi", "Ngozi Eze"]
const branchesFor: Record<string, string[]> = {
  prj_orders: ["main", "main", "main", "feat/webhooks", "fix/reports"],
  prj_admin: ["main", "main", "develop", "feat/audit-log"],
  prj_docs: ["gh-pages"],
}

/** ~46 deployments across the mock projects, newest first per project, spread over two weeks. */
export function generateMockDeployments(now = Date.now()): Deployment[] {
  const rand = random(42)
  const pick = <T,>(items: readonly T[]) => items[Math.floor(rand() * items.length)]
  const hex = () => Math.floor(rand() * 0xfffffff).toString(16).padStart(7, "0").slice(0, 7)
  const counts: Record<string, number> = { prj_orders: 22, prj_admin: 16, prj_docs: 8 }
  const deployments: Deployment[] = []

  for (const project of mockProjects) {
    let minutesAgo = project.id === "prj_admin" ? 1 : project.id === "prj_orders" ? 2 : 72
    for (let i = 0; i < counts[project.id]; i++) {
      // The newest deployment carries the project's current state; older ones are history.
      const state: Deployment["state"] =
        i === 0 ? project.state : rand() < 0.12 ? pick(["BUILD_FAILED", "DEPLOY_FAILED", "CRASHED"] as const) : "RUNNING"
      const inProgress = ["QUEUED", "BUILDING", "BUILT", "DEPLOYING"].includes(state)
      const failed = ["BUILD_FAILED", "DEPLOY_FAILED", "CRASHED"].includes(state)
      const trigger: DeploymentTrigger = rand() < 0.75 ? "git" : pick(["manual", "redeploy", "rollback"] as const)
      const live = state === "RUNNING" && !deployments.some((d) => d.projectId === project.id && d.live)
      deployments.push({
        id: `dpl_${project.id.slice(4)}_${String(counts[project.id] - i).padStart(3, "0")}`,
        projectId: project.id,
        projectName: project.name,
        runtime: project.runtime,
        state,
        live,
        commit: {
          sha: hex(),
          message: messages[project.id][i % messages[project.id].length],
          branch: i === 0 ? "main" : pick(branchesFor[project.id]),
          author: { name: pick(authors), avatarUrl: null },
        },
        trigger,
        createdAt: new Date(now - minutesAgo * 60_000).toISOString(),
        durationSeconds: inProgress ? null : failed ? 8 + Math.floor(rand() * 60) : 25 + Math.floor(rand() * 140),
        url: live ? (project.url ?? `${project.name}.dpl.app`) : null,
      })
      minutesAgo += 90 + Math.floor(rand() * 600)
    }
  }
  return deployments
}

/*
 * A stateful mock so deploy actions behave like the real thing: new deployments move through
 * QUEUED → BUILDING → BUILT → DEPLOYING → RUNNING over ~15s (polled by the UI), the new one
 * becomes live and the old one steps down. docs-site's builds fail, to show that path too.
 */
type Simulation = { kind: "build" | "rollback"; startedAt: number; fails: boolean }

const buildTimeline: [number, Deployment["state"]][] = [
  [0, "QUEUED"],
  [3_000, "BUILDING"],
  [10_000, "BUILT"],
  [12_000, "DEPLOYING"],
  [16_000, "RUNNING"],
]
const rollbackTimeline: [number, Deployment["state"]][] = [
  [0, "DEPLOYING"],
  [4_000, "RUNNING"],
]

let store: Deployment[] | null = null
const simulations = new Map<string, Simulation>()
let sequence = 1000

function setProjectState(projectId: string, state: Deployment["state"]) {
  const project = mockProjects.find((p) => p.id === projectId)
  if (project) project.state = state
}

/** Moves every simulated deployment along its timeline. */
function advance(deployments: Deployment[], now = Date.now()) {
  for (const deployment of deployments) {
    const sim = simulations.get(deployment.id)
    if (!sim) continue
    const elapsed = now - sim.startedAt
    const timeline = sim.kind === "build" ? buildTimeline : rollbackTimeline
    let state = timeline.filter(([at]) => elapsed >= at).at(-1)![1]
    if (sim.fails && elapsed >= 9_000) state = "BUILD_FAILED"
    if (state === deployment.state) continue

    deployment.state = state
    setProjectState(deployment.projectId, state)
    if (state === "RUNNING" || state === "BUILD_FAILED") {
      simulations.delete(deployment.id)
      deployment.durationSeconds = Math.round(elapsed / 1000)
    }
    if (state === "RUNNING") {
      const previous = deployments.find((d) => d.projectId === deployment.projectId && d.live && d.id !== deployment.id)
      const project = mockProjects.find((p) => p.id === deployment.projectId)
      if (previous) {
        previous.live = false
        previous.url = null
      }
      deployment.live = true
      deployment.url = project?.url ?? `${deployment.projectName}.dpl.app`
    }
  }
  return deployments
}

/** The mock's deployments, advanced to now. Seeds once per page load. */
export function mockDeploymentStore() {
  if (!store) {
    store = generateMockDeployments()
    // The seed's in-progress build finishes a few seconds after the app opens.
    for (const d of store.filter((d) => ["QUEUED", "BUILDING", "BUILT", "DEPLOYING"].includes(d.state))) {
      simulations.set(d.id, { kind: "build", startedAt: Date.now() - 4_000, fails: false })
    }
  }
  return advance(store)
}

function nextId(projectId: string) {
  return `dpl_${projectId.slice(4)}_${sequence++}`
}

/** POST …/redeploy: the same commit, built again. */
export function mockRedeploy(sourceId: string): Deployment | null {
  const deployments = mockDeploymentStore()
  const source = deployments.find((d) => d.id === sourceId)
  if (!source) return null
  const deployment: Deployment = {
    ...source,
    id: nextId(source.projectId),
    state: "QUEUED",
    live: false,
    trigger: "redeploy",
    createdAt: new Date().toISOString(),
    durationSeconds: null,
    url: null,
    commit: { ...source.commit },
  }
  deployments.unshift(deployment)
  simulations.set(deployment.id, { kind: "build", startedAt: Date.now(), fails: source.projectId === "prj_docs" })
  setProjectState(source.projectId, "QUEUED")
  return deployment
}

/** POST …/rollback: an earlier successful deployment, made live again from its existing build. */
export function mockRollback(targetId: string): { deployment: Deployment; previousLiveId: string | null } | { error: string } {
  const deployments = mockDeploymentStore()
  const target = deployments.find((d) => d.id === targetId)
  if (!target) return { error: "That deployment no longer exists." }
  if (target.state !== "RUNNING") return { error: "Only a successful deployment can be rolled back to." }
  if (target.live) return { error: "That deployment is already live." }
  if (deployments.some((d) => d.projectId === target.projectId && simulations.has(d.id))) {
    return { error: "This project is already deploying. Wait for it to finish, then try again." }
  }
  const previousLive = deployments.find((d) => d.projectId === target.projectId && d.live)
  const deployment: Deployment = {
    ...target,
    id: nextId(target.projectId),
    state: "DEPLOYING",
    live: false,
    trigger: "rollback",
    createdAt: new Date().toISOString(),
    durationSeconds: null,
    url: null,
    commit: { ...target.commit },
  }
  deployments.unshift(deployment)
  simulations.set(deployment.id, { kind: "rollback", startedAt: Date.now(), fails: false })
  setProjectState(target.projectId, "DEPLOYING")
  return { deployment, previousLiveId: previousLive?.id ?? null }
}
