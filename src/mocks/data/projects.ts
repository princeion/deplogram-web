import type { ProjectSummary } from "@/features/projects/projects"

// Illustrative data — not real customers.
export const mockProjects: ProjectSummary[] = [
  { id: "prj_orders", name: "orders-api", runtime: "node", state: "RUNNING", url: "orders-api.dpl.app" },
  { id: "prj_admin", name: "admin-dashboard", runtime: "nextjs", state: "BUILDING", url: null },
  { id: "prj_docs", name: "docs-site", runtime: "static", state: "BUILD_FAILED", url: null },
]
