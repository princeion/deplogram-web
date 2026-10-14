import type { Metadata } from "next"

import { PendingPage } from "@/components/app-shell/pending-page"

export const metadata: Metadata = {
  title: "Project",
}

/**
 * Development scaffold for project routes, so `[projectId]` reaches the navigation (the project's
 * own links). Replace with real pages: projects/[projectId]/page.tsx, …/deployments, …/logs, etc.
 */
export default function PendingProjectRoute() {
  return <PendingPage />
}
