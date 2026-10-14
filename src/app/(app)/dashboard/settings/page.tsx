import type { Metadata } from "next"

import { Page, PageHeader } from "@/components/app-shell/page"
import { GeneralSettings } from "@/features/account/components/general-settings"

export const metadata: Metadata = {
  title: "Settings",
}

export default function GeneralSettingsPage() {
  return (
    <Page width="narrow">
      <PageHeader title="General" description="Your profile and preferences." />
      <GeneralSettings />
    </Page>
  )
}
