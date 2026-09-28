import { createMetadata } from "@/lib/metadata"
import { changelog } from "@/content/changelog"
import { ChangelogList } from "@/components/marketing/changelog-list"
import { PageHeader } from "@/components/marketing/page-header"

export const metadata = createMetadata({
  title: "Changelog",
  description: "New features, improvements and fixes shipped to Deplogram, newest first.",
  path: "/changelog",
})

export default function ChangelogPage() {
  return (
    <>
      <PageHeader
        eyebrow="Changelog"
        title="What we've shipped"
        description="New features, improvements and fixes across the APIs, developer utilities, deployments, storage and domains."
      />
      <ChangelogList entries={changelog} />
    </>
  )
}
