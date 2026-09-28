import { createMetadata } from "@/lib/metadata"
import { statusServices } from "@/content/status"
import { Container } from "@/components/shared/container"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { PageHeader } from "@/components/marketing/page-header"
import { StatusBoard } from "@/components/marketing/status-board"

export const metadata = createMetadata({
  title: "Status",
  description: "Current status of Deplogram deployments, builds, edge, APIs, storage and domains.",
  path: "/status",
})

export default function StatusPage() {
  return (
    <>
      <PageHeader
        eyebrow="Status"
        title="System status"
        description="The health of every part of the platform, from builds to the edge."
      />
      <SectionWrapper spacing="compact" className="pb-20 sm:pb-24">
        <Container>
          <StatusBoard services={statusServices} />
        </Container>
      </SectionWrapper>
    </>
  )
}
