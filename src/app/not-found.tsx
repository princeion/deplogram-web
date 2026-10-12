import Link from "next/link"
import type { Metadata } from "next"

import { buttonVariants } from "@/components/ui/button"
import { MarketingShell } from "@/components/marketing/marketing-shell"
import { StatusMessage } from "@/components/shared/status-message"

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
}

export default function NotFound() {
  return (
    <MarketingShell>
      <StatusMessage
        eyebrow="404"
        title="This route didn't deploy."
        description="The page you're looking for doesn't exist or has moved. Let's get you back to something live."
      >
        <Link href="/" className={buttonVariants({ variant: "inverted", size: "lg" })}>
          Back to home
        </Link>
        <Link href="/waitlist" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Join the waitlist
        </Link>
      </StatusMessage>
    </MarketingShell>
  )
}
