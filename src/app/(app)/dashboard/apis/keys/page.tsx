import { Suspense } from "react"
import type { Metadata } from "next"

import { Page, PageHeader, PageSection } from "@/components/app-shell/page"
import { Callout } from "@/components/feedback"
import { ApiKeysTable, NewApiKeyButton } from "@/features/apis/components/api-keys"

export const metadata: Metadata = { title: "API keys" }

export default function ApiKeysPage() {
  return (
    <Page>
      <PageHeader
        title="API keys"
        description="Keys let your code call the APIs. Send one as a Bearer token: Authorization: Bearer dpl_live_…"
        actions={
          <Suspense>
            <NewApiKeyButton />
          </Suspense>
        }
      />
      <ApiKeysTable />
      <PageSection>
        <Callout tone="info" icon="lock" title="Keep live keys on your server">
          Put them in your project&apos;s environment, never in a browser or mobile app — anyone with a key can spend your limits. If one leaks, revoke it here and create
          another.
        </Callout>
      </PageSection>
    </Page>
  )
}
