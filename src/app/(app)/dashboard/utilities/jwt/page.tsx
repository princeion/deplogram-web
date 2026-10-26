import type { Metadata } from "next"

import { Page, PageHeader } from "@/components/app-shell/page"
import { LocalBadge } from "@/features/utilities/components/utility-shell"
import { JwtDecoder } from "@/features/utilities/components/jwt-decoder"

export const metadata: Metadata = { title: "JWT decoder" }

export default function JwtDecoderPage() {
  return (
    <Page width="wide">
      <PageHeader title="JWT decoder" description="Paste a token to read its header and claims, see when it expires, and check its signature." meta={<LocalBadge />} />
      <JwtDecoder />
    </Page>
  )
}
