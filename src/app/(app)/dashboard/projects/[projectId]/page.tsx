import type { Metadata } from "next"

import { Page } from "@/components/app-shell/page"
import { ProjectOverview } from "@/features/projects/components/project-overview"

export const metadata: Metadata = {
  title: "Project",
}

export default async function ProjectPage({ params }: PageProps<"/dashboard/projects/[projectId]">) {
  const { projectId } = await params
  return (
    <Page width="wide">
      <ProjectOverview projectId={projectId} />
    </Page>
  )
}
