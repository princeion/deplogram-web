"use client" // Error boundaries must be Client Components

import * as React from "react"
import Link from "next/link"

import { Button, buttonVariants } from "@/components/ui/button"
import { MarketingShell } from "@/components/marketing/marketing-shell"
import { StatusMessage } from "@/components/shared/status-message"

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  React.useEffect(() => {
    // TODO: report to an error-tracking service once one is chosen.
    console.error(error)
  }, [error])

  return (
    <MarketingShell>
      <StatusMessage
        eyebrow="Something went wrong"
        title="This build hit an error."
        description="An unexpected error stopped this page from rendering. Try again, or head back home."
      >
        <Button variant="inverted" size="lg" onClick={() => retry()}>
          Try again
        </Button>
        <Link href="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Back to home
        </Link>
      </StatusMessage>
    </MarketingShell>
  )
}
