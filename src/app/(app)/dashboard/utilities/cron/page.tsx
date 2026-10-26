import type { Metadata } from "next"

import { Page, PageHeader } from "@/components/app-shell/page"
import { LocalBadge } from "@/features/utilities/components/utility-shell"
import { CronHelper } from "@/features/utilities/components/cron-helper"

export const metadata: Metadata = { title: "Cron helper" }

export default function CronHelperPage() {
  return (
    <Page width="wide">
      <PageHeader title="Cron helper" description="Type a schedule to read it in plain English and see its next runs." meta={<LocalBadge />} />
      <CronHelper />
    </Page>
  )
}
