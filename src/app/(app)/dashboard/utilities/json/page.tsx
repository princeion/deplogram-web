import type { Metadata } from "next"

import { Page, PageHeader } from "@/components/app-shell/page"
import { LocalBadge } from "@/features/utilities/components/utility-shell"
import { JsonFormatter } from "@/features/utilities/components/json-formatter"

export const metadata: Metadata = { title: "JSON formatter" }

export default function JsonFormatterPage() {
  return (
    <Page width="wide">
      <PageHeader title="JSON formatter" description="Paste JSON to format, validate or minify it." meta={<LocalBadge />} />
      <JsonFormatter />
    </Page>
  )
}
