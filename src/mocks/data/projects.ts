import type { ProjectSummary } from "@/features/projects/projects"

/** What the mock backend stores per project; list/detail responses are derived from it plus deployments. */
export type MockProject = {
  id: string
  name: string
  runtime: string
  /** Mirrors the latest deployment's state (kept in step by the deployment simulation). */
  state: ProjectSummary["state"]
  /** The host it's served at once live. */
  url: string | null
  repository: string
  branch: string
  createdAt: string
  rootDirectory: string | null
  /** Settings changed since the last deployment — used by the next one. */
  configOverride?: { buildCommand?: string | null; startCommand?: string | null; port?: number | null }
  env: { key: string; value: string; updatedAt: string }[]
}

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()

// Illustrative data — not real customers.
export const mockProjects: MockProject[] = [
  {
    id: "prj_orders",
    name: "orders-api",
    runtime: "node",
    state: "RUNNING",
    url: "orders-api.dpl.app",
    repository: "ada/orders-api",
    branch: "main",
    createdAt: daysAgo(41),
    rootDirectory: null,
    env: [
      { key: "DATABASE_URL", value: "postgres://…", updatedAt: daysAgo(41) },
      { key: "JWT_SECRET", value: "…", updatedAt: daysAgo(20) },
      { key: "REDIS_URL", value: "redis://…", updatedAt: daysAgo(6) },
      { key: "PAYSTACK_SECRET_KEY", value: "sk_…", updatedAt: daysAgo(2) },
    ],
  },
  {
    id: "prj_admin",
    name: "admin-dashboard",
    runtime: "nextjs",
    state: "BUILDING",
    url: "admin-dashboard.dpl.app",
    repository: "ada/admin-dashboard",
    branch: "main",
    createdAt: daysAgo(28),
    rootDirectory: null,
    env: [
      { key: "NEXT_PUBLIC_API_URL", value: "https://orders-api.dpl.app", updatedAt: daysAgo(28) },
      { key: "AUTH_SECRET", value: "…", updatedAt: daysAgo(9) },
    ],
  },
  {
    id: "prj_docs",
    name: "docs-site",
    runtime: "static",
    state: "BUILD_FAILED",
    url: "docs-site.dpl.app",
    repository: "ada/docs-site",
    branch: "main",
    createdAt: daysAgo(60),
    rootDirectory: "website",
    env: [],
  },
]
