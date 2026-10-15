import type { Metadata } from "next"

import { Page, PageHeader } from "@/components/app-shell/page"
import { ActivityFeed } from "@/features/activity/components/activity-feed"

export const metadata: Metadata = {
  title: "Activity",
}

export default function ActivityPage() {
  return (
    <Page>
      <PageHeader title="Activity" description="Everything that happened in your Galley — deployments, variables and settings — newest first." />
      <ActivityFeed />
    </Page>
  )
}
