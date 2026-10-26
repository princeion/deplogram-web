import type { Metadata } from "next"

import { Page, PageHeader } from "@/components/app-shell/page"
import { LocalBadge } from "@/features/utilities/components/utility-shell"
import { Base64Tool } from "@/features/utilities/components/base64-tool"

export const metadata: Metadata = { title: "Base64" }

export default function Base64ToolPage() {
  return (
    <Page width="wide">
      <PageHeader title="Base64" description="Encode text or a file to Base64, or decode it back." meta={<LocalBadge />} />
      <Base64Tool />
    </Page>
  )
}
