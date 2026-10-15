import type { Metadata } from "next"

import { Page } from "@/components/app-shell/page"
import { ProjectMetrics } from "@/features/projects/components/project-metrics"

export const metadata: Metadata = {
  title: "Metrics",
}

export default async function ProjectMetricsPage({ params }: PageProps<"/dashboard/projects/[projectId]/metrics">) {
  const { projectId } = await params
  return (
    <Page width="wide">
      <ProjectMetrics projectId={projectId} />
    </Page>
  )
}
