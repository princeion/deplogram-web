import type { Metadata } from "next"

import { Page, PageHeader } from "@/components/app-shell/page"
import { UtilitiesIndex } from "@/features/utilities/components/utilities-index"

export const metadata: Metadata = { title: "Utilities" }

export default function UtilitiesPage() {
  return (
    <Page width="wide">
      <PageHeader title="Utilities" description="Small tools for the jobs between commits. Five run entirely in your browser — nothing you paste leaves this tab." />
      <UtilitiesIndex />
    </Page>
  )
}
