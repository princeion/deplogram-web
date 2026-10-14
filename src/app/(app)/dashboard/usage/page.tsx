import type { Metadata } from "next"

import { Page, PageHeader } from "@/components/app-shell/page"
import { UsageOverview } from "@/features/usage/components/usage-overview"
import { LimitCallout } from "@/features/usage/components/limit-callout"

export const metadata: Metadata = {
  title: "Usage & limits",
}

export default function UsagePage() {
  return (
    <Page width="wide">
      <PageHeader title="Usage & limits" description="What your workspace has used this period, against your plan's limits." />
      <LimitCallout showUsageLink={false} />
      <UsageOverview />
    </Page>
  )
}
