"use client" // Error boundaries must be Client Components.

import * as React from "react"

import { Page } from "@/components/app-shell/page"
import { ErrorState } from "@/components/app-shell/error-state"

/** Any Galley page that throws while rendering or loading data. Next 16 passes `retry`. */
export default function GalleyError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  React.useEffect(() => {
    // TODO: report to error tracking once it's set up.
    console.error(error)
  }, [error])

  return (
    <Page>
      <ErrorState title="This page didn't load." onRetry={retry} reference={error.digest} />
    </Page>
  )
}
