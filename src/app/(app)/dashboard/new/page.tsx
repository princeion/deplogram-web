import type { Metadata } from "next"
import { Suspense } from "react"

import { Page, PageHeader } from "@/components/app-shell/page"
import { NewDeployment } from "@/features/deploy/components/new-deployment"

export const metadata: Metadata = {
  title: "New deployment",
}

export default function NewDeploymentPage() {
  return (
    <Page width="wide">
      <PageHeader title="New deployment" description="Import a repository, check its settings, and put it live." />
      {/* The current step lives in the URL (useSearchParams). */}
      <Suspense>
        <NewDeployment />
      </Suspense>
    </Page>
  )
}
