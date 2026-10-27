import type { Metadata } from "next"
import Link from "next/link"

import { Page, PageHeader } from "@/components/app-shell/page"
import { Icon } from "@/components/shared/icon"
import { buttonVariants } from "@/components/ui/button"
import { ApisOverview } from "@/features/apis/components/apis-overview"

export const metadata: Metadata = { title: "APIs" }

export default function ApisPage() {
  return (
    <Page width="wide">
      <PageHeader
        title="APIs"
        description="OTP, email, image transforms and QR codes — one key, one base URL, limits included in your plan."
        actions={
          <Link href="/dashboard/apis/keys" className={buttonVariants({ variant: "outline" })}>
            <Icon name="key-round" /> API keys
          </Link>
        }
      />
      <ApisOverview />
    </Page>
  )
}
