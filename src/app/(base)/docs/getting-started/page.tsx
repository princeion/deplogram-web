import { notFound } from "next/navigation"

import { createMetadata } from "@/lib/metadata"
import { getDocPage } from "@/content/docs"
import { DocArticle } from "@/components/marketing/doc-article"

const page = getDocPage("getting-started")

export const metadata = createMetadata({
  title: page?.title ?? "Getting started",
  description: page?.description ?? "",
  path: "/docs/getting-started",
})

export default function GettingStartedPage() {
  if (!page) notFound()
  return (
    <DocArticle
      page={page}
      next={{ title: "Deploying your first project", href: "/docs/deploying-your-first-project" }}
    />
  )
}
