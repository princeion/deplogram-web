import type { Metadata } from "next"

import { Page, PageHeader } from "@/components/app-shell/page"
import { SecuritySettings } from "@/features/account/components/security-settings"

export const metadata: Metadata = {
  title: "Security",
}

export default function SecuritySettingsPage() {
  return (
    <Page width="narrow">
      <PageHeader title="Security" description="Your password, two-factor, and the devices signed in to your account." />
      <SecuritySettings />
    </Page>
  )
}
