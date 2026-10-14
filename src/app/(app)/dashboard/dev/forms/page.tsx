import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { Page, PageHeader } from "@/components/app-shell/page"
import { FormsPlayground } from "./forms-playground"

export const metadata: Metadata = {
  title: "Forms (dev)",
  robots: { index: false, follow: false },
}

/** Development-only showcase of the form system. Not available in production builds. */
export default function FormsDevPage() {
  if (process.env.NODE_ENV === "production") notFound()
  return (
    <Page width="narrow">
      <PageHeader title="Forms" description="Every field, validation, server errors, drafts, the unsaved-changes guard and a multi-step wizard." />
      <FormsPlayground />
    </Page>
  )
}
