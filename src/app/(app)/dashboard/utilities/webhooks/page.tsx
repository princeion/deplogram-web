import type { Metadata } from "next"

import { Page, PageHeader } from "@/components/app-shell/page"

import { WebhookTester } from "@/features/utilities/components/webhook-tester"

export const metadata: Metadata = { title: "Webhook tester" }

export default function WebhookTesterPage() {
  return (
    <Page width="wide">
      <PageHeader title="Webhook tester" description="A URL that records whatever is sent to it — see what a service sends, then replay it at your app." />
      <WebhookTester />
    </Page>
  )
}
