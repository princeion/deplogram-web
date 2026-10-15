import type { Metadata } from "next"

import { Page } from "@/components/app-shell/page"
import { ProjectEnvironment } from "@/features/projects/components/project-environment"

export const metadata: Metadata = {
  title: "Environment",
}

export default async function ProjectEnvironmentPage({ params }: PageProps<"/dashboard/projects/[projectId]/environment">) {
  const { projectId } = await params
  return (
    <Page width="wide">
      <ProjectEnvironment projectId={projectId} />
    </Page>
  )
}
