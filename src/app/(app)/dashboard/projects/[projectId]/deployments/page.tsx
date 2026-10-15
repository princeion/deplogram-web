import type { Metadata } from "next"
import { Suspense } from "react"

import { Page, PageHeader } from "@/components/app-shell/page"
import { DeploymentsTable } from "@/features/deployments/components/deployments-table"

export const metadata: Metadata = {
  title: "Deployments",
}

export default async function ProjectDeploymentsPage({ params }: PageProps<"/dashboard/projects/[projectId]/deployments">) {
  const { projectId } = await params
  return (
    <Page width="wide">
      <PageHeader title="Deployments" description="Every deployment of this project, newest first." />
      {/* Filters live in the URL (useSearchParams). */}
      <Suspense>
        <DeploymentsTable projectId={projectId} />
      </Suspense>
    </Page>
  )
}
