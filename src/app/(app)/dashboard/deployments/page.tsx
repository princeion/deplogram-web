import type { Metadata } from "next"
import { Suspense } from "react"

import { Page, PageHeader } from "@/components/app-shell/page"
import { DeploymentsTable } from "@/features/deployments/components/deployments-table"
import { LimitCallout } from "@/features/usage/components/limit-callout"

export const metadata: Metadata = {
  title: "Deployments",
}

export default function DeploymentsPage() {
  return (
    <Page width="wide">
      <PageHeader title="Deployments" description="Every deployment across your projects, newest first." />
      <LimitCallout />
      {/* The table reads its filters from the URL (useSearchParams). */}
      <Suspense>
        <DeploymentsTable />
      </Suspense>
    </Page>
  )
}
