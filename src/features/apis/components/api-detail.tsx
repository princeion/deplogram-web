"use client"

import type * as React from "react"

import type { ApiId } from "@/features/apis/apis"
import { ApiUsageStrip, RecentRequests } from "@/features/apis/components/api-parts"
import { EmailTry, ImageTry, OtpTry, QrTry } from "@/features/apis/components/api-try"
import { PageSection } from "@/components/app-shell/page"

const tries: Record<ApiId, React.ComponentType> = { otp: OtpTry, email: EmailTry, images: ImageTry, qr: QrTry }

/** One API: this period's usage, try it (with the code beside it), and its latest requests. */
export function ApiDetail({ api }: { api: ApiId }) {
  const Try = tries[api]
  return (
    <>
      <ApiUsageStrip api={api} />
      <Try />
      <PageSection title="Recent requests" description="From every key, newest first.">
        <RecentRequests api={api} />
      </PageSection>
    </>
  )
}
