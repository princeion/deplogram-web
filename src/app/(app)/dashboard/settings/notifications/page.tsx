import type { Metadata } from "next"

import { Page, PageHeader } from "@/components/app-shell/page"
import { NotificationSettings } from "@/features/account/components/notification-settings"

export const metadata: Metadata = {
  title: "Notifications",
}

export default function NotificationSettingsPage() {
  return (
    <Page width="narrow">
      <PageHeader title="Notifications" description="Which emails Deplogram sends you." />
      <NotificationSettings />
    </Page>
  )
}
