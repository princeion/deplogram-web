import { Suspense } from "react"
import type { Metadata } from "next"

import { Page, PageHeader } from "@/components/app-shell/page"
import { StorageBrowser } from "@/features/storage/components/storage-browser"
import { StorageHeaderActions } from "@/features/storage/components/storage-dialogs"

export const metadata: Metadata = { title: "Storage" }

/** /dashboard/storage and every folder under it: /dashboard/storage/assets/logos. */
export default async function StoragePage({ params }: PageProps<"/dashboard/storage/[[...path]]">) {
  const { path } = await params
  const folder = (path ?? []).map((part) => decodeURIComponent(part)).join("/")
  return (
    <Page width="wide">
      <PageHeader title="Storage" description="Private files for your projects. Share one with a link that expires." actions={<StorageHeaderActions />} />
      {/* Search, sort and the selected file live in the URL. */}
      <Suspense>
        <StorageBrowser path={folder} />
      </Suspense>
    </Page>
  )
}
