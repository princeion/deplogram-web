import { notFound } from "next/navigation"

import { createMetadata } from "@/lib/metadata"
import { getDocPage } from "@/content/docs"
import { DocArticle } from "@/components/marketing/doc-article"

const page = getDocPage("deploying-your-first-project")

export const metadata = createMetadata({
  title: page?.title ?? "Deploying your first project",
  description: page?.description ?? "",
  path: "/docs/deploying-your-first-project",
})

export default function DeployingFirstProjectPage() {
  if (!page) notFound()
  return <DocArticle page={page} />
}
