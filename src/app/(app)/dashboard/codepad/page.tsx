import { Suspense } from "react"
import type { Metadata } from "next"

import { Page, PageHeader } from "@/components/app-shell/page"
import { NewPadButton, NewPadDialog, PadsList } from "@/features/codepad/components/pads-list"

export const metadata: Metadata = { title: "CodePad" }

export default function CodepadPage() {
  return (
    <Page>
      <PageHeader
        title="CodePad"
        description="Write small projects in the browser — a static page, a Node.js server or a Python script. Run them, preview them, deploy them."
        actions={<NewPadButton />}
      />
      <PadsList />
      {/* Reads ?new from the URL, so it needs its own Suspense boundary. */}
      <Suspense>
        <NewPadDialog />
      </Suspense>
    </Page>
  )
}
