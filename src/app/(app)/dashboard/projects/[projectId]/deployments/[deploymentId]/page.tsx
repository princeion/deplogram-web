import type { Metadata } from "next"

import { Page } from "@/components/app-shell/page"
import { DeploymentDetail } from "@/features/deployments/components/deployment-detail"

export const metadata: Metadata = {
  title: "Deployment",
}

export default async function DeploymentPage({ params }: PageProps<"/dashboard/projects/[projectId]/deployments/[deploymentId]">) {
  const { deploymentId } = await params
  return (
    <Page width="wide">
      <DeploymentDetail deploymentId={deploymentId} />
    </Page>
  )
}
