import type { ActivityEvent, ActivityFilter } from "@/features/activity/activity"
import type { Deployment } from "@/features/deployments/deployments"
import { mockDeploymentStore } from "@/mocks/data/deployments"
import { mockProjects } from "@/mocks/data/projects"

/*
 * Activity, derived where possible so it can't drift from reality: every deployment yields a
 * "started" event and, once it settles, an outcome event. Things that aren't deployments
 * (variables, settings, projects created or deleted) are recorded by the handlers as they happen.
 */
const recorded: ActivityEvent[] = []
let seq = 0

export function recordActivity(event: Omit<ActivityEvent, "id" | "at" | "deployment"> & { at?: string; deployment?: ActivityEvent["deployment"] }) {
  recorded.push({ id: `evt_r${++seq}`, at: event.at ?? new Date().toISOString(), deployment: null, ...event })
}

const triggerVerb: Record<string, ActivityEvent["type"]> = { rollback: "deployment.rolled_back" }
const working = ["QUEUED", "BUILDING", "BUILT", "DEPLOYING"]

function fromDeployment(d: Deployment): ActivityEvent[] {
  const deployment = { id: d.id, sha: d.commit.sha, message: d.commit.message, branch: d.commit.branch, state: d.state, trigger: d.trigger }
  const base = { actor: { name: d.commit.author.name }, project: { id: d.projectId, name: d.projectName }, deployment }
  const events: ActivityEvent[] = [
    {
      id: `evt_${d.id}_start`,
      at: d.createdAt,
      type: triggerVerb[d.trigger] ?? "deployment.started",
      detail: d.trigger === "git" ? `pushed to ${d.commit.branch}` : d.trigger === "redeploy" ? "redeployed" : d.trigger === "manual" ? "deployed from the dashboard" : null,
      ...base,
    },
  ]
  if (!working.includes(d.state) && d.durationSeconds != null) {
    const failed = d.state !== "RUNNING"
    events.push({
      id: `evt_${d.id}_end`,
      at: new Date(new Date(d.createdAt).getTime() + d.durationSeconds * 1000).toISOString(),
      type: failed ? "deployment.failed" : "deployment.succeeded",
      detail: failed
        ? `${d.state === "BUILD_FAILED" ? "build failed" : d.state === "DEPLOY_FAILED" ? "deploy failed" : "crashed"} after ${d.durationSeconds}s`
        : `live in ${d.durationSeconds}s`,
      ...base,
      actor: { name: "Deplogram" },
    })
  }
  return events
}

let seeded = false
function seed() {
  if (seeded) return
  seeded = true
  for (const p of mockProjects) {
    recorded.push({ id: `evt_created_${p.id}`, at: p.createdAt, type: "project.created", actor: { name: "Ada Obi" }, project: { id: p.id, name: p.name }, deployment: null, detail: `from ${p.repository}` })
    for (const v of p.env) {
      if (v.updatedAt === p.createdAt) continue
      recorded.push({ id: `evt_env_${p.id}_${v.key}`, at: v.updatedAt, type: "env.updated", actor: { name: "Ada Obi" }, project: { id: p.id, name: p.name }, deployment: null, detail: `changed ${v.key}` })
    }
  }
}

const groups: Record<Exclude<ActivityFilter, "all">, (e: ActivityEvent) => boolean> = {
  deploys: (e) => e.type.startsWith("deployment."),
  changes: (e) => !e.type.startsWith("deployment."),
  failures: (e) => e.type === "deployment.failed",
}

/** GET /v1/activity for the mock. */
export function mockActivity({ type, project, cursor, limit }: { type?: string | null; project?: string | null; cursor?: string | null; limit: number }) {
  seed()
  const all = [...mockDeploymentStore().flatMap(fromDeployment), ...recorded]
    .filter((e) => new Date(e.at).getTime() <= Date.now())
    .filter((e) => !type || !(type in groups) || groups[type as keyof typeof groups](e))
    .filter((e) => !project || e.project?.id === project)
    .sort((a, b) => b.at.localeCompare(a.at))
  const start = Number(cursor) || 0
  const items = all.slice(start, start + limit)
  return { items, nextCursor: start + limit < all.length ? String(start + limit) : null }
}
