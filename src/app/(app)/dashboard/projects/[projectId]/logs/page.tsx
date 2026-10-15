import type { Metadata } from "next"

import { Page } from "@/components/app-shell/page"
import { ProjectLogs } from "@/features/projects/components/project-logs"

export const metadata: Metadata = {
  title: "Logs",
}

export default async function ProjectLogsPage({ params }: PageProps<"/dashboard/projects/[projectId]/logs">) {
  const { projectId } = await params
  return (
    <Page width="wide">
      <ProjectLogs projectId={projectId} />
    </Page>
  )
}
