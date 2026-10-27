import type { Metadata } from "next"

import { Page, PageHeader } from "@/components/app-shell/page"
import { GitSettings } from "@/features/account/components/git-settings"

export const metadata: Metadata = {
  title: "Git connections",
}

export default function GitSettingsPage() {
  return (
    <Page width="narrow">
      <PageHeader title="Git connections" description="The GitHub account your projects deploy from." />
      <GitSettings />
    </Page>
  )
}
