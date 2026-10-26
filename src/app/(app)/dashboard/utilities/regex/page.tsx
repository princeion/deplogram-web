import type { Metadata } from "next"

import { Page, PageHeader } from "@/components/app-shell/page"
import { LocalBadge } from "@/features/utilities/components/utility-shell"
import { RegexTester } from "@/features/utilities/components/regex-tester"

export const metadata: Metadata = { title: "Regex tester" }

export default function RegexTesterPage() {
  return (
    <Page width="wide">
      <PageHeader title="Regex tester" description="Write a pattern and see what it matches, group by group." meta={<LocalBadge />} />
      <RegexTester />
    </Page>
  )
}
