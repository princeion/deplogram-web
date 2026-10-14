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
