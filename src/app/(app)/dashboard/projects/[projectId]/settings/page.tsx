import type { Metadata } from "next"

import { Page } from "@/components/app-shell/page"
import { ProjectSettings } from "@/features/projects/components/project-settings"

export const metadata: Metadata = {
  title: "Settings",
}

export default async function ProjectSettingsPage({ params }: PageProps<"/dashboard/projects/[projectId]/settings">) {
  const { projectId } = await params
  return (
    <Page width="default">
      <ProjectSettings projectId={projectId} />
    </Page>
  )
}
